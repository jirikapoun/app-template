import fs from 'node:fs'
import path from 'node:path'
import { HMR_EVENTS } from '@maveric/client'

import type { ClientEntry } from '@maveric/client'
import type { ESTree, Manifest, NormalizedHotChannelClient, Plugin as VitePlugin, ResolvedConfig, Rolldown, ViteDevServer } from 'vite'


interface MavericOptions {
  /** glob pattern(s) matching the view modules, relative to the Vite root */
  views: string | string[]
}

const MANIFEST_ID = 'virtual:maveric/manifest'
const RESOLVED_MANIFEST_ID = `\0${MANIFEST_ID}`
const RUNTIME_ID = '@maveric/client/runtime'
const VITE_MANIFEST_FILE = '.vite/manifest.json'

const toPosixPath = (filePath: string) => filePath.replaceAll('\\', '/')

// name of the variable exported as default, either by `export default name` or `export { name as default }`
const findDefaultExportName = (program: ESTree.Program) => {
  for (const node of program.body) {
    if (node.type === 'ExportDefaultDeclaration' && node.declaration.type === 'Identifier') {
      return node.declaration.name
    }
    if (node.type === 'ExportNamedDeclaration') {
      const specifier = node.specifiers.find(({ exported }) => exported.type === 'Identifier' && exported.name === 'default')
      if (specifier?.local.type === 'Identifier') {
        return specifier.local.name
      }
    }
  }
  return null
}

const maveric = ({ views }: MavericOptions): VitePlugin => {
  const viewPatterns = Array.isArray(views) ? views : [views]
  let config: ResolvedConfig
  let server: ViteDevServer | undefined
  // browser tabs connected to the dev server, mapped to whether they have hydrated a view
  const clients = new Map<NormalizedHotChannelClient, boolean>()
  // manifest of the client build, which the server build turns into the client manifest
  let viteManifest: Manifest | undefined
  // resolved by the client build, which bundles the runtime, as the server build may keep it external
  let runtimeFile: string | null = null

  const isView = (file: string) => {
    const relativePath = toPosixPath(path.relative(config.root, file))
    return viewPatterns.some(pattern => path.matchesGlob(relativePath, pattern))
  }

  const findViews = (root: string) => fs.globSync(viewPatterns, { cwd: root })
    .map(file => toPosixPath(path.resolve(root, file)))
    .sort()

  // URL under which the dev server serves the given file
  const devUrl = (file: string) => {
    const relativePath = path.relative(config.root, file)
    const isOutsideRoot = relativePath.startsWith('..') || path.isAbsolute(relativePath)
    return path.posix.join(config.base, isOutsideRoot ? `/@fs/${file}` : toPosixPath(relativePath))
  }

  // client entry of the given source file in the build, with all the chunks it imports and their stylesheets
  const buildEntry = (manifest: Manifest, file: string): ClientEntry => {
    const url = (outputFile: string) => path.posix.join(config.base, outputFile)
    const key = toPosixPath(path.relative(config.root, file))
    const preload = new Set<string>()
    const css = new Set<string>()
    const collect = (chunkKey: string) => {
      const chunk = manifest[chunkKey]
      if (preload.has(url(chunk.file))) {
        return
      }
      preload.add(url(chunk.file))
      // stylesheets of the imported chunks go first, so that the chunk's own rules win, like Vite orders them in HTML
      chunk.imports?.forEach(collect)
      chunk.css?.forEach(cssFile => css.add(url(cssFile)))
    }
    if (!(key in manifest)) {
      throw new Error(`${key} is not an entry of the client build`)
    }
    collect(key)
    return { url: url(manifest[key].file), preload: [...preload], css: [...css] }
  }

  // the runtime is resolved from a view, so that it comes from the same @maveric/client package the views use,
  // without any views, there is nothing to hydrate and so no need for the runtime either
  const resolveRuntime = async (context: Rolldown.PluginContext, viewFiles: string[]) => {
    if (viewFiles.length === 0) {
      return null
    }
    const runtime = await context.resolve(RUNTIME_ID, viewFiles[0])
    return runtime?.id ?? context.error(`Cannot resolve ${RUNTIME_ID} from ${viewFiles[0]}, make sure @maveric/client is installed`)
  }

  // tags that Vite and its plugins inject into HTML pages, such as the Vite client or the React Refresh preamble
  const devTags = async (devServer: ViteDevServer) => {
    const html = await devServer.transformIndexHtml('/', '<html><head></head><body></body></html>')
    return {
      head: /<head>(?<content>[\s\S]*)<\/head>/u.exec(html)?.groups?.content.trim() ?? '',
      body: /<body>(?<content>[\s\S]*)<\/body>/u.exec(html)?.groups?.content.trim() ?? '',
    }
  }

  return {
    name: 'maveric',
    // the client and the server environments are built separately, but they need to share the Vite manifest
    sharedDuringBuild: true,

    config: (userConfig, { command }) => {
      if (command === 'serve') {
        // let the dependency optimizer discover the views' dependencies before the first page load
        return { optimizeDeps: { entries: viewPatterns } }
      }
      return {
        // build all environments with `vite build`
        builder: {},
        environments: {
          client: {
            build: {
              manifest: VITE_MANIFEST_FILE,
              rolldownOptions: {
                input: findViews(path.resolve(userConfig.root ?? '')),
                // the runtime imports the views dynamically, so their exports need to be kept
                preserveEntrySignatures: 'exports-only',
              },
            },
          },
        },
      }
    },

    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    // the server build needs the manifest of the client build
    buildApp: {
      order: 'pre',
      async handler(builder) {
        await builder.build(builder.environments.client)
        for (const environment of Object.values(builder.environments)) {
          if (!environment.isBuilt) {
            // eslint-disable-next-line no-await-in-loop -- the environments are built one after another, like Vite does
            await builder.build(environment)
          }
        }
      },
    },

    async buildStart() {
      if (config.command !== 'build' || this.environment.name !== 'client') {
        return
      }
      runtimeFile = await resolveRuntime(this, findViews(config.root))
      if (runtimeFile) {
        this.emitFile({ type: 'chunk', id: runtimeFile, name: 'runtime' })
      }
    },

    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        if (this.environment.name !== 'client' || !(VITE_MANIFEST_FILE in bundle)) {
          return
        }
        const manifestAsset = bundle[VITE_MANIFEST_FILE]
        if (manifestAsset.type !== 'asset') {
          return
        }
        viteManifest = JSON.parse(manifestAsset.source.toString()) as Manifest
        // the manifest maps the source files to the built ones, so it's not published with the public files,
        // the server gets the information it needs as part of its build
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete bundle[VITE_MANIFEST_FILE]
      },
    },

    configureServer(devServer) {
      server = devServer

      // the manifest lists all views, so it needs to be regenerated when a view is added or removed
      const invalidateManifest = (file: string) => {
        if (!isView(file)) {
          return
        }
        for (const environment of Object.values(devServer.environments)) {
          const manifestModule = environment.moduleGraph.getModuleById(RESOLVED_MANIFEST_ID)
          if (manifestModule) {
            environment.moduleGraph.invalidateModule(manifestModule)
          }
        }
      }
      devServer.watcher.on('add', invalidateManifest)
      devServer.watcher.on('unlink', invalidateManifest)

      const { hot } = devServer.environments.client
      hot.on('vite:client:connect', (_data, client) => clients.set(client, false))
      hot.on('vite:client:disconnect', (_data, client) => clients.delete(client))
      hot.on(HMR_EVENTS.hydrated, (_data, client) => clients.set(client, true))
    },

    // Fast Refresh only treats exports with a capitalized name or display name as components, but the views
    // created by `view()` are anonymous functions, so they get the name of their module as the display name
    transform(code, id) {
      const file = id.split('?')[0]
      if (!isView(file)) {
        return null
      }
      const exportName = findDefaultExportName(this.parse(code))
      if (!exportName) {
        this.warn(`The default export of ${file} is not a variable, so it can't get a display name, which Fast Refresh may need`)
        return null
      }
      const displayName = path.basename(file, path.extname(file))
      // appending code doesn't move the existing code, so the source map stays valid
      return { code: `${code}\n${exportName}.displayName ??= ${JSON.stringify(displayName)}\n`, map: null }
    },

    resolveId(id) {
      return id === MANIFEST_ID ? RESOLVED_MANIFEST_ID : null
    },

    async load(id) {
      if (id !== RESOLVED_MANIFEST_ID) {
        return null
      }

      const viewFiles = findViews(config.root)
      const runtime = server ? await resolveRuntime(this, viewFiles) : runtimeFile
      let entry: (file: string) => ClientEntry
      let tags = { head: '', body: '' }
      if (server) {
        tags = await devTags(server)
        // nothing is preloaded in dev, the URLs wouldn't match anyway as Vite adds `?import` to dynamically imported modules
        entry = file => ({ url: devUrl(file), preload: [], css: [] })
      } else {
        const manifest = viteManifest ?? this.error('The client environment needs to be built before the server environment')
        entry = file => buildEntry(manifest, file)
      }
      const entryCode = (file: string | null) => JSON.stringify(file ? entry(file) : { url: '', preload: [], css: [] })

      return [
        ...viewFiles.map((file, index) => `import view${index} from ${JSON.stringify(file)}`),
        'export default {',
        `  runtime: ${entryCode(runtime)},`,
        `  views: new Map([${viewFiles.map((file, index) => `[view${index}, ${entryCode(file)}]`).join(', ')}]),`,
        `  head: ${JSON.stringify(tags.head)},`,
        `  body: ${JSON.stringify(tags.body)},`,
        '}',
      ].join('\n')
    },

    // modules used only on the server (controllers, schemas, ...) can't be hot-replaced in the browser, tabs with
    // a hydrated view re-render it with fresh props instead, other tabs (e.g. error pages) are reloaded,
    // modules loaded by the browser (views and their imports) are handled by the regular client-side HMR
    hotUpdate({ file, modules }) {
      if (this.environment.name !== 'ssr' || modules.length === 0 || !server) {
        return
      }
      if (server.environments.client.moduleGraph.getModulesByFile(file)?.size) {
        return
      }
      for (const [client, hasHydratedView] of clients) {
        client.send(hasHydratedView ? { type: 'custom', event: HMR_EVENTS.serverUpdate, data: { file } } : { type: 'full-reload' })
      }
    },
  }
}

export { maveric }

export type { MavericOptions }

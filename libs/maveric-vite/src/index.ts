import fs from 'node:fs'
import path from 'node:path'
import { HMR_EVENTS } from '@maveric/client'

import type { ESTree, NormalizedHotChannelClient, Plugin as VitePlugin, ResolvedConfig, Rolldown, ViteDevServer } from 'vite'


interface MavericOptions {
  /** glob pattern(s) matching the view modules, relative to the Vite root */
  views: string | string[]
}

const MANIFEST_ID = 'virtual:maveric/manifest'
const RESOLVED_MANIFEST_ID = `\0${MANIFEST_ID}`
const RUNTIME_ID = '@maveric/client/runtime'

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

  const isView = (file: string) => {
    const relativePath = toPosixPath(path.relative(config.root, file))
    return viewPatterns.some(pattern => path.matchesGlob(relativePath, pattern))
  }

  const findViews = () => fs.globSync(viewPatterns, { cwd: config.root })
    .map(file => toPosixPath(path.resolve(config.root, file)))
    .sort()

  // URL under which the dev server serves the given file
  const devUrl = (file: string) => {
    const relativePath = path.relative(config.root, file)
    const isOutsideRoot = relativePath.startsWith('..') || path.isAbsolute(relativePath)
    return path.posix.join(config.base, isOutsideRoot ? `/@fs/${file}` : toPosixPath(relativePath))
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

    // let the dependency optimizer discover the views' dependencies before the first page load
    config: () => ({
      optimizeDeps: {
        entries: viewPatterns,
      },
    }),

    configResolved(resolvedConfig) {
      config = resolvedConfig
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
      if (!server) {
        this.error('Production builds are not supported yet')
      }

      const viewFiles = findViews()
      const runtime = await resolveRuntime(this, viewFiles)
      const { head, body } = await devTags(server)
      // nothing is preloaded in dev, the URLs wouldn't match anyway as Vite adds `?import` to dynamically imported modules
      const entry = (file: string | null) => JSON.stringify({ url: file ? devUrl(file) : '', preload: [], css: [] })

      return [
        ...viewFiles.map((file, index) => `import view${index} from ${JSON.stringify(file)}`),
        'export default {',
        `  runtime: ${entry(runtime)},`,
        `  views: new Map([${viewFiles.map((file, index) => `[view${index}, ${entry(file)}]`).join(', ')}]),`,
        `  head: ${JSON.stringify(head)},`,
        `  body: ${JSON.stringify(body)},`,
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

import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { defineConfig } from 'vite'

import type { Plugin as VitePlugin } from 'vite'


// the server serves the client build of the UI package, so it's copied next to the server bundle
const copyClientBuild = (packageName: string): VitePlugin => ({
  name: 'copy-client-build',
  apply: 'build',
  writeBundle({ dir = 'dist' }) {
    const packageDir = path.dirname(createRequire(import.meta.url).resolve(`${packageName}/package.json`))
    fs.cpSync(path.join(packageDir, 'dist/client'), path.join(dir, 'client'), { recursive: true })
  },
})

const viteConfig = defineConfig({
  tsconfig: 'tsconfig.build.json',
  plugins: [
    copyClientBuild('@app/ui'),
  ],
  // the server is bundled with all its dependencies, so it runs without node_modules
  ssr: {
    noExternal: true,
  },
  build: {
    ssr: 'src/index.ts',
    outDir: 'dist',
    sourcemap: true,
  },
})

export default viteConfig

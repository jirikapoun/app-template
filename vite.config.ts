import devServer, { defaultOptions } from '@hono/vite-dev-server'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defaultClientConditions, defaultServerConditions, defineConfig } from 'vite'

import { maveric } from '@maveric/vite'

import type { Plugin as VitePlugin } from 'vite'


// building the root would bundle the sources of all packages, which is not how the production app is built
const developmentOnly: VitePlugin = {
  name: 'development-only',
  apply: 'build',
  config() {
    throw new Error('The root Vite config is for development only, use `pnpm build` to build the packages for production')
  },
}

// development server, which treats the whole project as a single package,
// production builds are performed by the individual packages
const viteConfig = defineConfig({
  plugins: [
    developmentOnly,
    devServer({
      entry: './packages/api/src/index.ts',
      injectClientScript: false,
      // source modules and assets requested by the browser are served by Vite, not by the app
      exclude: [...defaultOptions.exclude, /^\/(?:packages|libs)\//u],
    }),
    react(),
    tailwindcss(),
    maveric({
      views: 'packages/ui/src/view/**/*.tsx',
    }),
  ],
  // workspace packages are resolved to their source files instead of their builds
  resolve: {
    conditions: ['source', ...defaultClientConditions],
  },
  ssr: {
    resolve: {
      conditions: ['source', ...defaultServerConditions],
    },
  },
  publicDir: 'packages/ui/public',
})

export default viteConfig

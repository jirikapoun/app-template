import devServer, { defaultOptions } from '@hono/vite-dev-server'
import { defineConfig } from 'vite'

import { maveric } from '@maveric/vite'


const viteConfig = defineConfig({
  plugins: [
    devServer({
      entry: './packages/api/src/index.ts',
      injectClientScript: false,
      // source modules and assets requested by the browser are served by Vite, not by the app
      exclude: [...defaultOptions.exclude, /^\/(?:packages|libs)\//u],
    }),
    maveric({
      views: 'packages/ui/src/view/**/*.tsx',
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  publicDir: 'packages/ui/public',
})

export default viteConfig

import devServer, { defaultOptions } from '@hono/vite-dev-server'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { maveric } from '@maveric/vite'


const viteConfig = defineConfig(({ command }) => ({
  plugins: [
    devServer({
      entry: './packages/api/src/index.ts',
      injectClientScript: false,
      // source modules and assets requested by the browser are served by Vite, not by the app
      exclude: [...defaultOptions.exclude, /^\/(?:packages|libs)\//u],
    }),
    react(),
    maveric({
      views: 'packages/ui/src/view/**/*.tsx',
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  publicDir: 'packages/ui/public',
  environments: {
    client: {
      build: {
        outDir: 'dist/client',
        rolldownOptions: {
          output: {
            // dependencies change less often than the app, so they get their own chunk, which stays cached longer
            codeSplitting: {
              groups: [{ name: 'vendor', test: /[\\/]node_modules[\\/]/u }],
            },
          },
        },
      },
    },
    ssr: {
      // the built server is bundled with all its dependencies, so it runs without node_modules,
      // while in dev, the dependencies are loaded from node_modules
      ...command === 'build' ? { resolve: { noExternal: true } } : {},
      build: {
        outDir: 'dist/server',
        copyPublicDir: false,
        rolldownOptions: {
          input: 'apps/server/src/index.ts',
        },
      },
    },
  },
}))

export default viteConfig

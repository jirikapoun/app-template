import devServer from '@hono/vite-dev-server'
import { defineConfig } from 'vite'
import ssrPlugin from 'vite-ssr-components/plugin'


const viteConfig = defineConfig({
  plugins: [
    devServer({
      entry: './packages/api/src/index.ts',
      injectClientScript: false,
    }),
    ssrPlugin(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  publicDir: 'packages/ui/public',
})

export default viteConfig

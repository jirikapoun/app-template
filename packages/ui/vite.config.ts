import fs from 'node:fs'
import { maveric } from '@maveric/vite'
import { defineConfig } from 'vite'


const views = 'src/view/**/*.tsx'

const viteConfig = defineConfig({
  tsconfig: 'tsconfig.build.json',
  plugins: [
    maveric({ views }),
  ],
  environments: {
    // browser bundle of the views, served by the server as static files
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
    // modules imported by the server (views, manifest), dependencies stay external like in any other package
    ssr: {
      resolve: {
        external: true,
      },
      build: {
        outDir: 'dist/ssr',
        copyPublicDir: false,
        rolldownOptions: {
          input: ['src/manifest.ts', ...fs.globSync(views)],
          output: {
            preserveModules: true,
            preserveModulesRoot: 'src',
          },
        },
      },
    },
  },
})

export default viteConfig

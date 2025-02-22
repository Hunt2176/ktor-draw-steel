import * as path from "node:path";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

const fromRoot = (append: string) => path.resolve(__dirname, append)

export default defineConfig({
  root: fromRoot('src/app'),
  resolve: {
    alias: {
      'src': fromRoot('src/app/src')
    }
  },
  plugins: [
    react({
      babel: {
        plugins: [
          ['module:@preact/signals-react-transform'],
          ["babel-plugin-react-compiler"],
        ]
      }
    }),
    tsconfigPaths()
  ],
  build: {
    outDir: fromRoot('build/resources/main/static/app'),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/watch': 'ws://localhost:8080',
      '/files': 'http://localhost:8080',
      '/api': 'http://localhost:8080',
      '/static': 'http://localhost:8080'
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        includePaths: ['node_modules']
      }
    }
  },
})

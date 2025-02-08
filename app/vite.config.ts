import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
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
    outDir: '../build/resources/main/static/app',
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

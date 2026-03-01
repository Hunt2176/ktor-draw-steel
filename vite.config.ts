import * as path from "node:path";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from '@tailwindcss/vite';
import jotaiDebugLabel from 'jotai/babel/plugin-debug-label'
import jotaiReactRefresh from 'jotai/babel/plugin-react-refresh'


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
          ['babel-plugin-react-compiler'],
          jotaiReactRefresh,
          jotaiDebugLabel,
          ['module:@preact/signals-react-transform'],
        ]
      }
    }),
    tailwindcss(),
    tsconfigPaths()
  ],
  build: {
    outDir: fromRoot('out/site'),
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ['']
  },
  server: {
    proxy: {
      '/watch': 'ws://localhost:8080',
      '/files': 'http://localhost:8080',
      '/api': 'http://localhost:8080',
      '/site': 'http://localhost:8080',
      '/kanka': 'http://localhost:8080',
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        // includePaths: ['node_modules']
      }
    }
  },
})

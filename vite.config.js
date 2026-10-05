/**
 * Vite Config for K-Pass Tools Showcase
 * Optimized for Cloudflare Pages deployment
 */
import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    strictPort: true
  },
  optimizeDeps: {
    // Lucide icons via CDN, no need to bundle
    exclude: ['lucide']
  }
})
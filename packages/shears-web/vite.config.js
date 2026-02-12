// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'   // optional – only if you need path.resolve later

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Default output folder
  let outDir = 'dist'

  // Customize per mode / brand
  if (mode === 'bcia') {
    outDir = 'dist/bcia'
  } else if (mode === 'shear') {
    outDir = 'dist/shear'
  }
  // You can add more brands here, e.g.:
  // else if (mode === 'acme') { outDir = 'dist/acme' }

  return {
    plugins: [react()],

    // Optional: different base path if deploying to subfolder
    // base: mode === 'bcia' ? '/bcia/' : '/',

    build: {
      outDir,                 // ← this changes the output folder

      // Very important when using non-default outDir:
      // prevents leftover files from previous builds in the custom folder
      emptyOutDir: true,

      // Optional extras you might want later
      // sourcemap: true,
      // minify: 'esbuild',
      // rollupOptions: { ... }
    },

    // Optional: make the current brand/mode available in your app code
    // (can be useful for conditional logic, logos, titles, API endpoints…)
    define: {
      'import.meta.env.BRAND': JSON.stringify(mode),
    },

    // Optional: resolve aliases if your project uses them
    // resolve: {
    //   alias: {
    //     '@': path.resolve(__dirname, './src'),
    //   },
    // },
  }
})
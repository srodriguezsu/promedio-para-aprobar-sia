import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        content: 'src/content/index.js'
      },
      output: {
        entryFileNames: 'content.js'
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  }
});

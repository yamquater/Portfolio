import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        cv: resolve(import.meta.dirname, 'cv.html'),
        notFound: resolve(import.meta.dirname, '404.html'),
        merci: resolve(import.meta.dirname, 'merci.html'),
      },
    },
  },
});

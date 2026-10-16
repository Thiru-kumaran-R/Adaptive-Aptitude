import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    pure: ['console.log'],
  },
  build: {
    manifest: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': [
            'react',
            'react-dom',
            'react-router-dom',
          ],
          'query-vendor': [
            '@tanstack/react-query',
          ],
        },
      },
    },
  },
});

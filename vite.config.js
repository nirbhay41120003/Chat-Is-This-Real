import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Vercel serves files generated in public/ alongside the root Express Function.
  publicDir: false,
  build: { outDir: 'public' },
  server: { proxy: { '/api': 'http://localhost:3001' } },
});

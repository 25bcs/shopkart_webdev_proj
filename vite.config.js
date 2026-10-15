import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: Object.fromEntries(['/customers', '/products', '/wishlist', '/cart', '/orders'].map(path => [path, {
      target: 'http://127.0.0.1:5000',
      bypass(req) { if (req.headers.accept?.includes('text/html')) return '/index.html'; }
    }]))
  }
});

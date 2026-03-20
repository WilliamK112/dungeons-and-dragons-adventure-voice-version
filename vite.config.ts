import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        // Dedicated port so this app does not compete with other local projects (e.g. 3000, 5173).
        port: 3737,
        strictPort: true,
        host: '0.0.0.0',
        proxy: {
          '/api': { target: 'http://127.0.0.1:8080', changeOrigin: true },
          '/health': { target: 'http://127.0.0.1:8080', changeOrigin: true },
        },
      },
      preview: {
        port: 3737,
        strictPort: true,
        host: '0.0.0.0',
        proxy: {
          '/api': { target: 'http://127.0.0.1:8080', changeOrigin: true },
          '/health': { target: 'http://127.0.0.1:8080', changeOrigin: true },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

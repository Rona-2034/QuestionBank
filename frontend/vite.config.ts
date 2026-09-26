import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:8080';

export default defineConfig(({ mode }) => {
  const embeddedBuild = mode === 'embedded';

  return {
    base: embeddedBuild ? '/resources/app/' : '/',
    plugins: [react()],
    build: {
      outDir: embeddedBuild ? '../src/main/resources/static/resources/app' : 'dist',
      emptyOutDir: true,
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  };
});

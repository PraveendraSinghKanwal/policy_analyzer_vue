import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/v1/upload': {
      target: 'https://uspk10dbdev01.na.hruk.pri/api/policyassist/v1/upload',
      changeOrigin: true,
      },
      '/upload-pdf': {
      target: 'https://uspk10dbdev01.na.hruk.pri/api/policyassist/v1/upload',
      changeOrigin: true,
      },
    },
  },
});


import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    // The proxy is no longer needed because we are using the VITE_API_URL environment variable
  },
}); 


// import { defineConfig } from 'vite';
// import vue from '@vitejs/plugin-vue';
// export default defineConfig({
//   plugins: [vue()],
//   server: {
//     port: 5173,
//     proxy: {
//       '/api/v1/upload': {
//       target: 'http://127.0.0.1:8000',
//       changeOrigin: true,
//       },
//       '/upload-pdf': {
//       target: 'http://127.0.0.1:8000',
//       changeOrigin: true,
//       },
//     },
//   },
// });


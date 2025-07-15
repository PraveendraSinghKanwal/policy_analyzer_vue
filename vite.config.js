import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api/v1/upload': {
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
      },
      '/upload-pdf': {
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
      },
    },
  },
});


// import { defineConfig } from 'vite';
// import vue from '@vitejs/plugin-vue';
// export default defineConfig({
//   plugins: [vue()],
//   server: {
//     port: 5173,
//     proxy: {
//       '/upload-pdf': {
//       target: 'http://127.0.0.1:8000',
//       changeOrigin: true,
//       rewrite: (path) => path.replace(/^\/upload-pdf/, '/api/v1/upload'),
//       },
//     },
//   },
// });

// import { defineConfig } from 'vite';
// import vue from '@vitejs/plugin-vue';

// export default defineConfig({
//   plugins: [vue()],
//   server: {
//     port: 5173,
//     proxy: {
//       '/upload-pdf': {
//         target: 'http://127.0.0.1:8000',
//         changeOrigin: true,
//         secure: false,
//         logLevel: 'debug'
//       },
//     },
//   },
// }); 
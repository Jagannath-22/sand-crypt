// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import basicSsl from '@vitejs/plugin-basic-ssl'; // 


// export default defineConfig({
//   plugins: [
//     react(),
//      basicSsl() 
//     // Remove nodeStdlibBrowser() here if it was present
//   ],
//   // Remove the 'define' block for 'global' if it was present, PeerJS generally handles this
//   // If you encounter 'global is not defined' again, you can re-add it.
//   define: {
//     global: 'window', // Keep this just in case, it's generally harmless.

//   },
//   // Remove the 'resolve' block with 'alias' if it was present
//   server: {
//     port: 3000,
//         https: true, 

//     proxy: {
//       '/api': {
//         target: 'https://localhost:5000',
//         changeOrigin: true,
//         secure: false,
//       },
//     },
//   },
// });

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
  ],
  define: {
    global: 'window',
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
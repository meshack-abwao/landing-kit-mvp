import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      port: 5176,
      host: true, // Listen on all addresses
    },
    preview: {
      port: 5176,
    },
    define: {
      // Make env variables available in build
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3000'),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});

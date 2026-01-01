import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      port: 5177,
      host: true, // Listen on all addresses
    },
    preview: {
      port: 5177,
    },
    define: {
      // Make env variables available
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:3000'),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  };
});

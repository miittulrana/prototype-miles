import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Define process.env for use in the config
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@layouts': resolve(__dirname, './src/layouts'),
      '@store': resolve(__dirname, './src/store'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils'),
      '@styles': resolve(__dirname, './src/styles'),
      '@assets': resolve(__dirname, './src/assets'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    open: true,
    host: true, // Listen on all addresses, including LAN and public addresses
  },
  preview: {
    port: 4173,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // Prevent bundle size warnings
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split chunks by module for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['zustand', '@supabase/supabase-js'],
        },
      },
    },
    // Compress assets
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: false,
      },
    },
  },
  css: {
    // Enable CSS modules for all css files
    modules: {
      localsConvention: 'camelCase',
    },
    // PostCSS configuration
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      '@supabase/supabase-js',
    ],
  },
  esbuild: {
    // Drop console.log in production (using a static value now)
    drop: [],
    // Enable JSX in .js files
    jsx: 'automatic',
  },
  // Handle environment variables
  envPrefix: 'VITE_',
});
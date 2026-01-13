import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const plugins = [react()];

  // Add bundle analyzer only for production builds when ANALYZE=true
  if (mode === 'production' && process.env.ANALYZE) {
    plugins.push(visualizer({
      filename: './dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    }));
  }

  return {
    plugins,
    optimizeDeps: {
    include: ['socket.io-client']
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // Enable minification for smaller bundles
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // More granular code splitting for better caching
        manualChunks: (id) => {
          if (id.includes('node_modules/')) {
            // Core React libraries
            if (id.includes('node_modules/react/') ||
                id.includes('node_modules/react-dom/') ||
                id.includes('node_modules/react-router') ||
                id.includes('node_modules/scheduler/') ||
                id.includes('node_modules/use-sync-external-store/') ||
                id.includes('node_modules/@babel/') ||
                id.includes('node_modules/regenerator-runtime/') ||
                id.includes('node_modules/tiny-warning/') ||
                id.includes('node_modules/loose-envify/')) {
              return 'react-core';
            }
            // Redux state management
            if (id.includes('node_modules/@reduxjs/') || id.includes('node_modules/react-redux')) {
              return 'redux';
            }
            // UI libraries
            if (id.includes('node_modules/framer-motion') || 
                id.includes('node_modules/react-icons') || 
                id.includes('node_modules/react-toastify') ||
                id.includes('node_modules/@mui/') ||
                id.includes('node_modules/@emotion/')) {
              return 'ui-libs';
            }
            // Utilities
            if (id.includes('node_modules/axios') || id.includes('node_modules/socket.io')) {
              return 'network';
            }
            // Fabric.js
            if (id.includes('node_modules/fabric')) {
              return 'fabric';
            }
            
            // Group smaller packages together (excluding React-related packages)
            if (id.includes('node_modules/@babel/') ||
                id.includes('node_modules/regenerator-runtime/')) {
              return 'shared-vendor';
            }
            
            // Create vendor chunks by package for remaining dependencies
            const match = id.match(/node_modules\/([^\/]+)/);
            if (match) {
              const packageName = match[1];
              if (packageName !== '.vite') {
                return `vendor-${packageName.replace('@', '').replace('/', '-')}`;
              }
            }
          }
          return undefined;
        },
        // Optimize asset filenames for caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      }
    },
    // Enable source maps only in development
    sourcemap: false,
    // Minify CSS as well
    cssMinify: true,
    // Target modern browsers for smaller bundles
    target: 'es2018',
  },
  // Enable esbuild for faster dev builds
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
  // Compress output with brotli
  brotliSize: true,
  // Enable module preload polyfill
  polyfillModulePreload: true,
  // Optimize imports between chunks
  rollupOptions: {
    output: {
      sanitizeFileName: (name) => {
        // Replace invalid characters in filenames
        return name.replace(/[^a-zA-Z0-9\-_~.]/g, '_');
      },
      hoistTransitiveImports: true
    }
  }
};
});

import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Backend server port
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React + Router - essential for app startup
          if (id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/scheduler')) {
            return 'vendor-react'
          }
          
          // State management
          if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) {
            return 'vendor-redux'
          }
          
          // Radix UI components
          if (id.includes('@radix-ui/')) {
            return 'vendor-radix'
          }
          
          // Icons - split by library
          if (id.includes('lucide-react')) {
            return 'vendor-icons-lucide'
          }
          if (id.includes('@tabler/icons-react')) {
            return 'vendor-icons-tabler'
          }
          
          if (id.includes('recharts')) {
            return 'vendor-react'
          }
          
          // Forms & Validation
          if (id.includes('react-hook-form') || id.includes('@hookform/') || id.includes('node_modules/zod')) {
            return 'vendor-forms'
          }
          
          // Date utilities
          if (id.includes('date-fns') || id.includes('react-day-picker')) {
            return 'vendor-date'
          }
          
          // DnD
          if (id.includes('@dnd-kit/')) {
            return 'vendor-dnd'
          }
          
          // Table
          if (id.includes('@tanstack/react-table')) {
            return 'vendor-table'
          }
          
          // Other common utilities
          if (id.includes('node_modules/clsx') || 
              id.includes('tailwind-merge') || 
              id.includes('class-variance-authority') ||
              id.includes('node_modules/cmdk') ||
              id.includes('node_modules/sonner') ||
              id.includes('node_modules/vaul') ||
              id.includes('next-themes')) {
            return 'vendor-misc'
          }
        },
      },
    },
  },
})

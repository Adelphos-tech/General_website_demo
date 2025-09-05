import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';

export default defineConfig({
  plugins: [react(), basicSsl()],
  root: '.',
  resolve: {
    alias: {
      'figma:asset/f68172cebba7a8011f5b65091b6fa23e667d5100.png': path.resolve(__dirname, './src/untitled/assets/f68172cebba7a8011f5b65091b6fa23e667d5100.png'),
      'figma:asset/35263403e7d4212e7d5684d71e8036d990a40143.png': path.resolve(__dirname, './src/untitled/assets/35263403e7d4212e7d5684d71e8036d990a40143.png'),
      'figma:asset/24a9b06170d4829abc28e40c6a654e73ea49d04c.png': path.resolve(__dirname, './src/untitled/assets/24a9b06170d4829abc28e40c6a654e73ea49d04c.png'),
      'lucide-react@0.487.0': 'lucide-react',
      'embla-carousel-react@8.6.0': 'embla-carousel-react',
      'recharts@2.15.2': 'recharts',
      'cmdk@1.1.1': 'cmdk',
      'react-day-picker@8.10.1': 'react-day-picker',
      'react-resizable-panels@2.1.7': 'react-resizable-panels',
      'input-otp@1.4.2': 'input-otp',
      'next-themes@0.4.6': 'next-themes',
      'sonner@2.0.3': 'sonner',
      'vaul@1.1.2': 'vaul',
      '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
      '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
      '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
      '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
      '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
      '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
      '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
      '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
      '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
      '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
      '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
      '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
      '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
      '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
      '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
    },
  },
  server: {
    host: '0.0.0.0',
    https: false,
  },
  preview: {
    host: true,
    https: false,
  },
  build: {
    outDir: 'dist',
    commonjsOptions: {
      include: [/client-sdk-web/, /node_modules/]
    }
  },
  optimizeDeps: {
    include: ['@daily-co/daily-js', 'events']
  }
});

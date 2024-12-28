import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig } from 'vitest/config';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
  plugins: [
    sveltekit(),
    enhancedImages(),
    SvelteKitPWA({
      strategies: 'generateSW',
      registerType: 'autoUpdate',
      manifest: {
        name: 'clairvue',
        short_name: 'clairvue',
        description: 'RSS and Atom feed aggregator',
        theme_color: '#16a34a',
        icons: [
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}']
  },
  build: {
    rollupOptions: {
      external: [
        'crypto',
        'stream',
        'perf_hooks',
        'postgres',
        'drizzle-orm/postgres-js',
        '@lucia-auth/adapter-drizzle'
      ]
    }
  },
  optimizeDeps: {
    exclude: ['postgres', 'drizzle-orm', '@lucia-auth/adapter-drizzle']
  }
});

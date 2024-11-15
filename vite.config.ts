import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit(), enhancedImages()],
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}']
  }
});

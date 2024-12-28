import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';

export default defineConfig({
  plugins: [
    // Enable Vite Plugin for Node.js
    VitePluginNode({
      adapter: 'express',
      appPath: './src/index.ts'
    })
  ],
  build: {
    // Output as CommonJS for Node.js
    lib: {
      entry: './src/index.ts',
      formats: ['cjs'],
      fileName: () => 'index.cjs'
    },
    // Don't minify for Node.js
    minify: false,
    // Ensure we're building for Node.js
    target: 'node18',
    outDir: 'dist',
    // Ensure source maps for debugging
    sourcemap: true,
  },
  resolve: {
    // Ensure file extensions resolve properly
    extensions: ['.js', '.ts', '.json']
  }
});

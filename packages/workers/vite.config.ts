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
  resolve: {
    // Ensure file extensions resolve properly
    extensions: ['.js', '.ts', '.json']
  }
});

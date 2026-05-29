import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@music-cosmos/domain':       resolve(__dirname, '../../packages/domain/src'),
      '@music-cosmos/config':       resolve(__dirname, '../../packages/config/src'),
      '@music-cosmos/data-adapters': resolve(__dirname, '../../packages/data-adapters/src'),
      '@music-cosmos/normalization': resolve(__dirname, '../../packages/normalization/src'),
      '@music-cosmos/cosmos-engine': resolve(__dirname, '../../packages/cosmos-engine/src'),
      '@music-cosmos/layout-engine': resolve(__dirname, '../../packages/layout-engine/src'),
      '@music-cosmos/renderer-3d':  resolve(__dirname, '../../packages/renderer-3d/src'),
      '@music-cosmos/ui':           resolve(__dirname, '../../packages/ui/src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});

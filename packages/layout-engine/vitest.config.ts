import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    name: 'layout-engine',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@music-cosmos/domain': resolve(__dirname, '../domain/src'),
      '@music-cosmos/config': resolve(__dirname, '../config/src'),
      '@music-cosmos/cosmos-engine': resolve(__dirname, '../cosmos-engine/src'),
    },
  },
});

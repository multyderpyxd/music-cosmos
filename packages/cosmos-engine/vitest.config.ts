import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    name: 'cosmos-engine',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@music-cosmos/domain': resolve(__dirname, '../domain/src'),
      '@music-cosmos/config': resolve(__dirname, '../config/src'),
    },
  },
});

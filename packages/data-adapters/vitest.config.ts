import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    name: 'data-adapters',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@music-cosmos/domain': resolve(__dirname, '../domain/src'),
    },
  },
});

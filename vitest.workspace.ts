import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/domain/vitest.config.ts',
  'packages/config/vitest.config.ts',
  'packages/testing/vitest.config.ts',
  'packages/data-adapters/vitest.config.ts',
  'packages/normalization/vitest.config.ts',
  'packages/cosmos-engine/vitest.config.ts',
  'packages/layout-engine/vitest.config.ts',
]);

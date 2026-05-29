/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  settings: {
    'import/resolver': {
      typescript: {},
      node: { extensions: ['.ts', '.tsx'] },
    },
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/no-cycle': 'error',

    // Import boundary enforcement — see docs/architecture.md for the full dependency graph
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // domain: no imports from any other @music-cosmos package
          {
            target: path.resolve(__dirname, 'packages/domain'),
            from: path.resolve(__dirname, 'packages/normalization'),
            message: 'domain cannot import from normalization',
          },
          {
            target: path.resolve(__dirname, 'packages/domain'),
            from: path.resolve(__dirname, 'packages/cosmos-engine'),
            message: 'domain cannot import from cosmos-engine',
          },
          {
            target: path.resolve(__dirname, 'packages/domain'),
            from: path.resolve(__dirname, 'packages/layout-engine'),
            message: 'domain cannot import from layout-engine',
          },
          {
            target: path.resolve(__dirname, 'packages/domain'),
            from: path.resolve(__dirname, 'packages/renderer-3d'),
            message: 'domain cannot import from renderer-3d',
          },
          {
            target: path.resolve(__dirname, 'packages/domain'),
            from: path.resolve(__dirname, 'packages/ui'),
            message: 'domain cannot import from ui',
          },
          {
            target: path.resolve(__dirname, 'packages/domain'),
            from: path.resolve(__dirname, 'packages/data-adapters'),
            message: 'domain cannot import from data-adapters',
          },
          // config: no imports from any other @music-cosmos package
          {
            target: path.resolve(__dirname, 'packages/config'),
            from: path.resolve(__dirname, 'packages/domain'),
            message: 'config cannot import from domain',
          },
          {
            target: path.resolve(__dirname, 'packages/config'),
            from: path.resolve(__dirname, 'packages/normalization'),
            message: 'config cannot import from normalization',
          },
          // renderer-3d: cannot import from data-adapters or normalization
          {
            target: path.resolve(__dirname, 'packages/renderer-3d'),
            from: path.resolve(__dirname, 'packages/data-adapters'),
            message: 'renderer-3d cannot import from data-adapters',
          },
          {
            target: path.resolve(__dirname, 'packages/renderer-3d'),
            from: path.resolve(__dirname, 'packages/normalization'),
            message: 'renderer-3d cannot import from normalization',
          },
          {
            target: path.resolve(__dirname, 'packages/renderer-3d'),
            from: path.resolve(__dirname, 'packages/domain'),
            message: 'renderer-3d cannot import domain directly (use cosmos-engine types)',
          },
          // ui: cannot import from Three.js packages
          {
            target: path.resolve(__dirname, 'packages/ui'),
            from: path.resolve(__dirname, 'packages/renderer-3d'),
            message: 'ui cannot import from renderer-3d',
          },
          {
            target: path.resolve(__dirname, 'packages/ui'),
            from: path.resolve(__dirname, 'packages/cosmos-engine'),
            message: 'ui cannot import from cosmos-engine',
          },
          {
            target: path.resolve(__dirname, 'packages/ui'),
            from: path.resolve(__dirname, 'packages/layout-engine'),
            message: 'ui cannot import from layout-engine',
          },
          // normalization: cannot import from rendering packages
          {
            target: path.resolve(__dirname, 'packages/normalization'),
            from: path.resolve(__dirname, 'packages/cosmos-engine'),
            message: 'normalization cannot import from cosmos-engine',
          },
          {
            target: path.resolve(__dirname, 'packages/normalization'),
            from: path.resolve(__dirname, 'packages/layout-engine'),
            message: 'normalization cannot import from layout-engine',
          },
          {
            target: path.resolve(__dirname, 'packages/normalization'),
            from: path.resolve(__dirname, 'packages/renderer-3d'),
            message: 'normalization cannot import from renderer-3d',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.tsx'],
      rules: {
        'react/react-in-jsx-scope': 'off',
      },
    },
    {
      files: ['**/*.test.ts', '**/__tests__/**/*.ts'],
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/'],
};

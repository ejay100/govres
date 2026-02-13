import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@govres/shared': path.resolve(__dirname, 'packages/shared/src'),
      '@govres/ledger': path.resolve(__dirname, 'packages/ledger/src'),
      '@govres/oracle': path.resolve(__dirname, 'packages/oracle/src'),
      '@govres/security': path.resolve(__dirname, 'packages/security/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['packages//src//*.test.ts', 'packages//src//*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov'],
      include: [
        'packages/ledger/src//*.ts',
        'packages/oracle/src//*.ts',
        'packages/security/src//*.ts',
        'packages/shared/src//*.ts',
      ],
      exclude: ['/index.ts', '/*.test.ts', '/*.spec.ts', '/dist/'],
    },
  },
});

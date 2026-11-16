import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // tsconfig's `jsx: preserve` is for Next; tests that render a component
  // (saved-result.test.ts) need the automatic runtime instead.
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})

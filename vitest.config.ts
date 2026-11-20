import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // Lets component tests render .tsx without a Next build.
  esbuild: { jsx: 'automatic' },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})

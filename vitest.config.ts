import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      '@payload-config': path.resolve(__dirname, 'payload.config.ts'),
    },
  },
  test: {
    environment: 'node',
  },
})

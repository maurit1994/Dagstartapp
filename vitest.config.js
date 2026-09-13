import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // jsdom supplies a real localStorage so the storage module is tested
    // against browser behaviour rather than a hand-written fake.
    environment: 'jsdom',
    include: ['src/**/*.test.{js,jsx}'],
  },
})

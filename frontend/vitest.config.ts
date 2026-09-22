import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Note: pure-logic tests (parser, store) don't need the React plugin. Add
// `@vitejs/plugin-react` here if/when you write component-render tests.
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});

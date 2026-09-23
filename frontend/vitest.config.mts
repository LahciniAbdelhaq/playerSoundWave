import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// tsconfig uses "jsx": "preserve" (Next compiles JSX itself), so esbuild needs
// to be told to use the automatic runtime — component-render tests (.tsx) need it.
export default defineConfig({
  esbuild: { jsx: 'automatic' },
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

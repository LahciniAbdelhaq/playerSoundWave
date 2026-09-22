import type { Config } from 'tailwindcss';

/**
 * Tailwind is available for utility use, but the SoundWave design is driven by
 * the ported CSS in src/styles (tokens/components/app). Tailwind is wired to the
 * same CSS variables so utilities stay on-brand.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  // The design ships its own reset (tokens/app/styles). Disable preflight so
  // Tailwind never overrides the SoundWave look.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        brand: 'var(--brand)',
        'bg-app': 'var(--bg-app)',
        'bg-base': 'var(--bg-base)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
    },
  },
  plugins: [],
};

export default config;

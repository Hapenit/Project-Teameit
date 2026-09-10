import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#06101f',
          900: '#0b1f3a',
          800: '#122a4d',
          700: '#1a3a66',
        },
        accent: {
          blue: '#3b82f6',
          indigo: '#6366f1',
          purple: '#7c3aed',
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        glow: '0 0 80px -20px rgba(99, 102, 241, 0.45)',
      },
    },
  },
  plugins: [],
};

export default config;

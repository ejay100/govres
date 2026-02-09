/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        govres: {
          gold: '#D4AF37',
          green: '#006B3F',
          navy: '#1A1A2E',
          red: '#CE1126',
          blue: '#0F3460',
          cocoa: '#8B4513',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};

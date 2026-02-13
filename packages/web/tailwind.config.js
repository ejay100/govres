/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        govres: {
          gold: 'D4AF37',
          'gold-light': 'F5E6B8',
          'gold-dark': 'A68B28',
          green: '006B3F',
          'green-light': 'E6F4ED',
          'green-dark': '004D2C',
          navy: '1A1A2E',
          'navy-light': '2D2D44',
          black: '0D0D14',
          red: 'CE1126',
          'red-light': 'FDE8EB',
          blue: '0F3460',
          'blue-light': 'E8EEF5',
          cocoa: '8B4513',
          'cocoa-light': 'F5EDE6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
};

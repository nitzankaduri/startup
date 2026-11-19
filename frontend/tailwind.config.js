/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F6F4EF',
        surface: '#FFFFFF',
        sand: '#EFECE4',
        border: '#E6E2D8',
        foreground: '#181715',
        muted: '#6E6A61',
        accent: '#D96B27',
        midnightBg: '#0A0D14',
        midnightCard: '#111622',
        midnightChip: '#182032',
        midnightBorder: '#232E42',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

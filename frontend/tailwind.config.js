/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        accent: {
          50: '#fff8eb',
          100: '#ffefc7',
          200: '#ffe08a',
          300: '#ffd166',
          400: '#ffc13d',
          500: '#f7b500',
          600: '#d59500',
          700: '#ae7902',
          800: '#8f620a',
          900: '#77520d',
        },
      },
      fontFamily: {
        sans: ['Sora', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

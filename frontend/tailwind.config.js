/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1B2A4A', dark: '#121B30', light: '#2C3E63' },
        gold: { DEFAULT: '#C9932E', light: '#E4B865', dark: '#A67520' },
        canvas: '#F5F5F2',
        ink: '#1F2937',
        muted: '#667085',
        line: '#E4E1D8'
      },
      fontFamily: {
        serif: ['"Lora"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}

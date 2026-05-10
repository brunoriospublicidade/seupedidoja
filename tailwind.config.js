/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F59E0B', // Amber 500 (Ideal para Food/SaaS)
          foreground: '#ffffff',
        },
        background: {
          DEFAULT: '#f8f9fa',
          dark: '#0a0c10',
        }
      }
    },
  },
  plugins: [],
}

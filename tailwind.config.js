/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-black': '#000000',
        'brand-dark': '#171717',
        'brand-border': '#333333',
        'brand-white': '#FFFFFF',
        'brand-gray': '#999999',
        'brand-green': '#06C167',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      },
    },
  },
  plugins: [],
}


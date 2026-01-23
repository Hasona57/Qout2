/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          brown: '#6B4423',
          'brown-dark': '#4A2C17',
          'brown-light': '#8B5A3C',
          'cafe': '#D2B48C',
          'cream': '#F5E6D3',
        },
      },
    },
  },
  plugins: [],
}


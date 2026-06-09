/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          light: '#818CF8',
        },
        surface: {
          DEFAULT: '#1E293B',
          raised: '#273549',
        },
        dark: '#0F172A',
      },
    },
  },
  plugins: [],
}


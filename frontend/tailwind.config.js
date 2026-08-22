/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { 50:'#f0fdf4', 100:'#dcfce7', 500:'#22c55e', 600:'#16a34a', 700:'#15803d' },
        brand: { dark:'#1f2937', green:'#10b981', amber:'#fbbf24' }
      },
      fontFamily: { sans: ['"Segoe UI"', 'Arial', 'sans-serif'] }
    }
  },
  plugins: []
}

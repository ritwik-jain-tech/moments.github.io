/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        script: ['"Petit Formal Script"', "cursive"],
        display: ['"Space Grotesk"', "Inter", "sans-serif"],
        playfair: ['"Playfair Display"', "serif"],
        tight: ['"Inter Tight"', "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}

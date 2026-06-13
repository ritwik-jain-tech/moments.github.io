/** @type {import('tailwindcss').Config} */
const withAlpha = (v) => `rgb(var(${v}) / <alpha-value>)`;

module.exports = {
  darkMode: 'class',
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
      colors: {
        canvas: withAlpha('--canvas'),
        panel: withAlpha('--panel'),
        surface: withAlpha('--surface'),
        'surface-2': withAlpha('--surface-2'),
        ink: withAlpha('--ink'),
        muted: withAlpha('--muted'),
        subtle: withAlpha('--subtle'),
        line: withAlpha('--line'),
        brand: {
          DEFAULT: withAlpha('--brand'),
          2: withAlpha('--brand-2'),
        },
        'on-brand': withAlpha('--on-brand'),
        accent: {
          DEFAULT: withAlpha('--accent'),
          2: withAlpha('--accent-2'),
        },
      },
    },
  },
  plugins: [],
}

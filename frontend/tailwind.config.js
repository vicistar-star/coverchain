/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f0ff",
          500: "#7B61FF",
          600: "#6246e5",
          700: "#4f37cc",
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 👈 MUY importante para que Tailwind lea tus componentes
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

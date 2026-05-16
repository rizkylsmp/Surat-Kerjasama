/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#162023",
        mist: "#edf1f4",
        line: "#d5dde3",
        teal: "#0f766e",
        navy: "#123047",
        gold: "#b8860b",
        amber: "#b7791f"
      },
      boxShadow: {
        panel: "0 16px 40px rgba(22, 32, 35, 0.08)"
      }
    }
  },
  plugins: []
};

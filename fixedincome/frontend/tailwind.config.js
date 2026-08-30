export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Arial"],
      },
      colors: {
        ink: "#172033",
        paper: "#f7f8f5",
        line: "#d9dfd8",
        blue: "#245f9f",
        green: "#2e7356",
        amber: "#9a6a18",
      },
    },
  },
  plugins: [],
};

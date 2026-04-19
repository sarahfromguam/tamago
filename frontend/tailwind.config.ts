import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        tamago: {
          bg: "#fdf8f0",
          card: "#fffdf8",
          accent: "#f5b8c8",
          warm: "#fde98e",
          sage: "#b8d4a8",
          brown: "#8b5e3c",
          blush: "#fde8f0",
        },
      },
      borderRadius: {
        kawaii: "1.5rem",
      },
      fontFamily: {
        display: ["Baloo 2", "Nunito", "sans-serif"],
        body: ["Nunito", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;

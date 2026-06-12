/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        black: "#0A0A0A",
        "dark-gray": "#1A1A2E",
        "light-gray": "#2A2A3E",
        cyan: "#00E5CC",
        "cyan-dark": "#00B3A0",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        "cyan-glow": "0 0 20px rgba(0, 229, 204, 0.3), 0 0 40px rgba(0, 229, 204, 0.1)",
      },
      animation: {
        shimmer: "shimmer 2s infinite linear",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

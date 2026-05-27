import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./Components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#102436",
        "sea-50": "#ecfeff",
        "sea-100": "#cffafe",
        "sea-300": "#67e8f9",
        "sea-500": "#06b6d4",
        "sea-700": "#0e7490",
        "signal-red": "#ef4444",
        "signal-orange": "#f97316",
        "signal-green": "#16a34a"
      },
      boxShadow: {
        panel: "0 18px 60px rgba(15, 45, 68, 0.12)",
        soft: "0 10px 30px rgba(14, 116, 144, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#E31B23",
          black: "#000000",
          white: "#FFFFFF",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F9F0F2",
          dim: "#F1F5F9",
        },
        text: {
          DEFAULT: "#000000",
          muted: "#6B7280",
          subtle: "#5b6470",
        },
      },
      borderRadius: {
        card: "18px",
        sheet: "24px",
        pill: "9999px",
      },
    },
  },
  plugins: [],
};

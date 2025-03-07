// tailwind.config.js
import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            secondary: {
              DEFAULT: "#4f46e5",
            },
          },
        },
        dark: {
          colors: {
            secondary: {
              DEFAULT: "#4f46e5",
            },
          },
        },
      },
    }),
  ],
};

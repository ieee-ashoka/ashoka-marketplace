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
    // colors: {
    //   light:{
    //     background: "#ffffff",
    //     foreground: "#171717",
    //   },
    //   dark: {
    //     background: "#000000",
    //     foreground: "#ededed",
    //   }
    // },
    extend: {},
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            secondary: {
              DEFAULT: "#4338ca",
            },
          },
        },
        dark: {
          colors: {
            secondary: {
              DEFAULT: "#312e81",
            },
          },
        },
      },
    }),
  ],
};

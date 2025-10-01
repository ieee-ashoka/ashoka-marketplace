// hero.ts
import { heroui } from "@heroui/react";
export default heroui({
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
});

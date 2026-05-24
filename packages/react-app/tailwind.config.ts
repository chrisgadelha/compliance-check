import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        celo: {
          green: "#35D07F",
          gold:  "#FBCC5C",
          red:   "#FB7C6D",
        },
      },
    },
  },
  plugins: [],
};

export default config;

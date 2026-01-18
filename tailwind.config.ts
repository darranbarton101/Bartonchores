import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        midnight: "#0f172a",
        mist: "#f8fafc",
        mint: "#a7f3d0",
        bubble: "#eff6ff"
      }
    }
  },
  plugins: []
};

export default config;

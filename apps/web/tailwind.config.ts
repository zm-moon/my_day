import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#070a0f",
        panel: "#0d1117",
        line: "#263244",
        neon: "#35f2a8",
        cyan: "#38bdf8"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(53, 242, 168, 0.2), 0 0 36px rgba(53, 242, 168, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;

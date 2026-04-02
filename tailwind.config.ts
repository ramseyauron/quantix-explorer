import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "qtx-bg": "#050510",
        "qtx-surface": "#0a0a1a",
        "qtx-border": "rgba(0,255,255,0.1)",
        "qtx-cyan": "#00FFFF",
        "qtx-purple": "#7B61FF",
        "qtx-magenta": "#FF00FF",
        "qtx-text": "#E0E0FF",
        "qtx-green": "#00ff88",
        "qtx-yellow": "#FFD700",
      },
      fontFamily: {
        heading: ["var(--font-orbitron)", "Orbitron", "monospace"],
        body: ["var(--font-exo2)", "Exo 2", "sans-serif"],
        sans: ["var(--font-exo2)", "Exo 2", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

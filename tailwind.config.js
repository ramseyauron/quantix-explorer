/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'qtx-bg': '#050510',
        'qtx-surface': '#0a0a1a',
        'qtx-border': 'rgba(0,212,255,0.15)',
        'qtx-cyan': '#00d4ff',
        'qtx-purple': '#7b2fff',
        'qtx-green': '#00ff88',
        'qtx-yellow': '#ffd700',
        'qtx-red': '#ff4444',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}

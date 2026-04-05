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
        'qtx-bg': '#0a0e1a',
        'qtx-surface': '#111827',
        'qtx-surface2': '#1a2235',
        'qtx-border': '#1e2a3a',
        'qtx-border2': '#243044',
        'qtx-cyan': '#06b6d4',
        'qtx-cyan-light': '#22d3ee',
        'qtx-purple': '#7c3aed',
        'qtx-purple-light': '#a78bfa',
        'qtx-green': '#10b981',
        'qtx-green-light': '#34d399',
        'qtx-yellow': '#f59e0b',
        'qtx-red': '#ef4444',
        'qtx-text': '#e2e8f0',
        'qtx-muted': '#94a3b8',
        'qtx-dim': '#475569',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}

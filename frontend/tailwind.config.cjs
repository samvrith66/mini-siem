module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#070b1a',
        'bg-secondary': '#0d1325',
        'bg-card': '#0f1629',
        'bg-card-hover': '#141d35',
        'border-card': '#1a2544',
        'border-subtle': '#111b33',
        accent: '#00b4d8',
        'accent-dark': '#0077b6',
        critical: '#e63946',
        high: '#f48c06',
        medium: '#457b9d',
        low: '#2a9d8f',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0, 0, 0, 0.35)',
        'glow-cyan': '0 0 20px rgba(0, 180, 216, 0.15)',
      },
    },
  },
  plugins: [],
};

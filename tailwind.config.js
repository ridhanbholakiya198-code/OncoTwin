/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#050607',
        surface: '#0E1113',
        surface2: '#14181B',
        border: '#1C2226',
        ink: '#E6EDEF',
        muted: '#8A9599',
        accent: '#3FA9A0',
        accentSoft: 'rgba(63,169,160,0.12)',
        established: '#4ADE80',
        theoretical: '#FBBF24',
        speculative: '#F87171',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
      },
    },
  },
  plugins: [],
}

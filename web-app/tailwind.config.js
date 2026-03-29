/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Instrument Sans"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        primary: {
          50: '#effefb', 100: '#c8fff4', 200: '#91feea', 300: '#52f5dc',
          400: '#20e0c8', 500: '#07c4af', 600: '#029e8f', 700: '#067e74',
          800: '#0a635d', 900: '#0d524d', 950: '#003230',
        },
        accent: {
          50: '#fff5f2', 100: '#ffe8e1', 200: '#ffd5c8', 300: '#ffb5a1',
          400: '#ff8a6b', 500: '#f96b45', 600: '#e64f27', 700: '#c13e1d',
          800: '#9f361c', 900: '#84311e', 950: '#47160b',
        },
        warm: {
          50: '#fafaf9', 100: '#f5f5f3', 200: '#e8e7e4', 300: '#d5d3cf',
          400: '#a8a5a0', 500: '#8a8680', 600: '#6f6b65', 700: '#5b5853',
          800: '#4a4845', 900: '#3d3c3a', 950: '#1f1e1d',
        },
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0,0,0,0.05), 0 1px 3px -1px rgba(0,0,0,0.03)',
        'card': '0 4px 25px -5px rgba(0,0,0,0.06), 0 2px 6px -2px rgba(0,0,0,0.04)',
        'elevated': '0 10px 40px -10px rgba(0,0,0,0.1), 0 4px 12px -4px rgba(0,0,0,0.05)',
        'glow-primary': '0 0 20px -5px rgba(7,196,175,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out both',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
      },
    },
  },
  plugins: [],
}

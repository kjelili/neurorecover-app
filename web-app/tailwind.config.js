/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Lora', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        primary: {
          50: '#f0f7f6', 100: '#dcebe9', 200: '#b9d7d3', 300: '#8fbcb6',
          400: '#5e9a92', 500: '#3d7f75', 600: '#2a675f', 700: '#1a4a48',
          800: '#143c3a', 900: '#0f2e2d', 950: '#081f1e',
        },
        accent: {
          50: '#ffefe9', 100: '#ffe0d4', 200: '#ffc3ad', 300: '#ffa07e',
          400: '#f97e52', 500: '#e85a3c', 600: '#d14a2e', 700: '#b03a24',
          800: '#8c301f', 900: '#6f281b', 950: '#47160b',
        },
        blush: {
          100: '#fbd9d4', 200: '#f4a8a8', 300: '#ee8a8c',
        },
        marigold: {
          300: '#f5b87a', 400: '#ee9c55', 500: '#e87a3c',
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

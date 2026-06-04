import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink:        '#1C1C1C',
        cream:      '#F5EFE6',
        gold:       '#C9A96E',
        'gold-light': '#DFC08A',
        'gold-dark':  '#A8833E',
        rose:       '#D4A5A0',
        'off-white': '#FAFAF8',
        'ink-2':    '#242424',
        'ink-3':    '#2E2E2E',
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans:  ['Poppins', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        shimmer2: {
          '0%':   { backgroundPosition: '200% 0%' },
          '100%': { backgroundPosition: '-200% 0%' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer2: 'shimmer2 2.6s infinite linear',
        fadeUp:   'fadeUp 0.65s ease forwards',
      },
    },
  },
  plugins: [],
}

export default config

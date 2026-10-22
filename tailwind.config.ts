import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

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
      // Brand overrides for `prose` (legal / long-form pages only)
      typography: ({ theme }: { theme: (path: string) => any }) => ({
        DEFAULT: {
          css: {
            // next/font exposes the real faces only via these CSS variables
            fontFamily: ['var(--font-poppins)', ...theme('fontFamily.sans')].join(', '),
            'h1, h2, h3, h4': { fontFamily: ['var(--font-lora)', ...theme('fontFamily.serif')].join(', '), fontWeight: '600' },
            h2: { fontSize: '1.25em', lineHeight: '1.4' },
            h3: { fontSize: '1.1em' },
            a: { textDecoration: 'underline', textUnderlineOffset: '2px', fontWeight: '500' },
            'a:hover': { color: theme('colors.gold-dark') },
            strong: { fontWeight: '600' },
          },
        },
        neutral: {
          css: {
            '--tw-prose-body':     'rgba(18,18,18,0.75)',
            '--tw-prose-headings': '#121212',
            '--tw-prose-bold':     '#121212',
            '--tw-prose-links':    theme('colors.gold'),
            '--tw-prose-bullets':  theme('colors.gold'),
            '--tw-prose-counters': theme('colors.neutral.500'),
          },
        },
      }),
    },
  },
  plugins: [typography],
}

export default config

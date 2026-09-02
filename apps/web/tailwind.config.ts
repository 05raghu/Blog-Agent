import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Codewave Brand Tokens
      colors: {
        // Editorial inks
        'ink': {
          950: '#0A0A0B',
        },
        'parchment': '#EDE7DA',
        'signal': '#A8DDE8', // Cyan — observed, selected, authored
        'copper': '#B3733E', // Material interruption
        'slate': '#3C4A48', // Grounding, shadow
        'azure': '#438FE7', // Expansive campaign field
        'sulphur': '#F2EC67', // Friction, counterpoint
        'ember': '#E66D3A', // Catalytic interruption
        'iris': '#6552C7', // Speculative editorial field
      },
      fontFamily: {
        // Brand fonts — substitutes for licensed Signifier/Söhne
        display: ['var(--cw-font-display)', 'Fraunces', ...defaultTheme.fontFamily.serif],
        body: ['var(--cw-font-body)', 'Inter', ...defaultTheme.fontFamily.sans],
        mono: ['var(--cw-font-mono)', 'IBM Plex Mono', ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        // Type scale (from brand system)
        'hero': ['72px', { lineHeight: '0.84', letterSpacing: '-0.02em' }],
        'section': ['52px', { lineHeight: '0.88' }],
        'editorial': ['32px', { lineHeight: '1' }],
        'lead': ['17px', { lineHeight: '1.55', letterSpacing: '0.01em' }],
        'body': ['16px', { lineHeight: '1.55' }],
        'label': ['11px', { lineHeight: '1.2', letterSpacing: '0.05em' }],
      },
      borderRadius: {
        // Control radius
        'cw': '45px', // 45px capsule for buttons
      },
      spacing: {
        // Editorial spacing
        'rhythm': '1.55em', // One body line height
      },
      animation: {
        // Quantum motion (from brand)
        'collapse': 'collapse 640ms cubic-bezier(0.4, 0, 0.2, 1)',
        'entangle': 'entangle 960ms cubic-bezier(0.4, 0, 0.2, 1)',
        'interfere': 'interfere 640ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        collapse: {
          'from': { opacity: '1', transform: 'scale(1)' },
          'to': { opacity: '0', transform: 'scale(0.95)' },
        },
        entangle: {
          '0%': { opacity: '0' },
          '50%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '1' },
        },
        interfere: {
          '0%': { opacity: '0', clipPath: 'inset(0 100% 0 0)' },
          '100%': { opacity: '1', clipPath: 'inset(0)' },
        },
      },
      boxShadow: {
        // Subtle shadows using slate
        'cw': '0 1px 3px rgba(60, 74, 72, 0.12), 0 1px 2px rgba(60, 74, 72, 0.24)',
      },
    },
  },
  plugins: [],
};

export default config;

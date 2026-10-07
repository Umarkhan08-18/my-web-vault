import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-space)', 'var(--font-inter)', 'ui-sans-serif', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        // shadcn/ui semantic tokens (Tailwind 3 style: HSL triplets + hsl())
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        ink: {
          DEFAULT: '#0A0A0B',
          soft: '#16161A',
          muted: '#5B5B66',
        },
        violet: {
          brand: '#7C3AED',
          bright: '#8B5CF6',
          soft: '#A78BFA',
        },
        blue: {
          icon: '#2563EB',
          bright: '#3B82F6',
          soft: '#93C5FD',
        },
        neon: {
          cyan: '#22D3EE',
          lime: '#A3E635',
          pink: '#F472B6',
        },
        pastel: {
          lavender: '#EDE9FE',
          sky: '#DBEAFE',
          mint: '#DCFCE7',
          blush: '#FCE7F3',
          butter: '#FEF3C7',
        },
      },
      borderRadius: {
        '4xl': '1.75rem',
        '5xl': '2rem',
      },
      transitionDuration: {
        400: '400ms',
      },
      transitionTimingFunction: {
        // named once so `ease-[cubic-bezier(...)]` never has to be repeated
        spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        overshoot: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(10,10,11,0.04), 0 8px 24px -12px rgba(10,10,11,0.12)',
        lift: '0 2px 4px rgba(10,10,11,0.04), 0 18px 40px -16px rgba(10,10,11,0.22)',
        float: '0 30px 70px -30px rgba(76,29,149,0.35), 0 8px 24px -12px rgba(10,10,11,0.14)',
        glass: '0 8px 32px rgba(10,10,11,0.10), inset 0 1px 0 rgba(255,255,255,0.75)',
        glow: '0 0 0 1px rgba(124,58,237,0.18), 0 18px 44px -18px rgba(124,58,237,0.45)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-14px) rotate(-1.5deg)' },
        },
        'flash-radiance': {
          '0%, 100%': { opacity: '0.35', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.18)' },
        },
        sheen: {
          '0%': { transform: 'translateX(-120%) skewX(-18deg)' },
          '100%': { transform: 'translateX(220%) skewX(-18deg)' },
        },
        'arrow-nudge': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(4px, -4px)' },
        },
        'arrow-down': {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.6' },
          '50%': { transform: 'translateY(6px)', opacity: '1' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          from: { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%, 100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        flash: 'flash-radiance 3.6s ease-in-out infinite',
        sheen: 'sheen 1.1s ease-out',
        'arrow-nudge': 'arrow-nudge 1.4s ease-in-out infinite',
        'arrow-down': 'arrow-down 1.8s ease-in-out infinite',
        'spin-slow': 'spin-slow 14s linear infinite',
        blink: 'blink 1.1s steps(1) infinite',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'pop-in': 'pop-in 0.22s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.25s ease-out both',
        'pulse-ring': 'pulse-ring 2.4s ease-out infinite',
      },
    },
  },
  // `animate-in` / `fade-in` / `zoom-in-95` used by the prompt composer
  plugins: [animate],
};

export default config;

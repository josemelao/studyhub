/** @type {import('tailwindcss').Config} */

// Permite usar bg-accent/10, text-success/50, etc.
function withOpacity(variable) {
  return ({ opacityValue }) =>
    opacityValue !== undefined
      ? `rgba(var(${variable}), ${opacityValue})`
      : `rgb(var(${variable}))`;
}

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'bg-primary':   'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary':  'var(--bg-tertiary)',
        'bg-elevated':  'var(--bg-elevated)',
        // Text
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted':     'var(--text-muted)',
        // Accent (com suporte a /opacity)
        'accent':       withOpacity('--accent-rgb'),
        'success':      withOpacity('--success-rgb'),
        'error':        withOpacity('--error-rgb'),
        'warning':      withOpacity('--warning-rgb'),
        // Variantes pré-definidas (opacity já embutida)
        'accent-subtle': 'var(--accent-subtle)',
        'accent-border': 'var(--accent-border)',
        // Borders
        'border-default': 'var(--border)',
        'border-hover':   'var(--border-hover)',
        'border-subtle':  'var(--border-subtle)',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm:  'var(--radius-sm)',
        md:  'var(--radius-md)',
        lg:  'var(--radius-lg)',
        xl:  'var(--radius-xl)',
      },
      boxShadow: {
        sm:     'var(--shadow-sm)',
        md:     'var(--shadow-md)',
        lg:     'var(--shadow-lg)',
        accent: 'var(--shadow-accent)',
        card:   'var(--shadow-card)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        shimmer: {
          to: { left: '200%' },
        },
        correctPulse: {
          '0%':   { boxShadow: '0 0 0 0 rgba(var(--success-rgb), 0.5)' },
          '70%':  { boxShadow: '0 0 0 12px rgba(var(--success-rgb), 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(var(--success-rgb), 0)' },
        },
        wrongShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        shimmer:       'shimmer 2.5s infinite',
        correctPulse:  'correctPulse 0.6s ease-out',
        wrongShake:    'wrongShake 0.4s ease-out',
      },
    },
  },
  plugins: [],
};

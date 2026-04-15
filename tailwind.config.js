/** @type {import('tailwindcss').Config} */

// Permite usar accent/10, success/50, etc.
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
        // Cores Dinâmicas (Acento e Status)
        'accent':       withOpacity('--accent-rgb'),
        'success':      withOpacity('--success-rgb'),
        'error':        withOpacity('--error-rgb'),
        'warning':      withOpacity('--warning-rgb'),
        
        // Utilitários de Acento Predefinidos
        'accent-subtle': 'var(--accent-subtle)',
        'accent-border': 'var(--accent-border)',
      },
      backgroundColor: {
        // Mapeamento direto para evitar bg-bg-primary
        'primary':   'var(--bg-primary)',
        'secondary': 'var(--bg-secondary)',
        'tertiary':  'var(--bg-tertiary)',
        'elevated':  'var(--bg-elevated)',
      },
      backgroundImage: {
        'gradient-accent': 'var(--gradient-accent)',
        'gradient-text':   'var(--gradient-text)',
        'gradient-hero':   'var(--gradient-hero)',
      },
      textColor: {
        'primary':   'var(--text-primary)',
        'secondary': 'var(--text-secondary)',
        'muted':     'var(--text-muted)',
      },
      borderColor: {
        'default': 'var(--border)',
        'hover':   'var(--border-hover)',
        'subtle':  'var(--border-subtle)',
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
          to: { transform: 'translateX(200%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s infinite',
      },
    },
  },
  plugins: [],
};

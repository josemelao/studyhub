import { Loader2 } from 'lucide-react';

const variants = {
  primary:   'bg-gradient-accent text-white border-transparent shadow-glow-accent hover:opacity-90 hover:-translate-y-px',
  secondary: 'bg-accent-subtle text-accent border-accent-border hover:bg-accent/20',
  ghost:     'bg-transparent text-secondary border-default hover:bg-white/5 hover:text-primary hover:border-hover',
  danger:    'bg-error/10 text-error border-error/25 hover:bg-error/20',
};

const sizes = {
  sm: 'px-3.5 py-1.5 text-xs rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3 text-sm rounded-xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold border
        transition-all duration-200 select-none cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        active:scale-[0.98]
        ${variants[variant] ?? variants.primary}
        ${sizes[size] ?? sizes.md}
        ${className}
      `}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

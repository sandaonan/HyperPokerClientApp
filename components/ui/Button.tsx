import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-bold tracking-wide transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';
  
  const variants = {
    // Gold Gradient for Primary (Casino Vibe)
    primary: 'bg-gold-gradient text-black shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 border border-amber-400/50',
    secondary: 'bg-surfaceHighlight text-textMain border border-slate-700 hover:bg-slate-700 hover:border-slate-500',
    outline: 'border border-amber-600/50 text-amber-500 hover:bg-amber-600/10 hover:border-amber-500',
    ghost: 'text-textMuted hover:text-white hover:bg-white/5',
    danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  const width = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
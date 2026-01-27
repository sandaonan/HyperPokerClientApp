import React from 'react';
import { THEME } from '../../theme';

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
    // Brand Green for Primary
    primary: `${THEME.buttonPrimary} shadow-lg shadow-brand-green/20 hover:shadow-brand-green/40`,
    secondary: `${THEME.buttonSecondary} border ${THEME.border}`,
    outline: `border border-brand-green/50 ${THEME.accent} hover:bg-brand-green/10 hover:border-brand-green`,
    ghost: `${THEME.textSecondary} hover:${THEME.textPrimary} hover:bg-white/5`,
    danger: 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20',
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
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-slate-700 text-slate-200',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
    outline: 'border border-slate-600 text-slate-400',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
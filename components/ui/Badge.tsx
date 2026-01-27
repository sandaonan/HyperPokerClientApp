import React from 'react';
import { THEME } from '../../theme';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: `bg-[#333333] ${THEME.textPrimary}`,
    success: `${THEME.statusRegistration}`,
    warning: `${THEME.statusInProgress}`,
    danger: `${THEME.statusCancelled}`,
    outline: `border ${THEME.border} ${THEME.textSecondary}`,
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
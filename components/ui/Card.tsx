import React from 'react';
import { THEME } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`${THEME.card} rounded-xl border ${THEME.border} p-4 ${className} ${onClick ? `cursor-pointer ${THEME.cardHover} transition-colors` : ''}`}
    >
      {children}
    </div>
  );
};
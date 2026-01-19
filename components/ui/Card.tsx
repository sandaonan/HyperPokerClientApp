import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-surfaceHighlight rounded-xl border border-slate-700/50 p-4 ${className} ${onClick ? 'cursor-pointer hover:border-slate-600 transition-colors' : ''}`}
    >
      {children}
    </div>
  );
};
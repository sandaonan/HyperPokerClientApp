import React from 'react';
import { THEME } from '../../theme';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, leftIcon, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className={`block text-xs font-medium ${THEME.textSecondary} mb-1.5`}>
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${THEME.textSecondary}`}>
            {leftIcon}
          </div>
        )}
        <input
          className={`
            w-full ${THEME.input} rounded-lg 
            focus:ring-2 focus:ring-brand-green focus:border-brand-green outline-none transition-all
            placeholder:text-brand-gray
            ${leftIcon ? 'pl-10' : 'pl-4'}
            py-2.5 text-sm
            ${className}
          `}
          {...props}
        />
      </div>
    </div>
  );
};
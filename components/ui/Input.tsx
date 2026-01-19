import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, leftIcon, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-textMuted mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textMuted">
            {leftIcon}
          </div>
        )}
        <input
          className={`
            w-full bg-surface border border-slate-800 text-textMain rounded-lg 
            focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all
            placeholder:text-slate-600
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
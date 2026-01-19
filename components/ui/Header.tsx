import React from 'react';

interface HeaderProps {
  title?: string;
  showBrand?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, showBrand = true }) => {
  return (
    <div className="flex items-center justify-between mb-6 pt-2">
      {showBrand ? (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-primary to-emerald-300 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-sm">♠️</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">HyperPoker</h1>
        </div>
      ) : (
        <div />
      )}
      {title && <h2 className="text-lg font-medium text-slate-200">{title}</h2>}
    </div>
  );
};
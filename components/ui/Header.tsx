import React from 'react';
import { THEME } from '../../theme';

interface HeaderProps {
  title?: string;
  showBrand?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, showBrand = true }) => {
  return (
    <div className="flex items-center justify-between mb-6 pt-2">
      {showBrand ? (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-brand-green to-emerald-300 rounded-lg flex items-center justify-center shadow-lg shadow-brand-green/20">
            <span className="text-sm">♠️</span>
          </div>
          <h1 className={`text-xl font-bold ${THEME.textPrimary} tracking-tight`}>HyperPoker</h1>
        </div>
      ) : (
        <div />
      )}
      {title && <h2 className={`text-lg font-medium ${THEME.textPrimary}`}>{title}</h2>}
    </div>
  );
};
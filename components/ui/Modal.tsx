import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden scale-in-95 animate-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-textMain">{title}</h3>
          <button onClick={onClose} className="text-textMuted hover:text-textMain">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
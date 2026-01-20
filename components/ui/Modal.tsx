import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        // Allow closing by clicking the backdrop
        if (e.target === e.currentTarget) {
            onClose();
        }
      }}
    >
      <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] scale-in-95 animate-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
          <h3 className="text-lg font-semibold text-textMain">{title}</h3>
          <button 
            type="button"
            onClick={onClose} 
            className="p-2 -mr-2 text-textMuted hover:text-textMain hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
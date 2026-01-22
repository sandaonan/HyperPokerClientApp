
import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { Button } from './Button';

export type AlertType = 'alert' | 'confirm' | 'prompt';

interface AlertDialogProps {
  isOpen: boolean;
  type: AlertType;
  title: string;
  message: string;
  onConfirm: (value?: string) => void;
  onCancel: () => void;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({ 
  isOpen, 
  type, 
  title, 
  message, 
  onConfirm, 
  onCancel 
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
        if (type === 'prompt') {
            setInputValue('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    } else {
        document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, type]);

  if (!isOpen) return null;

  const handleConfirm = () => {
      onConfirm(type === 'prompt' ? inputValue : undefined);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl scale-in-95 animate-in duration-200 overflow-hidden">
        
        {/* Header Icon */}
        <div className="flex justify-center pt-6 pb-2">
            {type === 'confirm' ? (
                <div className="w-12 h-12 rounded-full bg-gold/20 text-gold flex items-center justify-center">
                    <Info size={24} />
                </div>
            ) : type === 'prompt' ? (
                <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Info size={24} />
                </div>
            ) : (
                <div className="w-12 h-12 rounded-full bg-surfaceHighlight border border-slate-600 text-white flex items-center justify-center">
                    <CheckCircle size={24} />
                </div>
            )}
        </div>

        <div className="px-6 pb-2 text-center">
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">{message}</p>
        </div>

        {type === 'prompt' && (
            <div className="px-6 py-2">
                <input 
                    ref={inputRef}
                    type="text" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-gold outline-none"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                />
            </div>
        )}

        <div className="p-4 flex gap-3 justify-center">
            {type !== 'alert' && (
                <Button variant="ghost" onClick={onCancel} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300">
                    取消
                </Button>
            )}
            <Button variant="primary" onClick={handleConfirm} className="flex-1">
                確定
            </Button>
        </div>
      </div>
    </div>
  );
};

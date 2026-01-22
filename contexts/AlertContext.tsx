
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertDialog, AlertType } from '../components/ui/AlertDialog';

interface AlertContextType {
  showAlert: (title: string, message: string) => Promise<void>;
  showConfirm: (title: string, message: string) => Promise<boolean>;
  showPrompt: (title: string, message: string) => Promise<string | null>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
      type: AlertType;
      title: string;
      message: string;
      resolve: (value: any) => void;
  } | null>(null);

  const showAlert = (title: string, message: string): Promise<void> => {
      return new Promise((resolve) => {
          setConfig({ type: 'alert', title, message, resolve });
          setIsOpen(true);
      });
  };

  const showConfirm = (title: string, message: string): Promise<boolean> => {
      return new Promise((resolve) => {
          setConfig({ type: 'confirm', title, message, resolve });
          setIsOpen(true);
      });
  };

  const showPrompt = (title: string, message: string): Promise<string | null> => {
      return new Promise((resolve) => {
          setConfig({ type: 'prompt', title, message, resolve });
          setIsOpen(true);
      });
  };

  const handleClose = () => {
      setIsOpen(false);
      if (config) {
          if (config.type === 'confirm') config.resolve(false);
          if (config.type === 'prompt') config.resolve(null);
          if (config.type === 'alert') config.resolve(undefined);
      }
      setTimeout(() => setConfig(null), 300);
  };

  const handleConfirm = (value?: string) => {
      setIsOpen(false);
      if (config) {
          if (config.type === 'confirm') config.resolve(true);
          if (config.type === 'prompt') config.resolve(value);
          if (config.type === 'alert') config.resolve(undefined);
      }
      setTimeout(() => setConfig(null), 300);
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      {config && (
          <AlertDialog 
            isOpen={isOpen}
            type={config.type}
            title={config.title}
            message={config.message}
            onConfirm={handleConfirm}
            onCancel={handleClose}
          />
      )}
    </AlertContext.Provider>
  );
};

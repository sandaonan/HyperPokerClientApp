import React, { useEffect } from 'react';
import { useHandleSignInCallback } from '@logto/react';
import { Loader2 } from 'lucide-react';

interface CallbackViewProps {
  onComplete: () => void;
}

export const CallbackView: React.FC<CallbackViewProps> = ({ onComplete }) => {
  const { isLoading, error } = useHandleSignInCallback(() => {
    // Clean up URL and let App.tsx handle navigation
    window.history.replaceState({}, '', '/');
    onComplete();
  });

  useEffect(() => {
    if (error) {
      console.error('Sign-in callback error:', error);
      // Clean up URL and redirect to login on error
      window.history.replaceState({}, '', '/');
      onComplete();
    }
  }, [error, onComplete]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <p className="text-textMuted text-sm">正在登入...</p>
      </div>
    </div>
  );
};

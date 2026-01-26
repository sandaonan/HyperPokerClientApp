import React, { useState } from 'react';
import { useLogto } from '@logto/react';
import { LogIn, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { User } from '../../types';
import { redirectUris } from '../../config/logto';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = () => {
  const { signIn } = useLogto();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signIn(redirectUris.signIn);
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-primary to-emerald-300 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
               <span className="text-3xl">♠️</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">HyperPoker</h1>
          <p className="text-textMuted mt-2">全球玩家入口</p>
        </div>

        <div className="bg-surfaceHighlight/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
             <h2 className="text-lg font-bold text-white text-center mb-4">
                 會員登入
             </h2>

             <Button fullWidth onClick={handleLogin} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    跳轉中...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2" size={18} />
                    使用 Logto 登入
                  </>
                )}
             </Button>

             <p className="text-xs text-textMuted text-center pt-2">
               首次登入將自動建立帳號
             </p>

             <div className="pt-4 border-t border-slate-800 text-xs text-textMuted text-center space-y-1">
               <p>支援登入方式：</p>
               <p className="text-white/80">Google · LINE · 帳號密碼</p>
             </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useLogto } from '@logto/react';
import { LogIn, Loader2, Compass } from 'lucide-react';
import { Button } from '../ui/Button';
import { User } from '../../types';
import { THEME } from '../../theme';
import { redirectUris } from '../../config/logto';

interface LoginViewProps {
  onLogin: (user: User) => void;
  onGuestAccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onGuestAccess }) => {
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
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden ${THEME.bg}`}>
      {/* Subtle Premium Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
            background: 'radial-gradient(circle at center, #171717 0%, #000000 80%)'
        }}
      />
      
      {/* Fine texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
      }}></div>

      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
                <div className={`w-20 h-20 bg-gradient-to-br from-brand-dark to-brand-black rounded-2xl flex items-center justify-center shadow-2xl border ${THEME.border}`}>
                    <span className="text-4xl text-brand-green drop-shadow-md">♠️</span>
                </div>
                {/* Brand green accent line */}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-r-2 border-b-2 border-brand-green rounded-br-lg opacity-60"></div>
                <div className="absolute -top-2 -left-2 w-8 h-8 border-l-2 border-t-2 border-brand-green rounded-tl-lg opacity-60"></div>
            </div>
          </div>
          <h1 className={`text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b ${THEME.textPrimary} to-brand-gray tracking-tight`}>HyperPoker</h1>
          <p className={`${THEME.textSecondary} text-sm mt-2 font-medium tracking-wide uppercase`}>Global Player Access</p>
        </div>

        <div className={`bg-black/40 border ${THEME.border} rounded-xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden group`}>
             {/* Top shine */}
             <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-border to-transparent opacity-50`}></div>
             
             <h2 className={`text-lg font-medium ${THEME.textPrimary} text-center mb-6`}>
                 會員登入
             </h2>

             <div className="space-y-4">
                <Button fullWidth onClick={handleLogin} disabled={loading} className="mt-2 h-11 text-base shadow-brand-green/10">
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

                <p className={`text-xs ${THEME.textSecondary} text-center pt-2`}>
                  首次登入將自動建立帳號
                </p>

                <div className={`pt-4 border-t ${THEME.border} text-xs ${THEME.textSecondary} text-center space-y-1`}>
                  <p>支援登入方式：</p>
                  <p className="text-white/80">Google · LINE · 帳號密碼</p>
                </div>
             </div>
        </div>
        
        {/* Guest Exploration Button */}
        <div className="mt-8 text-center">
             <button 
                onClick={onGuestAccess}
                className={`flex items-center justify-center gap-2 mx-auto ${THEME.textSecondary} hover:${THEME.textPrimary} transition-colors bg-white/5 hover:bg-white/10 px-6 py-3 rounded-full border ${THEME.border} ${THEME.cardHover}`}
             >
                 <Compass size={16} className="text-brand-green" />
                 <span className="text-sm font-bold">不登入，先瀏覽看看</span>
             </button>
        </div>
      </div>
    </div>
  );
};

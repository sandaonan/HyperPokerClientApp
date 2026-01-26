
import React, { useState } from 'react';
import { LogIn, UserPlus, Loader2, Compass } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { mockApi } from '../../services/mockApi';
import { User } from '../../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
  onGuestAccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onGuestAccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async () => {
    setError('');
    
    if (!username || !password) {
        setError("請輸入帳號與密碼");
        return;
    }

    if (mode === 'register') {
        if (password !== confirmPassword) {
            setError("兩次密碼不一致");
            return;
        }
    }

    setLoading(true);
    try {
        let user: User;
        if (mode === 'login') {
            user = await mockApi.login(username, password);
        } else {
            // Register without mobile initially
            user = await mockApi.register(username, password);
        }
        onLogin(user);
    } catch (err: any) {
        setError(err.message || "操作失敗");
    } finally {
        setLoading(false);
    }
  };

  const toggleMode = () => {
      setMode(mode === 'login' ? 'register' : 'login');
      setError('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[#050505]">
      {/* Subtle Premium Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
            background: 'radial-gradient(circle at center, #1a1a1a 0%, #050505 80%)'
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
                <div className="w-20 h-20 bg-gradient-to-br from-[#1c1c1c] to-black rounded-2xl flex items-center justify-center shadow-2xl border border-slate-800">
                    <span className="text-4xl text-gold drop-shadow-md">♠️</span>
                </div>
                {/* Gold accent line */}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-r-2 border-b-2 border-gold rounded-br-lg opacity-60"></div>
                <div className="absolute -top-2 -left-2 w-8 h-8 border-l-2 border-t-2 border-gold rounded-tl-lg opacity-60"></div>
            </div>
          </div>
          <h1 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tight">HyperPoker</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium tracking-wide uppercase">Global Player Access</p>
        </div>

        <div className="bg-black/40 border border-slate-800 rounded-xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden group">
             {/* Top shine */}
             <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-600 to-transparent opacity-50"></div>
             
             <h2 className="text-lg font-medium text-slate-200 text-center mb-6">
                 {mode === 'login' ? '會員登入' : '註冊帳號'}
             </h2>

             {error && (
                 <div className="mb-4 bg-red-950/30 border border-red-900/50 text-red-400 p-3 rounded text-xs text-center flex items-center justify-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                     {error}
                 </div>
             )}

             <div className="space-y-4">
                <Input 
                    placeholder="帳號" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-black/50 border-slate-700 focus:border-gold/50"
                />
                <Input 
                    type="password"
                    placeholder="密碼" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black/50 border-slate-700 focus:border-gold/50"
                />
                
                {mode === 'register' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <Input 
                            type="password"
                            placeholder="再次確認密碼" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="bg-black/50 border-slate-700 focus:border-gold/50"
                        />
                    </div>
                )}

                <Button fullWidth onClick={handleSubmit} disabled={loading} className="mt-2 h-11 text-base shadow-gold/10">
                    {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : 
                    mode === 'login' ? <LogIn className="mr-2" size={18} /> : <UserPlus className="mr-2" size={18} />
                    }
                    {mode === 'login' ? '登入' : '立即註冊'}
                </Button>
             </div>

             <div className="pt-6 text-center">
                 <button 
                    onClick={toggleMode}
                    className="text-xs text-slate-500 hover:text-gold transition-colors border-b border-transparent hover:border-gold pb-0.5"
                  >
                    {mode === 'login' ? '還沒有帳號？點此註冊' : '已有帳號？返回登入'}
                  </button>
             </div>
        </div>
        
        {/* Guest Exploration Button */}
        <div className="mt-8 text-center">
             <button 
                onClick={onGuestAccess}
                className="flex items-center justify-center gap-2 mx-auto text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-6 py-3 rounded-full border border-slate-700 hover:border-slate-500"
             >
                 <Compass size={16} className="text-emerald-400" />
                 <span className="text-sm font-bold">不登入，先瀏覽看看</span>
             </button>
        </div>
      </div>
    </div>
  );
};

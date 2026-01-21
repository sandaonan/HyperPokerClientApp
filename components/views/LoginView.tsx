
import React, { useState } from 'react';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { mockApi } from '../../services/mockApi';
import { User } from '../../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
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
                 {mode === 'login' ? '會員登入' : '註冊帳號'}
             </h2>

             {error && (
                 <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-xs text-center">
                     {error}
                 </div>
             )}

             <Input 
                placeholder="帳號" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
             />
             <Input 
                type="password"
                placeholder="密碼" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
             />
             
             {mode === 'register' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <Input 
                        type="password"
                        placeholder="再次確認密碼" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
             )}

             <Button fullWidth onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : 
                 mode === 'login' ? <LogIn className="mr-2" size={18} /> : <UserPlus className="mr-2" size={18} />
                }
                {mode === 'login' ? '登入' : '立即註冊'}
             </Button>

             <div className="pt-2 text-center">
                 <button 
                    onClick={toggleMode}
                    className="text-xs text-textMuted hover:text-white transition-colors"
                  >
                    {mode === 'login' ? '還沒有帳號？點此註冊' : '已有帳號？返回登入'}
                  </button>
             </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Smartphone, MessageCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MOCK_USER } from '../../constants';
import { User } from '../../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
  onNavigateHome: () => void;
  onNavigateProfile: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onNavigateHome, onNavigateProfile }) => {
  const [activeTab, setActiveTab] = useState<'line' | 'phone'>('line');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+886');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleSendOtp = () => {
    if (!phoneNumber) return;
    setShowOtp(true);
    // Simulate API call
  };

  const handleLogin = () => {
    // Simulate login success
    const isNewUser = true; // Hardcoded simulation
    
    // Set global user
    onLogin(MOCK_USER);

    if (isNewUser) {
      setShowOnboarding(true);
    } else {
      onNavigateHome();
    }
  };

  if (showOnboarding) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90">
        <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-md p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" x2="20" y1="8" y2="14"/><line x1="23" x2="17" y1="11" y2="11"/></svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to HyperPoker</h2>
            <p className="text-textMuted text-sm leading-relaxed">
              To reserve seats and join tournaments, please complete your global profile to meet local regulations.
            </p>
          </div>
          <div className="space-y-3">
            <Button fullWidth onClick={onNavigateProfile}>
              Fill Profile Now
            </Button>
            <Button fullWidth variant="ghost" onClick={onNavigateHome}>
              I'll do it later
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          <p className="text-textMuted mt-2">Global Player Portal</p>
        </div>

        <div className="bg-surface border border-slate-800 rounded-2xl p-2 mb-6 grid grid-cols-2 gap-2">
          <button 
            onClick={() => setActiveTab('line')}
            className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all ${activeTab === 'line' ? 'bg-[#06C755] text-white shadow-lg' : 'text-textMuted hover:bg-slate-800'}`}
          >
            <MessageCircle size={18} />
            LINE Login
          </button>
          <button 
             onClick={() => setActiveTab('phone')}
             className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all ${activeTab === 'phone' ? 'bg-slate-700 text-white shadow-lg' : 'text-textMuted hover:bg-slate-800'}`}
          >
            <Smartphone size={18} />
            Phone
          </button>
        </div>

        <div className="bg-surfaceHighlight/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          {activeTab === 'line' ? (
             <div className="text-center py-4">
               <p className="text-textMuted mb-6 text-sm">One-click login with your LINE account.</p>
               <Button fullWidth className="bg-[#06C755] hover:bg-[#05b34c]" onClick={handleLogin}>
                 Continue with LINE
               </Button>
             </div>
          ) : (
            <div className="space-y-4">
              {!showOtp ? (
                <>
                  <div className="flex gap-3">
                    <div className="w-24">
                      <Input 
                        value={countryCode} 
                        onChange={(e) => setCountryCode(e.target.value)} 
                        placeholder="+886"
                        className="text-center"
                      />
                    </div>
                    <Input 
                      type="tel" 
                      placeholder="Mobile Number" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <Button fullWidth onClick={handleSendOtp} disabled={!phoneNumber}>
                    Send OTP
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-center mb-2">
                    <p className="text-xs text-textMuted">Code sent to {countryCode} {phoneNumber}</p>
                  </div>
                  <Input 
                    type="text" 
                    placeholder="Enter 6-digit code" 
                    className="text-center tracking-widest text-lg"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <Button fullWidth onClick={handleLogin} disabled={otp.length < 4}>
                    Verify & Login
                  </Button>
                  <button 
                    onClick={() => setShowOtp(false)}
                    className="w-full text-xs text-textMuted hover:text-white mt-2"
                  >
                    Change Number
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
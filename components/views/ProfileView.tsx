import React, { useState } from 'react';
import { Lock, Camera, Upload, CheckCircle, TrendingUp, TrendingDown, LogOut, Smartphone, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Header } from '../ui/Header';
import { User } from '../../types';
import { GAME_HISTORY } from '../../constants';

interface ProfileViewProps {
  user: User;
  onUpdateUser: (updates: Partial<User>) => void;
  onLogout: () => void;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isWin = data.profit > 0;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl z-50">
        <p className="text-xs text-slate-400 mb-1">{data.date}</p>
        <p className="text-sm font-bold text-white mb-1">{data.gameName}</p>
        <p className={`text-sm font-mono font-bold ${isWin ? 'text-primary' : 'text-danger'}`}>
          {isWin ? '+' : ''}{data.profit.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

// Date Dropdown Component
const BirthdaySelector = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Parse current value
    const dateObj = value ? new Date(value) : null;
    const [selYear, setSelYear] = useState(dateObj?.getFullYear() || 1990);
    const [selMonth, setSelMonth] = useState(dateObj ? dateObj.getMonth() + 1 : 1);
    const [selDay, setSelDay] = useState(dateObj?.getDate() || 1);

    const updateDate = (y: number, m: number, d: number) => {
        setSelYear(y); setSelMonth(m); setSelDay(d);
        // Format YYYY-MM-DD
        const formatted = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        onChange(formatted);
    };

    const years = Array.from({length: 80}, (_, i) => currentYear - i); // Last 80 years
    const months = Array.from({length: 12}, (_, i) => i + 1);
    const days = Array.from({length: 31}, (_, i) => i + 1);

    return (
        <div className="w-full">
            <label className="block text-xs font-medium text-textMuted mb-1.5">生日 (西元 / 月 / 日)</label>
            <div className="flex gap-2 w-full">
                <select 
                   className="bg-surface border border-slate-800 rounded-lg p-2.5 text-sm text-white flex-1 outline-none focus:border-gold min-w-0"
                   value={selYear}
                   onChange={(e) => updateDate(Number(e.target.value), selMonth, selDay)}
                >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select 
                   className="bg-surface border border-slate-800 rounded-lg p-2.5 text-sm text-white flex-1 outline-none focus:border-gold min-w-0"
                   value={selMonth}
                   onChange={(e) => updateDate(selYear, Number(e.target.value), selDay)}
                >
                    {months.map(m => <option key={m} value={m}>{m}月</option>)}
                </select>
                <select 
                   className="bg-surface border border-slate-800 rounded-lg p-2.5 text-sm text-white flex-1 outline-none focus:border-gold min-w-0"
                   value={selDay}
                   onChange={(e) => updateDate(selYear, selMonth, Number(e.target.value))}
                >
                    {days.map(d => <option key={d} value={d}>{d}日</option>)}
                </select>
            </div>
        </div>
    );
};

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser, onLogout }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    nationalId: user.nationalId || '',
    nickname: user.nickname || '',
    mobile: user.mobile || '',
    birthday: user.birthday || '',
  });

  // Reordered Tabs: Info -> Club -> Stats
  const [activeTab, setActiveTab] = useState<'info' | 'club' | 'stats'>('info');
  
  // KYC State
  const [kycUploaded, setKycUploaded] = useState(user.kycUploaded || false);
  
  // Mobile Verification State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isMobileVerified, setIsMobileVerified] = useState(user.mobileVerified || false);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSendOtp = () => {
      if (!formData.mobile) {
          alert("請先輸入手機號碼");
          return;
      }
      setOtpSent(true);
      alert(`驗證碼已發送至 ${formData.mobile} (模擬碼: 1234)`);
  };

  const handleVerifyOtp = () => {
      if (otpCode === '1234') {
          setIsMobileVerified(true);
          setOtpSent(false);
          alert("手機驗證成功！");
      } else {
          alert("驗證碼錯誤");
      }
  };

  const handleUploadKyc = () => {
      // Simulate upload
      setTimeout(() => {
          setKycUploaded(true);
          alert("證件上傳成功！");
      }, 500);
  };

  const handleSave = () => {
    if (!formData.name) {
        alert("請輸入真實姓名");
        return;
    }
    
    // Simulate API save
    onUpdateUser({
        ...user, 
        ...formData,
        kycUploaded,
        mobileVerified: isMobileVerified,
        isProfileComplete: true 
    });
    alert("檔案更新成功！");
  };

  // Stats Logic
  let cumulative = 0;
  const chartData = GAME_HISTORY.map(game => {
    cumulative += game.profit;
    return {
      ...game,
      cumulative,
      displayDate: new Date(game.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    };
  });
  const totalProfit = chartData[chartData.length - 1]?.cumulative || 0;
  const isPositive = totalProfit >= 0;

  return (
    <div className="pb-24">
      <Header />
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white font-display">個人檔案</h2>
      </div>
      
      {/* Avatar Section */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-surface border-2 border-gold flex items-center justify-center overflow-hidden shadow-lg shadow-gold/20">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">♠️</span>
            )}
          </div>
          <button className="absolute bottom-0 right-0 bg-gold text-black p-1.5 rounded-full shadow-lg border-2 border-surface">
            <Camera size={14} />
          </button>
        </div>
        <div>
           <h3 className="text-xl font-bold text-white">{formData.nickname || user.name || "新玩家"}</h3>
           <p className={`text-sm font-medium ${user.isProfileComplete ? 'text-gold' : 'text-slate-500'}`}>
               {user.isProfileComplete ? '✨ 認證會員' : '未完成設置'}
           </p>
        </div>
      </div>

      {/* Tabs - Swapped Stats and Club */}
      <div className="flex border-b border-slate-800 mb-6">
        <button
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'info' ? 'text-gold border-b-2 border-gold' : 'text-textMuted hover:text-slate-300'}`}
          onClick={() => setActiveTab('info')}
        >
          身份資訊
        </button>
        <button
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'club' ? 'text-gold border-b-2 border-gold' : 'text-textMuted hover:text-slate-300'}`}
          onClick={() => setActiveTab('club')}
        >
          俱樂部
        </button>
        <button
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'stats' ? 'text-gold border-b-2 border-gold' : 'text-textMuted hover:text-slate-300'}`}
          onClick={() => setActiveTab('stats')}
        >
          數據統計
        </button>
      </div>

      <div className="min-h-[300px]">
      {activeTab === 'info' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-4">
            
            {/* Identity & KYC Section Combined */}
            <div className="p-5 bg-surfaceHighlight rounded-2xl border border-slate-700 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gold/5 rounded-bl-full -mr-4 -mt-4" />
                
                <div className="flex items-center justify-between">
                     <h3 className="text-sm font-bold text-gold uppercase tracking-wider flex items-center gap-2">
                         <Lock size={14} /> 身份與證件驗證
                     </h3>
                     {user.isProfileComplete && <CheckCircle size={16} className="text-gold" />}
                </div>

                {user.isProfileComplete ? (
                    // Read-Only View (Verified)
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-500">真實姓名</label>
                                <div className="text-white font-medium">{user.name}</div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">身分證字號</label>
                                <div className="text-white font-medium">{user.nationalId}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded border border-slate-800">
                            <CheckCircle size={14} className="text-emerald-500" />
                            <span className="text-xs text-slate-300">證件已上傳驗證</span>
                        </div>
                    </div>
                ) : (
                    // Edit View
                    <div className="space-y-4">
                         <Input 
                            label="真實姓名" 
                            placeholder="例：王小明"
                            value={formData.name} 
                            onChange={(e) => handleChange('name', e.target.value)}
                        />
                        <Input 
                            label="身分證字號" 
                            placeholder="例：A123456789"
                            value={formData.nationalId} 
                            onChange={(e) => handleChange('nationalId', e.target.value)}
                        />
                        
                        {/* Compact KYC Upload */}
                        <div className="pt-2">
                            <label className="text-xs font-medium text-textMuted mb-2 block">證件驗證</label>
                            {kycUploaded ? (
                                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <CheckCircle size={16} />
                                        <span className="text-sm font-medium">已上傳完畢</span>
                                    </div>
                                    <button 
                                        onClick={() => setKycUploaded(false)}
                                        className="text-xs text-slate-400 underline hover:text-white flex items-center gap-1"
                                    >
                                        <RefreshCw size={10} /> 重新上傳
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={handleUploadKyc} className="bg-slate-800 border border-dashed border-slate-600 rounded-lg py-3 flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:border-gold hover:bg-gold/5 transition-all">
                                        <Upload size={14} /> <span className="text-xs">正面</span>
                                    </button>
                                    <button onClick={handleUploadKyc} className="bg-slate-800 border border-dashed border-slate-600 rounded-lg py-3 flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:border-gold hover:bg-gold/5 transition-all">
                                        <Upload size={14} /> <span className="text-xs">反面</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="h-px bg-slate-800 w-full my-2"></div>
            
            <Input 
                label="暱稱 (顯示名稱)" 
                value={formData.nickname} 
                onChange={(e) => handleChange('nickname', e.target.value)}
            />

            {/* Birthday Dropdowns */}
            <BirthdaySelector 
                value={formData.birthday} 
                onChange={(val) => handleChange('birthday', val)} 
            />

            {/* Mobile with OTP */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-textMuted">手機號碼</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Smartphone className="absolute top-2.5 left-3 text-slate-500" size={16} />
                        <input
                            className={`w-full bg-surface border border-slate-800 rounded-lg pl-10 pr-3 py-2.5 text-sm focus:border-gold outline-none ${isMobileVerified ? 'text-emerald-400' : 'text-white'}`}
                            value={formData.mobile}
                            onChange={(e) => {
                                handleChange('mobile', e.target.value);
                                setIsMobileVerified(false); // Reset if changed
                            }}
                            placeholder="0912345678"
                            disabled={isMobileVerified}
                        />
                        {isMobileVerified && <CheckCircle className="absolute top-2.5 right-3 text-emerald-500" size={16} />}
                    </div>
                    {!isMobileVerified && (
                        <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={handleSendOtp}
                            disabled={otpSent || !formData.mobile}
                            className="w-24 shrink-0"
                        >
                            {otpSent ? '已發送' : '驗證'}
                        </Button>
                    )}
                </div>
                
                {otpSent && !isMobileVerified && (
                    <div className="animate-in fade-in slide-in-from-top-1 mt-2 p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <p className="text-xs text-textMuted mb-2">請輸入簡訊驗證碼:</p>
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 bg-black border border-slate-700 rounded p-2 text-center tracking-widest text-white outline-none focus:border-gold"
                                placeholder="----"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                maxLength={4}
                            />
                            <Button size="sm" onClick={handleVerifyOtp}>確認</Button>
                        </div>
                    </div>
                )}
            </div>
            
          </div>

          <Button fullWidth onClick={handleSave} className="mt-4 h-12 text-base shadow-gold/20" size="lg">
             {user.isProfileComplete ? '保存變更' : '完成設置'}
          </Button>
        </div>
      )}

      {/* Swapped order: Club second */}
      {activeTab === 'club' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black shadow-lg">
                       <span className="font-bold text-lg">6B</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg font-display">6Bet 撲克俱樂部</h3>
                        <p className="text-xs text-slate-400">Since 2023</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Tier</p>
                        <p className="text-xl font-bold text-white font-display">Platinum</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Points</p>
                        <p className="text-xl font-bold text-gold">3,500</p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Referral</p>
                        <p className="text-sm font-mono text-white">AGT-009</p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Total Buy-in</p>
                        <p className="text-sm font-mono text-white">$145,000</p>
                    </div>
                </div>
             </div>
        </div>
      )}

      {/* Swapped order: Stats third */}
      {activeTab === 'stats' && (
         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-surfaceHighlight rounded-2xl p-6 border border-slate-700 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-gold/10 rounded-full blur-2xl"></div>
                <p className="text-sm text-slate-400 mb-1 font-medium">Total Profit</p>
                <div className="flex items-center gap-3">
                    <h3 className={`text-3xl font-bold font-mono ${isPositive ? 'text-gold' : 'text-danger'} glow-text`}>
                        {isPositive ? '+' : ''}{totalProfit.toLocaleString()}
                    </h3>
                    {isPositive ? <TrendingUp className="text-gold" /> : <TrendingDown className="text-danger" />}
                </div>
            </div>

            <div className="h-[250px] w-full bg-slate-900/50 rounded-2xl p-2 border border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis 
                        dataKey="displayDate" 
                        stroke="#525252" 
                        tick={{fontSize: 10}} 
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis 
                        stroke="#525252" 
                        tick={{fontSize: 10}} 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value/1000}k`}
                        dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '4 4'}} />
                    <Line 
                        type="monotone" 
                        dataKey="cumulative" 
                        stroke={isPositive ? '#f59e0b' : '#ef4444'} 
                        strokeWidth={2}
                        dot={{fill: '#0f172a', strokeWidth: 2, r: 3}}
                        activeDot={{r: 5, fill: '#fff', stroke: '#f59e0b'}}
                    />
                </LineChart>
                </ResponsiveContainer>
            </div>
         </div>
      )}
      </div>

      {/* Logout Section */}
      <div className="mt-8 pt-6 border-t border-slate-800">
         <button 
           onClick={onLogout}
           className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-danger hover:bg-danger/10 transition-colors font-medium"
         >
           <LogOut size={18} />
           登出
         </button>
      </div>
    </div>
  );
};
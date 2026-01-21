
import React, { useState, useEffect } from 'react';
import { Lock, Camera, Upload, CheckCircle, LogOut, Smartphone, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Header } from '../ui/Header';
import { User, Wallet } from '../../types';
import { mockApi } from '../../services/mockApi';

interface ProfileViewProps {
  user: User;
  onUpdateUser: (updates: Partial<User>) => void;
  onLogout: () => void;
}

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

  const [activeTab, setActiveTab] = useState<'info' | 'club'>('info');
  const [kycUploaded, setKycUploaded] = useState(user.kycUploaded || false);
  const [myWallet, setMyWallet] = useState<Wallet | null>(null);

  useEffect(() => {
      // Fetch user's primary wallet for display (assuming Hyper Club c-1 for now)
      const fetchWallet = async () => {
          try {
              const w = await mockApi.getWallet(user.id, 'c-1');
              setMyWallet(w);
          } catch(e) {}
      };
      if(activeTab === 'club') fetchWallet();
  }, [activeTab, user.id]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleReverifyMobile = () => {
      const newMobile = prompt("請輸入新的手機號碼：");
      if (newMobile) {
          const code = prompt(`驗證碼已發送至 ${newMobile} (模擬碼: 1234)。請輸入：`);
          if (code === '1234') {
              handleChange('mobile', newMobile);
              alert("手機號碼更新並驗證成功！");
          } else {
              alert("驗證碼錯誤");
          }
      }
  };

  const handleUploadKyc = () => {
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
    
    onUpdateUser({
        ...user, 
        ...formData,
        kycUploaded,
        isProfileComplete: true 
    });
    alert("檔案更新成功！");
  };

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

      {/* Tabs */}
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
      </div>

      <div className="min-h-[300px]">
      {activeTab === 'info' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-4">
            
            {/* Identity & KYC Section */}
            <div className="p-5 bg-surfaceHighlight rounded-2xl border border-slate-700 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gold/5 rounded-bl-full -mr-4 -mt-4" />
                
                <div className="flex items-center justify-between">
                     <h3 className="text-sm font-bold text-gold uppercase tracking-wider flex items-center gap-2">
                         <Lock size={14} /> 身份與證件驗證
                     </h3>
                     {user.isProfileComplete && <CheckCircle size={16} className="text-gold" />}
                </div>

                {user.isProfileComplete ? (
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
                        
                        <div className="pt-2">
                            <label className="text-xs font-medium text-textMuted mb-2 block">證件驗證</label>
                            {kycUploaded ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                                        <div className="flex items-center gap-2 text-emerald-400">
                                            <CheckCircle size={16} />
                                            <span className="text-sm font-medium">已上傳完畢</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setKycUploaded(false)}
                                        className="text-xs text-slate-400 underline hover:text-white flex items-center gap-1 self-end"
                                    >
                                        <RefreshCw size={10} /> 重新上傳證件
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

            <BirthdaySelector 
                value={formData.birthday} 
                onChange={(val) => handleChange('birthday', val)} 
            />

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-textMuted">手機號碼</label>
                    <button 
                        onClick={handleReverifyMobile}
                        className="text-[10px] text-primary hover:text-primaryHover underline"
                    >
                        重新驗證 / 變更
                    </button>
                </div>
                <div className="relative">
                    <Smartphone className="absolute top-2.5 left-3 text-slate-500" size={16} />
                    <input
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-3 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                        value={formData.mobile}
                        disabled
                    />
                    <CheckCircle className="absolute top-2.5 right-3 text-emerald-500" size={16} />
                </div>
            </div>
          </div>

          <Button fullWidth onClick={handleSave} className="mt-4 h-12 text-base shadow-gold/20" size="lg">
             {user.isProfileComplete ? '保存變更' : '完成設置'}
          </Button>
        </div>
      )}

      {activeTab === 'club' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black shadow-lg">
                       <span className="font-bold text-lg">HY</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg font-display">Hyper 俱樂部</h3>
                        <p className="text-xs text-slate-400">ID: Hyper-888</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">會員等級</p>
                        <p className="text-xl font-bold text-white font-display">白金會員 (Platinum)</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">加入時間</p>
                        <p className="text-sm font-mono text-white">
                            {myWallet?.joinDate ? new Date(myWallet.joinDate).toLocaleDateString() : 'Loading...'}
                        </p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">儲值金餘額 (Balance)</p>
                        <p className="text-xl font-bold font-mono text-emerald-400">
                            ${myWallet?.balance.toLocaleString() ?? 0}
                        </p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">積分 (Points)</p>
                        <p className="text-xl font-bold font-mono text-gold">
                            {myWallet?.points.toLocaleString() ?? 0} P
                        </p>
                    </div>
                </div>
             </div>
        </div>
      )}
      </div>

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

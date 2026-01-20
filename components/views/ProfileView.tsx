import React, { useState } from 'react';
import { Lock, Camera, Upload, CheckCircle, TrendingUp, TrendingDown, LogOut } from 'lucide-react';
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

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser, onLogout }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    nationalId: user.nationalId || '',
    nickname: user.nickname || '',
    mobile: user.mobile || '',
    birthday: user.birthday || '',
    isForeigner: user.isForeigner || false,
  });

  const [activeTab, setActiveTab] = useState<'info' | 'stats' | 'club'>('info');

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Basic validation logic - relaxed for testing
    // In production, you would check regex for ID/Phone
    if (!formData.name) {
        alert("請輸入真實姓名");
        return;
    }
    
    // Simulate API save
    onUpdateUser({
        ...user, // Keep existing fields
        ...formData,
        isProfileComplete: true // Force complete on save
    });
    alert("檔案驗證並更新成功！");
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
        <h2 className="text-2xl font-bold text-white">個人檔案</h2>
      </div>
      
      {/* Avatar Section */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">👤</span>
            )}
          </div>
          <button className="absolute bottom-0 right-0 bg-primary text-slate-900 p-1 rounded-full shadow-lg border-2 border-background">
            <Camera size={12} />
          </button>
        </div>
        <div>
           <h3 className="text-xl font-bold text-white">{formData.nickname || user.name || "新玩家"}</h3>
           <p className={`text-sm ${user.isProfileComplete ? 'text-emerald-400' : 'text-yellow-500'}`}>
               {user.isProfileComplete ? '已驗證玩家' : '需設置'}
           </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6">
        <button
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'info' ? 'text-primary border-b-2 border-primary' : 'text-textMuted hover:text-slate-300'}`}
          onClick={() => setActiveTab('info')}
        >
          身份資訊
        </button>
        <button
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'stats' ? 'text-primary border-b-2 border-primary' : 'text-textMuted hover:text-slate-300'}`}
          onClick={() => setActiveTab('stats')}
        >
          數據統計
        </button>
        <button
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'club' ? 'text-primary border-b-2 border-primary' : 'text-textMuted hover:text-slate-300'}`}
          onClick={() => setActiveTab('club')}
        >
          俱樂部資訊
        </button>
      </div>

      <div className="min-h-[300px]">
      {activeTab === 'info' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-4">
            
            {/* Conditional Identity Section */}
            {user.isProfileComplete ? (
                // Read-Only View (Verified)
                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle size={14} /> 已驗證身份
                        </h3>
                        <Lock size={14} className="text-slate-600" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500">真實姓名</label>
                        <div className="text-slate-300 font-medium">{user.name}</div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500">身分證字號</label>
                        <div className="text-slate-300 font-medium">{user.nationalId}</div>
                    </div>
                    <div className="text-[10px] text-slate-600 italic">
                        * 若需修改實名資訊，請洽俱樂部櫃台。
                    </div>
                </div>
            ) : (
                // Edit View (New User)
                <div className="p-4 bg-yellow-500/5 rounded-xl border border-yellow-500/20 space-y-4">
                     <div className="flex items-center gap-2 mb-2">
                         <h3 className="text-sm font-semibold text-yellow-500 uppercase tracking-wider">身份設置</h3>
                     </div>
                     <p className="text-xs text-textMuted">請輸入與您身分證件一致的資訊。</p>
                     
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
                </div>
            )}

            <div className="h-px bg-slate-800 w-full my-2"></div>

            <Input 
                label="暱稱 (顯示名稱)" 
                value={formData.nickname} 
                onChange={(e) => handleChange('nickname', e.target.value)}
            />
            
            <Input 
                label="手機號碼" 
                value={formData.mobile} 
                onChange={(e) => handleChange('mobile', e.target.value)}
            />
            
            <Input 
                label="生日" 
                type="date"
                value={formData.birthday} 
                onChange={(e) => handleChange('birthday', e.target.value)}
            />
            
            {/* KYC Upload - Enhanced for First Time */}
            <div className="space-y-2 mt-4">
                <label className="text-xs font-medium text-textMuted">證件驗證 (正面/反面)</label>
                {user.kycUploaded ? (
                    <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                        <CheckCircle size={18} />
                        <span className="text-sm">證件已上傳</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                         <button className="bg-slate-800 border border-dashed border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-white hover:border-primary hover:bg-primary/5 transition-all group">
                            <Upload size={24} className="group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-medium">上傳正面</span>
                         </button>
                         <button className="bg-slate-800 border border-dashed border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-white hover:border-primary hover:bg-primary/5 transition-all group">
                            <Upload size={24} className="group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-medium">上傳反面</span>
                         </button>
                    </div>
                )}
            </div>
          </div>

          <Button fullWidth onClick={handleSave} className="mt-4" size="lg">
             {user.isProfileComplete ? '保存變更' : '驗證並完成設置'}
          </Button>
        </div>
      )}

      {activeTab === 'stats' && (
         <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-surfaceHighlight rounded-2xl p-6 border border-slate-800">
                <p className="text-sm text-slate-400 mb-1">總盈利</p>
                <div className="flex items-center gap-3">
                    <h3 className={`text-3xl font-bold font-mono ${isPositive ? 'text-primary' : 'text-danger'}`}>
                        {isPositive ? '+' : ''}{totalProfit.toLocaleString()}
                    </h3>
                    {isPositive ? <TrendingUp className="text-primary" /> : <TrendingDown className="text-danger" />}
                </div>
            </div>

            <div className="h-[250px] w-full bg-slate-900/50 rounded-2xl p-2 border border-slate-800/50">
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis 
                        dataKey="displayDate" 
                        stroke="#64748b" 
                        tick={{fontSize: 10}} 
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis 
                        stroke="#64748b" 
                        tick={{fontSize: 10}} 
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value/1000}k`}
                        dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4'}} />
                    <Line 
                        type="monotone" 
                        dataKey="cumulative" 
                        stroke={isPositive ? '#10b981' : '#ef4444'} 
                        strokeWidth={2}
                        dot={{fill: '#0f172a', strokeWidth: 2, r: 3}}
                        activeDot={{r: 5, fill: '#fff'}}
                    />
                </LineChart>
                </ResponsiveContainer>
            </div>
         </div>
      )}

      {activeTab === 'club' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                       <span className="font-bold text-lg">6B</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">6Bet 撲克俱樂部</h3>
                        <p className="text-xs text-slate-400">2023 年加入</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-xs text-slate-500">當前等級</p>
                        <p className="text-xl font-bold text-white">Platinum</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-slate-500">總積分</p>
                        <p className="text-xl font-bold text-primary">3,500</p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-xs text-slate-500">推薦人 ID</p>
                        <p className="text-sm font-mono text-white">AGT-009</p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-xs text-slate-500">總買入</p>
                        <p className="text-sm font-mono text-white">$145,000</p>
                    </div>
                </div>
             </div>
        </div>
      )}
      </div>

      {/* Logout Section - Always visible at bottom */}
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

import React, { useState, useEffect } from 'react';
import { Lock, Camera, Upload, CheckCircle, LogOut, Smartphone, RefreshCw, AlertTriangle, Edit2, Save, MessageSquare, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Header } from '../ui/Header';
import { Modal } from '../ui/Modal';
import { User, Wallet } from '../../types';
import { SEED_CLUBS, GAME_HISTORY } from '../../constants';
import { mockApi } from '../../services/mockApi';
import { useAlert } from '../../contexts/AlertContext';

interface ProfileViewProps {
  user: User;
  onUpdateUser: (updates: Partial<User>) => void;
  onLogout: () => void;
}

const BirthdaySelector = ({ value, onChange, disabled }: { value: string, onChange: (val: string) => void, disabled: boolean }) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const dateObj = value ? new Date(value) : null;
    const [selYear, setSelYear] = useState(dateObj?.getFullYear() || 1990);
    const [selMonth, setSelMonth] = useState(dateObj ? dateObj.getMonth() + 1 : 1);
    const [selDay, setSelDay] = useState(dateObj?.getDate() || 1);

    const updateDate = (y: number, m: number, d: number) => {
        setSelYear(y); setSelMonth(m); setSelDay(d);
        const formatted = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        onChange(formatted);
    };

    const years = Array.from({length: 80}, (_, i) => currentYear - i);
    const months = Array.from({length: 12}, (_, i) => i + 1);
    const days = Array.from({length: 31}, (_, i) => i + 1);

    return (
        <div className="w-full">
            <label className="block text-xs font-medium text-textMuted mb-1.5">生日 (西元 / 月 / 日)</label>
            <div className="flex gap-2 w-full">
                <select 
                   className={`bg-surface border border-slate-800 rounded-lg p-2.5 text-sm text-white flex-1 outline-none focus:border-gold min-w-0 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                   value={selYear}
                   onChange={(e) => updateDate(Number(e.target.value), selMonth, selDay)}
                   disabled={disabled}
                >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select 
                   className={`bg-surface border border-slate-800 rounded-lg p-2.5 text-sm text-white flex-1 outline-none focus:border-gold min-w-0 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                   value={selMonth}
                   onChange={(e) => updateDate(selYear, Number(e.target.value), selDay)}
                   disabled={disabled}
                >
                    {months.map(m => <option key={m} value={m}>{m}月</option>)}
                </select>
                <select 
                   className={`bg-surface border border-slate-800 rounded-lg p-2.5 text-sm text-white flex-1 outline-none focus:border-gold min-w-0 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                   value={selDay}
                   onChange={(e) => updateDate(selYear, selMonth, Number(e.target.value))}
                   disabled={disabled}
                >
                    {days.map(d => <option key={d} value={d}>{d}日</option>)}
                </select>
            </div>
        </div>
    );
};

// Circular Progress Component for Mileage
const MileageCircle = ({ current, total }: { current: number, total: number }) => {
    // Canvas size
    const size = 160;
    const strokeWidth = 10;
    const center = size / 2;
    const radius = (size - strokeWidth) / 2 - 5; // Padding
    
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min(100, Math.max(0, (current / total) * 100));
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex justify-center w-full py-4">
            <div className="relative" style={{ width: size, height: size }}>
                <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                    {/* Background Track: Using neutral dark gray to match app theme better than slate */}
                    <circle
                        className="text-neutral-800" 
                        strokeWidth={strokeWidth}
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={center}
                        cy={center}
                    />
                    {/* Progress */}
                    <circle
                        className="text-gold transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx={center}
                        cy={center}
                    />
                </svg>
                {/* Text Content - Absolute centered flex container */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">里程碑</span>
                    <span className="text-3xl font-bold text-white font-mono tracking-tighter leading-none shadow-black drop-shadow-sm">{current}</span>
                    <div className="h-px w-8 bg-neutral-700 my-2"></div>
                    <span className="text-[10px] text-neutral-500 leading-none mb-1">下一門檻</span>
                    <span className="text-xs font-bold text-neutral-400 font-mono">/ {total.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser, onLogout }) => {
  const { showAlert, showConfirm, showPrompt } = useAlert();
  const [nickname, setNickname] = useState(user.nickname || '');
  const [mobile, setMobile] = useState(user.mobile || '');
  const [sensitiveData, setSensitiveData] = useState({
    name: user.name || '',
    nationalId: user.nationalId || '',
    birthday: user.birthday || '',
  });
  const [kycUploaded, setKycUploaded] = useState(user.kycUploaded || false);
  const [activeTab, setActiveTab] = useState<'info' | 'club'>('info');
  const [myWallets, setMyWallets] = useState<Wallet[]>([]);
  const [isEditingIdentity, setIsEditingIdentity] = useState(!user.isProfileComplete); 
  
  // Membership Card Modal
  const [showMemberCard, setShowMemberCard] = useState<string | null>(null); // Store Club ID

  useEffect(() => {
      const fetchWallets = async () => {
          try {
              // Fetch all wallets for the user to list all clubs
              const w = await mockApi.getAllWallets(user.id);
              setMyWallets(w);
          } catch(e) {}
      };
      if(activeTab === 'club') fetchWallets();
  }, [activeTab, user.id]);

  const handleSensitiveChange = (field: string, value: any) => {
    setSensitiveData(prev => ({ ...prev, [field]: value }));
  };

  const handleReverifyMobile = async () => {
      const newMobile = await showPrompt("變更手機號碼", "請輸入新的手機號碼：");
      if (newMobile) {
          const code = await showPrompt("驗證手機", `驗證碼已發送至 ${newMobile} (模擬碼: 1234)。\n請輸入驗證碼：`);
          if (code === '1234') {
              setMobile(newMobile);
              mockApi.updateUserProfile({ ...user, mobile: newMobile }).then(u => {
                  onUpdateUser(u);
                  showAlert("成功", "手機號碼更新成功！");
              });
          } else if (code !== null) {
              showAlert("錯誤", "驗證碼錯誤");
          }
      }
  };

  const handleSaveNickname = () => {
      mockApi.updateUserProfile({ ...user, nickname }).then(u => {
          onUpdateUser(u);
          showAlert("成功", "暱稱已更新");
      });
  };

  const handleUploadKyc = () => {
      setTimeout(() => {
          setKycUploaded(true);
          showAlert("成功", "證件上傳成功！");
      }, 500);
  };

  const handleSaveIdentity = async () => {
      if (!sensitiveData.name || !sensitiveData.nationalId || !sensitiveData.birthday) {
          showAlert("資料不完整", "請填寫完整身份資料");
          return;
      }
      if (!kycUploaded) {
          showAlert("資料不完整", "請上傳證件照片");
          return;
      }

      if (user.isProfileComplete) {
          const confirmed = await showConfirm(
              "重要提醒",
              "⚠️ 修改身份資料（姓名、證件、生日）將導致您在所有協會的會員狀態變更為「待驗證」。\n\n您必須重新前往協會櫃檯進行真人核對，否則將無法報名賽事。\n\n確定要保存變更嗎？"
          );
          if (!confirmed) return;
      }

      try {
          const updatedUser = await mockApi.updateUserSensitiveData({
              ...user,
              ...sensitiveData,
              kycUploaded
          });
          onUpdateUser(updatedUser);
          setIsEditingIdentity(false);
          await showAlert("更新成功", "身份資料已更新。請記得至協會櫃檯完成驗證。");
      } catch (e: any) {
          await showAlert("錯誤", e.message);
      }
  };

  const getClubDetails = (clubId: string) => SEED_CLUBS.find(c => c.id === clubId);

  // Selected Wallet for Modal
  const selectedWallet = myWallets.find(w => w.clubId === showMemberCard);
  const selectedClubInfo = selectedWallet ? getClubDetails(selectedWallet.clubId) : null;
  
  // Calculate winnings for selected club
  const totalWinnings = selectedClubInfo ? GAME_HISTORY
    .filter(g => g.clubName === selectedClubInfo.name && g.profit > 0)
    .reduce((acc, curr) => acc + curr.profit, 0) : 0;

  return (
    <div className="pb-24">
      <Header />
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white font-display">個人檔案</h2>
      </div>
      
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
           <h3 className="text-xl font-bold text-white">{nickname || user.name || "新玩家"}</h3>
           <p className={`text-sm font-medium ${user.isProfileComplete ? 'text-gold' : 'text-slate-500'}`}>
               {user.isProfileComplete ? '✨ 已填寫實名資料' : '未完成設置'}
           </p>
        </div>
      </div>

      <div className="flex border-b border-slate-800 mb-6">
        <button
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'info' ? 'text-gold border-b-2 border-gold' : 'text-textMuted hover:text-slate-300'}`}
          onClick={() => setActiveTab('info')}
        >
          身份與設定
        </button>
        <button
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'club' ? 'text-gold border-b-2 border-gold' : 'text-textMuted hover:text-slate-300'}`}
          onClick={() => setActiveTab('club')}
        >
          協會
        </button>
      </div>

      <div className="min-h-[300px]">
      {activeTab === 'info' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Identity Section Code (unchanged) */}
          <div className={`p-5 rounded-2xl border space-y-4 relative overflow-hidden transition-colors ${isEditingIdentity ? 'bg-surfaceHighlight border-gold/50 shadow-gold/10 shadow-lg' : 'bg-surface border-slate-800'}`}>
                <div className="flex items-center justify-between">
                     <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isEditingIdentity ? 'text-gold' : 'text-slate-400'}`}>
                         <Lock size={14} /> 身份與證件驗證
                     </h3>
                     {!isEditingIdentity ? (
                         <button 
                            onClick={() => setIsEditingIdentity(true)}
                            className="text-xs flex items-center gap-1 text-primary hover:text-primaryHover transition-colors px-2 py-1 rounded bg-primary/10 border border-primary/20"
                         >
                            <Edit2 size={12} /> 編輯
                         </button>
                     ) : (
                         <span className="text-xs text-gold animate-pulse font-medium">編輯中...</span>
                     )}
                </div>

                {isEditingIdentity && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex items-start gap-2">
                        <AlertTriangle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-500/90 leading-relaxed">
                            注意：修改此區塊資料後，您在所有協會的會籍將轉為<span className="font-bold underline">待驗證</span>狀態。需重新至櫃檯進行真人核對。
                        </p>
                    </div>
                )}

                <div className="space-y-4">
                    <Input 
                        label="真實姓名" 
                        placeholder="例：王小明"
                        value={sensitiveData.name} 
                        onChange={(e) => handleSensitiveChange('name', e.target.value)}
                        disabled={!isEditingIdentity}
                    />
                    <Input 
                        label="身分證字號" 
                        placeholder="例：A123456789"
                        value={sensitiveData.nationalId} 
                        onChange={(e) => handleSensitiveChange('nationalId', e.target.value)}
                        disabled={!isEditingIdentity}
                    />

                    <BirthdaySelector 
                        value={sensitiveData.birthday} 
                        onChange={(val) => handleSensitiveChange('birthday', val)} 
                        disabled={!isEditingIdentity}
                    />
                    
                    <div className="pt-2">
                        <label className="text-xs font-medium text-textMuted mb-2 block">證件驗證 (上傳)</label>
                        {kycUploaded ? (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <CheckCircle size={16} />
                                        <span className="text-sm font-medium">已上傳完畢</span>
                                    </div>
                                </div>
                                {isEditingIdentity && (
                                    <button 
                                        onClick={() => setKycUploaded(false)}
                                        className="text-xs text-slate-400 underline hover:text-white flex items-center gap-1 self-end"
                                    >
                                        <RefreshCw size={10} /> 重新上傳證件
                                    </button>
                                )}
                            </div>
                        ) : (
                            isEditingIdentity ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={handleUploadKyc} className="bg-slate-800 border border-dashed border-slate-600 rounded-lg py-3 flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:border-gold hover:bg-gold/5 transition-all">
                                        <Upload size={14} /> <span className="text-xs">正面</span>
                                    </button>
                                    <button onClick={handleUploadKyc} className="bg-slate-800 border border-dashed border-slate-600 rounded-lg py-3 flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:border-gold hover:bg-gold/5 transition-all">
                                        <Upload size={14} /> <span className="text-xs">反面</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="text-xs text-slate-500 italic">未上傳</div>
                            )
                        )}
                    </div>
                </div>

                {isEditingIdentity && (
                    <div className="flex gap-3 pt-2">
                        <Button variant="ghost" fullWidth onClick={() => setIsEditingIdentity(false)} className="border border-slate-700">取消</Button>
                        <Button variant="primary" fullWidth onClick={handleSaveIdentity}>
                            <Save size={16} className="mr-2" /> 保存變更
                        </Button>
                    </div>
                )}
          </div>

          <div className="h-px bg-slate-800 w-full my-2"></div>
          
          <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">一般設定</h3>
              
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <Input 
                        label="暱稱 (顯示名稱)" 
                        value={nickname} 
                        onChange={(e) => setNickname(e.target.value)}
                    />
                </div>
                <Button size="md" className="mb-[1px] shrink-0 whitespace-nowrap" variant="secondary" onClick={handleSaveNickname}>更新</Button>
              </div>

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
                            value={mobile}
                            disabled
                        />
                        <CheckCircle className="absolute top-2.5 right-3 text-emerald-500" size={16} />
                    </div>
              </div>
          </div>

        </div>
      )}

      {activeTab === 'club' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
             {myWallets.map(wallet => {
                 const club = getClubDetails(wallet.clubId);
                 if (!club) return null;
                 return (
                    <div 
                        key={wallet.clubId}
                        onClick={() => setShowMemberCard(wallet.clubId)}
                        className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden cursor-pointer group hover:border-gold/30 hover:shadow-gold/10 transition-all active:scale-[0.98] mb-4"
                    >
                        <div className="absolute top-0 right-0 p-4">
                            <div className="flex items-center gap-1 text-xs text-slate-500 group-hover:text-gold transition-colors">
                                查看會員卡 <ChevronRight size={14} />
                            </div>
                        </div>

                        {wallet.status === 'pending' && (
                            <div className="absolute top-10 right-4">
                                <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/40 text-yellow-500 px-2 py-1 rounded text-xs font-bold animate-pulse">
                                    <AlertTriangle size={12} /> 需驗證身份
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black shadow-lg">
                            <span className="font-bold text-lg">{club.name.substring(0,2)}</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg font-display">{club.name}</h3>
                                <p className="text-xs text-slate-400">ID: {club.localId}</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 uppercase tracking-wider">會員等級</p>
                                <p className="text-xl font-bold text-white font-display">{club.tier}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 uppercase tracking-wider">加入時間</p>
                                <p className="text-sm font-mono text-white">
                                    {new Date(wallet.joinDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 uppercase tracking-wider">儲值金餘額</p>
                                <p className="text-xl font-bold font-mono text-emerald-400">
                                    ${wallet.balance.toLocaleString()}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 uppercase tracking-wider">積分</p>
                                <p className="text-xl font-bold font-mono text-gold">
                                    {wallet.points.toLocaleString()} P
                                </p>
                            </div>
                        </div>
                    </div>
                 );
             })}
             
             {myWallets.length === 0 && (
                 <div className="text-center py-8 text-slate-500 text-sm">尚未加入任何協會</div>
             )}
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

      {/* Member Card Modal */}
      <Modal isOpen={!!showMemberCard} onClose={() => setShowMemberCard(null)} title="會員認證">
         <div className="flex flex-col items-center space-y-4">
             
             {/* 1. Combined Membership Card (Card + Barcode) */}
             <div className="w-full aspect-[1.5/1] bg-gradient-to-br from-yellow-200 via-amber-400 to-amber-600 rounded-xl shadow-2xl relative overflow-hidden flex flex-col justify-between">
                 {/* Card Texture Overlay */}
                 <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                     backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)',
                     backgroundSize: '16px 16px'
                 }}></div>
                 
                 {/* Top Shine */}
                 <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-10 pointer-events-none"></div>

                 {/* Top Section: Branding */}
                 <div className="relative z-10 p-6">
                    <div className="flex justify-between items-start">
                        <div>
                             <div className="flex items-center gap-2 text-black/90 font-display font-bold text-2xl tracking-wide drop-shadow-sm">
                                <span>♠️</span> {selectedClubInfo?.name || 'Club'}
                            </div>
                            <div className="text-[10px] text-black/70 uppercase tracking-widest font-bold mt-1">
                                {selectedClubInfo?.tier || 'MEMBER'} PASS
                            </div>
                        </div>
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                             {/* Hologram Effect Placeholder */}
                             <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-300 to-purple-400 opacity-60"></div>
                        </div>
                    </div>
                 </div>

                 {/* Bottom Section: Barcode Area */}
                 <div className="relative z-10 mx-6 mb-6">
                     <div className="bg-white/95 backdrop-blur-md rounded-lg p-3 shadow-lg flex flex-col items-center gap-1 border border-white/50">
                        {/* Simulated Barcode */}
                         <div className="w-3/4 h-8 bg-black opacity-90" style={{
                             maskImage: 'repeating-linear-gradient(90deg, black, black 1px, transparent 1px, transparent 3px)',
                             WebkitMaskImage: 'repeating-linear-gradient(90deg, black, black 1px, transparent 1px, transparent 3px)'
                         }}></div>
                         <div className="text-black font-mono text-xs font-bold tracking-widest text-slate-800">2967089445</div>
                     </div>
                 </div>
             </div>

             {/* 2. Mileage Circle (Moved below card) */}
             <MileageCircle current={selectedWallet?.points || 0} total={3000} />

             {/* 3. Financial Info & Feedback */}
             <div className="w-full bg-surfaceHighlight rounded-xl p-4 border border-slate-700 space-y-3 mt-2">
                 <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                     <span className="text-sm text-slate-400">預繳報名費餘額</span>
                     <span className="font-mono font-bold text-white">${selectedWallet?.balance.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center">
                     <span className="text-sm text-slate-400">歷史總獎金</span>
                     <span className="font-mono font-bold text-gold">${totalWinnings.toLocaleString()}</span>
                 </div>
             </div>
             
             {selectedClubInfo?.feedbackUrl && (
                 <Button 
                   fullWidth 
                   variant="secondary" 
                   onClick={() => window.open(selectedClubInfo.feedbackUrl, '_blank')}
                   className="gap-2"
                 >
                     <MessageSquare size={16} /> 填寫意見反饋表
                 </Button>
             )}

             <Button fullWidth variant="primary" onClick={() => setShowMemberCard(null)}>
                 完成
             </Button>
         </div>
      </Modal>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { Lock, Camera, Upload, CheckCircle, LogOut, Smartphone, RefreshCw, AlertTriangle, Edit2, Save, MessageSquare, ChevronRight, ChevronDown, ChevronUp, Gift, Trophy, Coins, ArrowDown, ArrowUp, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Header } from '../ui/Header';
import { Modal } from '../ui/Modal';
import { User, Wallet } from '../../types';
import { SEED_CLUBS, GAME_HISTORY } from '../../constants';
import { mockApi } from '../../services/mockApi';
import { useAlert } from '../../contexts/AlertContext';
import { THEME } from '../../theme';
import { isSupabaseClub } from '../../services/mockApi';
import { getTransactionsByMember, Transaction } from '../../services/supabaseTransaction';

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
            <label className={`block text-xs font-medium ${THEME.textSecondary} mb-1.5`}>生日 (西元 / 月 / 日)</label>
            <div className="flex gap-2 w-full">
                <select 
                   className={`${THEME.input} rounded-lg p-2.5 text-sm flex-1 outline-none focus:border-brand-green min-w-0 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                   value={selYear}
                   onChange={(e) => updateDate(Number(e.target.value), selMonth, selDay)}
                   disabled={disabled}
                >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select 
                   className={`${THEME.input} rounded-lg p-2.5 text-sm flex-1 outline-none focus:border-brand-green min-w-0 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                   value={selMonth}
                   onChange={(e) => updateDate(selYear, Number(e.target.value), selDay)}
                   disabled={disabled}
                >
                    {months.map(m => <option key={m} value={m}>{m}月</option>)}
                </select>
                <select 
                   className={`${THEME.input} rounded-lg p-2.5 text-sm flex-1 outline-none focus:border-brand-green min-w-0 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
const MileageCircle = ({ current }: { current: number }) => {
    // Canvas size
    const size = 160;
    const strokeWidth = 10;
    const center = size / 2;
    const radius = (size - strokeWidth) / 2 - 5; // Padding
    
    // Membership tier thresholds (in 6points)
    const PEARL_THRESHOLD = 0;      // 珍珠卡 (default)
    const EMERALD_THRESHOLD = 5000;  // 翡翠卡
    const PLATINUM_THRESHOLD = 20000; // 白金卡
    const DIAMOND_THRESHOLD = 50000;  // 金鑽卡
    
    // Determine current tier and next threshold
    let currentTier: string;
    let nextThreshold: number;
    let progress: number;
    
    if (current >= DIAMOND_THRESHOLD) {
        currentTier = '金鑽卡';
        nextThreshold = DIAMOND_THRESHOLD; // Max tier, show current as next
        progress = 100;
    } else if (current >= PLATINUM_THRESHOLD) {
        currentTier = '白金卡';
        nextThreshold = DIAMOND_THRESHOLD;
        progress = ((current - PLATINUM_THRESHOLD) / (DIAMOND_THRESHOLD - PLATINUM_THRESHOLD)) * 100;
    } else if (current >= EMERALD_THRESHOLD) {
        currentTier = '翡翠卡';
        nextThreshold = PLATINUM_THRESHOLD;
        progress = ((current - EMERALD_THRESHOLD) / (PLATINUM_THRESHOLD - EMERALD_THRESHOLD)) * 100;
    } else {
        currentTier = '珍珠卡';
        nextThreshold = EMERALD_THRESHOLD;
        progress = (current / EMERALD_THRESHOLD) * 100;
    }
    
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min(100, Math.max(0, progress));
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex justify-center w-full py-4">
            <div className="relative" style={{ width: size, height: size }}>
                <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                    {/* Background Track */}
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
                        className={`${THEME.accent} transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(6,193,103,0.5)]`}
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
                    <span className="text-2xl font-bold text-white font-mono tracking-tighter leading-none shadow-black drop-shadow-sm">{current.toLocaleString()}</span>
                    <span className="text-[10px] text-neutral-400 font-mono mb-1">6points</span>
                    <div className="h-px w-8 bg-neutral-700 my-2"></div>
                    <span className="text-[10px] text-neutral-500 leading-none mb-1">下一門檻</span>
                    <span className="text-xs font-bold text-neutral-400 font-mono">{nextThreshold.toLocaleString()} 6points</span>
                    <span className="text-[10px] text-brand-green font-bold mt-1">{currentTier}</span>
                </div>
            </div>
        </div>
    );
};

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser, onLogout }) => {
  const { showAlert, showConfirm, showPrompt } = useAlert();
  const [nickname, setNickname] = useState(user.nickname || '');
  const [mobile, setMobile] = useState(user.mobile || '');
  const [email, setEmail] = useState(user.email || '');
  const [sensitiveData, setSensitiveData] = useState({
    name: user.name || '',
    nationalId: user.nationalId || '',
    birthday: user.birthday || '',
    gender: user.gender || undefined as 'male' | 'female' | 'other' | undefined,
    nationality: user.nationality || 'TW' as string, // Default to Taiwan
  });
  const [kycUploaded, setKycUploaded] = useState(user.kycUploaded || false);
  const [activeTab, setActiveTab] = useState<'info' | 'club'>('info');
  const [myWallets, setMyWallets] = useState<Wallet[]>([]);
  const [isEditingIdentity, setIsEditingIdentity] = useState(!user.isProfileComplete); 
  
  // Membership Card Modal
  const [showMemberCard, setShowMemberCard] = useState<string | null>(null); // Store Club ID
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [expandedTransactions, setExpandedTransactions] = useState(false);

  // Check if nickname, mobile, or email has changed
  const nicknameChanged = nickname !== (user.nickname || '');
  const mobileChanged = mobile !== (user.mobile || '');
  const emailChanged = email !== (user.email || '');

  // Update state when user prop changes
  useEffect(() => {
    setNickname(user.nickname || '');
    setMobile(user.mobile || '');
    setEmail(user.email || '');
    setSensitiveData({
      name: user.name || '',
      nationalId: user.nationalId || '',
      birthday: user.birthday || '',
      gender: user.gender || undefined,
      nationality: user.nationality || 'TW',
    });
    setKycUploaded(user.kycUploaded || false);
  }, [user]);

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

  // Fetch transactions when membership card modal opens (only for Supabase clubs)
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!showMemberCard) {
        setTransactions([]);
        return;
      }

      // Only fetch for Supabase clubs
      if (!isSupabaseClub(showMemberCard)) {
        setTransactions([]);
        return;
      }

      const memberId = parseInt(user.id);
      if (isNaN(memberId)) {
        setTransactions([]);
        return;
      }

      setTransactionsLoading(true);
      try {
        const txns = await getTransactionsByMember(showMemberCard, memberId);
        setTransactions(txns);
      } catch (error: any) {
        console.error('Failed to fetch transactions:', error);
        setTransactions([]);
      } finally {
        setTransactionsLoading(false);
      }
    };

    fetchTransactions();
  }, [showMemberCard, user.id]);

  const handleSensitiveChange = (field: string, value: any) => {
    setSensitiveData(prev => ({ ...prev, [field]: value }));
  };


  const handleUploadKyc = () => {
      setTimeout(() => {
          setKycUploaded(true);
          showAlert("成功", "證件上傳成功！");
      }, 500);
  };

  const handleSaveIdentity = async () => {
      if (!sensitiveData.name || !sensitiveData.birthday) {
          showAlert("資料不完整", "請填寫完整身份資料");
          return;
      }
      // National ID required only for Taiwan (TW)
      if (sensitiveData.nationality === 'TW' && !sensitiveData.nationalId) {
          showAlert("資料不完整", "台灣用戶請填寫身分證字號");
          return;
      }
      if (!kycUploaded) {
          showAlert("資料不完整", "請上傳證件照片");
          return;
      }

      const isUpdatingExistingProfile = user.isProfileComplete && 
          (user.name !== sensitiveData.name || 
           user.nationalId !== sensitiveData.nationalId || 
           user.birthday !== sensitiveData.birthday);

      if (isUpdatingExistingProfile) {
          const confirmed = await showConfirm(
              "重要提醒",
              "⚠️ 修改身份資料（姓名、證件、生日）將導致您在所有協會的會員狀態變更為「待驗證」。\n\n您必須重新前往協會櫃檯進行真人核對，否則將無法報名賽事。\n\n確定要保存變更嗎？"
          );
          if (!confirmed) return;
      }

      try {
          // If updating existing profile, reset KYC status for all clubs BEFORE updating user data
          if (isUpdatingExistingProfile) {
              try {
                  const memberId = parseInt(user.id);
                  console.log('[ProfileView] Checking KYC reset - user.id:', user.id, 'memberId:', memberId);
                  if (!isNaN(memberId)) {
                      const { resetKycStatusForAllClubs } = await import('../../services/supabaseClubMember');
                      const { isSupabaseAvailable } = await import('../../lib/supabaseClient');
                      if (isSupabaseAvailable()) {
                          console.log('[ProfileView] Resetting KYC status for member:', memberId);
                          await resetKycStatusForAllClubs(memberId);
                          console.log('[ProfileView] KYC status reset successfully for all clubs');
                      } else {
                          console.warn('[ProfileView] Supabase not available, skipping KYC reset');
                      }
                  } else {
                      console.warn('[ProfileView] Invalid member ID, cannot reset KYC status');
                  }
              } catch (e: any) {
                  console.error('[ProfileView] Failed to reset KYC status:', e);
                  // Show error but don't block the update
                  await showAlert("警告", "身份資料已更新，但 KYC 狀態更新失敗：" + e.message);
              }
          }
          
          const updatedUser = await mockApi.updateUserSensitiveData({
              ...user,
              ...sensitiveData,
              nationality: sensitiveData.nationality,
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
  
  // Calculate points for selected club (mock data - will come from Supabase)
  const mockSixPoints = selectedClubInfo ? GAME_HISTORY
    .filter(g => g.clubName === selectedClubInfo.name)
    .reduce((acc, curr) => acc + (curr.points || 0), 0) : 0;
  
  const mockActivityPoints = selectedClubInfo ? GAME_HISTORY
    .filter(g => g.clubName === selectedClubInfo.name)
    .reduce((acc, curr) => acc + (curr.activityPoints || 0), 0) : 0;
  
  // Mock redemption items (will come from Supabase)
  const redemptionItems = [
    { id: '1', name: '漢堡', pointsType: 'sixPoints' as const, cost: 50 },
    { id: '2', name: '可樂', pointsType: 'sixPoints' as const, cost: 30 },
    { id: '3', name: '報名折扣券($100)', pointsType: 'activityPoints' as const, cost: 200 },
    { id: '4', name: '報名折扣券($200)', pointsType: 'activityPoints' as const, cost: 400 },
  ];
  
  // Expandable state for redemption lists - support multiple expanded
  const [expandedSixPoints, setExpandedSixPoints] = useState(false);
  const [expandedActivityPoints, setExpandedActivityPoints] = useState(false);

  return (
    <div className="pb-24">
      <Header />
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white font-display">個人檔案</h2>
      </div>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="relative">
          <div className={`w-20 h-20 rounded-full ${THEME.card} border-2 border-brand-green flex items-center justify-center overflow-hidden shadow-lg shadow-brand-green/20`}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">♠️</span>
            )}
          </div>
          <button className={`absolute bottom-0 right-0 bg-brand-green text-black p-1.5 rounded-full shadow-lg border-2 ${THEME.card}`}>
            <Camera size={14} />
          </button>
        </div>
        <div>
           <h3 className={`text-xl font-bold ${THEME.textPrimary}`}>{nickname || user.name || "新玩家"}</h3>
           <p className={`text-sm font-medium ${user.isProfileComplete ? THEME.accent : THEME.textSecondary}`}>
               {user.isProfileComplete ? '✨ 已填寫實名資料' : '未完成設置'}
           </p>
        </div>
      </div>

      <div className={`flex border-b ${THEME.border} mb-6`}>
        <button
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'info' ? `${THEME.accent} border-b-2 border-brand-green` : `${THEME.textSecondary} hover:${THEME.textPrimary}`}`}
          onClick={() => setActiveTab('info')}
        >
          身份與設定
        </button>
        <button
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'club' ? `${THEME.accent} border-b-2 border-brand-green` : `${THEME.textSecondary} hover:${THEME.textPrimary}`}`}
          onClick={() => setActiveTab('club')}
        >
          協會
        </button>
      </div>

      <div className="min-h-[300px]">
      {activeTab === 'info' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* General Settings Section - Moved to top */}
          <div className="space-y-4">
              <h3 className={`text-sm font-bold ${THEME.textSecondary} uppercase tracking-wider`}>一般設定</h3>
              
              <div className="space-y-4">
                  <Input 
                      label="暱稱 (顯示名稱)" 
                      value={nickname} 
                      onChange={(e) => setNickname(e.target.value)}
                  />

                  <div className="space-y-2">
                      <label className={`text-xs font-medium ${THEME.textSecondary}`}>手機號碼 <span className="text-red-500">*</span></label>
                      <div className="relative">
                          <Smartphone className={`absolute top-2.5 left-3 ${THEME.textSecondary} z-10`} size={16} />
                          <Input
                              placeholder="請輸入手機號碼（必填）"
                              value={mobile}
                              onChange={(e) => setMobile(e.target.value)}
                              className="pl-10 pr-10"
                          />
                          {mobile && (
                              <CheckCircle className={`absolute top-2.5 right-3 ${THEME.accent} pointer-events-none z-10`} size={16} />
                          )}
                      </div>
                  </div>

                  <Input 
                      label="Email（選填）" 
                      type="email"
                      placeholder="example@email.com"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                  />
              </div>

              <Button 
                  size="md" 
                  fullWidth
                  className={`transition-colors ${
                      (nicknameChanged || mobileChanged || emailChanged)
                          ? THEME.buttonPrimary
                          : ''
                  }`}
                  variant={(nicknameChanged || mobileChanged || emailChanged) ? "primary" : "secondary"} 
                  onClick={async () => {
                      // Validate mobile first (required field)
                      if (!mobile || mobile.trim() === '') {
                          await showAlert("錯誤", "手機號碼為必填項目，請輸入手機號碼");
                          return;
                      }
                      
                      // Update all changed fields
                      try {
                          const updates: Partial<User> = {};
                          if (nicknameChanged) updates.nickname = nickname;
                          if (mobileChanged) updates.mobile = mobile;
                          if (emailChanged) updates.email = email || undefined;
                          
                          const updatedUser = await mockApi.updateUserProfile({ ...user, ...updates });
                          
                          // Reset local state to match updated user
                          setNickname(updatedUser.nickname || '');
                          setMobile(updatedUser.mobile || '');
                          setEmail(updatedUser.email || '');
                          
                          // Update parent component
                          onUpdateUser(updatedUser);
                          
                          await showAlert("成功", "一般設定已更新！");
                      } catch (e: any) {
                          await showAlert("錯誤", e.message || "更新失敗");
                      }
                  }}
                  disabled={!nicknameChanged && !mobileChanged && !emailChanged}
              >
                  更新
              </Button>
          </div>

          <div className={`h-px ${THEME.border.replace('border', 'bg')} w-full my-2`}></div>
          
          {/* Identity Section - Moved below General Settings */}
          <div className={`p-5 rounded-2xl border space-y-4 relative overflow-hidden transition-colors ${isEditingIdentity ? `bg-[#262626] border-brand-green/50 shadow-brand-green/10 shadow-lg` : `${THEME.card} ${THEME.border}`}`}>
                <div className="flex items-center justify-between">
                     <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isEditingIdentity ? THEME.accent : THEME.textSecondary}`}>
                         <Lock size={14} /> 身份與證件驗證
                     </h3>
                     {!isEditingIdentity ? (
                         <button 
                            onClick={() => setIsEditingIdentity(true)}
                            className={`text-xs flex items-center gap-1 ${THEME.accent} hover:text-brand-green transition-colors px-2 py-1 rounded bg-brand-green/10 border border-brand-green/20`}
                         >
                            <Edit2 size={12} /> 編輯
                         </button>
                     ) : (
                         <span className={`text-xs ${THEME.accent} animate-pulse font-medium`}>編輯中...</span>
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
                    <div className={`${THEME.card} border ${THEME.border} rounded-lg p-3`}>
                        <Input 
                            label="真實姓名" 
                            placeholder="例：王小明"
                            value={sensitiveData.name} 
                            onChange={(e) => handleSensitiveChange('name', e.target.value)}
                            disabled={!isEditingIdentity}
                        />
                    </div>
                    
                    {/* Nationality Selection */}
                    <div className={`${THEME.card} border ${THEME.border} rounded-lg p-3`}>
                        <div className="w-full">
                            <label className={`block text-xs font-medium ${THEME.textSecondary} mb-1.5`}>國籍</label>
                            <select 
                                className={`${THEME.input} rounded-lg p-2.5 text-sm w-full outline-none focus:border-brand-green ${!isEditingIdentity ? 'opacity-50 cursor-not-allowed' : ''}`}
                                value={sensitiveData.nationality || 'TW'}
                                onChange={(e) => handleSensitiveChange('nationality', e.target.value)}
                                disabled={!isEditingIdentity}
                            >
                                <option value="TW">台灣</option>
                                <option value="OTHER">外國人</option>
                            </select>
                        </div>
                    </div>

                    {/* National ID - Only show for Taiwan */}
                    {sensitiveData.nationality === 'TW' && (
                        <div className={`${THEME.card} border ${THEME.border} rounded-lg p-3`}>
                            <Input 
                                label="身分證字號" 
                                placeholder="例：A123456789"
                                value={sensitiveData.nationalId} 
                                onChange={(e) => handleSensitiveChange('nationalId', e.target.value)}
                                disabled={!isEditingIdentity}
                            />
                        </div>
                    )}

                    {/* Passport Number - Only show for foreigners */}
                    {sensitiveData.nationality === 'OTHER' && (
                        <div className={`${THEME.card} border ${THEME.border} rounded-lg p-3`}>
                            <Input 
                                label="護照號碼" 
                                placeholder="例：P12345678"
                                value={sensitiveData.nationalId} 
                                onChange={(e) => handleSensitiveChange('nationalId', e.target.value)}
                                disabled={!isEditingIdentity}
                            />
                        </div>
                    )}

                    <div className={`${THEME.card} border ${THEME.border} rounded-lg p-3`}>
                        <BirthdaySelector 
                            value={sensitiveData.birthday} 
                            onChange={(val) => handleSensitiveChange('birthday', val)} 
                            disabled={!isEditingIdentity}
                        />
                    </div>

                    <div className={`${THEME.card} border ${THEME.border} rounded-lg p-3`}>
                        <div className="w-full">
                            <label className={`block text-xs font-medium ${THEME.textSecondary} mb-1.5`}>性別</label>
                            <select 
                                className={`${THEME.input} rounded-lg p-2.5 text-sm w-full outline-none focus:border-brand-green ${!isEditingIdentity ? 'opacity-50 cursor-not-allowed' : ''}`}
                                value={sensitiveData.gender || ''}
                                onChange={(e) => handleSensitiveChange('gender', e.target.value || undefined)}
                                disabled={!isEditingIdentity}
                            >
                                <option value="">請選擇</option>
                                <option value="male">男</option>
                                <option value="female">女</option>
                                <option value="other">傾向不透露</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="pt-2">
                        <label className={`text-xs font-medium ${THEME.textSecondary} mb-2 block`}>證件驗證 (上傳)</label>
                        {kycUploaded ? (
                            <div className="flex flex-col gap-2">
                                <div className={`flex items-center justify-between bg-brand-green/10 border border-brand-green/20 p-3 rounded-lg`}>
                                    <div className={`flex items-center gap-2 ${THEME.accent}`}>
                                        <CheckCircle size={16} />
                                        <span className="text-sm font-medium">已上傳完畢</span>
                                    </div>
                                </div>
                                {isEditingIdentity && (
                                    <button 
                                        onClick={() => setKycUploaded(false)}
                                        className={`text-xs ${THEME.textSecondary} underline hover:${THEME.textPrimary} flex items-center gap-1 self-end`}
                                    >
                                        <RefreshCw size={10} /> 重新上傳證件
                                    </button>
                                )}
                            </div>
                        ) : (
                            isEditingIdentity ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {sensitiveData.nationality === 'TW' ? (
                                        <>
                                            <button onClick={handleUploadKyc} className={`${THEME.card} border border-dashed ${THEME.border} rounded-lg py-3 flex items-center justify-center gap-2 ${THEME.textSecondary} hover:${THEME.textPrimary} hover:border-brand-green hover:bg-brand-green/5 transition-all`}>
                                                <Upload size={14} /> <span className="text-xs">身分證正面</span>
                                            </button>
                                            <button onClick={handleUploadKyc} className={`${THEME.card} border border-dashed ${THEME.border} rounded-lg py-3 flex items-center justify-center gap-2 ${THEME.textSecondary} hover:${THEME.textPrimary} hover:border-brand-green hover:bg-brand-green/5 transition-all`}>
                                                <Upload size={14} /> <span className="text-xs">身分證反面</span>
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={handleUploadKyc} className={`${THEME.card} border border-dashed ${THEME.border} rounded-lg py-3 flex items-center justify-center gap-2 ${THEME.textSecondary} hover:${THEME.textPrimary} hover:border-brand-green hover:bg-brand-green/5 transition-all`}>
                                                <Upload size={14} /> <span className="text-xs">護照封面</span>
                                            </button>
                                            <button onClick={handleUploadKyc} className={`${THEME.card} border border-dashed ${THEME.border} rounded-lg py-3 flex items-center justify-center gap-2 ${THEME.textSecondary} hover:${THEME.textPrimary} hover:border-brand-green hover:bg-brand-green/5 transition-all`}>
                                                <Upload size={14} /> <span className="text-xs">護照內頁</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className={`text-xs ${THEME.textSecondary} italic`}>未上傳</div>
                            )
                        )}
                    </div>
                </div>

                {isEditingIdentity && (
                    <div className="flex gap-3 pt-2">
                        <Button variant="ghost" fullWidth onClick={() => setIsEditingIdentity(false)} className={`border ${THEME.border}`}>取消</Button>
                        <Button variant="primary" fullWidth onClick={handleSaveIdentity}>
                            <Save size={16} className="mr-2" /> 保存變更
                        </Button>
                    </div>
                )}
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
                        className={`bg-gradient-to-br from-brand-dark to-[#0f0f0f] p-6 rounded-2xl border ${THEME.border} shadow-lg relative overflow-hidden cursor-pointer group hover:border-brand-green/30 hover:shadow-brand-green/10 transition-all active:scale-[0.98] mb-4`}
                    >
                        <div className="absolute top-0 right-0 p-4">
                            <div className={`flex items-center gap-1 text-xs ${THEME.textSecondary} group-hover:${THEME.accent} transition-colors`}>
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
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className={`text-xs ${THEME.textSecondary} uppercase tracking-wider`}>會員等級</p>
                                <p className="text-xl font-bold text-white font-display">{club.tier}</p>
                            </div>
                            <div className="space-y-1">
                                <p className={`text-xs ${THEME.textSecondary} uppercase tracking-wider`}>加入時間</p>
                                <p className={`text-sm font-mono ${THEME.textPrimary}`}>
                                    {new Date(wallet.joinDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className={`text-xs ${THEME.textSecondary} uppercase tracking-wider`}>預繳報名費</p>
                                <p className={`text-xl font-bold font-mono ${THEME.accent}`}>
                                    ${wallet.balance.toLocaleString()}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className={`text-xs ${THEME.textSecondary} uppercase tracking-wider`}>積分</p>
                                <p className={`text-xl font-bold font-mono ${THEME.accent}`}>
                                    {wallet.points.toLocaleString()} P
                                </p>
                            </div>
                        </div>
                    </div>
                 );
             })}
             
             {myWallets.length === 0 && (
                 <div className={`text-center py-8 ${THEME.textSecondary} text-sm`}>尚未加入任何協會</div>
             )}
        </div>
      )}
      </div>

      <div className={`mt-8 pt-6 border-t ${THEME.border}`}>
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
                         <div className={`text-black font-mono text-xs font-bold tracking-widest ${THEME.textSecondary}`}>2967089445</div>
                     </div>
                 </div>
             </div>

             {/* 2. Mileage Circle (Moved below card) */}
             <MileageCircle current={mockSixPoints} />

             {/* 3. Financial Info & Points */}
             <div className={`w-full bg-[#262626] rounded-xl p-4 border ${THEME.border} space-y-3 mt-2`}>
                 <div className={`flex justify-between items-center border-b ${THEME.border} pb-2`}>
                     <span className={`text-sm ${THEME.textSecondary}`}>預繳報名費餘額</span>
                     <span className={`font-mono font-bold ${THEME.textPrimary}`}>${selectedWallet?.balance.toLocaleString()}</span>
                 </div>
                 
                 {/* 6points Section */}
                 <div className="space-y-2">
                     <button
                         onClick={() => setExpandedSixPoints(!expandedSixPoints)}
                         className="w-full flex justify-between items-center hover:bg-white/5 rounded-lg p-2 transition-colors"
                     >
                         <div className="flex items-center gap-2">
                             <Trophy size={16} className={THEME.accent} />
                             <span className={`text-sm ${THEME.textPrimary} font-medium`}>6points 點數</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <span className={`font-mono font-bold ${THEME.accent}`}>{mockSixPoints}</span>
                             {expandedSixPoints ? <ChevronUp size={16} className={THEME.textSecondary} /> : <ChevronDown size={16} className={THEME.textSecondary} />}
                         </div>
                     </button>
                     {expandedSixPoints && (
                         <div className="pl-6 space-y-2 animate-in slide-in-from-top-1 duration-200">
                             {redemptionItems.filter(item => item.pointsType === 'sixPoints').map(item => (
                                 <div key={item.id} className={`flex justify-between items-center p-2 rounded ${THEME.card} border ${THEME.border}`}>
                                     <div className="flex items-center gap-2">
                                         <Gift size={12} className={THEME.accent} />
                                         <span className={`text-xs ${THEME.textPrimary}`}>{item.name}</span>
                                     </div>
                                     <span className={`text-xs font-mono ${THEME.accent}`}>{item.cost} 6points</span>
                                 </div>
                             ))}
                             <p className={`text-[10px] ${THEME.textSecondary} italic mt-2 pt-2 border-t ${THEME.border}`}>
                                 如需兌換請至協會櫃檯
                             </p>
                         </div>
                     )}
                 </div>
                 
                 {/* Activity Points Section */}
                 <div className="space-y-2">
                     <button
                         onClick={() => setExpandedActivityPoints(!expandedActivityPoints)}
                         className="w-full flex justify-between items-center hover:bg-white/5 rounded-lg p-2 transition-colors"
                     >
                         <div className="flex items-center gap-2">
                             <Coins size={16} className="text-blue-400" />
                             <span className={`text-sm ${THEME.textPrimary} font-medium`}>活動點數</span>
                         </div>
                         <div className="flex items-center gap-2">
                             <span className={`font-mono font-bold text-blue-400`}>{mockActivityPoints}</span>
                             {expandedActivityPoints ? <ChevronUp size={16} className={THEME.textSecondary} /> : <ChevronDown size={16} className={THEME.textSecondary} />}
                         </div>
                     </button>
                     {expandedActivityPoints && (
                         <div className="pl-6 space-y-2 animate-in slide-in-from-top-1 duration-200">
                             {redemptionItems.filter(item => item.pointsType === 'activityPoints').map(item => (
                                 <div key={item.id} className={`flex justify-between items-center p-2 rounded ${THEME.card} border ${THEME.border}`}>
                                     <div className="flex items-center gap-2">
                                         <Gift size={12} className="text-blue-400" />
                                         <span className={`text-xs ${THEME.textPrimary}`}>{item.name}</span>
                                     </div>
                                     <span className={`text-xs font-mono text-blue-400`}>{item.cost} 活動點數</span>
                                 </div>
                             ))}
                             <p className={`text-[10px] ${THEME.textSecondary} italic mt-2 pt-2 border-t ${THEME.border}`}>
                                 如需兌換請至協會櫃檯
                             </p>
                         </div>
                     )}
                 </div>

                 {/* Transaction History Section - Only for Supabase clubs */}
                 {isSupabaseClub(showMemberCard || '') && (
                     <div className={`space-y-2 border-t ${THEME.border} pt-3`}>
                         <button
                             onClick={() => setExpandedTransactions(!expandedTransactions)}
                             className="w-full flex justify-between items-center hover:bg-white/5 rounded-lg p-2 transition-colors"
                         >
                             <div className="flex items-center gap-2">
                                 <ArrowDown size={16} className="text-green-400" />
                                 <span className={`text-sm ${THEME.textPrimary} font-medium`}>預繳報名費紀錄</span>
                             </div>
                             <div className="flex items-center gap-2">
                                 {transactionsLoading ? (
                                     <Loader2 size={14} className={`animate-spin ${THEME.textSecondary}`} />
                                 ) : (
                                     <span className={`text-xs ${THEME.textSecondary}`}>{transactions.length} 筆</span>
                                 )}
                                 {expandedTransactions ? <ChevronUp size={16} className={THEME.textSecondary} /> : <ChevronDown size={16} className={THEME.textSecondary} />}
                             </div>
                         </button>
                         {expandedTransactions && (
                             <div className="pl-6 space-y-2 animate-in slide-in-from-top-1 duration-200">
                                 {transactionsLoading ? (
                                     <div className={`text-center py-4 ${THEME.textSecondary} text-xs`}>載入中...</div>
                                 ) : transactions.length === 0 ? (
                                     <div className={`text-center py-4 ${THEME.textSecondary} text-xs`}>尚無交易記錄</div>
                                 ) : (
                                     transactions.map(txn => (
                                         <div key={txn.id} className={`flex justify-between items-center p-2 rounded ${THEME.card} border ${THEME.border}`}>
                                             <div className="flex items-center gap-2 flex-1">
                                                 {txn.type === 'deposit' ? (
                                                     <ArrowDown size={12} className="text-green-400" />
                                                 ) : (
                                                     <ArrowUp size={12} className="text-red-400" />
                                                 )}
                                                 <div className="flex-1">
                                                     <div className={`text-xs ${THEME.textPrimary} font-medium`}>
                                                         {txn.type === 'deposit' ? '儲值' : '提領'}
                                                     </div>
                                                     {txn.completed_at && (
                                                         <div className={`text-[10px] ${THEME.textSecondary}`}>
                                                             {new Date(txn.completed_at).toLocaleString('zh-TW', {
                                                                 year: 'numeric',
                                                                 month: '2-digit',
                                                                 day: '2-digit',
                                                                 hour: '2-digit',
                                                                 minute: '2-digit'
                                                             })}
                                                         </div>
                                                     )}
                                                     {txn.description && (
                                                         <div className={`text-[10px] ${THEME.textSecondary} mt-0.5`}>
                                                             {txn.description}
                                                         </div>
                                                     )}
                                                 </div>
                                             </div>
                                             <span className={`text-xs font-mono font-bold ${txn.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                                                 {txn.type === 'deposit' ? '+' : '-'}${Math.abs(txn.amount).toLocaleString()}
                                             </span>
                                         </div>
                                     ))
                                 )}
                             </div>
                         )}
                     </div>
                 )}
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

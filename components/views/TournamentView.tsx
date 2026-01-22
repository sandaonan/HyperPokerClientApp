
import React, { useState, useEffect } from 'react';
import { Clock, Users, ArrowLeft, Check, Info, MapPin, Wallet as WalletIcon, Coins, Calendar, ShieldAlert, UserPlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { User, Tournament, Club, Registration, Wallet } from '../../types';
import { mockApi } from '../../services/mockApi';
import { TournamentDetailModal } from './TournamentDetailModal';
import { useAlert } from '../../contexts/AlertContext';

interface TournamentViewProps {
  user: User;
  club: Club;
  onBack: () => void;
  onNavigateProfile: () => void;
}

export const TournamentView: React.FC<TournamentViewProps> = ({ user, club, onBack, onNavigateProfile }) => {
  const { showAlert, showConfirm } = useAlert();
  const [now, setNow] = useState(new Date());
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  
  const [detailTournament, setDetailTournament] = useState<Tournament | null>(null);
  const [showClubInfo, setShowClubInfo] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch Data
  const loadData = async () => {
      try {
          const [tData, rData, wData] = await Promise.all([
              mockApi.getTournaments(club.id),
              mockApi.getMyRegistrations(user.id),
              mockApi.getWallet(user.id, club.id)
          ]);
          setTournaments(tData);
          setMyRegistrations(rData.map(r => r.registration));
          setWallet(wData);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setNow(new Date()), 1000);
    const pollTimer = setInterval(loadData, 3000); // Poll for status changes
    return () => {
        clearInterval(timer);
        clearInterval(pollTimer);
    };
  }, [club.id, user.id]);

  const handleRegisterAction = async (type: 'reserve' | 'buy-in') => {
      if (!detailTournament) return;
      
      try {
          await mockApi.registerTournament(user.id, detailTournament.id, type);
          if (type === 'buy-in') {
             await showAlert("報名成功", "費用已從您的俱樂部錢包扣除。");
             setDetailTournament(null);
          } else {
             await showAlert("預約成功", "您已成功預約席位。\n請於開賽前至櫃檯報到繳費，或於此頁面使用餘額扣款報名。");
             // DO NOT CLOSE MODAL for reserve action
          }
          loadData(); // Refresh list and wallet
      } catch (e: any) {
          await showAlert("操作失敗", e.message);
      }
  };

  const handleCancelAction = async () => {
      if (!detailTournament) return;
      
      // Determine current status for correct message
      const reg = myRegistrations.find(r => r.tournamentId === detailTournament.id);
      const isPaid = reg?.status === 'paid';

      // NOTE: Logic change requested - Paid users cannot cancel via App. 
      // This block guards the logic, though the button should be hidden in UI.
      if (isPaid) {
          await showAlert("無法取消", "已付款之報名無法從 App 取消，請洽櫃檯人員。");
          return;
      }

      const confirmed = await showConfirm(
          "取消預約",
          "您確定要取消本次賽事的預約嗎？"
      );

      if (confirmed) {
          try {
            await mockApi.cancelRegistration(user.id, detailTournament.id);
            await showAlert("已取消", "您的預約已取消。");
            setDetailTournament(null);
            loadData();
          } catch (e: any) {
              await showAlert("錯誤", e.message);
          }
      }
  };

  const handleCardClick = (t: Tournament) => {
      setDetailTournament(t);
  };

  // Helper for Date/Time Display
  const renderTimeDisplay = (startTimeIso: string) => {
      const start = new Date(startTimeIso);
      const diffMs = start.getTime() - now.getTime();
      const isStarted = diffMs < 0;
      
      // Format: "14:00"
      const timeStr = start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
      
      // Check if it is today
      const isToday = start.toDateString() === now.toDateString();
      const dateStr = isToday ? '今天' : start.toLocaleDateString([], {month: 'numeric', day: 'numeric'});

      // Relative Badge Text
      let badgeText = '';
      let badgeVariant: 'default' | 'warning' | 'success' | 'danger' = 'default';

      if (isStarted) {
          const minsAgo = Math.floor(Math.abs(diffMs) / 60000);
          const hoursAgo = Math.floor(minsAgo / 60);
          badgeText = hoursAgo > 0 ? `已開始 ${hoursAgo}小時` : `已開始 ${minsAgo}分鐘`;
          badgeVariant = 'success';
      } else {
          const minsUntil = Math.floor(diffMs / 60000);
          const hoursUntil = Math.floor(minsUntil / 60);
          
          if (hoursUntil < 1) {
              badgeText = `${minsUntil}分鐘後開始`;
              badgeVariant = 'danger'; // Urgent
          } else if (hoursUntil < 24) {
              badgeText = `${hoursUntil}小時後開始`;
              badgeVariant = 'warning';
          } else {
              const days = Math.floor(hoursUntil / 24);
              badgeText = `${days}天後`;
              badgeVariant = 'default';
          }
      }

      return (
          <div className="flex flex-col items-end gap-1">
              <Badge variant={badgeVariant} className="font-bold tracking-wide">
                  {badgeText}
              </Badge>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <Calendar size={12} />
                  <span>{dateStr}</span>
                  <span className="font-mono text-white font-bold text-sm">{timeStr}</span>
              </div>
          </div>
      );
  };

  // Grouping logic
  const myRegIds = myRegistrations.map(r => r.tournamentId);
  const myEntries = tournaments.filter(t => myRegIds.includes(t.id));
  const otherTournaments = tournaments.filter(t => !myRegIds.includes(t.id));

  const renderTournamentCard = (t: Tournament, reg?: Registration) => {
    // Logic update: Only OPEN or CLOSED.
    const status = t.isLateRegEnded ? 'CLOSED' : 'OPEN';
    const totalPrice = t.buyIn + t.fee;
    const isOverCap = t.reservedCount > t.maxCap;
    
    // Different style for Registered items
    if (reg) {
        return (
            <Card 
              key={t.id} 
              onClick={() => handleCardClick(t)}
              className="border-l-4 border-l-gold bg-gold/5 border-gold/30 cursor-pointer hover:bg-gold/10 transition-colors"
            >
                <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                        <Badge variant={reg.status === 'paid' ? 'success' : 'warning'} className="self-start mb-1">
                            {reg.status === 'paid' ? '已付款' : '已預約'}
                        </Badge>
                        <h3 className="font-bold text-lg text-white">{t.name}</h3>
                    </div>
                    {renderTimeDisplay(t.startTime)}
                </div>
                
                <div className="w-full bg-slate-800 rounded-full h-1 mt-2 overflow-hidden">
                    <div className="bg-gold h-1 rounded-full animate-pulse" style={{width: '100%'}}></div>
                </div>
                <p className="text-xs text-gold mt-2 flex items-center gap-1 font-bold">
                    <Check size={12} /> 請準時參賽
                </p>
            </Card>
        );
    }

    return (
        <Card 
          key={t.id} 
          onClick={() => handleCardClick(t)}
          className={`border-l-4 ${status === 'CLOSED' ? 'border-l-slate-700 opacity-50' : 'border-l-slate-600'} cursor-pointer hover:bg-surfaceHighlight/80 transition-all hover:border-l-gold hover:shadow-lg`}
        >
        <div className="flex justify-between items-start mb-3">
            <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                    {status === 'CLOSED' ? (
                        <Badge variant="default">已截止</Badge>
                    ) : (
                        <Badge variant="success">開放報名</Badge>
                    )}
                    {t.type && <Badge variant="outline" className="border-slate-700 text-slate-400">{t.type}</Badge>}
                </div>
                <h3 className="font-bold text-lg text-white font-display tracking-wide">{t.name}</h3>
            </div>
            {renderTimeDisplay(t.startTime)}
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-300 mb-3">
            <div className="flex items-center gap-1.5 bg-slate-800/50 px-2 py-1 rounded">
                <Coins size={14} className="text-gold" />
                <span className="text-white font-mono font-bold">${totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-textMuted">
                <span>起始: {t.startingChips.toLocaleString()}</span>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs text-textMuted border-t border-slate-800/50 pt-3">
            <div className="flex items-center gap-2">
                {/* Extra info can go here */}
            </div>
            <div className="flex items-center gap-2 justify-end">
                <Users size={14} />
                <span className={isOverCap ? 'text-danger font-bold' : ''}>
                    {t.reservedCount} / {t.maxCap}
                </span>
            </div>
        </div>
        </Card>
    );
  };

  const renderStatusBadge = () => {
      if (!wallet) {
          return <Badge className="bg-slate-700 text-slate-300">尚未加入</Badge>;
      }
      switch (wallet.status) {
          case 'active':
              return <Badge variant="success">已加入會員</Badge>;
          case 'pending':
              return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">需身份驗證</Badge>;
          case 'applying':
              return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse">加入審核中</Badge>;
          case 'banned':
              return <Badge variant="danger">已停權</Badge>;
          default:
              return null;
      }
  };

  return (
    <div className="pb-24">
      {/* Top Banner Section */}
      <div className="relative w-full h-56 bg-slate-900 overflow-hidden">
         {club.bannerUrl && (
             <img src={club.bannerUrl} className="w-full h-full object-cover opacity-50" alt="Club Banner" />
         )}
         <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
         
         <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors z-10">
            <ArrowLeft size={20} />
         </button>
         
         {/* Wallet Info Display or Join Status */}
         <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
            {renderStatusBadge()}
            {wallet && wallet.status !== 'banned' && (
                <div className="bg-black/60 backdrop-blur-md rounded-xl p-2 px-3 border border-amber-500/30 shadow-lg shadow-black/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black shadow-inner">
                            <WalletIcon size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] text-amber-200 uppercase tracking-wider">Balance</p>
                            <p className="text-sm font-mono font-bold text-white glow-text">${wallet.balance.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}
         </div>

         <div className="absolute bottom-4 left-4 right-4">
             <div className="flex justify-between items-end">
                 <div>
                    <h1 className="text-3xl font-bold text-white shadow-black drop-shadow-lg font-display">{club.name}</h1>
                    <div className="flex items-center gap-2 text-slate-300 text-sm mt-1">
                        <MapPin size={14} className="text-gold" />
                        <span>台北市信義區</span>
                    </div>
                 </div>
                 <button onClick={() => setShowClubInfo(true)} className="p-2 bg-surfaceHighlight/80 backdrop-blur rounded-full text-gold border border-gold/20 hover:bg-gold/10">
                     <Info size={20} />
                 </button>
             </div>
         </div>
      </div>

      <div className="p-4 space-y-6">
        {club.description && (
            <div className="bg-surfaceHighlight/50 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 leading-relaxed italic">
                "{club.description}"
            </div>
        )}

        <div>
            <div className="flex items-center justify-between mb-4">
                 <h2 className="text-lg font-bold text-white font-display border-l-4 border-gold pl-3">今日賽程</h2>
                 <p className="text-xs text-textMuted font-mono">{now.toLocaleDateString()}</p>
            </div>
            
            {loading ? (
                <div className="py-10 text-center text-textMuted">載入賽程中...</div>
            ) : (
                <>
                    {myEntries.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-500 mb-6">
                            <div className="space-y-3">
                                {myEntries.map(t => renderTournamentCard(t, myRegistrations.find(r => r.tournamentId === t.id)))}
                            </div>
                            <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent w-full my-6"></div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {otherTournaments.map(t => renderTournamentCard(t))}
                    </div>
                </>
            )}
        </div>
      </div>

      <TournamentDetailModal 
        tournament={detailTournament}
        userWallet={wallet}
        registration={myRegistrations.find(r => r.tournamentId === detailTournament?.id)}
        onClose={() => setDetailTournament(null)}
        onRegister={handleRegisterAction}
        onCancel={handleCancelAction}
      />
      
      <Modal isOpen={showClubInfo} onClose={() => setShowClubInfo(false)} title="關於俱樂部">
          <div className="space-y-4">
               <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                   <h3 className="font-bold text-white text-lg mb-1">{club.name}</h3>
                   <p className="text-gold">{club.tier} Partner</p>
               </div>
               <div className="space-y-2 text-sm text-slate-300">
                   <p>📍 地址：台北市信義區松壽路 12 號 8 樓</p>
                   <p>📞 電話：02-2345-6789</p>
                   <p>⏰ 營業時間：14:00 - 06:00</p>
               </div>
               <Button fullWidth onClick={() => setShowClubInfo(false)}>關閉</Button>
          </div>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Clock, Users, ArrowLeft, AlertCircle, Check, Star, Info, MapPin, Wallet as WalletIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { User, Tournament, Club, Registration, Wallet } from '../../types';
import { mockApi } from '../../services/mockApi';
import { TournamentDetailModal } from './TournamentDetailModal';

interface TournamentViewProps {
  user: User;
  club: Club;
  onBack: () => void;
  onNavigateProfile: () => void;
}

export const TournamentView: React.FC<TournamentViewProps> = ({ user, club, onBack, onNavigateProfile }) => {
  const [now, setNow] = useState(new Date());
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  
  const [detailTournament, setDetailTournament] = useState<Tournament | null>(null);
  const [showWarning, setShowWarning] = useState(false);
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
    return () => clearInterval(timer);
  }, [club.id, user.id]);

  const formatCountdown = (targetDate: string) => {
    const diff = new Date(targetDate).getTime() - now.getTime();
    if (diff <= 0) return "已開始";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRegisterAction = async (type: 'reserve' | 'buy-in') => {
      if (!detailTournament) return;
      
      try {
          await mockApi.registerTournament(user.id, detailTournament.id, type);
          alert(type === 'buy-in' ? "報名成功！已扣除費用。" : "預約成功！請於開賽前至櫃檯報到。");
          setDetailTournament(null);
          loadData(); // Refresh list and wallet
      } catch (e: any) {
          alert(e.message);
      }
  };

  const handleCancelAction = async () => {
      if (!detailTournament) return;
      if (window.confirm("確定要取消嗎？如果是線上扣款將會自動退款至俱樂部錢包。")) {
          try {
            await mockApi.cancelRegistration(user.id, detailTournament.id);
            setDetailTournament(null);
            loadData();
          } catch (e: any) {
              alert(e.message);
          }
      }
  };

  // Grouping logic
  const myRegIds = myRegistrations.map(r => r.tournamentId);
  const myEntries = tournaments.filter(t => myRegIds.includes(t.id));
  const otherTournaments = tournaments.filter(t => !myRegIds.includes(t.id));

  const renderTournamentCard = (t: Tournament, reg?: Registration) => {
    const isStarted = new Date(t.startTime).getTime() < now.getTime();
    const isFull = t.reservedCount >= t.maxCap;
    const status = isStarted ? (t.isLateRegEnded ? 'CLOSED' : 'LATE REG') : 'UPCOMING';
    
    if (reg) {
        return (
            <Card 
              key={t.id} 
              onClick={() => setDetailTournament(t)}
              className="border-l-4 border-l-primary bg-primary/5 border-primary/20 cursor-pointer hover:bg-primary/10"
            >
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-white">{t.name}</h3>
                    <Badge variant={reg.status === 'paid' ? 'success' : 'warning'}>
                        {reg.status === 'paid' ? '已付款' : '已預約'}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-textMuted mb-2">
                     <Clock size={14} />
                     <span>開賽時間 {new Date(t.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                    <div className="bg-primary h-1.5 rounded-full" style={{width: '100%'}}></div>
                </div>
                <p className="text-xs text-primary mt-2 flex items-center gap-1">
                    <Check size={12} /> 請準時參賽
                </p>
            </Card>
        );
    }

    return (
        <Card 
          key={t.id} 
          onClick={() => setDetailTournament(t)}
          className={`border-l-4 ${status === 'CLOSED' ? 'border-l-slate-600 opacity-60' : 'border-l-slate-600'} cursor-pointer hover:bg-surfaceHighlight/80`}
        >
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-white">{t.name}</h3>
            {status === 'CLOSED' && <Badge variant="default">已截止</Badge>}
            {status === 'LATE REG' && <Badge variant="warning">延遲註冊</Badge>}
            {status === 'UPCOMING' && <Badge variant="outline">即將開始</Badge>}
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-300 mb-4">
            <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">${t.buyIn}</span>
            <span className="text-slate-500">+ {t.fee}</span>
            </div>
            <div className="flex items-center gap-1.5">
            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-xs">{(t.startingChips / 1000)}k 記分牌</span>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-xs text-textMuted">
            <div className="flex items-center gap-2">
            <Clock size={14} />
            {isStarted ? (
                <span>已開始 {new Date(t.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            ) : (
                <span className="font-mono text-white">{formatCountdown(t.startTime)}</span>
            )}
            </div>
            <div className="flex items-center gap-2">
            <Users size={14} />
            <span>{t.reservedCount} / {t.maxCap} 玩家</span>
            </div>
        </div>
        </Card>
    );
  };

  return (
    <div className="pb-24">
      {/* Top Banner Section */}
      <div className="relative w-full h-48 bg-slate-800">
         {club.bannerUrl && (
             <img src={club.bannerUrl} className="w-full h-full object-cover opacity-60" alt="Club Banner" />
         )}
         <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
         
         <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors z-10">
            <ArrowLeft size={20} />
         </button>
         
         {/* Wallet Info Display */}
         {wallet && (
             <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-xl p-2 px-3 border border-white/10 z-10">
                 <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <WalletIcon size={16} />
                     </div>
                     <div>
                         <p className="text-[10px] text-slate-400">錢包餘額</p>
                         <p className="text-sm font-mono font-bold text-white">${wallet.balance.toLocaleString()}</p>
                     </div>
                 </div>
             </div>
         )}

         <div className="absolute bottom-4 left-4 right-4">
             <div className="flex justify-between items-end">
                 <div>
                    <h1 className="text-2xl font-bold text-white shadow-black drop-shadow-lg">{club.name}</h1>
                    <div className="flex items-center gap-2 text-slate-300 text-sm mt-1">
                        <MapPin size={14} />
                        <span>台北市信義區</span>
                    </div>
                 </div>
                 <button onClick={() => setShowClubInfo(true)} className="p-2 bg-surfaceHighlight/80 backdrop-blur rounded-full text-primary border border-primary/20">
                     <Info size={20} />
                 </button>
             </div>
         </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Intro Text */}
        {club.description && (
            <div className="bg-surfaceHighlight/50 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 leading-relaxed">
                {club.description}
            </div>
        )}

        {/* Schedule List */}
        <div>
            <div className="flex items-center justify-between mb-2">
                 <h2 className="text-lg font-bold text-white">今日賽程</h2>
                 <p className="text-xs text-textMuted">{now.toLocaleDateString()}</p>
            </div>
            
            {loading ? (
                <div className="py-10 text-center text-textMuted">載入賽程中...</div>
            ) : (
                <>
                    {myEntries.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-500 mb-6">
                            <div className="flex items-center gap-2 mb-3 text-primary">
                                <Star size={16} fill="currentColor" />
                                <h3 className="text-sm font-semibold uppercase tracking-wider">我的賽事</h3>
                            </div>
                            <div className="space-y-3">
                                {myEntries.map(t => renderTournamentCard(t, myRegistrations.find(r => r.tournamentId === t.id)))}
                            </div>
                            <div className="h-px bg-slate-800 w-full my-6"></div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {otherTournaments.map(t => renderTournamentCard(t))}
                    </div>
                </>
            )}
        </div>
      </div>

      {/* Modal Logic */}
      <TournamentDetailModal 
        tournament={detailTournament}
        userWallet={wallet}
        registration={myRegistrations.find(r => r.tournamentId === detailTournament?.id)}
        onClose={() => setDetailTournament(null)}
        onRegister={handleRegisterAction}
        onCancel={handleCancelAction}
      />
      
      {/* Club Info Modal */}
      <Modal isOpen={showClubInfo} onClose={() => setShowClubInfo(false)} title="關於俱樂部">
          <div className="space-y-4">
               <div className="bg-slate-800 p-4 rounded-lg">
                   <h3 className="font-bold text-white text-lg mb-1">{club.name}</h3>
                   <p className="text-primary">{club.tier} Partner</p>
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
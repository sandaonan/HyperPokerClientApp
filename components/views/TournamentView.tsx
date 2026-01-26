
import React, { useState, useEffect } from 'react';
import { Clock, Users, ArrowLeft, Check, Info, MapPin, Wallet as WalletIcon, Coins, Calendar, ShieldAlert, UserPlus, Filter, Ticket, ChevronDown, ChevronUp, Navigation, Map } from 'lucide-react';
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

// Buy-in Filter Options
type BuyInFilter = 'All' | 'Low' | 'Mid' | 'High';

export const TournamentView: React.FC<TournamentViewProps> = ({ user, club, onBack, onNavigateProfile }) => {
  const { showAlert, showConfirm } = useAlert();
  const [now, setNow] = useState(new Date());
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  
  const [detailTournament, setDetailTournament] = useState<Tournament | null>(null);
  const [showClubInfo, setShowClubInfo] = useState(false);
  const [loading, setLoading] = useState(true);

  // UI State
  const [buyInFilter, setBuyInFilter] = useState<BuyInFilter>('All');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // Geolocation
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [distanceText, setDistanceText] = useState<string>('');

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

  // Geolocation Logic
  useEffect(() => {
      if ("geolocation" in navigator && club.latitude && club.longitude) {
          navigator.geolocation.getCurrentPosition((position) => {
              const uLat = position.coords.latitude;
              const uLng = position.coords.longitude;
              setUserLocation({ lat: uLat, lng: uLng });
              
              // Calculate Distance (Haversine Formula)
              const R = 6371; // km
              const dLat = (club.latitude! - uLat) * Math.PI / 180;
              const dLon = (club.longitude! - uLng) * Math.PI / 180;
              const a = 
                  Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(uLat * Math.PI / 180) * Math.cos(club.latitude! * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2); 
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
              const d = R * c; // Distance in km

              if (d < 1) {
                  setDistanceText(`${Math.round(d * 1000)}m`);
              } else {
                  setDistanceText(`${d.toFixed(1)}km`);
              }
          }, (err) => {
              console.log("Geolocation error:", err);
          });
      }
  }, [club]);

  const handleOpenMap = () => {
      if (club.latitude && club.longitude) {
          window.open(`https://www.google.com/maps/search/?api=1&query=${club.latitude},${club.longitude}`, '_blank');
      } else {
          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(club.name)}`, '_blank');
      }
  };

  const handleRegisterAction = async (type: 'reserve' | 'buy-in') => {
      if (!detailTournament) return;
      
      try {
          await mockApi.registerTournament(user.id, detailTournament.id, type);
          if (type === 'buy-in') {
             await showAlert("報名成功", "費用已從您的協會錢包扣除。");
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
  const renderTimeDisplay = (startTimeIso: string, isClosed: boolean) => {
      // If manually closed, show merged Closed badge
      if (isClosed) {
          return (
             <div className="flex items-center gap-2">
                  {/* We can still show time or hide it. Let's show time for reference */}
                  <div className="font-mono text-slate-500 font-bold text-sm">
                      {new Date(startTimeIso).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                  </div>
                  <Badge variant="default" className="bg-slate-700 text-slate-400 font-bold tracking-wide text-[10px] px-1.5 py-0">
                      已截止
                  </Badge>
             </div>
          );
      }

      const start = new Date(startTimeIso);
      const diffMs = start.getTime() - now.getTime();
      const isStarted = diffMs < 0;
      
      // Format: "14:00"
      const timeStr = start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
      
      // Relative Badge Text
      let badgeText = '';
      let badgeVariant: 'default' | 'warning' | 'success' | 'danger' = 'default';

      if (isStarted) {
          const minsAgo = Math.floor(Math.abs(diffMs) / 60000);
          const hoursAgo = Math.floor(minsAgo / 60);
          badgeText = hoursAgo > 0 ? `已開始 ${hoursAgo}h` : `已開始 ${minsAgo}m`;
          badgeVariant = 'success';
      } else {
          const minsUntil = Math.floor(diffMs / 60000);
          const hoursUntil = Math.floor(minsUntil / 60);
          
          if (hoursUntil < 1) {
              badgeText = `${minsUntil}分後`;
              badgeVariant = 'danger'; // Urgent
          } else if (hoursUntil < 24) {
              badgeText = `${hoursUntil}小時後`;
              badgeVariant = 'warning';
          } else {
              const days = Math.floor(hoursUntil / 24);
              badgeText = `${days}天後`;
              badgeVariant = 'default';
          }
      }

      return (
          <div className="flex items-center gap-2">
              <div className="font-mono text-white font-bold text-sm">{timeStr}</div>
              <Badge variant={badgeVariant} className="font-bold tracking-wide text-[10px] px-1.5 py-0">
                  {badgeText}
              </Badge>
          </div>
      );
  };

  // Grouping logic & Filtering
  const myRegIds = myRegistrations.map(r => r.tournamentId);
  const myEntries = tournaments.filter(t => myRegIds.includes(t.id));
  
  // Filter logic for other tournaments
  const otherTournaments = tournaments.filter(t => {
      if (myRegIds.includes(t.id)) return false;
      
      // Apply Buy-in Filter
      const total = t.buyIn + t.fee;
      if (buyInFilter === 'Low') return total < 2000;
      if (buyInFilter === 'Mid') return total >= 2000 && total <= 5000;
      if (buyInFilter === 'High') return total > 5000;
      return true;
  });

  const renderTournamentCard = (t: Tournament, reg?: Registration) => {
    const status = t.isLateRegEnded ? 'CLOSED' : 'OPEN';
    const totalPrice = t.buyIn + t.fee;
    const isOverCap = t.reservedCount > t.maxCap;
    
    // Different style for Registered items (Unified with StatsView)
    if (reg) {
        const isPaid = reg.status === 'paid';
        return (
            <Card 
              key={t.id} 
              onClick={() => handleCardClick(t)}
              className={`p-3 border-l-4 cursor-pointer hover:bg-surfaceHighlight/80 transition-all hover:shadow-lg ${isPaid ? 'border-l-emerald-500 bg-emerald-500/5' : 'border-l-yellow-500 bg-yellow-500/5'}`}
            >
                <div className="flex justify-between items-center mb-2">
                    <div className="flex flex-col gap-1">
                        <h3 className="font-bold text-base text-white">{t.name}</h3>
                        <div className="flex items-center gap-1.5">
                            {t.type && <span className="text-[10px] text-slate-300 border border-slate-600 rounded px-1.5 py-[1px] bg-slate-800/50">{t.type}</span>}
                            <Badge variant={isPaid ? 'success' : 'warning'} className="text-[10px] px-1.5 py-0 whitespace-nowrap">
                                    {isPaid ? '已付款' : '已預約'}
                            </Badge>
                        </div>
                    </div>
                    {renderTimeDisplay(t.startTime, t.isLateRegEnded)}
                </div>

                {/* Unified Progress Bar */}
                <div className="w-full bg-slate-800/50 rounded-full h-1 mt-2 mb-2 overflow-hidden">
                    <div className={`h-1 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-gold'} animate-pulse`} style={{width: '100%'}}></div>
                </div>

                <div className="flex items-center justify-between text-xs mt-2">
                     <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-gold font-mono font-bold text-base">
                            <Coins size={14} />
                            <span>${totalPrice.toLocaleString()}</span>
                        </div>
                        <span className="text-slate-600">|</span>
                        <span className="text-textMuted">起始: {t.startingChips.toLocaleString()}</span>
                     </div>
                     
                     {!isPaid ? (
                        <span className="text-[10px] text-yellow-500/80 flex items-center gap-1 font-bold animate-pulse">
                            <Check size={10} /> 請至櫃檯繳費
                        </span>
                     ) : (
                        <span className="text-[10px] text-emerald-500/80 flex items-center gap-1 font-bold">
                            <Check size={10} /> 準備參賽
                        </span>
                     )}
                </div>
            </Card>
        );
    }

    // Unregistered Card
    return (
        <Card 
          key={t.id} 
          onClick={() => handleCardClick(t)}
          className={`p-3 border-l-2 ${status === 'CLOSED' ? 'border-l-slate-700 opacity-50' : 'border-l-slate-600'} cursor-pointer hover:bg-surfaceHighlight/80 transition-all hover:border-l-gold hover:shadow-lg`}
        >
        <div className="flex justify-between items-center mb-2">
            <div className="flex flex-col gap-1">
                <h3 className="font-bold text-base text-white font-display tracking-wide">{t.name}</h3>
                {t.type && <span className="text-[10px] text-slate-400 border border-slate-700 rounded px-1 w-fit">{t.type}</span>}
            </div>
            {renderTimeDisplay(t.startTime, t.isLateRegEnded)}
        </div>

        <div className="flex items-center justify-between text-xs mt-2">
             <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-gold font-mono font-bold text-base">
                    <Coins size={14} />
                    <span>${totalPrice.toLocaleString()}</span>
                </div>
                <span className="text-slate-600">|</span>
                <span className="text-textMuted">起始: {t.startingChips.toLocaleString()}</span>
             </div>
             <div className="flex items-center gap-1 text-slate-400">
                <Users size={12} />
                <span className={isOverCap ? 'text-danger font-bold' : ''}>
                    {t.reservedCount}/{t.maxCap}
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
      {/* 1. Header Controls (Back & Wallet) - Floating */}
      <div className="fixed top-0 left-0 right-0 z-30 p-4 flex justify-between items-start pointer-events-none">
          <button 
             onClick={onBack} 
             className="pointer-events-auto p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors shadow-lg border border-white/10"
          >
            <ArrowLeft size={20} />
         </button>

         {/* Wallet Info Display or Join Status */}
         <div className="pointer-events-auto flex flex-col items-end gap-2">
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
      </div>

      {/* 2. Full Banner Section (Aspect Ratio 2:1 for best mobile view) */}
      <div className="w-full aspect-[2/1] relative bg-slate-900">
         {club.bannerUrl ? (
             <img src={club.bannerUrl} className="w-full h-full object-cover" alt="Club Banner" />
         ) : (
             <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                 <span className="text-slate-700 text-4xl font-display font-bold opacity-20">{club.name}</span>
             </div>
         )}
         {/* Simple bottom gradient for transition */}
         <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="px-4 -mt-6 relative z-10 space-y-4">
        {/* 3. Club Header Info Block */}
        <div className="flex justify-between items-end">
             <div>
                <h1 className="text-3xl font-bold text-white shadow-black drop-shadow-xl font-display tracking-tight">{club.name}</h1>
                <div className="flex items-center gap-2 text-slate-300 text-sm mt-2">
                    <MapPin size={14} className="text-gold" />
                    <span>台北市信義區</span>
                    
                    <button 
                        onClick={handleOpenMap}
                        className="bg-slate-800/80 px-1.5 py-0.5 rounded text-xs text-slate-300 border border-slate-700 hover:text-white hover:border-slate-500 hover:bg-slate-700 transition-colors flex items-center gap-1"
                    >
                        <Map size={10} />
                    </button>

                    {distanceText && (
                        <span className="flex items-center gap-1 bg-slate-800/80 px-1.5 py-0.5 rounded text-xs text-slate-300 border border-slate-700">
                            <Navigation size={10} /> {distanceText}
                        </span>
                    )}
                </div>
             </div>
             <button onClick={() => setShowClubInfo(true)} className="p-2 bg-surfaceHighlight/80 backdrop-blur rounded-full text-gold border border-gold/20 hover:bg-gold/10 shadow-lg">
                 <Info size={20} />
             </button>
         </div>

        {/* 4. Collapsible Club Description */}
        {club.description && (
            <div className="bg-surfaceHighlight/50 p-3 rounded-xl border border-slate-800 relative">
                <div className={`text-xs text-slate-300 leading-relaxed italic ${isDescriptionExpanded ? '' : 'line-clamp-2'}`}>
                    "{club.description}"
                </div>
                {/* Expand Toggle */}
                {club.description.length > 50 && (
                    <button 
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="flex items-center gap-1 text-[10px] text-gold mt-1 font-bold hover:underline"
                    >
                        {isDescriptionExpanded ? (
                            <><ChevronUp size={12} /> 收起介紹</>
                        ) : (
                            <><ChevronDown size={12} /> 閱讀更多</>
                        )}
                    </button>
                )}
            </div>
        )}

        <div>
            <div className="flex flex-col gap-3 mb-4 mt-6">
                 <div className="flex items-center justify-between">
                     {/* Increased Font Size here as requested */}
                     <h2 className="text-2xl font-bold text-white font-display border-l-4 border-gold pl-3">今日賽程</h2>
                     <p className="text-xs text-textMuted font-mono">{now.toLocaleDateString()}</p>
                 </div>

                 {/* Buy-in Filter Chips */}
                 <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <button 
                        onClick={() => setBuyInFilter('All')}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors whitespace-nowrap ${buyInFilter === 'All' ? 'bg-slate-700 text-white border-slate-600' : 'bg-transparent text-slate-500 border-slate-800'}`}
                    >
                        全部
                    </button>
                    <button 
                        onClick={() => setBuyInFilter('Low')}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors whitespace-nowrap ${buyInFilter === 'Low' ? 'bg-slate-700 text-white border-slate-600' : 'bg-transparent text-slate-500 border-slate-800'}`}
                    >
                        小額 (&lt;2k)
                    </button>
                    <button 
                        onClick={() => setBuyInFilter('Mid')}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors whitespace-nowrap ${buyInFilter === 'Mid' ? 'bg-slate-700 text-white border-slate-600' : 'bg-transparent text-slate-500 border-slate-800'}`}
                    >
                        中額 (2k-5k)
                    </button>
                    <button 
                        onClick={() => setBuyInFilter('High')}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors whitespace-nowrap ${buyInFilter === 'High' ? 'bg-slate-700 text-white border-slate-600' : 'bg-transparent text-slate-500 border-slate-800'}`}
                    >
                        高額 (&gt;5k)
                    </button>
                 </div>
            </div>
            
            {loading ? (
                <div className="py-10 text-center text-textMuted">載入賽程中...</div>
            ) : (
                <>
                    {myEntries.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-500 mb-6">
                            <div className="text-xs font-bold text-primary mb-2 flex items-center gap-1">
                                <Ticket size={12} /> 我的報名
                            </div>
                            <div className="space-y-2">
                                {myEntries.map(t => renderTournamentCard(t, myRegistrations.find(r => r.tournamentId === t.id)))}
                            </div>
                            <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent w-full my-4"></div>
                        </div>
                    )}

                    <div className="space-y-2">
                        {otherTournaments.length > 0 ? (
                            otherTournaments.map(t => renderTournamentCard(t))
                        ) : (
                            <div className="text-center py-6 text-xs text-slate-500 italic">
                                沒有符合篩選條件的賽事
                            </div>
                        )}
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
      
      <Modal isOpen={showClubInfo} onClose={() => setShowClubInfo(false)} title="關於協會">
          <div className="space-y-4">
               <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                   <h3 className="font-bold text-white text-lg mb-1">{club.name}</h3>
                   {/* Removed Partner Tier as requested */}
               </div>
               <div className="space-y-4 text-sm text-slate-300">
                   <div>
                        <div className="flex justify-between items-start">
                             <p>📍 地址：台北市信義區松壽路 12 號 8 樓</p>
                             <button 
                                onClick={handleOpenMap}
                                className="bg-slate-700 text-gold p-1.5 rounded-lg border border-slate-600 hover:bg-slate-600 transition-colors"
                             >
                                 <Map size={16} />
                             </button>
                        </div>
                   </div>
                   <p>📞 電話：02-2345-6789</p>
                   <p>⏰ 營業時間：14:00 - 06:00</p>
               </div>
               <Button fullWidth onClick={() => setShowClubInfo(false)}>關閉</Button>
          </div>
      </Modal>
    </div>
  );
};

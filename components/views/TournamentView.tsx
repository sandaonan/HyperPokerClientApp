
import React, { useState, useEffect } from 'react';
import { Clock, Users, ArrowLeft, Check, Info, MapPin, Wallet as WalletIcon, Coins, Calendar, ShieldAlert, UserPlus, Filter, Ticket, ChevronDown, ChevronUp, Navigation, Map, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { User, Tournament, Club, Registration, Wallet } from '../../types';
import { mockApi } from '../../services/mockApi';
import { TournamentDetailModal } from './TournamentDetailModal';
import { useAlert } from '../../contexts/AlertContext';
import { THEME } from '../../theme';

interface TournamentViewProps {
  user: User | null;
  club: Club;
  onBack: () => void;
  onNavigateProfile: () => void;
}

// Buy-in Filter - now using number (amount) or 'All'
type BuyInFilter = 'All' | number;

// Date Filter - now using number of days offset from today
// 0 = today, 1 = tomorrow, 2 = day after tomorrow, -1 = yesterday, etc.

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
  const [dateOffset, setDateOffset] = useState<number>(0); // 0 = today, 1 = tomorrow, etc.
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // Reset buy-in filter when date changes
  useEffect(() => {
      setBuyInFilter('All');
  }, [dateOffset]);
  
  // Geolocation
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [distanceText, setDistanceText] = useState<string>('');

  const isGuest = !user;

  // Fetch Data
  const loadData = async () => {
      try {
          if (isGuest) {
              const tData = await mockApi.getTournaments(club.id);
              setTournaments(tData);
              setMyRegistrations([]);
              setWallet(null);
          } else {
              const [tData, rData, wData] = await Promise.all([
                  mockApi.getTournaments(club.id),
                  mockApi.getMyRegistrations(user!.id),
                  mockApi.getWallet(user!.id, club.id)
              ]);
              setTournaments(tData);
              setMyRegistrations(rData.map(r => r.registration));
              setWallet(wData);
          }
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
  }, [club.id, user?.id]);

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

  const handleRegisterAction = async (type: 'reserve') => {
      if (isGuest) {
          await showAlert("需要登入", "請先註冊或登入會員，方可預約賽事。");
          onBack(); // Go back to Home which might show login CTA
          return;
      }
      
      if (!detailTournament || !user) return;
      
      try {
          await mockApi.registerTournament(user.id, detailTournament.id, type);
          await showAlert("預約成功", "您已成功預約席位。\n請於開賽前至櫃檯報到繳費。");
          setDetailTournament(null);
          loadData(); 
      } catch (e: any) {
          await showAlert("操作失敗", e.message);
      }
  };

  const handleCancelAction = async () => {
      if (isGuest || !detailTournament || !user) return;
      
      const reg = myRegistrations.find(r => r.tournamentId === detailTournament.id);
      const isPaid = reg?.status === 'paid';

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

  const handleGuestJoinClub = async () => {
      await showAlert("需要登入", "請先註冊或登入會員，即可加入此協會。");
  };

  const renderStateBadge = (t: Tournament) => {
      const startTime = new Date(t.startTime).getTime();
      const currentTime = now.getTime();
      const isEnded = currentTime > startTime + (8 * 60 * 60 * 1000);

      if (isEnded) {
          return <Badge className={`${THEME.buttonSecondary} ${THEME.textSecondary} border ${THEME.border}`}>已結束</Badge>;
      }
      if (t.isLateRegEnded) {
          return <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30">已截買</Badge>;
      }
      return <Badge className="bg-brand-green/20 text-brand-green border border-brand-green/30">報名中</Badge>;
  };

  const renderTimeDisplay = (startTimeIso: string) => {
      if (!startTimeIso) {
          return <div className={`font-mono ${THEME.textPrimary} font-bold text-sm`}>--:--</div>;
      }
      const start = new Date(startTimeIso);
      if (isNaN(start.getTime())) {
          console.warn('Invalid date:', startTimeIso);
          return <div className={`font-mono ${THEME.textPrimary} font-bold text-sm`}>--:--</div>;
      }
      const dateStr = `${start.getMonth() + 1}/${start.getDate()}`;
      const timeStr = start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
      return (
          <div className={`font-mono ${THEME.textPrimary} font-bold text-sm flex flex-col items-end gap-0.5`}>
              <span className="text-xs leading-tight">{dateStr}</span>
              <span className="leading-tight">{timeStr}</span>
          </div>
      );
  };

  // Helper function to check if tournament is on a specific date (by offset from today)
  const isTournamentOnDate = (tournament: Tournament, daysOffset: number): boolean => {
      const tournamentDate = new Date(tournament.startTime);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + daysOffset);
      
      const tournamentDay = new Date(tournamentDate);
      tournamentDay.setHours(0, 0, 0, 0);
      
      return tournamentDay.getTime() === targetDate.getTime();
  };

  // Get date label for display
  const getDateLabel = (daysOffset: number): string => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysOffset);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDay = new Date(targetDate);
      targetDay.setHours(0, 0, 0, 0);
      
      const dayDiff = Math.floor((targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
      const weekday = weekdays[targetDate.getDay()];
      
      if (dayDiff === 0) {
          return `今天（${weekday}）`;
      } else if (dayDiff === 1) {
          return `明天（${weekday}）`;
      } else if (dayDiff === -1) {
          return `昨天（${weekday}）`;
      } else {
          return `${targetDate.getMonth() + 1}/${targetDate.getDate()}（${weekday}）`;
      }
  };

  // Grouping logic & Filtering
  const myRegIds = myRegistrations.map(r => r.tournamentId);
  
  // Filter by date first
  const dateFilteredTournaments = tournaments.filter(t => isTournamentOnDate(t, dateOffset));
  
  // Calculate unique buy-in amounts from filtered tournaments for dynamic filter buttons
  const uniqueBuyInAmounts = Array.from(
    new Set(dateFilteredTournaments.map(t => t.buyIn + t.fee))
  ).sort((a: number, b: number) => a - b);
  
  const myEntries = dateFilteredTournaments.filter(t => myRegIds.includes(t.id));
  
  // otherTournaments includes all tournaments (even if user has registered)
  // so that registered tournaments can also appear in the club tournament list
  const otherTournaments = dateFilteredTournaments.filter(t => {
      // Filter by specific amount if selected, otherwise show all
      if (buyInFilter === 'All') return true;
      const total = t.buyIn + t.fee;
      return total === buyInFilter;
  });

  const renderTournamentCard = (t: Tournament, reg?: Registration) => {
    const status = t.isLateRegEnded ? 'CLOSED' : 'OPEN';
    const totalPrice = t.buyIn + t.fee;
    const isOverCap = t.reservedCount > t.maxCap;
    
    if (reg) {
        const isPaid = reg.status === 'paid';
        return (
            <Card 
              key={t.id} 
              onClick={() => handleCardClick(t)}
              className={`p-3 border-l-4 cursor-pointer ${THEME.cardHover} transition-all hover:shadow-lg ${isPaid ? 'border-l-brand-green bg-brand-green/5' : 'border-l-yellow-500 bg-yellow-500/5'}`}
            >
                <div className="flex justify-between items-center mb-2">
                    <div className="flex flex-col gap-1">
                        <h3 className={`font-bold text-base ${THEME.textPrimary} font-display tracking-wide`}>{t.name}</h3>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {renderStateBadge(t)}
                            <Badge variant="warning">已預約</Badge>
                            {t.type && <span className={`text-[10px] ${THEME.textSecondary} border ${THEME.border} rounded px-1 w-fit`}>{t.type}</span>}
                        </div>
                    </div>
                    {renderTimeDisplay(t.startTime)}
                </div>

                <div className={`w-full ${THEME.card}/50 rounded-full h-1 mt-2 mb-2 overflow-hidden`}>
                    <div className={`h-1 rounded-full ${isPaid ? 'bg-brand-green' : 'bg-yellow-500'} animate-pulse`} style={{width: '100%'}}></div>
                </div>

                <div className="flex items-center justify-between text-xs mt-2">
                     <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1 ${THEME.accent} font-mono font-bold text-base`}>
                            <Coins size={14} />
                            <span>${totalPrice.toLocaleString()}</span>
                        </div>
                        <span className={THEME.textSecondary}>|</span>
                        <span className={THEME.textSecondary}>起始: {t.startingChips.toLocaleString()}</span>
                     </div>
                     
                     <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1 ${THEME.textSecondary}`}>
                            <Users size={12} />
                            <span className={isOverCap ? 'text-danger font-bold' : ''}>
                                {t.reservedCount}/{t.maxCap}
                            </span>
                        </div>
                        {!isPaid ? (
                            <span className="text-[10px] text-yellow-500/80 flex items-center gap-1 font-bold animate-pulse">
                                <Check size={10} /> 請至櫃檯繳費
                            </span>
                        ) : (
                            <span className={`text-[10px] ${THEME.accent}/80 flex items-center gap-1 font-bold`}>
                                <Check size={10} /> 準備參賽
                            </span>
                        )}
                     </div>
                </div>
            </Card>
        );
    }

    return (
        <Card 
          key={t.id} 
          onClick={() => handleCardClick(t)}
          className={`p-3 border-l-2 ${status === 'CLOSED' ? `${THEME.border} opacity-50` : THEME.border} cursor-pointer ${THEME.cardHover} transition-all hover:border-l-brand-green hover:shadow-lg`}
        >
        <div className="flex justify-between items-center mb-2">
            <div className="flex flex-col gap-1">
                <h3 className={`font-bold text-base ${THEME.textPrimary} font-display tracking-wide`}>{t.name}</h3>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {renderStateBadge(t)}
                    {t.type && <span className={`text-[10px] ${THEME.textSecondary} border ${THEME.border} rounded px-1 w-fit`}>{t.type}</span>}
                </div>
            </div>
            {renderTimeDisplay(t.startTime)}
        </div>

        <div className="flex items-center justify-between text-xs mt-2">
             <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 ${THEME.accent} font-mono font-bold text-base`}>
                    <Coins size={14} />
                    <span>${totalPrice.toLocaleString()}</span>
                </div>
                <span className={THEME.textSecondary}>|</span>
                <span className={THEME.textSecondary}>起始: {t.startingChips.toLocaleString()}</span>
             </div>
             <div className={`flex items-center gap-1 ${THEME.textSecondary}`}>
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
      if (isGuest) return <Badge className={`${THEME.buttonSecondary} ${THEME.textSecondary}`}>訪客模式</Badge>;
      
      if (!wallet) {
          return <Badge className={`${THEME.buttonSecondary} ${THEME.textPrimary}`}>尚未加入</Badge>;
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
            <div className="flex items-center gap-2">
                {isGuest && (
                    <button 
                        onClick={handleGuestJoinClub}
                        className={`${THEME.buttonPrimary} text-xs px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-1 transition-colors animate-pulse`}
                    >
                        <UserPlus size={12} /> 申請加入俱樂部
                    </button>
                )}
                {renderStatusBadge()}
            </div>
            
            {!isGuest && wallet && wallet.status !== 'banned' && (
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
      <div className={`w-full aspect-[2/1] relative ${THEME.card}`}>
         {club.bannerUrl ? (
             <img src={club.bannerUrl} className="w-full h-full object-cover" alt="Club Banner" />
         ) : (
             <div className={`w-full h-full bg-gradient-to-br from-brand-dark to-[#0f0f0f] flex items-center justify-center`}>
                 <span className={`${THEME.textSecondary} text-4xl font-display font-bold opacity-20`}>{club.name}</span>
             </div>
         )}
         {/* Simple bottom gradient for transition */}
         <div className={`absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-brand-black to-transparent`} />
      </div>

      <div className="px-4 -mt-6 relative z-10 space-y-4">
        {/* 3. Club Header Info Block */}
        <div className="flex justify-between items-end">
             <div>
                <h1 className={`text-3xl font-bold ${THEME.textPrimary} shadow-black drop-shadow-xl font-display tracking-tight`}>{club.name}</h1>
                <div className={`flex items-center gap-2 ${THEME.textPrimary} text-sm mt-2`}>
                    <MapPin size={14} className={THEME.accent} />
                    <span>台北市信義區</span>
                    
                    <button 
                        onClick={handleOpenMap}
                        className={`${THEME.card}/80 px-1.5 py-0.5 rounded text-xs ${THEME.textPrimary} border ${THEME.border} hover:${THEME.textPrimary} hover:border-brand-green ${THEME.cardHover} transition-colors flex items-center gap-1`}
                    >
                        <Map size={10} />
                    </button>

                    {distanceText && (
                        <span className={`flex items-center gap-1 ${THEME.card}/80 px-1.5 py-0.5 rounded text-xs ${THEME.textPrimary} border ${THEME.border}`}>
                            <Navigation size={10} /> {distanceText}
                        </span>
                    )}
                </div>
             </div>
             <button onClick={() => setShowClubInfo(true)} className={`p-2 bg-[#262626]/80 backdrop-blur rounded-full ${THEME.accent} border border-brand-green/20 hover:bg-brand-green/10 shadow-lg`}>
                 <Info size={20} />
             </button>
         </div>

        {/* 4. Collapsible Club Description */}
        {club.description && (
            <div className={`bg-[#262626]/50 p-3 rounded-xl border ${THEME.border} relative`}>
                <div className={`text-xs ${THEME.textPrimary} leading-relaxed italic ${isDescriptionExpanded ? '' : 'line-clamp-2'}`}>
                    "{club.description}"
                </div>
                {/* Expand Toggle */}
                {club.description.length > 50 && (
                    <button 
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className={`flex items-center gap-1 text-[10px] ${THEME.accent} mt-1 font-bold hover:underline`}
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
                 {/* Date Filter - Simple UI with arrows */}
                 <div className="flex items-center justify-center gap-4 py-2">
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            setDateOffset(dateOffset - 1);
                        }}
                        className={`p-2 rounded-lg ${THEME.card} border ${THEME.border} ${THEME.cardHover} ${THEME.textPrimary} hover:bg-brand-green/10 hover:border-brand-green/30 transition-colors`}
                        aria-label="前一天"
                    >
                        <ChevronLeft size={24} strokeWidth={2.5} />
                    </button>
                    <div className={`text-lg font-bold ${THEME.textPrimary} min-w-[140px] text-center`}>
                        {getDateLabel(dateOffset)}
                    </div>
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            setDateOffset(dateOffset + 1);
                        }}
                        className={`p-2 rounded-lg ${THEME.card} border ${THEME.border} ${THEME.cardHover} ${THEME.textPrimary} hover:bg-brand-green/10 hover:border-brand-green/30 transition-colors`}
                        aria-label="後一天"
                    >
                        <ChevronRight size={24} strokeWidth={2.5} />
                    </button>
                 </div>

                 {/* Dynamic Buy-in Filter Chips */}
                 {uniqueBuyInAmounts.length > 0 && (
                     <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <button 
                            onClick={() => setBuyInFilter('All')}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap font-bold ${
                                buyInFilter === 'All' 
                                    ? `${THEME.buttonSecondary} ${THEME.textPrimary} ${THEME.border} bg-brand-green/10 border-brand-green/30` 
                                    : `bg-transparent ${THEME.textSecondary} ${THEME.border}`
                            }`}
                        >
                            全部
                        </button>
                        {uniqueBuyInAmounts.map((amount) => (
                            <button 
                                key={amount}
                                onClick={() => setBuyInFilter(amount)}
                                className={`text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap font-bold ${
                                    buyInFilter === amount 
                                        ? `${THEME.buttonSecondary} ${THEME.textPrimary} ${THEME.border} bg-brand-green/10 border-brand-green/30` 
                                        : `bg-transparent ${THEME.textSecondary} ${THEME.border}`
                                }`}
                            >
                                ${amount.toLocaleString()}
                            </button>
                        ))}
                     </div>
                 )}
            </div>
            
            {loading ? (
                <div className={`py-10 text-center ${THEME.textSecondary}`}>載入賽程中...</div>
            ) : (
                <>
                    {myEntries.length > 0 ? (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-500 mb-6">
                            <div className="space-y-2">
                                {myEntries.map(t => renderTournamentCard(t, myRegistrations.find(r => r.tournamentId === t.id)))}
                            </div>
                            {otherTournaments.length > 0 && (
                                <>
                                    <div className={`h-px bg-gradient-to-r from-transparent via-brand-border to-transparent w-full my-4`}></div>
                                    <div className="space-y-2">
                                        {otherTournaments.map(t => {
                                            const reg = myRegistrations.find(r => r.tournamentId === t.id);
                                            return renderTournamentCard(t, reg);
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {otherTournaments.length > 0 ? (
                                otherTournaments.map(t => {
                                    const reg = myRegistrations.find(r => r.tournamentId === t.id);
                                    return renderTournamentCard(t, reg);
                                })
                            ) : (
                                <div className={`text-center py-6 text-xs ${THEME.textSecondary} italic`}>
                                    沒有符合篩選條件的賽事
                                </div>
                            )}
                        </div>
                    )}
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
               <div className={`${THEME.card} p-4 rounded-lg border ${THEME.border}`}>
                   <h3 className={`font-bold ${THEME.textPrimary} text-lg mb-1`}>{club.name}</h3>
                   {/* Removed Partner Tier as requested */}
               </div>
               <div className={`space-y-4 text-sm ${THEME.textPrimary}`}>
                   <div>
                        <div className="flex justify-between items-start">
                             <p>📍 地址：台北市信義區松壽路 12 號 8 樓</p>
                             <button 
                                onClick={handleOpenMap}
                                className={`${THEME.buttonSecondary} ${THEME.accent} p-1.5 rounded-lg border ${THEME.border} ${THEME.cardHover} transition-colors`}
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

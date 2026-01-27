
import React, { useState, useEffect } from 'react';
import { Ticket, History, Loader2, TrendingUp, TrendingDown, Store, Clock, Filter, Trophy, Coins, Check, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { GAME_HISTORY, SEED_CLUBS, SEED_TOURNAMENTS } from '../../constants';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Header } from '../ui/Header';
import { TournamentDetailModal } from './TournamentDetailModal';
import { Tournament, Registration, GameRecord } from '../../types';
import { mockApi } from '../../services/mockApi';
import { useAlert } from '../../contexts/AlertContext';
import { THEME } from '../../theme';

interface StatsViewProps {
  userId: string;
  onNavigateTournaments: () => void;
}

interface ActiveGame {
    registration: Registration;
    tournament: Tournament;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isWin = data.profit > 0;
    return (
      <div className={`${THEME.card} border ${THEME.border} p-3 rounded-lg shadow-xl z-50`}>
        <p className={`text-xs ${THEME.textSecondary} mb-1`}>{data.date}</p>
        <p className={`text-sm font-bold ${THEME.textPrimary} mb-1`}>{data.gameName}</p>
        <p className={`text-sm font-mono font-bold ${isWin ? THEME.accent : 'text-red-500'}`}>
          {isWin ? '+' : ''}{data.profit.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export const StatsView: React.FC<StatsViewProps> = ({ userId, onNavigateTournaments }) => {
  const { showAlert, showConfirm } = useAlert();
  const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  
  const [selectedGame, setSelectedGame] = useState<ActiveGame | null>(null);
  const [historyDetailTournament, setHistoryDetailTournament] = useState<Tournament | null>(null);
  const [historyDetailRegistration, setHistoryDetailRegistration] = useState<Registration | undefined>(undefined);
  
  // Collapsible States
  const [showHistory, setShowHistory] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Filter State
  const [selectedClubFilter, setSelectedClubFilter] = useState<string>('All');
  const uniqueClubs = ['All', ...new Set(GAME_HISTORY.map(g => g.clubName))];

  const loadMyGames = async () => {
      setLoading(true);
      try {
          const data = await mockApi.getMyRegistrations(userId);
          setActiveGames(data);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    loadMyGames();
    const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, [userId]);

  const handleCancelRegistration = async () => {
      if (!selectedGame) return;
      
      // Update logic: Prevent cancellation of PAID entries
      if (selectedGame.registration.status === 'paid') {
          await showAlert("無法取消", "已付款之報名無法從 App 取消，請洽櫃檯人員。");
          return;
      }

      const confirmed = await showConfirm(
          "取消預約",
          "確定要取消預約嗎？"
      );

      if (confirmed) {
          try {
              await mockApi.cancelRegistration(userId, selectedGame.tournament.id);
              await showAlert("已取消", "已取消預約");
              setSelectedGame(null);
              loadMyGames(); 
          } catch (e: any) {
              await showAlert("錯誤", e.message);
          }
      }
  };

  const getClubName = (clubId: string) => {
      const club = SEED_CLUBS.find(c => c.id === clubId);
      return club ? club.name : 'Unknown Club';
  };

  const renderStateBadge = (t: Tournament) => {
    const startTime = new Date(t.startTime).getTime();
    const currentTime = now.getTime();
    
    // Mock logic: Assume game lasts 8 hours for 'Ended' visual
    const isEnded = currentTime > startTime + (8 * 60 * 60 * 1000);

    if (isEnded) {
        return <Badge className={`${THEME.buttonSecondary} ${THEME.textSecondary} border ${THEME.border}`}>已結束</Badge>;
    }
    if (t.isLateRegEnded) {
        return <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30">已截買</Badge>;
    }
    return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">報名中</Badge>;
};

  const renderTimeDisplay = (startTimeIso: string) => {
      const start = new Date(startTimeIso);
      const timeStr = start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false});
      return <div className="font-mono text-white font-bold text-sm">{timeStr}</div>;
  };

  const handleHistoryClick = (game: GameRecord) => {
      const template = SEED_TOURNAMENTS.find(t => t.name === game.gameName) || SEED_TOURNAMENTS[0];
      const clubId = SEED_CLUBS.find(c => c.name === game.clubName)?.id || 'mock-history';

      const mockTournament: Tournament = {
          ...template, 
          id: game.id,
          clubId: clubId, 
          name: game.gameName,
          buyIn: game.buyIn,
          type: game.type || template.type, 
          startTime: game.date, 
          reservedCount: game.entryCount * 10, 
          maxCap: game.entryCount * 10 + 5,
          isLateRegEnded: true, 
      };

      const mockReg: Registration = {
          id: `hist-reg-${game.id}`,
          tournamentId: game.id,
          userId: userId,
          status: 'paid', 
          timestamp: game.date
      };

      setHistoryDetailTournament(mockTournament);
      setHistoryDetailRegistration(mockReg);
  };

  const allHistory = [...GAME_HISTORY].reverse(); 
  const recent50 = allHistory.slice(0, 50);
  
  const filteredHistory = recent50.filter(game => {
      if (selectedClubFilter === 'All') return true;
      return game.clubName === selectedClubFilter;
  });

  let cumulative = 0;
  const chartData = [...GAME_HISTORY].map(game => {
    cumulative += game.profit;
    return {
      ...game,
      cumulative,
      displayDate: new Date(game.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    };
  });
  const totalProfit = chartData[chartData.length - 1]?.cumulative || 0;
  const isPositive = totalProfit >= 0;

  // Group active games by Club ID
  const gamesByClub = activeGames.reduce((acc, game) => {
      const clubId = game.tournament.clubId;
      if (!acc[clubId]) acc[clubId] = [];
      acc[clubId].push(game);
      return acc;
  }, {} as Record<string, ActiveGame[]>);

  return (
    <div className="pb-24 space-y-8">
      <style>{`
        .scrollbar-thin::-webkit-scrollbar {
            height: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
            background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
            background: #334155;
            border-radius: 999px;
        }
      `}</style>
      <Header />
      
      <div>
        <h2 className={`text-2xl font-bold ${THEME.textPrimary} mb-6`}>我的賽事</h2>
        
        {/* Active / Registered Games Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
             <div className={`w-1 h-8 bg-brand-green rounded-full shadow-[0_0_10px_rgba(6,193,103,0.5)]`}></div>
             <div className="flex flex-col">
                 <h3 className={`font-display font-bold text-2xl ${THEME.textPrimary} tracking-wide`}>進行中 / 已報名</h3>
                 <p className={`text-xs ${THEME.textSecondary} font-medium uppercase tracking-widest`}>Active Tournaments</p>
             </div>
          </div>
          
          {loading ? (
              <div className={`flex justify-center py-8 ${THEME.textSecondary}`}>
                  <Loader2 className="animate-spin mr-2" /> 載入中...
              </div>
          ) : activeGames.length > 0 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {Object.entries(gamesByClub).map(([clubId, games]) => (
                  <div key={clubId}>
                      {/* Category Header */}
                      <div className="flex items-center gap-2 mb-3 px-1">
                          <Store size={14} className={THEME.accent} />
                          <span className={`text-sm font-bold ${THEME.textPrimary} tracking-wide`}>{getClubName(clubId)}</span>
                          <div className={`h-px ${THEME.border.replace('border', 'bg')} flex-1 ml-2`}></div>
                      </div>

                      <div className="space-y-3">
                          {games.map(item => {
                            const isPaid = item.registration.status === 'paid';
                            const totalPrice = item.tournament.buyIn + item.tournament.fee;
                            
                            return (
                            <Card 
                              key={item.registration.id} 
                              onClick={() => setSelectedGame(item)}
                              // Strengthened Visuals: Increased opacity of bg, added shadow-md
                              className={`p-3 border-l-4 cursor-pointer ${THEME.cardHover} transition-all hover:shadow-lg shadow-md ${isPaid ? 'border-l-brand-green bg-brand-green/10' : 'border-l-yellow-500 bg-yellow-500/10'}`}
                            >
                               <div className="flex justify-between items-center mb-2 gap-2">
                                    <div className="flex flex-col gap-1 overflow-hidden">
                                         <h4 className={`font-bold ${THEME.textPrimary} text-base truncate`}>{item.tournament.name}</h4>
                                         <div className="flex items-center gap-1.5 flex-wrap">
                                             {/* Status Badge Added */}
                                             {renderStateBadge(item.tournament)}
                                             <div className={`h-3 w-px ${THEME.border.replace('border', 'bg')} mx-0.5`}></div>
                                             {/* Type Badge Restored */}
                                             {item.tournament.type && (
                                                <span className={`text-[10px] ${THEME.textPrimary} border ${THEME.border} rounded px-1.5 py-[1px] ${THEME.card}/50`}>
                                                    {item.tournament.type}
                                                </span>
                                             )}
                                             
                                             <Badge variant={isPaid ? 'success' : 'warning'} className="text-[10px] px-1.5 py-0 whitespace-nowrap">
                                                {isPaid ? '已付款' : '已預約'}
                                             </Badge>
                                         </div>
                                    </div>
                                    {renderTimeDisplay(item.tournament.startTime)}
                               </div>

                               {/* Progress Bar Visual */}
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
                                         <span className={THEME.textSecondary}>起始: {item.tournament.startingChips.toLocaleString()}</span>
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
                          )})}
                      </div>
                  </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 bg-[#262626]/30 rounded-xl border border-dashed ${THEME.border}`}>
               <p className={`${THEME.textSecondary} text-sm mb-3`}>目前沒有已報名的賽事。</p>
               <button 
                 onClick={onNavigateTournaments}
                 className={`${THEME.accent} text-sm font-medium hover:underline`}
               >
                 前往報名
               </button>
            </div>
          )}
        </div>

        {/* Collapsible History Section */}
        <div className={`border ${THEME.border} rounded-xl overflow-hidden mb-4 bg-[#262626]/10`}>
            <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`w-full flex items-center justify-between p-4 bg-[#262626]/30 ${THEME.cardHover} transition-colors`}
            >
                <div className="flex items-center gap-2">
                    <History className={THEME.textSecondary} size={18} />
                    <span className={`text-base font-bold ${THEME.textPrimary}`}>歷史戰績</span>
                </div>
                {showHistory ? <ChevronUp size={18} className={THEME.textSecondary} /> : <ChevronDown size={18} className={THEME.textSecondary} />}
            </button>

            {showHistory && (
                <div className={`p-4 border-t ${THEME.border} animate-in fade-in slide-in-from-top-1 duration-200`}>
                    {/* Header & Filter */}
                    <div className="flex flex-col gap-3 mb-4">
                        <div className={`flex items-center gap-2 ${THEME.textSecondary} text-xs`}>
                            <span className="font-medium">近期紀錄 (最近50筆)</span>
                        </div>
                        
                        {/* Chips for Filtering */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                            {uniqueClubs.map(clubName => (
                                <button
                                    key={clubName}
                                    onClick={() => setSelectedClubFilter(clubName)}
                                    className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                                        selectedClubFilter === clubName 
                                        ? `${THEME.buttonSecondary} ${THEME.textPrimary} ${THEME.border}` 
                                        : `bg-transparent ${THEME.textSecondary} ${THEME.border} hover:${THEME.border}`
                                    }`}
                                >
                                    {clubName === 'All' ? '全部協會' : clubName}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* List Items */}
                    <div className="space-y-1">
                        {filteredHistory.length > 0 ? (
                            filteredHistory.map(game => (
                                <div 
                                    key={game.id} 
                                    onClick={() => handleHistoryClick(game)}
                                    className={`group flex justify-between items-center py-4 border-b ${THEME.border}/40 cursor-pointer hover:bg-white/5 transition-all px-2 -mx-2 rounded-lg opacity-80 hover:opacity-100`}
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className={`text-sm font-bold ${THEME.textPrimary} group-hover:${THEME.textPrimary} transition-colors`}>{game.gameName}</div>
                                        <div className={`flex items-center gap-2 text-xs ${THEME.textSecondary}`}>
                                            <span>{new Date(game.date).toLocaleDateString()}</span>
                                            <span className={`w-1 h-1 rounded-full ${THEME.border.replace('border', 'bg')}`}></span>
                                            <span className={THEME.textSecondary}>{game.clubName}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className={`font-mono font-bold text-sm ${game.profit > 0 ? THEME.accent : THEME.textSecondary}`}>
                                                {game.profit > 0 ? '+' : ''}{game.profit.toLocaleString()}
                                            </div>
                                            {game.points && game.points > 0 && (
                                                <span className="text-[10px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-0.5">
                                                    <Trophy size={8} /> +{game.points}
                                                </span>
                                            )}
                                        </div>
                                        <div className={`text-[10px] ${THEME.textSecondary} mt-0.5`}>
                                            Buy-in: ${game.buyIn.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={`py-8 text-center ${THEME.textSecondary} text-sm italic`}>
                                查無相關賽事紀錄
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Collapsible Stats Section */}
        <div className={`border ${THEME.border} rounded-xl overflow-hidden bg-[#262626]/10`}>
            <button 
                onClick={() => setShowStats(!showStats)}
                className={`w-full flex items-center justify-between p-4 bg-[#262626]/30 ${THEME.cardHover} transition-colors`}
            >
                <div className="flex items-center gap-2">
                    <BarChart3 className={THEME.textSecondary} size={18} />
                    <span className={`text-base font-bold ${THEME.textPrimary}`}>數據統計</span>
                </div>
                {showStats ? <ChevronUp size={18} className={THEME.textSecondary} /> : <ChevronDown size={18} className={THEME.textSecondary} />}
            </button>
            
            {showStats && (
                <div className={`p-4 border-t ${THEME.border} animate-in fade-in slide-in-from-top-1 duration-200 space-y-6`}>
                    <div className={`bg-[#262626] rounded-2xl p-6 border ${THEME.border} relative overflow-hidden`}>
                        <div className={`absolute -right-10 -top-10 w-32 h-32 bg-brand-green/10 rounded-full blur-2xl`}></div>
                        <p className={`text-sm ${THEME.textSecondary} mb-1 font-medium`}>總盈利 (Total Profit)</p>
                        <div className="flex items-center gap-3">
                            <h3 className={`text-3xl font-bold font-mono ${isPositive ? THEME.accent : 'text-red-500'} glow-text`}>
                                {isPositive ? '+' : ''}{totalProfit.toLocaleString()}
                            </h3>
                            {isPositive ? <TrendingUp className={THEME.accent} /> : <TrendingDown className="text-red-500" />}
                        </div>
                    </div>

                    <div className={`h-[300px] w-full ${THEME.card}/50 rounded-2xl p-2 border ${THEME.border}`}>
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

      </div>

      <TournamentDetailModal 
        tournament={selectedGame?.tournament || null} 
        userWallet={null} 
        registration={selectedGame?.registration}
        onClose={() => setSelectedGame(null)}
        onRegister={() => {}} 
        onCancel={handleCancelRegistration}
      />

      <TournamentDetailModal 
        tournament={historyDetailTournament} 
        userWallet={null} 
        registration={historyDetailRegistration}
        onClose={() => {
            setHistoryDetailTournament(null);
            setHistoryDetailRegistration(undefined);
        }}
        onRegister={() => {}} 
        onCancel={() => {}}
      />
    </div>
  );
};

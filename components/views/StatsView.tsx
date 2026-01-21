import React, { useState, useEffect } from 'react';
import { Ticket, History, Calendar, Loader2, TrendingUp, TrendingDown, Store, Clock } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { GAME_HISTORY, SEED_CLUBS } from '../../constants';
import { Badge } from '../ui/Badge';
import { Header } from '../ui/Header';
import { TournamentDetailModal } from './TournamentDetailModal';
import { Tournament, Registration, GameRecord } from '../../types';
import { mockApi } from '../../services/mockApi';

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

export const StatsView: React.FC<StatsViewProps> = ({ userId, onNavigateTournaments }) => {
  const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  
  // State for Modal
  const [selectedGame, setSelectedGame] = useState<ActiveGame | null>(null);
  const [historyDetailTournament, setHistoryDetailTournament] = useState<Tournament | null>(null);
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'history' | 'stats'>('history');

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
      
      const confirmMsg = selectedGame.registration.status === 'paid' 
          ? "確定要取消報名嗎？款項將退回至您的俱樂部錢包。" 
          : "確定要取消預約嗎？";

      if (window.confirm(confirmMsg)) {
          try {
              await mockApi.cancelRegistration(userId, selectedGame.tournament.id);
              alert("已取消報名");
              setSelectedGame(null);
              loadMyGames(); // Refresh list
          } catch (e: any) {
              alert(e.message);
          }
      }
  };

  const getClubName = (clubId: string) => {
      const club = SEED_CLUBS.find(c => c.id === clubId);
      return club ? club.name : 'Unknown Club';
  };

  const getTimeStatus = (startTimeStr: string) => {
      const start = new Date(startTimeStr);
      const diffMs = now.getTime() - start.getTime();
      const diffMins = Math.floor(Math.abs(diffMs) / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      
      const timeString = `${hours > 0 ? `${hours}小時 ` : ''}${mins}分`;

      if (diffMs > 0) {
          return { label: '已開始', time: timeString, isStarted: true };
      } else {
          return { label: '距離開始', time: timeString, isStarted: false };
      }
  };

  // Helper to open history detail
  const handleHistoryClick = (game: GameRecord) => {
      // Find the real club ID if possible from the name
      const clubId = SEED_CLUBS.find(c => c.name === game.clubName)?.id || 'mock-history';

      // Construct a mock tournament object for the modal to display
      const mockTournament: Tournament = {
          id: game.id,
          clubId: clubId, // Use resolved ID
          name: game.gameName,
          buyIn: game.buyIn,
          fee: 0, 
          startingChips: 20000, 
          startTime: game.date,
          reservedCount: 0,
          maxCap: 0,
          isLateRegEnded: true,
          structure: [
             { level: 1, smallBlind: 100, bigBlind: 100, ante: 100, duration: 20 },
             { level: 2, smallBlind: 100, bigBlind: 200, ante: 200, duration: 20 },
          ]
      };
      setHistoryDetailTournament(mockTournament);
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
    <div className="pb-24 space-y-6">
      <Header />
      
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">我的賽事</h2>
        
        {/* Active Section - Fixed at Top */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 text-primary">
             <Ticket size={18} />
             <h3 className="font-semibold">進行中 / 已報名</h3>
          </div>
          
          {loading ? (
              <div className="flex justify-center py-8 text-textMuted">
                  <Loader2 className="animate-spin mr-2" /> 載入中...
              </div>
          ) : activeGames.length > 0 ? (
            <div className="space-y-3">
              {activeGames.map(item => {
                const timeStatus = getTimeStatus(item.tournament.startTime);
                const exactTime = new Date(item.tournament.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                return (
                <div 
                  key={item.registration.id} 
                  onClick={() => setSelectedGame(item)}
                  className="bg-surfaceHighlight p-4 rounded-xl border border-slate-700 relative overflow-hidden cursor-pointer hover:border-slate-500 transition-all active:scale-[0.98]"
                >
                   <div className={`absolute top-0 left-0 w-1 h-full ${item.registration.status === 'paid' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                   
                   {/* Club Name */}
                   <div className="flex items-center gap-1.5 mb-1.5">
                       <Store size={12} className="text-slate-500" />
                       <span className="text-xs text-slate-400 font-medium">{getClubName(item.tournament.clubId)}</span>
                   </div>

                   <div className="flex justify-between items-start mb-3 pl-2">
                      <h4 className="font-bold text-white text-lg">{item.tournament.name}</h4>
                      <Badge variant={item.registration.status === 'paid' ? 'success' : 'warning'}>
                          {item.registration.status === 'paid' ? '已付款' : '已預約'}
                      </Badge>
                   </div>
                   
                   {/* Time Display with Both Exact and Relative */}
                   <div className="flex items-center gap-3 text-sm mb-4 pl-2">
                      <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
                          <Clock size={14} className="text-slate-400" />
                          <span className="font-mono font-bold text-white tracking-wide">{exactTime}</span>
                      </div>
                      <span className={`text-xs font-medium ${timeStatus.isStarted ? 'text-green-400' : 'text-gold'}`}>
                            {timeStatus.label} {timeStatus.time}
                      </span>
                   </div>
                   
                   <div className="flex justify-between items-end pl-2 pt-3 border-t border-slate-700/50">
                      <div className="text-xs text-slate-500">
                           單次買入: ${item.tournament.buyIn.toLocaleString()} <span className="mx-1">|</span> 買入次數: 1
                      </div>
                      <div className="font-mono font-bold text-emerald-400">
                          ${(item.tournament.buyIn + item.tournament.fee).toLocaleString()}
                      </div>
                   </div>
                </div>
              )})}
            </div>
          ) : (
            <div className="text-center py-8 bg-surfaceHighlight/30 rounded-xl border border-dashed border-slate-800">
               <p className="text-textMuted text-sm mb-3">目前沒有已報名的賽事。</p>
               <button 
                 onClick={onNavigateTournaments}
                 className="text-primary text-sm font-medium hover:underline"
               >
                 前往報名
               </button>
            </div>
          )}
        </div>

        {/* Tabs for History and Stats */}
        <div className="flex border-b border-slate-800 mb-6">
            <button
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'history' ? 'text-gold border-b-2 border-gold' : 'text-textMuted hover:text-slate-300'}`}
            onClick={() => setActiveTab('history')}
            >
            歷史戰績
            </button>
            <button
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${activeTab === 'stats' ? 'text-gold border-b-2 border-gold' : 'text-textMuted hover:text-slate-300'}`}
            onClick={() => setActiveTab('stats')}
            >
            數據統計
            </button>
        </div>

        {/* Content Area */}
        {activeTab === 'history' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 mb-4 text-slate-400">
                    <History size={18} />
                    <h3 className="font-semibold">近期紀錄</h3>
                </div>
                <div className="space-y-3">
                    {[...GAME_HISTORY].reverse().map(game => (
                        <div 
                            key={game.id} 
                            onClick={() => handleHistoryClick(game)}
                            className="bg-surface rounded-xl border border-slate-800 hover:border-gold/30 hover:bg-surfaceHighlight transition-all cursor-pointer p-4 group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Store size={12} className="text-slate-500" />
                                        <span className="text-xs text-slate-500">{game.clubName}</span>
                                    </div>
                                    <div className="font-medium text-white group-hover:text-gold transition-colors">{game.gameName}</div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-mono font-bold ${game.profit > 0 ? 'text-primary' : 'text-danger'}`}>
                                        {game.profit > 0 ? '+' : ''}{game.profit.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-800/50 pt-2 mt-2">
                                <div>{new Date(game.date).toLocaleDateString()}</div>
                                <div className="font-mono">
                                    Buy-in: ${game.buyIn.toLocaleString()} <span className="text-slate-600">x</span> {game.entryCount}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'stats' && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                <div className="bg-surfaceHighlight rounded-2xl p-6 border border-slate-700 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-gold/10 rounded-full blur-2xl"></div>
                    <p className="text-sm text-slate-400 mb-1 font-medium">總盈利 (Total Profit)</p>
                    <div className="flex items-center gap-3">
                        <h3 className={`text-3xl font-bold font-mono ${isPositive ? 'text-gold' : 'text-danger'} glow-text`}>
                            {isPositive ? '+' : ''}{totalProfit.toLocaleString()}
                        </h3>
                        {isPositive ? <TrendingUp className="text-gold" /> : <TrendingDown className="text-danger" />}
                    </div>
                </div>

                <div className="h-[300px] w-full bg-slate-900/50 rounded-2xl p-2 border border-slate-800">
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

      {/* Active Game Modal */}
      <TournamentDetailModal 
        tournament={selectedGame?.tournament || null} 
        userWallet={null} 
        registration={selectedGame?.registration}
        onClose={() => setSelectedGame(null)}
        onRegister={() => {}} 
        onCancel={handleCancelRegistration}
      />

      {/* History Detail Modal (Read Only) */}
      <TournamentDetailModal 
        tournament={historyDetailTournament} 
        userWallet={null} 
        onClose={() => setHistoryDetailTournament(null)}
        onRegister={() => {}} 
        onCancel={() => {}}
      />
    </div>
  );
};
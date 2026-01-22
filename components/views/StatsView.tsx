
import React, { useState, useEffect } from 'react';
import { Ticket, History, Loader2, TrendingUp, TrendingDown, Store, Clock } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { GAME_HISTORY, SEED_CLUBS, SEED_TOURNAMENTS } from '../../constants';
import { Badge } from '../ui/Badge';
import { Header } from '../ui/Header';
import { TournamentDetailModal } from './TournamentDetailModal';
import { Tournament, Registration, GameRecord } from '../../types';
import { mockApi } from '../../services/mockApi';
import { useAlert } from '../../contexts/AlertContext';

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
  const { showAlert, showConfirm } = useAlert();
  const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  
  const [selectedGame, setSelectedGame] = useState<ActiveGame | null>(null);
  const [historyDetailTournament, setHistoryDetailTournament] = useState<Tournament | null>(null);
  const [historyDetailRegistration, setHistoryDetailRegistration] = useState<Registration | undefined>(undefined);
  
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
                                    <div className="flex items-center gap-2 mb-1">
                                        {game.type && (
                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-slate-600 text-slate-400">
                                                {game.type}
                                            </Badge>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <Store size={12} className="text-slate-500" />
                                            <span className="text-xs text-slate-500">{game.clubName}</span>
                                        </div>
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
                                <div className="flex gap-3">
                                    <span>{new Date(game.date).toLocaleDateString()}</span>
                                    {game.seatNumber && <span className="text-gold">座位: {game.seatNumber}號</span>}
                                </div>
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

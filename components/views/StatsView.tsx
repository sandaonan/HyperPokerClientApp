import React, { useState, useEffect } from 'react';
import { Ticket, History, Calendar, Loader2 } from 'lucide-react';
import { GAME_HISTORY } from '../../constants';
import { Badge } from '../ui/Badge';
import { Header } from '../ui/Header';
import { TournamentDetailModal } from './TournamentDetailModal';
import { Tournament, Registration } from '../../types';
import { mockApi } from '../../services/mockApi';

interface StatsViewProps {
  userId: string;
  onNavigateTournaments: () => void;
}

interface ActiveGame {
    registration: Registration;
    tournament: Tournament;
}

export const StatsView: React.FC<StatsViewProps> = ({ userId, onNavigateTournaments }) => {
  const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for Modal
  const [selectedGame, setSelectedGame] = useState<ActiveGame | null>(null);

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

  return (
    <div className="pb-24 space-y-6">
      <Header />
      
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">我的賽事</h2>
        
        {/* Active Section */}
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
              {activeGames.map(item => (
                <div 
                  key={item.registration.id} 
                  onClick={() => setSelectedGame(item)}
                  className="bg-surfaceHighlight p-4 rounded-xl border border-slate-700 relative overflow-hidden cursor-pointer hover:border-slate-500 transition-all active:scale-[0.98]"
                >
                   <div className={`absolute top-0 left-0 w-1 h-full ${item.registration.status === 'paid' ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                   
                   <div className="flex justify-between items-start mb-2 pl-2">
                      <h4 className="font-bold text-white text-lg">{item.tournament.name}</h4>
                      <Badge variant={item.registration.status === 'paid' ? 'success' : 'warning'}>
                          {item.registration.status === 'paid' ? '已付款' : '已預約'}
                      </Badge>
                   </div>
                   
                   <div className="flex items-center gap-3 text-sm text-textMuted mb-3 pl-2">
                      <div className="flex items-center gap-1">
                         <Calendar size={14} />
                         <span>{new Date(item.tournament.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                   </div>
                   
                   <div className="flex justify-between items-end pl-2">
                      <div className="text-xs text-slate-500">
                          {item.registration.status === 'paid' ? '線上扣款' : '現場繳費'}
                      </div>
                      <div className="font-mono font-bold text-emerald-400">
                          ${item.tournament.buyIn.toLocaleString()}
                      </div>
                   </div>
                </div>
              ))}
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

        {/* History Section (Static Mock Data for now) */}
        <div>
           <div className="flex items-center gap-2 mb-4 text-slate-400">
             <History size={18} />
             <h3 className="font-semibold">歷史戰績</h3>
          </div>
          <div className="space-y-3">
            {[...GAME_HISTORY].reverse().map(game => (
                <div key={game.id} className="flex items-center justify-between p-4 bg-surface rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                    <div>
                        <div className="font-medium text-white">{game.gameName}</div>
                        <div className="text-xs text-slate-500">{new Date(game.date).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                         <div className={`font-mono font-bold ${game.profit > 0 ? 'text-primary' : 'text-danger'}`}>
                            {game.profit > 0 ? '+' : ''}{game.profit.toLocaleString()}
                         </div>
                         <div className="text-xs text-slate-600">盈利</div>
                    </div>
                </div>
            ))}
          </div>
        </div>
      </div>

      <TournamentDetailModal 
        tournament={selectedGame?.tournament || null} 
        userWallet={null} // Read-only context for cancellation
        registration={selectedGame?.registration}
        onClose={() => setSelectedGame(null)}
        onRegister={() => {}} 
        onCancel={handleCancelRegistration}
      />
    </div>
  );
};
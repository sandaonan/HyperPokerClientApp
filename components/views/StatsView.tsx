import React, { useState } from 'react';
import { Ticket, History, Calendar } from 'lucide-react';
import { GAME_HISTORY, TOURNAMENTS } from '../../constants';
import { Badge } from '../ui/Badge';
import { Header } from '../ui/Header';
import { TournamentDetailModal } from './TournamentDetailModal';
import { Tournament } from '../../types';

interface MyGamesViewProps {
  registeredIds: string[];
  onNavigateTournaments: () => void;
}

export const StatsView: React.FC<MyGamesViewProps> = ({ registeredIds, onNavigateTournaments }) => {
  const [viewingTournament, setViewingTournament] = useState<Tournament | null>(null);
  const activeGames = TOURNAMENTS.filter(t => registeredIds.includes(t.id));

  return (
    <div className="pb-24 space-y-6">
      <Header />
      
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">My Games</h2>
        
        {/* Active Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 text-primary">
             <Ticket size={18} />
             <h3 className="font-semibold">Active Registrations</h3>
          </div>
          
          {activeGames.length > 0 ? (
            <div className="space-y-3">
              {activeGames.map(game => (
                <div 
                  key={game.id} 
                  onClick={() => setViewingTournament(game)}
                  className="bg-surfaceHighlight p-4 rounded-xl border border-slate-700 relative overflow-hidden cursor-pointer hover:border-slate-500 transition-all active:scale-[0.98]"
                >
                   <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                   <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-white text-lg">{game.name}</h4>
                      <Badge variant="success">Registered</Badge>
                   </div>
                   <div className="flex items-center gap-3 text-sm text-textMuted mb-3">
                      <div className="flex items-center gap-1">
                         <Calendar size={14} />
                         <span>{new Date(game.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} Today</span>
                      </div>
                   </div>
                   <div className="flex justify-between items-end">
                      <div className="text-xs text-slate-500">Starting Stack: {(game.startingChips/1000)}k</div>
                      <div className="font-mono font-bold text-emerald-400">${game.buyIn.toLocaleString()}</div>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-surfaceHighlight/30 rounded-xl border border-dashed border-slate-800">
               <p className="text-textMuted text-sm mb-3">No active games.</p>
               <button 
                 onClick={onNavigateTournaments}
                 className="text-primary text-sm font-medium hover:underline"
               >
                 Browse Tournaments
               </button>
            </div>
          )}
        </div>

        {/* History Section */}
        <div>
           <div className="flex items-center gap-2 mb-4 text-slate-400">
             <History size={18} />
             <h3 className="font-semibold">Game History</h3>
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
                         <div className="text-[10px] text-slate-600">Profit</div>
                    </div>
                </div>
            ))}
          </div>
        </div>
      </div>

      <TournamentDetailModal 
        tournament={viewingTournament} 
        onClose={() => setViewingTournament(null)}
        actionLabel="Cancel Registration"
        onAction={() => alert("Cancel logic would go here")}
      />
    </div>
  );
};
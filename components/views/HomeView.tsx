import React from 'react';
import { Plus, ChevronRight, Wallet, Trophy } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Header } from '../ui/Header';
import { CLUBS } from '../../constants';
import { Club } from '../../types';

interface HomeViewProps {
  onSelectClub: (club: Club) => void;
  onJoinNew: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectClub, onJoinNew }) => {
  return (
    <div className="space-y-6 pb-20">
      <Header />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">My Clubs</h2>
          <p className="text-sm text-textMuted">Select a club to view games</p>
        </div>
        <button 
          onClick={onJoinNew}
          className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {CLUBS.map((club) => (
          <Card 
            key={club.id} 
            onClick={() => onSelectClub(club)}
            className="group relative overflow-hidden"
          >
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-700/20 to-transparent rounded-bl-full -mr-8 -mt-8 pointer-events-none" />

            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                  {club.name}
                </h3>
                <span className="text-xs text-textMuted font-mono">ID: {club.localId}</span>
              </div>
              <Badge variant={
                club.tier === 'Diamond' ? 'warning' :
                club.tier === 'Emerald' ? 'success' : 'default'
              }>
                {club.tier}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2 text-textMuted text-xs mb-1">
                  <Wallet size={12} />
                  <span>Balance</span>
                </div>
                <div className="text-lg font-mono font-semibold text-white">
                  ${club.balance.toLocaleString()}
                </div>
              </div>
              
              <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2 text-textMuted text-xs mb-1">
                  <Trophy size={12} />
                  <span>Points</span>
                </div>
                <div className="text-lg font-mono font-semibold text-primary">
                  {club.points.toLocaleString()} Pts
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
              <ChevronRight className="text-slate-600" />
            </div>
          </Card>
        ))}
      </div>
      
      <div className="mt-8 pt-8 border-t border-slate-800 text-center">
        <p className="text-sm text-textMuted mb-4">Want to play somewhere else?</p>
        <button 
          onClick={onJoinNew}
          className="w-full py-3 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-slate-500 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Join New Club
        </button>
      </div>
    </div>
  );
};
import React from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Header } from '../ui/Header';
import { SEED_CLUBS } from '../../constants';
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
          <h2 className="text-xl font-bold text-white">我的俱樂部</h2>
          <p className="text-sm text-textMuted">選擇俱樂部以查看賽事與錢包</p>
        </div>
        <button 
          onClick={onJoinNew}
          className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {SEED_CLUBS.map((club) => (
          <Card 
            key={club.id} 
            onClick={() => onSelectClub(club)}
            className="group relative overflow-hidden"
          >
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-700/20 to-transparent rounded-bl-full -mr-8 -mt-8 pointer-events-none" />

            <div className="flex justify-between items-start mb-10">
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

            <div className="flex items-center justify-between text-sm text-textMuted">
                <span>{club.description?.substring(0, 20)}...</span>
                <span className="group-hover:translate-x-1 transition-transform text-white flex items-center gap-1">
                    進入俱樂部 <ChevronRight size={14} />
                </span>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="mt-8 pt-8 border-t border-slate-800 text-center">
        <p className="text-sm text-textMuted mb-4">想去其他地方玩？</p>
        <button 
          onClick={onJoinNew}
          className="w-full py-3 border border-dashed border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-slate-500 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          加入新俱樂部
        </button>
      </div>
    </div>
  );
};
import React from 'react';
import { Clock, Coins, Info, Users } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Tournament } from '../../types';

interface TournamentDetailModalProps {
  tournament: Tournament | null;
  onClose: () => void;
  onAction?: () => void;
  actionLabel?: string;
  actionDisabled?: boolean;
}

export const TournamentDetailModal: React.FC<TournamentDetailModalProps> = ({ 
  tournament, 
  onClose, 
  onAction,
  actionLabel = "Action",
  actionDisabled = false
}) => {
  if (!tournament) return null;

  return (
    <Modal isOpen={!!tournament} onClose={onClose} title="Tournament Details">
      <div className="space-y-6">
        
        {/* Header Info */}
        <div>
           <h3 className="text-xl font-bold text-white mb-1">{tournament.name}</h3>
           <p className="text-emerald-400 font-mono text-lg font-bold">
             ${tournament.buyIn.toLocaleString()} <span className="text-slate-500 text-sm font-normal">+ ${tournament.fee}</span>
           </p>
        </div>

        {/* Description */}
        {tournament.description && (
          <div className="bg-surfaceHighlight p-3 rounded-lg border border-slate-700">
             <div className="flex items-center gap-2 mb-2 text-textMuted">
                <Info size={16} />
                <span className="text-xs font-bold uppercase">Info</span>
             </div>
             <p className="text-sm text-slate-300 leading-relaxed">
               {tournament.description}
             </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
             <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Coins size={14} />
                Starting Stack
             </div>
             <div className="text-white font-mono">{tournament.startingChips.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
             <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Users size={14} />
                Capacity
             </div>
             <div className="text-white font-mono">{tournament.reservedCount} / {tournament.maxCap}</div>
          </div>
        </div>

        {/* Blind Structure Table */}
        <div>
           <div className="flex items-center gap-2 mb-3 text-white">
              <Clock size={16} />
              <h4 className="font-bold text-sm">Blind Structure</h4>
           </div>
           <div className="border border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                 <thead className="bg-slate-800 text-slate-400 text-xs uppercase">
                    <tr>
                       <th className="p-3 font-medium">Lvl</th>
                       <th className="p-3 font-medium">Blinds</th>
                       <th className="p-3 font-medium text-right">Dur</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                    {tournament.structure?.map((level) => (
                       <tr key={level.level}>
                          <td className="p-3 text-slate-500">{level.level}</td>
                          <td className="p-3 text-white font-mono">{level.smallBlind.toLocaleString()}/{level.bigBlind.toLocaleString()} ({level.ante})</td>
                          <td className="p-3 text-slate-400 text-right">{level.duration}m</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Action Button */}
        {onAction && (
          <div className="pt-2">
            <Button fullWidth onClick={onAction} disabled={actionDisabled}>
               {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
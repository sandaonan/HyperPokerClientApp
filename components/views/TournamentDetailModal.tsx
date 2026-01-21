import React from 'react';
import { Clock, Coins, Users, Wallet as WalletIcon, Check, AlertTriangle, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Tournament, Wallet, Registration } from '../../types';
import { SEED_CLUBS } from '../../constants';

interface TournamentDetailModalProps {
  tournament: Tournament | null;
  userWallet: Wallet | null;
  registration?: Registration;
  onClose: () => void;
  onRegister: (type: 'reserve' | 'buy-in') => void;
  onCancel: () => void;
}

export const TournamentDetailModal: React.FC<TournamentDetailModalProps> = ({ 
  tournament, 
  userWallet,
  registration,
  onClose, 
  onRegister,
  onCancel
}) => {
  if (!tournament) return null;

  const totalCost = tournament.buyIn + tournament.fee;
  // If user wallet is missing, treat as not affordable to prevent errors
  const currentBalance = userWallet ? userWallet.balance : 0;
  const canAfford = currentBalance >= totalCost;
  const isFull = tournament.reservedCount >= tournament.maxCap;
  
  // Logic to determine if "Ended"
  // If we don't have an active registration/wallet context, or start time is in the past
  const startTime = new Date(tournament.startTime).getTime();
  const isEnded = startTime < new Date().getTime();
  
  // Resolve Club Name
  const clubName = SEED_CLUBS.find(c => c.id === tournament.clubId)?.name || 'Club Event';

  const handleBuyInClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Feedback for insufficient funds
      if (!canAfford) {
          alert(`餘額不足！\n\n您的俱樂部錢包餘額: $${currentBalance.toLocaleString()}\n本次報名需要: $${totalCost.toLocaleString()}\n\n請先至櫃檯儲值。`);
          return;
      }
      
      // Confirmation Logic
      if (window.confirm(`【確認報名】\n\n您即將使用俱樂部錢包餘額報名。\n將扣除: $${totalCost.toLocaleString()}\n\n注意：使用線上金流報名後，如需取消，報名費 (Fee) 恕不退還。\n\n是否確定報名？`)) {
          onRegister('buy-in');
      }
  };

  const handleCancelClick = (e: React.MouseEvent) => {
     e.preventDefault();
     e.stopPropagation();
     // Trigger the parent's cancel handler
     onCancel();
  };

  return (
    <Modal isOpen={!!tournament} onClose={onClose} title={registration ? "我的報名狀態" : "賽事詳情"}>
      <div className="space-y-6">
        
        {/* Header Info - Gold Theme */}
        <div className="text-center pb-4 border-b border-slate-800">
           <div className="text-gold text-xs font-bold uppercase tracking-widest mb-1 opacity-80">{clubName}</div>
           <h3 className="text-2xl font-bold text-white mb-2 font-display">{tournament.name}</h3>
           <div className="inline-flex items-center justify-center px-4 py-1 rounded-full bg-gold/10 border border-gold/30">
               <span className="text-gold font-mono text-xl font-bold glow-text">
                 ${totalCost.toLocaleString()}
               </span>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surfaceHighlight p-3 rounded-lg border border-slate-700">
             <div className="flex items-center gap-2 text-slate-400 text-xs mb-1 uppercase tracking-wider">
                <Coins size={14} />
                Starting Chips
             </div>
             <div className="text-white font-mono text-lg">{tournament.startingChips.toLocaleString()}</div>
          </div>
          <div className="bg-surfaceHighlight p-3 rounded-lg border border-slate-700">
             <div className="flex items-center gap-2 text-slate-400 text-xs mb-1 uppercase tracking-wider">
                <Users size={14} />
                Entries
             </div>
             <div className="text-white font-mono text-lg">{tournament.reservedCount} / {tournament.maxCap}</div>
          </div>
        </div>

        {/* Registration Actions or Status */}
        {registration ? (
            <div className="bg-surfaceHighlight p-4 rounded-xl border border-slate-700 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${registration.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
                        <Check size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-white">
                            {registration.status === 'paid' ? '報名成功' : '已預約席位'}
                        </div>
                        <div className="text-xs text-slate-400">
                            狀態: {registration.status === 'paid' ? '已付款 (線上扣款)' : '待繳費 (現場繳費)'}
                        </div>
                    </div>
                </div>

                {registration.status === 'reserved' && (
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-xs text-textMuted mb-2">
                        <p>💡 提示：您可以使用線上餘額直接完成報名，確保您的席位。</p>
                    </div>
                )}
                
                {registration.status === 'reserved' ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <Button 
                                type="button"
                                fullWidth 
                                variant="outline" 
                                onClick={handleCancelClick} 
                                className="text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500"
                            >
                                取消預約
                            </Button>
                            <Button 
                                type="button"
                                fullWidth 
                                variant="primary" 
                                onClick={handleBuyInClick}
                            >
                                確認報名
                            </Button>
                        </div>
                        {/* Display Balance as requested */}
                        <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-slate-800">
                             <span className="text-xs text-slate-400">可用餘額</span>
                             <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold text-sm ${canAfford ? 'text-gold' : 'text-red-500'}`}>
                                    ${currentBalance.toLocaleString()}
                                </span>
                                {!canAfford && <AlertTriangle size={12} className="text-red-500" />}
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                         <Button 
                            type="button"
                            fullWidth 
                            variant="outline" 
                            onClick={handleCancelClick} 
                            className="text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500"
                        >
                            <X size={16} className="mr-2" /> 取消報名
                        </Button>
                    </div>
                )}
            </div>
        ) : (
            <div className="space-y-3 pt-2">
                {isEnded ? (
                     <div className="bg-slate-800 p-4 rounded-lg text-slate-400 text-center text-sm border border-slate-700">
                        此賽事已結束
                    </div>
                ) : isFull ? (
                    <div className="bg-yellow-500/10 p-4 rounded-lg text-yellow-500 text-center text-sm border border-yellow-500/20">
                        此賽事名額已滿
                    </div>
                ) : (
                    <>
                        <Button 
                            type="button"
                            fullWidth 
                            variant="primary" 
                            onClick={handleBuyInClick}
                            className={`h-16 relative overflow-hidden ${!canAfford ? 'opacity-80 grayscale-[0.3]' : ''}`}
                        >
                            <div className="flex flex-col items-center justify-center w-full z-10">
                                <span className="text-base font-bold flex items-center gap-2 uppercase tracking-wide">
                                    <WalletIcon size={18} /> 立即報名
                                </span>
                                {canAfford ? (
                                     <span className="text-[10px] font-normal opacity-80 mt-0.5">
                                        扣除餘額 ${totalCost.toLocaleString()}
                                     </span>
                                ) : (
                                    <span className="text-[10px] font-bold text-red-100 bg-red-500/80 px-2 py-0.5 rounded mt-1 flex items-center gap-1 shadow-sm">
                                        <AlertTriangle size={10} /> 餘額不足 (${currentBalance.toLocaleString()})
                                    </span>
                                )}
                            </div>
                            {/* Shine effect */}
                            {canAfford && <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-white/20 skew-x-[-20deg] animate-[shimmer_2s_infinite]"></div>}
                        </Button>

                        <Button 
                            type="button"
                            fullWidth 
                            variant="secondary"
                            onClick={() => onRegister('reserve')}
                            className="h-12"
                        >
                            <div className="flex flex-col items-center w-full">
                                <span className="text-sm font-bold">預約席位 (現場繳費)</span>
                            </div>
                        </Button>
                    </>
                )}
            </div>
        )}

        {/* Structure Info */}
        <div className="border-t border-slate-800 pt-4">
           <div className="flex items-center gap-2 mb-3 text-gold">
              <Clock size={16} />
              <h4 className="font-bold text-sm tracking-wide">BLIND STRUCTURE</h4>
           </div>
           <div className="border border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                 <thead className="bg-slate-800 text-slate-400 text-xs uppercase">
                    <tr>
                       <th className="p-3 font-medium">Level</th>
                       <th className="p-3 font-medium">Blinds</th>
                       <th className="p-3 font-medium text-right">Duration</th>
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
      </div>
    </Modal>
  );
};
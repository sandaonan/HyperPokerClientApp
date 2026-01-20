import React from 'react';
import { Clock, Coins, Info, Users, Wallet as WalletIcon, Check, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Tournament, Wallet, Registration } from '../../types';

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
  const canAfford = userWallet ? userWallet.balance >= totalCost : false;
  const isFull = tournament.reservedCount >= tournament.maxCap;

  return (
    <Modal isOpen={!!tournament} onClose={onClose} title={registration ? "已報名資訊" : "賽事報名"}>
      <div className="space-y-6">
        
        {/* Header Info */}
        <div>
           <h3 className="text-xl font-bold text-white mb-1">{tournament.name}</h3>
           <p className="text-emerald-400 font-mono text-lg font-bold">
             ${tournament.buyIn.toLocaleString()} <span className="text-slate-500 text-sm font-normal">+ ${tournament.fee}</span>
           </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
             <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Coins size={14} />
                起始記分牌
             </div>
             <div className="text-white font-mono">{tournament.startingChips.toLocaleString()}</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
             <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Users size={14} />
                名額
             </div>
             <div className="text-white font-mono">{tournament.reservedCount} / {tournament.maxCap}</div>
          </div>
        </div>

        {/* Registration Actions or Status */}
        {registration ? (
            <div className="bg-surfaceHighlight p-4 rounded-xl border border-slate-700 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Check size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-white">您已在名單中</div>
                        <div className="text-xs text-slate-400">
                            狀態: {registration.status === 'paid' ? '已付款 (線上扣款)' : '已預約 (請至櫃檯繳費)'}
                        </div>
                    </div>
                </div>
                <Button fullWidth variant="outline" onClick={onCancel} className="text-red-400 border-red-500/30 hover:bg-red-500/10">
                    取消報名
                </Button>
            </div>
        ) : (
            <div className="space-y-3 pt-2">
                {isFull ? (
                    <div className="bg-yellow-500/10 p-3 rounded text-yellow-500 text-center text-sm">
                        此賽事名額已滿
                    </div>
                ) : (
                    <>
                        <Button 
                            fullWidth 
                            variant="primary" 
                            onClick={() => onRegister('buy-in')}
                            className="h-14"
                        >
                            <div className="flex flex-col items-start w-full">
                                <span className="text-sm font-bold flex items-center gap-2">
                                    <WalletIcon size={16} /> 立即報名 (扣除餘額)
                                </span>
                                <span className="text-[10px] opacity-80 font-normal">
                                    目前餘額: ${userWallet?.balance.toLocaleString() || 0}
                                    {!canAfford && <span className="text-red-800 font-bold ml-1">(餘額不足)</span>}
                                </span>
                            </div>
                        </Button>

                        <Button 
                            fullWidth 
                            variant="secondary"
                            onClick={() => onRegister('reserve')}
                            className="h-14"
                        >
                            <div className="flex flex-col items-start w-full">
                                <span className="text-sm font-bold">預約席位 (現場繳費)</span>
                                <span className="text-[10px] opacity-60 font-normal">
                                    僅保留名額，需於開賽前 30 分鐘報到
                                </span>
                            </div>
                        </Button>
                    </>
                )}
            </div>
        )}

        {/* Structure Info */}
        <div className="border-t border-slate-800 pt-4">
           <div className="flex items-center gap-2 mb-3 text-white">
              <Clock size={16} />
              <h4 className="font-bold text-sm">盲注結構</h4>
           </div>
           <div className="border border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                 <thead className="bg-slate-800 text-slate-400 text-xs uppercase">
                    <tr>
                       <th className="p-3 font-medium">級別</th>
                       <th className="p-3 font-medium">盲注</th>
                       <th className="p-3 font-medium text-right">時長</th>
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
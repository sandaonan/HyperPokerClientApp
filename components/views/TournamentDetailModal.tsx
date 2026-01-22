
import React, { useEffect, useState } from 'react';
import { Clock, Coins, Users, Wallet as WalletIcon, Check, AlertTriangle, X, Megaphone, Info, Trophy, Calendar, ShieldCheck, Lock, ExternalLink, List } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tournament, Wallet, Registration } from '../../types';
import { SEED_CLUBS } from '../../constants';
import { mockApi } from '../../services/mockApi';
import { useAlert } from '../../contexts/AlertContext';

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
  const { showAlert, showConfirm } = useAlert();
  // State for fetching player list
  const [playerList, setPlayerList] = useState<Registration[]>([]);
  const [listTab, setListTab] = useState<'reserved' | 'paid'>('reserved');

  useEffect(() => {
      if (tournament) {
          // If it's a history/mock ended tournament, we might not get real API results.
          mockApi.getTournamentRegistrations(tournament.id).then((regs) => {
              setPlayerList(regs);
              
              const startTimeObj = new Date(tournament.startTime);
              const isEnded = startTimeObj.getTime() < new Date().getTime();
              
              if (isEnded || tournament.isLateRegEnded) {
                  setListTab('paid');
              } else {
                  setListTab('reserved');
              }
          });
      }
  }, [tournament]);

  if (!tournament) return null;

  const totalCost = tournament.buyIn + tournament.fee;
  const currentBalance = userWallet ? userWallet.balance : 0;
  const canAfford = currentBalance >= totalCost;
  const isFull = tournament.reservedCount >= tournament.maxCap;
  const startTimeObj = new Date(tournament.startTime);
  const isEnded = startTimeObj.getTime() < new Date().getTime();
  const isClosed = tournament.isLateRegEnded; // Specifically for registration logic
  const clubName = SEED_CLUBS.find(c => c.id === tournament.clubId)?.name || 'Club Event';

  // Calculate Total Duration for End Time Display
  const totalDurationMinutes = tournament.structure.reduce((acc, curr) => acc + curr.duration, 0);
  const endTimeObj = new Date(startTimeObj.getTime() + totalDurationMinutes * 60000 + (30 * 60000)); // Add 30 mins buffer for breaks

  const reservedList = isEnded ? [] : playerList.filter(r => r.status === 'reserved');
  // Logic: First 'maxCap' people are Main, rest are Waitlist
  const mainReservedList = reservedList.slice(0, tournament.maxCap);
  const waitingList = reservedList.slice(tournament.maxCap);

  let paidPlayers = playerList.filter(r => r.status === 'paid');
  
  if (isEnded && paidPlayers.length === 0 && registration && registration.status === 'paid') {
      paidPlayers = [registration];
  }

  const handleBuyInClick = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!canAfford) {
          // Button is disabled, but just in case
          return;
      }
      
      const confirmed = await showConfirm(
          "確認報名",
          `您即將使用儲值金餘額報名。\n將扣除: $${totalCost.toLocaleString()}\n\n注意：使用線上金流報名後，如需取消，報名費 (Fee) 恕不退還。\n\n是否確定報名？`
      );

      if (confirmed) {
          onRegister('buy-in');
      }
  };

  const handleReserveClick = async () => {
      // If full, warn about waitlist
      if (isFull) {
          const confirmed = await showConfirm(
              "加入候補名單",
              "目前賽事名額已滿。您確定要加入候補名單嗎？\n\n若有名額釋出，將依照預約順序遞補。"
          );
          if(confirmed) onRegister('reserve');
      } else {
          onRegister('reserve');
      }
  };

  const handleCancelClick = async (e: React.MouseEvent) => {
     e.preventDefault();
     e.stopPropagation();
     onCancel();
  };

  let accumulatedMinutes = 0;
  
  return (
    <Modal isOpen={!!tournament} onClose={onClose} title={isEnded ? "賽事回顧" : (registration ? "我的報名狀態" : "賽事詳情")}>
      <div className="space-y-6">
        
        {/* Header Info */}
        <div className="text-center pb-4 border-b border-slate-800 relative">
           <Badge className="mb-2 bg-purple-500/20 text-purple-300 border-purple-500/30">{tournament.type}</Badge>
           <div className="text-gold text-xs font-bold uppercase tracking-widest mb-1 opacity-80 mt-1">{clubName}</div>
           <h3 className="text-2xl font-bold text-white mb-2 font-display">{tournament.name}</h3>
           
           {isEnded ? (
               <div className="flex flex-col gap-1 items-center justify-center mt-3 bg-surfaceHighlight/50 p-2 rounded-lg border border-slate-700">
                   <div className="flex items-center gap-2 text-sm text-slate-300">
                       <Calendar size={14} className="text-gold" />
                       <span>{startTimeObj.toLocaleDateString()}</span>
                   </div>
                   <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                       <Clock size={12} />
                       {startTimeObj.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {endTimeObj.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} (預估)
                   </div>
               </div>
           ) : (
               <div className="inline-flex items-center justify-center px-4 py-1 rounded-full bg-gold/10 border border-gold/30 mt-1">
                    <span className="text-gold font-mono text-xl font-bold glow-text">
                        ${totalCost.toLocaleString()}
                    </span>
               </div>
           )}

           {/* Watch Clock Link */}
           {tournament.clockUrl && !isEnded && (
               <div className="mt-3">
                   <a 
                     href={tournament.clockUrl} 
                     target="_blank" 
                     rel="noreferrer"
                     className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors border border-slate-700 px-3 py-1.5 rounded-full hover:bg-slate-800"
                   >
                       <ExternalLink size={12} /> 📺 觀看賽事時鐘
                   </a>
               </div>
           )}
        </div>

        {/* Promotion / Announcement Block */}
        {tournament.promotionNote && !isEnded && (
            <div className="bg-amber-500/5 border-l-2 border-amber-500 p-3 rounded-r-lg">
                <div className="flex items-center gap-2 text-amber-500 mb-1">
                    <Megaphone size={14} />
                    <span className="text-xs font-bold uppercase">賽事公告 / 優惠</span>
                </div>
                <p className="text-sm text-amber-100/90 whitespace-pre-line leading-relaxed">
                    {tournament.promotionNote}
                </p>
            </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surfaceHighlight p-3 rounded-lg border border-slate-700">
             <div className="flex items-center gap-2 text-slate-400 text-xs mb-1 uppercase tracking-wider">
                <Coins size={14} />
                起始籌碼
             </div>
             <div className="text-white font-mono text-lg">{tournament.startingChips.toLocaleString()}</div>
          </div>
          <div className="bg-surfaceHighlight p-3 rounded-lg border border-slate-700">
             <div className="flex items-center gap-2 text-slate-400 text-xs mb-1 uppercase tracking-wider">
                <Users size={14} />
                {isEnded ? "總參賽人數" : "目前參賽"}
             </div>
             <div className={`font-mono text-lg ${tournament.reservedCount > tournament.maxCap ? 'text-danger' : 'text-white'}`}>
                 {isEnded ? tournament.reservedCount : `${tournament.reservedCount} / ${tournament.maxCap}`}
             </div>
          </div>
        </div>

        {/* Player List Section */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-surfaceHighlight/30">
             <div className="flex border-b border-slate-800">
                 {!isEnded && (
                     <button 
                        onClick={() => setListTab('reserved')}
                        className={`flex-1 py-2 text-xs font-bold transition-colors ${listTab === 'reserved' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                     >
                        已預約 ({reservedList.length})
                     </button>
                 )}
                 <button 
                    onClick={() => setListTab('paid')}
                    className={`flex-1 py-2 text-xs font-bold transition-colors ${listTab === 'paid' ? 'bg-emerald-900/40 text-emerald-400' : 'text-slate-400 hover:bg-slate-800'}`}
                 >
                    {isEnded ? `已參賽玩家` : `已報名繳費 (${paidPlayers.length})`}
                 </button>
             </div>
             <div className="p-3 max-h-56 overflow-y-auto">
                 {listTab === 'reserved' && !isEnded ? (
                     reservedList.length > 0 ? (
                         <div className="space-y-3">
                             {/* Main List */}
                             <div className="text-xs text-slate-500 font-bold uppercase mb-1">正選名單 ({mainReservedList.length} / {tournament.maxCap})</div>
                             <div className="grid grid-cols-2 gap-2">
                                 {mainReservedList.map((p, idx) => {
                                     const isMe = userWallet && p.userId === userWallet.userId;
                                     return (
                                         <div key={p.id} className={`flex items-center gap-2 text-xs p-1.5 rounded ${isMe ? 'bg-gold/20 border border-gold/30 text-gold font-bold' : 'text-slate-400 bg-slate-900/50'}`}>
                                             <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">{idx + 1}</span>
                                             <span>ID: {p.userLocalId}</span>
                                             {isMe && <span className="ml-auto text-[10px]">(我)</span>}
                                         </div>
                                     );
                                 })}
                             </div>
                             
                             {/* Waiting List */}
                             {waitingList.length > 0 && (
                                 <div className="pt-2 border-t border-slate-800/50">
                                     <div className="text-xs text-red-400 font-bold uppercase mb-1 flex items-center gap-1">
                                         <List size={12} /> 候補名單 ({waitingList.length})
                                     </div>
                                     <div className="grid grid-cols-2 gap-2">
                                         {waitingList.map((p, idx) => {
                                             const isMe = userWallet && p.userId === userWallet.userId;
                                             return (
                                                 <div key={p.id} className={`flex items-center gap-2 text-xs p-1.5 rounded ${isMe ? 'bg-red-500/20 border border-red-500/30 text-red-300 font-bold' : 'text-slate-500 bg-slate-900/30 dashed-border border-slate-800'}`}>
                                                     <span className="w-5 h-5 rounded-full bg-red-900/30 flex items-center justify-center text-[10px] text-red-400">W{idx + 1}</span>
                                                     <span>ID: {p.userLocalId}</span>
                                                     {isMe && <span className="ml-auto text-[10px]">(我)</span>}
                                                 </div>
                                             );
                                         })}
                                     </div>
                                 </div>
                             )}
                         </div>
                     ) : <p className="text-center text-xs text-slate-500 py-2">尚無預約</p>
                 ) : (
                     paidPlayers.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                            {paidPlayers.map((p, idx) => {
                                const isMe = (userWallet && p.userId === userWallet.userId) || (registration && p.userId === registration.userId);
                                return (
                                    <div key={p.id} className={`flex items-center gap-2 text-xs p-1.5 rounded ${isMe ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold' : 'text-slate-400 bg-slate-900/50'}`}>
                                        <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">{idx + 1}</span>
                                        <span>ID: {p.userLocalId || '888'}</span>
                                        {isMe && <span className="ml-auto text-[10px]">(我)</span>}
                                    </div>
                                );
                            })}
                        </div>
                    ) : <p className="text-center text-xs text-slate-500 py-2">尚無資料</p>
                 )}
             </div>
        </div>

        {/* Action Buttons */}
        {isEnded ? (
             <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                 <Trophy size={24} className="mx-auto text-gold mb-2 opacity-50" />
                 <p className="text-slate-400 text-sm">此賽事已結束</p>
                 {registration && (
                     <p className="text-emerald-400 text-xs mt-1">您已參與此賽事</p>
                 )}
             </div>
        ) : registration ? (
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

                {registration.status === 'reserved' ? (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <Button 
                                type="button" fullWidth variant="outline" 
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
                                disabled={!canAfford}
                                className={!canAfford ? 'opacity-50' : ''}
                            >
                                確認報名
                            </Button>
                        </div>
                        <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-slate-800">
                             <span className="text-xs text-slate-400">儲值金餘額</span>
                             <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold text-sm ${canAfford ? 'text-gold' : 'text-red-500'}`}>
                                    ${currentBalance.toLocaleString()}
                                </span>
                                {!canAfford && <AlertTriangle size={12} className="text-red-500" />}
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 flex items-center gap-2">
                         <ShieldCheck size={16} className="text-emerald-500" />
                         <span className="text-xs text-slate-400">已完成報名，如需異動請洽櫃檯。</span>
                    </div>
                )}
            </div>
        ) : (
            <div className="space-y-3 pt-2">
                {isClosed ? (
                     <div className="bg-slate-800 p-4 rounded-lg text-slate-400 text-center text-sm border border-slate-700 flex flex-col items-center gap-2">
                         <Lock size={16} />
                         <span>此賽事已截止報名</span>
                     </div>
                ) : (
                    <>
                        <Button type="button" fullWidth variant="secondary" onClick={handleReserveClick} className="h-12 border-amber-500/50 text-amber-500 hover:bg-amber-500/10">
                            <span className="text-base font-bold">
                                {isFull ? "加入候補 (Join Waitlist)" : "預約"}
                            </span>
                        </Button>
                        {isFull && <div className="text-center text-[10px] text-slate-500">* 目前名額已滿，您將被列入候補名單。</div>}
                    </>
                )}
            </div>
        )}

        {/* Structure Info */}
        <div className="border-t border-slate-800 pt-4">
           <div className="flex items-center gap-2 mb-3 text-gold">
              <Clock size={16} />
              <h4 className="font-bold text-sm tracking-wide">盲注結構表 (STRUCTURE)</h4>
           </div>
           <div className="border border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                 <thead className="bg-slate-800 text-slate-400 text-xs uppercase">
                    <tr>
                       <th className="p-3 font-medium w-12">級別</th>
                       <th className="p-3 font-medium">盲注 (SB/BB)</th>
                       <th className="p-3 font-medium">前注 (Ante)</th>
                       <th className="p-3 font-medium text-right">時間</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                    {tournament.structure?.map((level) => {
                       accumulatedMinutes += level.duration;
                       const isCutoff = level.level === tournament.lateRegLevel;
                       
                       const cutoffTime = new Date(startTimeObj.getTime() + (accumulatedMinutes * 60000));
                       const cutoffStr = cutoffTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                       return (
                           <React.Fragment key={level.level}>
                               <tr className={isCutoff ? 'bg-red-900/10' : ''}>
                                  <td className="p-3 text-slate-500 text-center">{level.level}</td>
                                  <td className="p-3 text-white font-mono">{level.smallBlind.toLocaleString()}/{level.bigBlind.toLocaleString()}</td>
                                  <td className="p-3 text-slate-400 font-mono">{level.ante > 0 ? level.ante : '-'}</td>
                                  <td className="p-3 text-slate-400 text-right">{level.duration}m</td>
                               </tr>
                               {isCutoff && (
                                   <tr className="bg-red-500/10 border-t border-b border-red-500/20">
                                       <td colSpan={4} className="p-2 text-center text-xs text-red-400 font-bold">
                                           🛑 截止買入 (Cut-off) - 時間約 {cutoffStr}
                                       </td>
                                   </tr>
                               )}
                           </React.Fragment>
                       );
                    })}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </Modal>
  );
};

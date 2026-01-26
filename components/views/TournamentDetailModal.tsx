
import React, { useEffect, useState } from 'react';
import { Clock, Coins, Users, Wallet as WalletIcon, Check, AlertTriangle, X, Megaphone, Info, Trophy, Calendar, ShieldCheck, Lock, ExternalLink, List, Store, Hourglass, ChevronDown, ChevronUp } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Tournament, Wallet, Registration } from '../../types';
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
  const [isPromoExpanded, setIsPromoExpanded] = useState(false);

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

  // Calculate Total Duration
  const totalDurationMinutes = tournament.structure.reduce((acc, curr) => acc + curr.duration, 0);
  const durationHours = Math.floor(totalDurationMinutes / 60);
  const durationMinsRemainder = totalDurationMinutes % 60;
  const durationStr = `${durationHours}hr${durationMinsRemainder > 0 ? ` ${durationMinsRemainder}m` : ''}`;
  
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
      
      if (isFull) {
          await showAlert("候補中", "目前賽事名額已滿，請等待名額釋出後再進行報名。");
          return;
      }

      if (!canAfford) return;
      
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

  // Rule Parsing
  const promoLines = tournament.promotionNote ? tournament.promotionNote.split('\n') : [];
  const displayLines = isPromoExpanded ? promoLines : promoLines.slice(0, 3);
  const hasMoreLines = promoLines.length > 3;

  let accumulatedMinutes = 0;
  
  return (
    <Modal isOpen={!!tournament} onClose={onClose} title="賽事詳情">
      <div className="space-y-6">
        
        {/* New Header Layout */}
        <div className="relative pb-2 border-b border-slate-800 text-center">
           {/* Center Top: Tournament Title */}
           <h3 className="text-2xl font-bold text-white font-display leading-tight px-2">
               {tournament.name}
           </h3>
           {/* Below Title: Badge */}
           <div className="flex justify-center mt-2">
               <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-3 py-0.5">
                   {tournament.type}
               </Badge>
           </div>
           
           <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
               <Calendar size={12} className="text-gold" />
               <span>{startTimeObj.toLocaleDateString()}</span>
               <span className="text-slate-600">|</span>
               <Clock size={12} className="text-gold" />
               <span className="font-mono">{startTimeObj.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
           </div>
        </div>

        {/* 3-Column Info Grid */}
        <div className="grid grid-cols-3 gap-2">
          {/* Col 1: Price */}
          <div className="bg-surfaceHighlight p-2.5 rounded-lg border border-slate-700 flex flex-col items-center justify-center text-center">
             <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1 uppercase tracking-wider">
                <WalletIcon size={12} className="text-gold" />
                參賽費用
             </div>
             <div className="text-gold font-mono text-base font-bold">${totalCost.toLocaleString()}</div>
          </div>
          
          {/* Col 2: Stack */}
          <div className="bg-surfaceHighlight p-2.5 rounded-lg border border-slate-700 flex flex-col items-center justify-center text-center">
             <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1 uppercase tracking-wider">
                <Coins size={12} className="text-gold" />
                起始計分牌
             </div>
             <div className="text-white font-mono text-base font-bold">{tournament.startingChips.toLocaleString()}</div>
          </div>

          {/* Col 3: Duration */}
          <div className="bg-surfaceHighlight p-2.5 rounded-lg border border-slate-700 flex flex-col items-center justify-center text-center">
             <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1 uppercase tracking-wider">
                <Hourglass size={12} className="text-blue-400" />
                比賽時長
             </div>
             <div className="text-white font-mono text-base font-bold">{durationStr}</div>
          </div>
        </div>

        {/* Collapsible Promotion / Announcement Block */}
        {promoLines.length > 0 && (
            <div className="bg-amber-500/5 border-l-2 border-amber-500 rounded-r-lg overflow-hidden transition-all duration-300">
                <div className="flex items-center justify-between p-3 pb-2">
                    <div className="flex items-center gap-2 text-amber-500">
                        <Megaphone size={14} />
                        <span className="text-xs font-bold uppercase">賽事公告與規則</span>
                    </div>
                </div>
                
                <div className="px-3 pb-3">
                    <div className="text-xs text-amber-100/80 whitespace-pre-line leading-relaxed pl-1">
                        {displayLines.map((line, idx) => (
                            <div key={idx}>{line}</div>
                        ))}
                    </div>
                    {hasMoreLines && (
                        <button 
                            onClick={() => setIsPromoExpanded(!isPromoExpanded)}
                            className="w-full flex items-center justify-center gap-1 text-[10px] text-amber-500/60 hover:text-amber-500 mt-2 pt-2 border-t border-amber-500/10"
                        >
                            {isPromoExpanded ? (
                                <><ChevronUp size={10} /> 收起規則</>
                            ) : (
                                <><ChevronDown size={10} /> 展開完整規則</>
                            )}
                        </button>
                    )}
                </div>
            </div>
        )}

        {/* Player List Section & Actions */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-surfaceHighlight/30">
             {/* Header with Total Count */}
             <div className="bg-slate-900/50 p-3 flex justify-between items-center border-b border-slate-800">
                 <div className="flex items-center gap-2">
                     <Users size={14} className="text-slate-400" />
                     <span className="text-sm font-bold text-slate-200">目前參賽</span>
                 </div>
                 <div className={`font-mono text-sm font-bold ${tournament.reservedCount >= tournament.maxCap ? 'text-danger' : 'text-white'}`}>
                     {isEnded ? tournament.reservedCount : `${tournament.reservedCount} / ${tournament.maxCap}`}
                     <span className="text-xs text-slate-500 font-normal ml-1">人</span>
                 </div>
             </div>

             <div className="flex border-b border-slate-800">
                 {!isEnded && (
                     <button 
                        onClick={() => setListTab('reserved')}
                        className={`flex-1 py-2 text-xs font-bold transition-colors ${listTab === 'reserved' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                     >
                        預約名單 ({reservedList.length})
                     </button>
                 )}
                 <button 
                    onClick={() => setListTab('paid')}
                    className={`flex-1 py-2 text-xs font-bold transition-colors ${listTab === 'paid' ? 'bg-emerald-900/40 text-emerald-400' : 'text-slate-400 hover:bg-slate-800'}`}
                 >
                    {isEnded ? `參賽名單` : `已繳費 (${paidPlayers.length})`}
                 </button>
             </div>

             <div className="p-3 max-h-48 overflow-y-auto">
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

             {/* Integrated Action Area in Footer of Player List */}
             <div className="border-t border-slate-800 p-4 bg-slate-900/80">
                {isEnded ? (
                    <div className="text-center">
                        <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
                            <Trophy size={14} className="text-gold" /> 此賽事已結束
                        </p>
                    </div>
                ) : registration ? (
                    // Registered State
                    <div className="space-y-3">
                        {registration.status === 'reserved' ? (
                            <>
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
                                        disabled={!canAfford || isFull}
                                        className={(!canAfford || isFull) ? 'opacity-50' : ''}
                                    >
                                        {isFull ? "候補中 (等待名額)" : "確認報名"}
                                    </Button>
                                </div>
                                {/* Weakened Wallet Display */}
                                <div className="flex justify-between items-center px-1">
                                     <span className="text-xs text-slate-500">儲值金餘額</span>
                                     <div className="flex items-center gap-2">
                                        <span className={`font-mono font-bold text-xs ${canAfford ? 'text-slate-300' : 'text-red-500'}`}>
                                            ${currentBalance.toLocaleString()}
                                        </span>
                                        {!canAfford && <AlertTriangle size={12} className="text-red-500" />}
                                     </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center gap-2 py-2 text-emerald-400 text-sm font-bold">
                                <ShieldCheck size={16} /> 已完成報名
                            </div>
                        )}
                    </div>
                ) : (
                    // Unregistered State
                    <div className="space-y-2">
                         {isClosed ? (
                             <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                                 <Lock size={14} /> 報名已截止
                             </div>
                         ) : (
                            <>
                                <Button type="button" fullWidth variant="secondary" onClick={handleReserveClick} className="h-10 border-amber-500/50 text-amber-500 hover:bg-amber-500/10">
                                    <span className="text-sm font-bold">
                                        {isFull ? "加入候補 (Join Waitlist)" : "預約席位"}
                                    </span>
                                </Button>
                                {isFull && <div className="text-center text-[10px] text-slate-500">* 目前名額已滿，您將被列入候補名單。</div>}
                            </>
                         )}
                    </div>
                )}
             </div>
        </div>

        {/* Watch Clock Link */}
        {tournament.clockUrl && !isEnded && (
            <a 
                href={tournament.clockUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-surfaceHighlight border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:border-slate-500 transition-all shadow-sm group"
            >
                <ExternalLink size={16} className="text-gold group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm">觀看賽事時鐘 (Tournament Clock)</span>
            </a>
        )}

        {/* Structure Info */}
        <div className="pt-2">
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

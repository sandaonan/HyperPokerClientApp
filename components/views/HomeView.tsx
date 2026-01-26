
import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, Search, Loader2, AlertTriangle, UserCheck, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Header } from '../ui/Header';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SEED_CLUBS } from '../../constants';
import { Club, Wallet } from '../../types';
import { mockApi } from '../../services/mockApi';
import { useAlert } from '../../contexts/AlertContext';

interface HomeViewProps {
  onSelectClub: (club: Club) => void;
  onJoinNew: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectClub }) => {
  const { showAlert } = useAlert();
  const [joinedClubs, setJoinedClubs] = useState<Club[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  // Join Modal State
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [availableClubs, setAvailableClubs] = useState<Club[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Verification Alert Modal
  const [showVerifyAlert, setShowVerifyAlert] = useState(false);

  const fetchMyClubs = async () => {
      const userId = localStorage.getItem('hp_session_user_id');
      if (!userId) return;

      const allWallets: Wallet[] = JSON.parse(localStorage.getItem('hp_wallets') || '[]');
      const myWallets = allWallets.filter(w => w.userId === userId && w.status !== 'banned');
      
      const myClubIds = myWallets.map(w => w.clubId);
      const myClubs = SEED_CLUBS.filter(c => myClubIds.includes(c.id));
      
      setJoinedClubs(myClubs);
      setWallets(myWallets); 
      setLoading(false);
  };

  useEffect(() => {
      fetchMyClubs();
      const interval = setInterval(fetchMyClubs, 3000);
      return () => clearInterval(interval);
  }, []);

  const handleOpenJoinModal = () => {
      const activeClubIds = joinedClubs.map(c => c.id);
      const others = SEED_CLUBS.filter(c => !activeClubIds.includes(c.id));
      setAvailableClubs(others);
      setShowJoinModal(true);
  };

  const handleApplyJoin = async (e: React.MouseEvent, clubId: string) => {
      e.stopPropagation(); 
      const userId = localStorage.getItem('hp_session_user_id');
      if (!userId) return;
      
      setProcessingId(clubId);
      try {
          await mockApi.joinClub(userId, clubId);
          await showAlert("申請成功", "系統將自動進行審核 (約需 8 秒)。\n審核通過後，若您資料未經驗證，請至櫃檯進行身份核對。");
          fetchMyClubs(); 
          setShowJoinModal(false);
      } catch (e: any) {
          await showAlert("錯誤", e.message);
      } finally {
          setProcessingId(null);
      }
  };

  const handleClubClick = (club: Club) => {
      onSelectClub(club);
  };

  const handleWarningClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowVerifyAlert(true);
  };

  const renderClubCard = (club: Club) => {
      const wallet = wallets.find(w => w.clubId === club.id);
      const isPending = wallet?.status === 'pending';
      const isApplying = wallet?.status === 'applying';

      return (
        <Card 
            key={club.id} 
            onClick={() => handleClubClick(club)}
            className={`group relative overflow-hidden transition-all duration-300 hover:shadow-amber-500/10 hover:border-amber-500/50 ${isPending || isApplying ? 'border-slate-600 border-dashed bg-surfaceHighlight/50' : ''}`}
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full -mr-8 -mt-8 pointer-events-none" />

            {isPending && (
                <div 
                    onClick={handleWarningClick}
                    className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 px-2 py-1 rounded-full text-xs font-bold border border-yellow-500/40 cursor-pointer animate-pulse"
                >
                    <AlertTriangle size={12} /> 需驗證身份
                </div>
            )}

            {isApplying && (
                <div 
                    className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs font-bold border border-blue-500/40"
                >
                    <Clock size={12} /> 申請審核中
                </div>
            )}

            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-gold transition-colors font-display tracking-wide">
                  {club.name}
                </h3>
                <span className="text-xs text-textMuted font-mono">ID: {club.localId}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-textMuted">
                <span>{club.description?.substring(0, 20)}...</span>
                <span className="whitespace-nowrap group-hover:translate-x-1 transition-transform text-white flex items-center gap-1 text-xs uppercase tracking-widest font-bold text-gold">
                    進入協會 <ChevronRight size={14} />
                </span>
            </div>
        </Card>
      );
  };

  return (
    <div className="space-y-6 pb-20">
      <Header />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white font-display">協會</h2>
          {/* Subtitle removed as requested */}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
             <div className="text-center py-10 text-textMuted">載入中...</div>
        ) : joinedClubs.length > 0 ? (
             joinedClubs.map(renderClubCard)
        ) : (
            <div className="text-center py-12 bg-surfaceHighlight/30 rounded-2xl border border-dashed border-slate-700">
                <p className="text-slate-500">您尚未加入任何協會</p>
            </div>
        )}
      </div>
      
      <div className="mt-8 pt-8 border-t border-slate-800 text-center">
        <p className="text-sm text-textMuted mb-4">尋找新的戰場？</p>
        <button 
          onClick={handleOpenJoinModal}
          className="w-full py-4 border border-dashed border-amber-600/30 bg-amber-600/5 rounded-xl text-amber-500 hover:text-amber-400 hover:border-amber-500 hover:bg-amber-600/10 transition-all flex items-center justify-center gap-2 font-bold tracking-wide"
        >
          <Search size={16} />
          加入新協會
        </button>
      </div>

      {/* Join Club Modal */}
      <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} title="探索協會">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {availableClubs.length > 0 ? (
                  availableClubs.map(club => {
                      return (
                        <div 
                            key={club.id} 
                            onClick={() => {
                                setShowJoinModal(false);
                                onSelectClub(club);
                            }}
                            className="bg-surfaceHighlight p-4 rounded-xl border border-slate-700 cursor-pointer hover:bg-surfaceHighlight/80 hover:border-slate-500 transition-all"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-white">{club.name}</h3>
                                    {/* Removed Tier Badge as requested */}
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-500">ID: {club.localId}</span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 mb-4 line-clamp-2">{club.description}</p>
                            
                            <Button 
                                fullWidth 
                                size="sm" 
                                variant="primary"
                                onClick={(e) => handleApplyJoin(e, club.id)}
                                disabled={!!processingId}
                            >
                                {processingId === club.id ? (
                                    <Loader2 className="animate-spin" size={14} /> 
                                ) : (
                                    '申請加入'
                                )}
                            </Button>
                        </div>
                      );
                  })
              ) : (
                  <p className="text-center text-slate-500 py-8">目前沒有可加入的協會</p>
              )}
          </div>
      </Modal>

      {/* Verification Explanation Modal */}
      <Modal isOpen={showVerifyAlert} onClose={() => setShowVerifyAlert(false)} title="需要身份驗證">
         <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto text-yellow-500">
                <UserCheck size={32} />
            </div>
            <h3 className="text-lg font-bold text-white">您的會籍尚未啟用</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
                可能的原因：<br/>
                1. 您剛申請加入此協會（需至櫃檯開通）。<br/>
                2. 您近期修改了個人檔案資料（需重新核對）。
            </p>
            <div className="bg-slate-800 p-4 rounded-lg text-sm text-slate-300 text-left border border-slate-700">
                <p className="font-bold mb-2 text-white">如何解決？</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>請攜帶身份證件前往該協會櫃檯。</li>
                    <li>工作人員核對資料無誤後，將為您啟用報名權限。</li>
                </ul>
            </div>
            <Button fullWidth onClick={() => setShowVerifyAlert(false)}>了解</Button>
         </div>
      </Modal>
    </div>
  );
};

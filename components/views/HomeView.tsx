import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, Search, Loader2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Header } from '../ui/Header';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SEED_CLUBS } from '../../constants';
import { Club, Wallet } from '../../types';
import { mockApi } from '../../services/mockApi';

interface HomeViewProps {
  onSelectClub: (club: Club) => void;
  onJoinNew: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectClub }) => {
  const [joinedClubs, setJoinedClubs] = useState<Club[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  // Join Modal State
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [availableClubs, setAvailableClubs] = useState<Club[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchMyClubs = async () => {
      const userId = localStorage.getItem('hp_session_user_id');
      if (!userId) return;

      const allWallets: Wallet[] = JSON.parse(localStorage.getItem('hp_wallets') || '[]');
      const myWallets = allWallets.filter(w => w.userId === userId);
      
      // Filter for ACTIVE clubs only for the main dashboard
      const activeClubIds = myWallets.filter(w => w.status === 'active').map(w => w.clubId);
      const myActiveClubs = SEED_CLUBS.filter(c => activeClubIds.includes(c.id));
      
      setJoinedClubs(myActiveClubs);
      setWallets(myWallets); // Keep all wallets (active & pending) to check status later
      setLoading(false);
  };

  useEffect(() => {
      fetchMyClubs();
  }, []);

  const handleOpenJoinModal = () => {
      // Logic: Show clubs that are NOT 'active'. This includes Pending and Not Joined.
      const activeClubIds = joinedClubs.map(c => c.id);
      const others = SEED_CLUBS.filter(c => !activeClubIds.includes(c.id));
      setAvailableClubs(others);
      setShowJoinModal(true);
  };

  const handleApplyJoin = async (clubId: string) => {
      const userId = localStorage.getItem('hp_session_user_id');
      if (!userId) return;
      
      setProcessingId(clubId);
      try {
          await mockApi.joinClub(userId, clubId);
          alert("申請成功！您的會籍正在審核中。");
          fetchMyClubs(); // Refresh list
          // Re-calculate available clubs to show the new pending status immediately
          const activeClubIds = joinedClubs.map(c => c.id);
          const others = SEED_CLUBS.filter(c => !activeClubIds.includes(c.id));
          setAvailableClubs(others);
          
      } catch (e: any) {
          alert(e.message);
      } finally {
          setProcessingId(null);
      }
  };

  const renderClubCard = (club: Club) => {
      return (
        <Card 
            key={club.id} 
            onClick={() => onSelectClub(club)}
            className="group relative overflow-hidden transition-all duration-300 hover:shadow-amber-500/10 hover:border-amber-500/50"
        >
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full -mr-8 -mt-8 pointer-events-none" />

            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-gold transition-colors font-display tracking-wide">
                  {club.name}
                </h3>
                <span className="text-xs text-textMuted font-mono">ID: {club.localId}</span>
              </div>
              {/* Removed Tier Badge as requested */}
            </div>

            <div className="flex items-center justify-between text-sm text-textMuted">
                <span>{club.description?.substring(0, 20)}...</span>
                <span className="group-hover:translate-x-1 transition-transform text-white flex items-center gap-1 text-xs uppercase tracking-widest font-bold text-gold">
                    進入俱樂部 <ChevronRight size={14} />
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
          <h2 className="text-xl font-bold text-white font-display">我的俱樂部</h2>
          <p className="text-sm text-textMuted">您的專屬競技場</p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
             <div className="text-center py-10 text-textMuted">載入中...</div>
        ) : joinedClubs.length > 0 ? (
             joinedClubs.map(renderClubCard)
        ) : (
            <div className="text-center py-12 bg-surfaceHighlight/30 rounded-2xl border border-dashed border-slate-700">
                <p className="text-slate-500">您尚未加入任何俱樂部</p>
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
          加入新俱樂部
        </button>
      </div>

      {/* Join Club Modal */}
      <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} title="探索俱樂部">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {availableClubs.length > 0 ? (
                  availableClubs.map(club => {
                      // Check if there is a pending wallet for this club
                      const wallet = wallets.find(w => w.clubId === club.id);
                      const isPending = wallet?.status === 'pending';

                      return (
                        <div key={club.id} className="bg-surfaceHighlight p-4 rounded-xl border border-slate-700">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-white">{club.name}</h3>
                                    <Badge className="mt-1" variant="outline">{club.tier}</Badge>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-500">ID: {club.localId}</span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 mb-4 line-clamp-2">{club.description}</p>
                            
                            <Button 
                                fullWidth 
                                size="sm" 
                                variant={isPending ? "secondary" : "primary"}
                                onClick={() => !isPending && handleApplyJoin(club.id)}
                                disabled={!!processingId || isPending}
                                className={isPending ? "opacity-70 cursor-not-allowed border-yellow-500/30 text-yellow-500" : ""}
                            >
                                {processingId === club.id ? (
                                    <Loader2 className="animate-spin" size={14} /> 
                                ) : isPending ? (
                                    '審核中'
                                ) : (
                                    '申請加入'
                                )}
                            </Button>
                        </div>
                      );
                  })
              ) : (
                  <p className="text-center text-slate-500 py-8">目前沒有可加入的俱樂部</p>
              )}
          </div>
      </Modal>
    </div>
  );
};
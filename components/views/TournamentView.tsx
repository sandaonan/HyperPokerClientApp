import React, { useState, useEffect } from 'react';
import { Clock, Users, ArrowLeft, AlertCircle, Check, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { TOURNAMENTS } from '../../constants';
import { User, Tournament } from '../../types';
import { TournamentDetailModal } from './TournamentDetailModal';

interface TournamentViewProps {
  user: User;
  registeredIds: string[];
  onRegister: (id: string) => void;
  onBack: () => void;
  onNavigateProfile: () => void;
}

export const TournamentView: React.FC<TournamentViewProps> = ({ user, registeredIds, onRegister, onBack, onNavigateProfile }) => {
  const [now, setNow] = useState(new Date());
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [detailTournament, setDetailTournament] = useState<Tournament | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (targetDate: string) => {
    const diff = new Date(targetDate).getTime() - now.getTime();
    if (diff <= 0) return "Started";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleReserveClick = (e: React.MouseEvent, tournament: Tournament) => {
    e.stopPropagation(); // Prevent opening the detail view
    if (!user.isProfileComplete) {
      setShowWarning(true);
      return;
    }
    setSelectedTournament(tournament);
  };

  const confirmReservation = () => {
    if (selectedTournament) {
        onRegister(selectedTournament.id);
        setSelectedTournament(null);
    }
  };

  // Grouping logic
  const myEntries = TOURNAMENTS.filter(t => registeredIds.includes(t.id));
  const otherTournaments = TOURNAMENTS.filter(t => !registeredIds.includes(t.id));

  const renderTournamentCard = (t: Tournament, isRegistered: boolean) => {
    const isStarted = new Date(t.startTime).getTime() < now.getTime();
    const isFull = t.reservedCount >= t.maxCap;
    const status = isStarted ? (t.isLateRegEnded ? 'CLOSED' : 'LATE REG') : 'UPCOMING';
    
    if (isRegistered) {
        return (
            <Card 
              key={t.id} 
              onClick={() => setDetailTournament(t)}
              className="border-l-4 border-l-primary bg-primary/5 border-primary/20 cursor-pointer hover:bg-primary/10"
            >
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-white">{t.name}</h3>
                    <Badge variant="success">Registered</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-textMuted mb-2">
                     <Clock size={14} />
                     <span>Starts at {new Date(t.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                    <div className="bg-primary h-1.5 rounded-full" style={{width: '100%'}}></div>
                </div>
                <p className="text-xs text-primary mt-2 flex items-center gap-1">
                    <Check size={12} /> Seat Confirmed
                </p>
            </Card>
        );
    }

    return (
        <Card 
          key={t.id} 
          onClick={() => setDetailTournament(t)}
          className={`border-l-4 ${status === 'CLOSED' ? 'border-l-slate-600 opacity-60' : 'border-l-slate-600'} cursor-pointer hover:bg-surfaceHighlight/80`}
        >
        <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-white">{t.name}</h3>
            {status === 'CLOSED' && <Badge variant="default">Closed</Badge>}
            {status === 'LATE REG' && <Badge variant="warning">Late Reg</Badge>}
            {status === 'UPCOMING' && <Badge variant="outline">Upcoming</Badge>}
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-300 mb-4">
            <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">${t.buyIn}</span>
            <span className="text-slate-500">+ {t.fee}</span>
            </div>
            <div className="flex items-center gap-1.5">
            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-xs">{(t.startingChips / 1000)}k chips</span>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-xs text-textMuted">
            <div className="flex items-center gap-2">
            <Clock size={14} />
            {isStarted ? (
                <span>Started {new Date(t.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            ) : (
                <span className="font-mono text-white">{formatCountdown(t.startTime)}</span>
            )}
            </div>
            <div className="flex items-center gap-2">
            <Users size={14} />
            <span>{t.reservedCount} / {t.maxCap} Players</span>
            </div>
        </div>

        {status !== 'CLOSED' && (
            <Button 
            fullWidth 
            variant={isFull ? 'secondary' : 'primary'}
            size="sm"
            onClick={(e) => handleReserveClick(e, t)}
            className={isFull ? 'text-yellow-500' : ''}
            >
            {isFull ? `Join Waitlist (Queue: ${t.reservedCount - t.maxCap + 1})` : 'Reserve Seat'}
            </Button>
        )}
        </Card>
    );
  };

  return (
    <div className="space-y-6 pb-24 pt-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-800 rounded-full">
          <ArrowLeft size={20} className="text-textMuted" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">Schedule</h2>
          <p className="text-xs text-textMuted">{now.toLocaleDateString()} • {now.toLocaleTimeString()}</p>
        </div>
      </div>

      {myEntries.length > 0 && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="flex items-center gap-2 mb-3 text-primary">
                <Star size={16} fill="currentColor" />
                <h3 className="text-sm font-semibold uppercase tracking-wider">My Registrations</h3>
             </div>
             <div className="space-y-3">
                {myEntries.map(t => renderTournamentCard(t, true))}
             </div>
             <div className="h-px bg-slate-800 w-full my-6"></div>
          </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-textMuted uppercase tracking-wider mb-3 pl-1">Available Games</h3>
        <div className="space-y-3">
            {otherTournaments.map(t => renderTournamentCard(t, false))}
        </div>
      </div>

      {/* Warning Modal */}
      <Modal 
        isOpen={showWarning} 
        onClose={() => setShowWarning(false)}
        title="Profile Incomplete"
      >
        <div className="text-center space-y-4">
          <div className="bg-yellow-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-yellow-500">
            <AlertCircle size={32} />
          </div>
          <p className="text-textMuted">
            Local regulations require a complete player profile before making a reservation.
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="ghost" fullWidth onClick={() => setShowWarning(false)}>Cancel</Button>
            <Button fullWidth onClick={onNavigateProfile}>Go to Profile</Button>
          </div>
        </div>
      </Modal>

      {/* Reservation Confirmation Modal */}
      {selectedTournament && (
        <Modal
          isOpen={!!selectedTournament}
          onClose={() => setSelectedTournament(null)}
          title="Confirm Reservation"
        >
          <div className="space-y-4">
             <p className="text-textMuted text-sm">You are about to reserve a seat for:</p>
             <div className="bg-slate-800 p-3 rounded-lg">
                <p className="font-bold text-white">{selectedTournament.name}</p>
                <p className="text-emerald-400 font-mono mt-1">${selectedTournament.buyIn} + ${selectedTournament.fee}</p>
             </div>
             <p className="text-xs text-slate-500">
               By confirming, you agree to the club's cancellation policy. No-shows may incur penalties.
             </p>
             <div className="flex gap-3">
               <Button variant="outline" fullWidth onClick={() => setSelectedTournament(null)}>Cancel</Button>
               <Button fullWidth onClick={confirmReservation}>Confirm</Button>
             </div>
          </div>
        </Modal>
      )}

      {/* Tournament Detail Modal */}
      <TournamentDetailModal 
        tournament={detailTournament}
        onClose={() => setDetailTournament(null)}
        actionLabel={registeredIds.includes(detailTournament?.id || '') ? "Cancel Registration" : "Reserve Now"}
        onAction={() => {
            if (detailTournament) {
                if (registeredIds.includes(detailTournament.id)) {
                    // Handle cancel
                    alert("Mock Cancel");
                } else {
                    handleReserveClick({ stopPropagation: () => {} } as any, detailTournament);
                }
                setDetailTournament(null);
            }
        }}
      />
    </div>
  );
};
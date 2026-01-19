import React, { useState } from 'react';
import { Home, User as UserIcon, Ticket } from 'lucide-react';
import { LoginView } from './components/views/LoginView';
import { HomeView } from './components/views/HomeView';
import { TournamentView } from './components/views/TournamentView';
import { ProfileView } from './components/views/ProfileView';
import { StatsView } from './components/views/StatsView';
import { ViewState, User, Club } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('login');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  
  // Mock state for user registrations (Empty by default now)
  const [myRegistrations, setMyRegistrations] = useState<string[]>([]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Logic for new user redirection is handled in LoginView
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    setSelectedClub(null);
  };

  const handleRegister = (tournamentId: string) => {
    if (!myRegistrations.includes(tournamentId)) {
        setMyRegistrations([...myRegistrations, tournamentId]);
    }
  };

  const navigateTo = (view: ViewState) => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  // Improved Club Navigation Logic
  const handleClubNavClick = () => {
    if (selectedClub) {
        navigateTo('tournaments');
    } else {
        navigateTo('home');
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginView 
            onLogin={handleLogin} 
            onNavigateHome={() => navigateTo('home')}
            onNavigateProfile={() => navigateTo('profile')}
          />
        );
      case 'home':
        return (
          <HomeView 
            onSelectClub={(club) => {
              setSelectedClub(club);
              navigateTo('tournaments');
            }}
            onJoinNew={() => alert("Join Club Flow Mockup")}
          />
        );
      case 'tournaments':
        return (
          currentUser ? (
            <TournamentView 
              user={currentUser}
              registeredIds={myRegistrations}
              onRegister={handleRegister}
              onBack={() => {
                  setSelectedClub(null); // Clear selection when going back
                  navigateTo('home');
              }}
              onNavigateProfile={() => navigateTo('profile')}
            />
          ) : null
        );
      case 'profile':
        return (
          currentUser ? (
            <ProfileView 
              user={currentUser} 
              onUpdateUser={(updates) => setCurrentUser({...currentUser, ...updates})} 
              onLogout={handleLogout}
            />
          ) : null
        );
      case 'my-games':
        return (
          <StatsView 
             registeredIds={myRegistrations}
             onNavigateTournaments={() => {
                if(selectedClub) {
                    navigateTo('tournaments');
                } else {
                    navigateTo('home');
                }
             }} 
          />
        );
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background text-textMain font-sans selection:bg-primary/30">
      <main className={`mx-auto max-w-md min-h-screen relative ${currentView !== 'login' ? 'p-4' : ''}`}>
        {renderView()}
      </main>

      {/* Bottom Navigation */}
      {currentUser && currentView !== 'login' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-md border-t border-slate-800 pb-safe">
          <div className="max-w-md mx-auto flex justify-around items-center h-16 px-6">
            <button 
              onClick={handleClubNavClick}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === 'home' || currentView === 'tournaments' ? 'text-primary' : 'text-textMuted hover:text-slate-300'}`}
            >
              <Home size={22} />
              <span className="text-[10px] font-medium">Clubs</span>
            </button>
            
            <button 
              onClick={() => navigateTo('my-games')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === 'my-games' ? 'text-primary' : 'text-textMuted hover:text-slate-300'}`}
            >
              <Ticket size={22} />
              <span className="text-[10px] font-medium">My Games</span>
            </button>

            <button 
              onClick={() => navigateTo('profile')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === 'profile' ? 'text-primary' : 'text-textMuted hover:text-slate-300'}`}
            >
              <UserIcon size={22} />
              <span className="text-[10px] font-medium">Profile</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
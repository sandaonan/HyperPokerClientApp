
import React, { useState } from 'react';
import { Home, User as UserIcon, Ticket, LogIn } from 'lucide-react';
import { LoginView } from './components/views/LoginView';
import { HomeView } from './components/views/HomeView';
import { TournamentView } from './components/views/TournamentView';
import { ProfileView } from './components/views/ProfileView';
import { StatsView } from './components/views/StatsView';
import { ViewState, User, Club } from './types';
import { mockApi } from './services/mockApi';
import { AlertProvider } from './contexts/AlertContext';

const GuestOverlay: React.FC<{ onLoginClick: () => void }> = ({ onLoginClick }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pointer-events-auto">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
        
        {/* Content */}
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl relative z-10 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <UserIcon size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">訪客模式</h3>
            <p className="text-slate-400 mb-6 text-sm">此功能僅限會員使用。請註冊或登入以管理您的檔案、報名賽事與查看戰績。</p>
            <button 
                onClick={onLoginClick}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl text-black font-bold shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-transform"
            >
                立即登入 / 註冊
            </button>
        </div>
    </div>
);

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('login');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    navigateTo('home');
  };

  const handleGuestEnter = () => {
      setCurrentUser(null);
      navigateTo('home');
  };

  const handleLogout = () => {
    mockApi.logout();
    setCurrentUser(null);
    setCurrentView('login');
    setSelectedClub(null);
  };

  const navigateTo = (view: ViewState) => {
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const handleClubNavClick = () => {
    if (selectedClub) {
        navigateTo('tournaments');
    } else {
        navigateTo('home');
    }
  };

  const isGuest = currentView !== 'login' && !currentUser;

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginView 
            onLogin={handleLogin}
            onGuestAccess={handleGuestEnter}
          />
        );
      case 'home':
        return (
          <HomeView 
            onSelectClub={(club) => {
              setSelectedClub(club);
              navigateTo('tournaments');
            }}
            onJoinNew={() => {}}
            isGuest={isGuest}
          />
        );
      case 'tournaments':
        return (
          selectedClub ? (
            <TournamentView 
              user={currentUser}
              club={selectedClub} 
              onBack={() => {
                  setSelectedClub(null); 
                  navigateTo('home');
              }}
              onNavigateProfile={() => navigateTo('profile')}
            />
          ) : null
        );
      case 'profile':
        return (
            <div className="relative min-h-[80vh]">
                {isGuest && <GuestOverlay onLoginClick={handleLogout} />}
                <div className={isGuest ? 'blur-md pointer-events-none select-none opacity-40 fixed inset-0 top-20' : ''}>
                    {/* Render Mock Profile for background visual */}
                    <ProfileView 
                        user={currentUser || { 
                            id: 'guest', username: 'Guest', isProfileComplete: false 
                        } as User} 
                        onUpdateUser={() => {}} 
                        onLogout={handleLogout}
                    />
                </div>
            </div>
        );
      case 'my-games':
        return (
            <div className="relative min-h-[80vh]">
                {isGuest && <GuestOverlay onLoginClick={handleLogout} />}
                <div className={isGuest ? 'blur-md pointer-events-none select-none opacity-40 fixed inset-0 top-20' : ''}>
                    {/* Render Mock Stats for background visual */}
                    <StatsView 
                        userId={currentUser?.id || 'guest'}
                        onNavigateTournaments={() => navigateTo('home')}
                    />
                </div>
            </div>
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
      {currentView !== 'login' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-md border-t border-slate-800 pb-safe">
          <div className="max-w-md mx-auto flex justify-around items-center h-16 px-6">
            <button 
              onClick={handleClubNavClick}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === 'home' || currentView === 'tournaments' ? 'text-primary' : 'text-textMuted hover:text-slate-300'}`}
            >
              <Home size={22} />
              <span className="text-[10px] font-medium">協會</span>
            </button>
            
            <button 
              onClick={() => navigateTo('my-games')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === 'my-games' ? 'text-primary' : 'text-textMuted hover:text-slate-300'}`}
            >
              <Ticket size={22} />
              <span className="text-[10px] font-medium">我的賽事</span>
            </button>

            <button 
              onClick={() => navigateTo('profile')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === 'profile' ? 'text-primary' : 'text-textMuted hover:text-slate-300'}`}
            >
              {isGuest ? <LogIn size={22} /> : <UserIcon size={22} />}
              <span className="text-[10px] font-medium">{isGuest ? '登入' : '檔案'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
    return (
        <AlertProvider>
            <AppContent />
        </AlertProvider>
    );
}

export default App;

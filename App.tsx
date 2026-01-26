
import React, { useState, useEffect } from 'react';
import { useLogto } from '@logto/react';
import { Home, User as UserIcon, Ticket, Loader2 } from 'lucide-react';
import { LoginView } from './components/views/LoginView';
import { HomeView } from './components/views/HomeView';
import { TournamentView } from './components/views/TournamentView';
import { ProfileView } from './components/views/ProfileView';
import { StatsView } from './components/views/StatsView';
import { CallbackView } from './components/views/CallbackView';
import { ViewState, User, Club } from './types';
import { syncLogtoUserToLocalStorage, getCurrentUser, clearCurrentSession } from './services/userSync';
import { redirectUris } from './config/logto';
import { AlertProvider } from './contexts/AlertContext';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading: isLogtoLoading, getIdTokenClaims, signOut } = useLogto();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('login');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [callbackProcessed, setCallbackProcessed] = useState(false);

  // Initialize user on mount or when authentication changes
  useEffect(() => {
    const initializeUser = async () => {
      if (isLogtoLoading) return;

      // Check URL for callback route (only if not yet processed)
      if (window.location.pathname === '/callback' && !callbackProcessed) {
        setCurrentView('callback');
        setAuthChecked(true);
        return;
      }

      if (isAuthenticated) {
        try {
          const claims = await getIdTokenClaims();
          if (claims) {
            const user = syncLogtoUserToLocalStorage(claims);
            setCurrentUser(user);
            // Navigate to home after successful auth
            if (currentView === 'login' || currentView === 'callback') {
              setCurrentView('home');
            }
          }
        } catch (error) {
          console.error('Failed to sync user:', error);
          clearCurrentSession();
          setCurrentView('login');
        }
      } else {
        // Not authenticated
        const existingUser = getCurrentUser();
        if (existingUser) {
          // User in localStorage but not authenticated - clear session
          clearCurrentSession();
        }
        setCurrentUser(null);
        if (currentView !== 'login') {
          setCurrentView('login');
        }
      }

      setAuthChecked(true);
    };

    initializeUser();
  }, [isAuthenticated, isLogtoLoading, getIdTokenClaims, currentView, callbackProcessed]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    navigateTo('home');
  };

  const handleLogout = async () => {
    clearCurrentSession();
    setCurrentUser(null);
    setCurrentView('login');
    setSelectedClub(null);
    await signOut(redirectUris.signOut);
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

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginView
            onLogin={handleLogin}
          />
        );
      case 'callback':
        return (
          <CallbackView
            onComplete={() => {
              // Mark callback as processed and trigger re-initialization
              setCallbackProcessed(true);
              setAuthChecked(false);
            }}
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
          />
        );
      case 'tournaments':
        return (
          currentUser && selectedClub ? (
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
          currentUser ? (
            <StatsView
              userId={currentUser.id}
              onNavigateTournaments={() => navigateTo('home')}
            />
          ) : null
        );
      default:
        return <div>View not found</div>;
    }
  };

  // Show loading state while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background text-textMain font-sans flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-textMain font-sans selection:bg-primary/30">
      <main className={`mx-auto max-w-md min-h-screen relative ${currentView !== 'login' && currentView !== 'callback' ? 'p-4' : ''}`}>
        {renderView()}
      </main>

      {/* Bottom Navigation */}
      {currentUser && currentView !== 'login' && currentView !== 'callback' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-md border-t border-slate-800 pb-safe">
          <div className="max-w-md mx-auto flex justify-around items-center h-16 px-6">
            <button 
              onClick={handleClubNavClick}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === 'home' || currentView === 'tournaments' ? 'text-primary' : 'text-textMuted hover:text-slate-300'}`}
            >
              <Home size={22} />
              <span className="text-[10px] font-medium">俱樂部</span>
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
              <UserIcon size={22} />
              <span className="text-[10px] font-medium">檔案</span>
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

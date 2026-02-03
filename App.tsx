
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { Home, User as UserIcon, Ticket, LogIn } from 'lucide-react';
import { LoginView } from './components/views/LoginView';
import { HomeView } from './components/views/HomeView';
import { TournamentView } from './components/views/TournamentView';
import { ProfileView } from './components/views/ProfileView';
import { StatsView } from './components/views/StatsView';
import { User, Club } from './types';
import { mockApi } from './services/mockApi';
import { AlertProvider } from './contexts/AlertContext';
import { THEME } from './theme';
import { getAllClubsFromSupabase } from './services/supabaseClub';
import { isSupabaseAvailable } from './lib/supabaseClient';
import { SEED_CLUBS } from './constants';
import { isSupabaseClub } from './services/mockApi';
import { getUserById } from './services/supabaseAuth';
import { NotificationManager } from './components/NotificationManager';

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

// Club Route Component - handles /club/:clubId
const ClubRoute: React.FC<{ currentUser: User | null; isGuest: boolean }> = ({ currentUser, isGuest }) => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();

  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClub = async () => {
      if (!clubId) {
        navigate('/');
        return;
      }

      setLoading(true);
      try {
        let foundClub: Club | null = null;

        // Try Supabase first if it's a Supabase club
        if (isSupabaseClub(clubId) && isSupabaseAvailable()) {
          try {
            const clubIdNum = parseInt(clubId);
            const { getClubByIdFromSupabase } = await import('./services/supabaseClub');
            foundClub = await getClubByIdFromSupabase(clubIdNum);
          } catch (e) {
            console.warn('Failed to fetch club from Supabase:', e);
          }
        }

        // Fallback to SEED_CLUBS for mock clubs or if Supabase failed
        if (!foundClub) {
          foundClub = SEED_CLUBS.find(c => c.id === clubId) || null;
        }

        if (!foundClub) {
          navigate('/');
          return;
        }

        setClub(foundClub);
      } catch (e) {
        console.error('Failed to fetch club:', e);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchClub();
  }, [clubId, navigate]);

  if (loading) {
    return <div className={`text-center py-10 ${THEME.textSecondary}`}>載入中...</div>;
  }

  if (!club) {
    return null;
  }

  return (
    <TournamentView 
      user={currentUser}
      club={club} 
      onBack={() => navigate('/')}
      onNavigateProfile={() => navigate('/profile')}
    />
  );
};

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Load user from session on mount
  useEffect(() => {
    const userId = localStorage.getItem('hp_session_user_id');
    if (userId) {
      // Try Supabase first, then fallback to localStorage
      if (isSupabaseAvailable()) {
        getUserById(userId).then(user => {
          if (user) {
            setCurrentUser(user);
          } else {
            localStorage.removeItem('hp_session_user_id');
          }
        }).catch(() => {
          // Try localStorage fallback
          const users: User[] = JSON.parse(localStorage.getItem('hp_users') || '[]');
          const user = users.find(u => u.id === userId);
          if (user) {
            setCurrentUser(user);
          } else {
            localStorage.removeItem('hp_session_user_id');
          }
        });
      } else {
        // Fallback to localStorage
        const users: User[] = JSON.parse(localStorage.getItem('hp_users') || '[]');
        const user = users.find(u => u.id === userId);
        if (user) {
          setCurrentUser(user);
        } else {
          localStorage.removeItem('hp_session_user_id');
        }
      }
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    navigate('/');
  };

  const handleGuestEnter = () => {
    setCurrentUser(null);
    navigate('/');
  };

  const handleLogout = () => {
    mockApi.logout();
    setCurrentUser(null);
    navigate('/login');
  };

  const isGuest = location.pathname !== '/login' && !currentUser;
  const currentPath = location.pathname;

  // Determine active view for bottom navigation
  const isHomeActive = currentPath === '/' || currentPath.startsWith('/club/');
  const isMyGamesActive = currentPath === '/my-games';
  const isProfileActive = currentPath === '/profile';

  const handleClubNavClick = () => {
    if (currentPath.startsWith('/club/')) {
      // Already on a club page, go to home
      navigate('/');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-brand-black text-brand-white font-sans selection:bg-brand-green/30">
      <NotificationManager userId={currentUser?.id || null} />
      <main className={`mx-auto max-w-md min-h-screen relative ${currentPath !== '/login' ? 'p-4' : ''}`}>
        <Routes>
          <Route path="/login" element={
            <LoginView 
              onLogin={handleLogin}
              onGuestAccess={handleGuestEnter}
            />
          } />
          <Route path="/" element={
            <HomeView 
              onSelectClub={(club) => {
                navigate(`/club/${club.id}`);
              }}
              onJoinNew={() => {}}
              isGuest={isGuest}
            />
          } />
          <Route path="/club/:clubId" element={
            <ClubRoute currentUser={currentUser} isGuest={isGuest} />
          } />
          <Route path="/profile" element={
            <div className="relative min-h-[80vh]">
              {isGuest && <GuestOverlay onLoginClick={handleLogout} />}
              <div className={isGuest ? 'blur-md pointer-events-none select-none opacity-40 fixed inset-0 top-20' : ''}>
                <ProfileView 
                  user={currentUser || { 
                    id: 'guest', username: 'Guest', isProfileComplete: false 
                  } as User} 
                  onUpdateUser={(updates) => {
                    if (currentUser) {
                      setCurrentUser({ ...currentUser, ...updates });
                    }
                  }} 
                  onLogout={handleLogout}
                />
              </div>
            </div>
          } />
          <Route path="/my-games" element={
            <div className="relative min-h-[80vh]">
              {isGuest && <GuestOverlay onLoginClick={handleLogout} />}
              <div className={isGuest ? 'blur-md pointer-events-none select-none opacity-40 fixed inset-0 top-20' : ''}>
                <StatsView 
                  userId={currentUser?.id || 'guest'}
                  onNavigateTournaments={() => navigate('/')}
                />
              </div>
            </div>
          } />
          {/* Catch-all route - redirect to home */}
          <Route path="*" element={
            <HomeView 
              onSelectClub={(club) => {
                navigate(`/club/${club.id}`);
              }}
              onJoinNew={() => {}}
              isGuest={isGuest}
            />
          } />
        </Routes>
      </main>

      {/* Bottom Navigation */}
      {currentPath !== '/login' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-brand-dark/90 backdrop-blur-md border-t border-brand-border pb-safe">
          <div className="max-w-md mx-auto flex justify-around items-center h-16 px-6">
            <button 
              onClick={handleClubNavClick}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isHomeActive ? THEME.accent : `${THEME.textSecondary} hover:${THEME.textPrimary}`}`}
            >
              <Home size={22} />
              <span className="text-[10px] font-medium">協會</span>
            </button>
            
            <button 
              onClick={() => navigate('/my-games')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isMyGamesActive ? THEME.accent : `${THEME.textSecondary} hover:${THEME.textPrimary}`}`}
            >
              <Ticket size={22} />
              <span className="text-[10px] font-medium">我的賽事</span>
            </button>

            <button 
              onClick={() => navigate('/profile')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isProfileActive ? THEME.accent : `${THEME.textSecondary} hover:${THEME.textPrimary}`}`}
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

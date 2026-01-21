
import { User, Club, Wallet, Tournament, Registration, RegistrationStatus, MembershipStatus } from '../types';
import { SEED_CLUBS, SEED_TOURNAMENTS } from '../constants';

// Keys for LocalStorage
const STORAGE_KEYS = {
  USERS: 'hp_users',
  WALLETS: 'hp_wallets',
  TOURNAMENTS: 'hp_tournaments',
  REGISTRATIONS: 'hp_registrations',
  CURRENT_USER: 'hp_session_user_id',
  CLUBS: 'hp_clubs'
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockApiService {
  constructor() {
    this.initialize();
  }

  private initialize() {
    if (!localStorage.getItem(STORAGE_KEYS.CLUBS)) {
        localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(SEED_CLUBS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TOURNAMENTS)) {
        localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(SEED_TOURNAMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.WALLETS)) localStorage.setItem(STORAGE_KEYS.WALLETS, '[]');
    if (!localStorage.getItem(STORAGE_KEYS.REGISTRATIONS)) localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, '[]');
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) localStorage.setItem(STORAGE_KEYS.USERS, '[]');
  }

  // --- Auth ---

  async login(username: string, password: string): Promise<User> {
    await delay(500);
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) throw new Error("帳號或密碼錯誤");
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, user.id);
    return user;
  }

  async register(username: string, password: string, mobile: string = ''): Promise<User> {
    await delay(800);
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    
    if (users.find(u => u.username === username)) {
      throw new Error("此帳號已被使用");
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      username,
      password, 
      mobile, // Can be empty now
      mobileVerified: false, // Default to false if skipped at registration
      isProfileComplete: false,
      nickname: username,
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    // Seed: Auto-join c-1 as active for demo purposes
    this.seedWalletsForUser(newUser.id);
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, newUser.id);
    return newUser;
  }

  async logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  // --- Wallet & Club Membership ---

  private seedWalletsForUser(userId: string) {
    const wallets: Wallet[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLETS) || '[]');
    
    // Auto join Hyper Club (c-1) with money and Date
    wallets.push({ 
        userId, 
        clubId: 'c-1', 
        balance: 50000, 
        points: 100, 
        status: 'active',
        joinDate: '2023-01-15T10:00:00Z'
    });
    
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
  }

  async getWallet(userId: string, clubId: string): Promise<Wallet | null> {
    await delay(300);
    const wallets: Wallet[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLETS) || '[]');
    // Find wallet implies membership
    const wallet = wallets.find(w => w.userId === userId && w.clubId === clubId);
    return wallet || null;
  }

  // New: Join a club
  async joinClub(userId: string, clubId: string): Promise<Wallet> {
      await delay(600);
      const wallets: Wallet[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLETS) || '[]');
      
      if (wallets.find(w => w.userId === userId && w.clubId === clubId)) {
          throw new Error("您已是該俱樂部會員");
      }

      const newWallet: Wallet = {
          userId,
          clubId,
          balance: 0,
          points: 0,
          joinDate: new Date().toISOString(),
          status: 'pending' // Start as pending
      };

      wallets.push(newWallet);
      localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
      return newWallet;
  }

  // --- Tournaments ---

  async getTournaments(clubId: string): Promise<Tournament[]> {
    await delay(300);
    const registrations: Registration[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
    
    // Also count mock registrations for better UI data
    return SEED_TOURNAMENTS.filter(t => t.clubId === clubId).map(t => {
      // Basic logic: base count + dynamic
      const count = registrations.filter(r => r.tournamentId === t.id && r.status !== 'cancelled').length;
      return { ...t, reservedCount: count + 5 }; // +5 mock users for demo
    });
  }

  async getMyRegistrations(userId: string): Promise<{registration: Registration, tournament: Tournament}[]> {
    await delay(300);
    const registrations: Registration[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
    const myRegs = registrations.filter(r => r.userId === userId && r.status !== 'cancelled');
    
    // Fill in current user display info if missing
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const currentUser = users.find(u => u.id === userId);

    return myRegs.map(reg => {
      const tournament = SEED_TOURNAMENTS.find(t => t.id === reg.tournamentId);
      // Ensure display info exists
      reg.userDisplayName = currentUser?.nickname || currentUser?.username || 'Me';
      reg.userLocalId = '888'; // Mock ID for current user
      return { registration: reg, tournament: tournament! };
    });
  }

  // NEW: Get ALL registrations for a tournament (for the list view)
  async getTournamentRegistrations(tournamentId: string): Promise<Registration[]> {
      await delay(400);
      const allRegs: Registration[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
      const realRegs = allRegs.filter(r => r.tournamentId === tournamentId && r.status !== 'cancelled');
      
      const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');

      // Hydrate Real Users
      const hydratedReal = realRegs.map(r => {
          const u = users.find(user => user.id === r.userId);
          return {
              ...r,
              userDisplayName: u?.nickname || u?.username || 'Unknown',
              userLocalId: u ? '888' : '000' // Simple mock logic
          };
      });

      // Generate Mock Users to make the list look busy
      const mockRegs: Registration[] = [
          { id: 'mock-1', tournamentId, userId: 'm-1', status: 'reserved', timestamp: new Date().toISOString(), userDisplayName: 'BigBlind_King', userLocalId: '001' },
          { id: 'mock-2', tournamentId, userId: 'm-2', status: 'paid', timestamp: new Date().toISOString(), userDisplayName: 'PokerFace', userLocalId: '023' },
          { id: 'mock-3', tournamentId, userId: 'm-3', status: 'paid', timestamp: new Date().toISOString(), userDisplayName: 'AllInJoe', userLocalId: '105' },
          { id: 'mock-4', tournamentId, userId: 'm-4', status: 'reserved', timestamp: new Date().toISOString(), userDisplayName: 'FishHunter', userLocalId: '099' },
          { id: 'mock-5', tournamentId, userId: 'm-5', status: 'paid', timestamp: new Date().toISOString(), userDisplayName: 'StackBuilder', userLocalId: '007' },
      ];

      return [...hydratedReal, ...mockRegs];
  }

  async registerTournament(userId: string, tournamentId: string, type: 'reserve' | 'buy-in'): Promise<Registration> {
    await delay(600);
    
    const tournament = SEED_TOURNAMENTS.find(t => t.id === tournamentId);
    if (!tournament) throw new Error("賽事不存在");

    const wallets: Wallet[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLETS) || '[]');
    const walletIndex = wallets.findIndex(w => w.userId === userId && w.clubId === tournament.clubId);

    // Check Membership
    if (walletIndex === -1) throw new Error("您尚未加入該俱樂部");
    if (wallets[walletIndex].status === 'pending') throw new Error("會員資格審核中，請至櫃檯完成加入手續");

    const registrations: Registration[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
    
    // Check Duplicate or Upgrade
    const existingIndex = registrations.findIndex(r => r.userId === userId && r.tournamentId === tournamentId && r.status !== 'cancelled');
    
    if (existingIndex !== -1) {
        const existing = registrations[existingIndex];
        
        // Upgrade Logic: Reserved -> Paid
        if (existing.status === 'reserved' && type === 'buy-in') {
             const totalCost = tournament.buyIn + tournament.fee;
       
             if (wallets[walletIndex].balance < totalCost) {
                 throw new Error(`餘額不足。需 $${totalCost.toLocaleString()}，當前餘額: $${wallets[walletIndex]?.balance.toLocaleString() || 0}`);
             }
             
             wallets[walletIndex].balance -= totalCost;
             localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));

             // Update Registration
             existing.status = 'paid';
             localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));
             
             return existing;
        }

        throw new Error("您已經報名過此賽事");
    }

    // Check Cap
    const currentCount = registrations.filter(r => r.tournamentId === tournamentId && r.status !== 'cancelled').length;
    if (currentCount >= tournament.maxCap) throw new Error("賽事名額已滿");

    // Logic for New Registration
    if (type === 'buy-in') {
       const totalCost = tournament.buyIn + tournament.fee;
       
       if (wallets[walletIndex].balance < totalCost) {
           throw new Error(`餘額不足。需 $${totalCost.toLocaleString()}，當前餘額: $${wallets[walletIndex]?.balance.toLocaleString() || 0}`);
       }
       
       wallets[walletIndex].balance -= totalCost;
       localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
    }

    const newReg: Registration = {
        id: `reg-${Date.now()}`,
        tournamentId,
        userId,
        status: type === 'buy-in' ? 'paid' : 'reserved',
        timestamp: new Date().toISOString()
    };

    registrations.push(newReg);
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));
    
    return newReg;
  }

  async cancelRegistration(userId: string, tournamentId: string): Promise<void> {
    await delay(400);
    const registrations: Registration[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
    const regIndex = registrations.findIndex(r => r.userId === userId && r.tournamentId === tournamentId && r.status !== 'cancelled');
    
    if (regIndex === -1) throw new Error("找不到報名記錄");
    
    const reg = registrations[regIndex];
    const tournament = SEED_TOURNAMENTS.find(t => t.id === tournamentId);

    if (reg.status === 'paid' && tournament) {
        const wallets: Wallet[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLETS) || '[]');
        const walletIndex = wallets.findIndex(w => w.userId === userId && w.clubId === tournament.clubId);
        if (walletIndex !== -1) {
            wallets[walletIndex].balance += (tournament.buyIn + tournament.fee);
            localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
        }
    }

    registrations[regIndex].status = 'cancelled';
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));
  }
}

export const mockApi = new MockApiService();

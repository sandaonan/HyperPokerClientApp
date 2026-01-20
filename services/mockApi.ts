import { User, Club, Wallet, Tournament, Registration, RegistrationStatus } from '../types';
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

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockApiService {
  constructor() {
    this.initialize();
  }

  private initialize() {
    if (!localStorage.getItem(STORAGE_KEYS.CLUBS)) {
        // Seed Clubs (Read-only usually, but stored for consistency)
        localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(SEED_CLUBS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TOURNAMENTS)) {
        localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(SEED_TOURNAMENTS));
    }
    // Wallets and Registrations start empty
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

  async register(username: string, password: string): Promise<User> {
    await delay(800);
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    
    if (users.find(u => u.username === username)) {
      throw new Error("此帳號已被使用");
    }

    const newUser: User = {
      id: `u-${Date.now()}`,
      username,
      password, // In plain text for mock only
      isProfileComplete: false,
      nickname: username, // Default nickname
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    // Seed some initial wallets for testing
    this.seedWalletsForUser(newUser.id);
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, newUser.id);
    return newUser;
  }

  async logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  // --- Wallet ---

  // Helper to create empty wallets for clubs when a user registers
  private seedWalletsForUser(userId: string) {
    const wallets: Wallet[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLETS) || '[]');
    
    // Give them some money in 6Bet (c-1) for testing
    wallets.push({ userId, clubId: 'c-1', balance: 50000, points: 100 });
    // Empty wallet in Ace High (c-2)
    wallets.push({ userId, clubId: 'c-2', balance: 0, points: 0 });
    
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
  }

  async getWallet(userId: string, clubId: string): Promise<Wallet> {
    await delay(300);
    const wallets: Wallet[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLETS) || '[]');
    let wallet = wallets.find(w => w.userId === userId && w.clubId === clubId);
    
    if (!wallet) {
      // Create if doesn't exist (Lazy init)
      wallet = { userId, clubId, balance: 0, points: 0 };
      wallets.push(wallet);
      localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
    }
    return wallet;
  }

  // --- Tournaments ---

  async getTournaments(clubId: string): Promise<Tournament[]> {
    await delay(300);
    // Always read from SEED for Club/Tournament info stability in this mock
    // But calculate 'reservedCount' dynamically
    const registrations: Registration[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
    
    return SEED_TOURNAMENTS.filter(t => t.clubId === clubId).map(t => {
      const count = registrations.filter(r => r.tournamentId === t.id && r.status !== 'cancelled').length;
      return { ...t, reservedCount: count };
    });
  }

  async getMyRegistrations(userId: string): Promise<{registration: Registration, tournament: Tournament}[]> {
    await delay(300);
    const registrations: Registration[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
    const myRegs = registrations.filter(r => r.userId === userId && r.status !== 'cancelled');
    
    return myRegs.map(reg => {
      const tournament = SEED_TOURNAMENTS.find(t => t.id === reg.tournamentId);
      return { registration: reg, tournament: tournament! };
    });
  }

  // The Core Logic for Requirement #3
  async registerTournament(userId: string, tournamentId: string, type: 'reserve' | 'buy-in'): Promise<Registration> {
    await delay(600);
    
    const tournament = SEED_TOURNAMENTS.find(t => t.id === tournamentId);
    if (!tournament) throw new Error("賽事不存在");

    const registrations: Registration[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
    
    // Check if already registered
    const existing = registrations.find(r => r.userId === userId && r.tournamentId === tournamentId && r.status !== 'cancelled');
    if (existing) throw new Error("您已經報名過此賽事");

    // Check Cap
    const currentCount = registrations.filter(r => r.tournamentId === tournamentId && r.status !== 'cancelled').length;
    if (currentCount >= tournament.maxCap) throw new Error("賽事名額已滿");

    // Logic: Buy-in vs Reserve
    if (type === 'buy-in') {
       const wallets: Wallet[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLETS) || '[]');
       const walletIndex = wallets.findIndex(w => w.userId === userId && w.clubId === tournament.clubId);
       
       const totalCost = tournament.buyIn + tournament.fee;
       
       if (walletIndex === -1 || wallets[walletIndex].balance < totalCost) {
           throw new Error(`餘額不足。需 $${totalCost.toLocaleString()}，當前餘額: $${wallets[walletIndex]?.balance.toLocaleString() || 0}`);
       }
       
       // Deduct Balance
       wallets[walletIndex].balance -= totalCost;
       localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
    }

    // Create Registration
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

    // Logic: Refund if PAID
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
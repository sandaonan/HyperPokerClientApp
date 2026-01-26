
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
    
    // Load existing users
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const player1Exists = users.some(u => u.username === 'player1');

    // Seed Default User "player1" if it doesn't exist
    if (!player1Exists) {
        const seedUser: User = {
            id: 'player1',
            username: 'player1',
            password: 'password',
            name: '測試玩家',
            nickname: 'ProPlayer',
            mobile: '0912345678',
            mobileVerified: true,
            isProfileComplete: true,
            nationalId: 'A123456789',
            birthday: '1990-01-01',
            kycUploaded: true
        };
        users.push(seedUser);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        
        // Seed Wallets for player1
        const wallets: Wallet[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLETS) || '[]');
        
        // Remove old player1 wallets if any (cleanup) and add fresh seed data
        const otherWallets = wallets.filter(w => w.userId !== 'player1');
        
        const seedWallets: Wallet[] = [
            {
                userId: 'player1',
                clubId: 'c-1', // Hyper Club (Original Mock: Pending Verification for demo purposes)
                balance: 50000, 
                points: 1200,
                joinDate: new Date().toISOString(),
                status: 'pending' // Force Pending to show Verification Alert Scenario
            },
            {
                userId: 'player1',
                clubId: 'c-2', // Ace High Club (Mock: Fully Active for functional testing)
                balance: 100000, 
                points: 500,
                joinDate: new Date(Date.now() - 86400000 * 30).toISOString(),
                status: 'active' // Active Status to test Tournament flows
            }
        ];
        
        localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify([...otherWallets, ...seedWallets]));

        // Seed a "Paid" registration for T-1 for player1
        const registrations: Registration[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
        
        // Remove old player1 registrations for t-1 if any
        const otherRegs = registrations.filter(r => !(r.userId === 'player1' && r.tournamentId === 't-1'));
        
        const seedReg: Registration = {
             id: 'reg-seed-1',
             tournamentId: 't-1',
             userId: 'player1',
             status: 'paid',
             timestamp: new Date().toISOString(),
             userDisplayName: 'ProPlayer',
             userLocalId: '888'
        };
        
        otherRegs.push(seedReg);
        localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(otherRegs));
    }
  }

  // --- Auth ---

  async login(username: string, password: string): Promise<User> {
    await delay(500);
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) throw new Error("帳號或密碼錯誤 (測試帳號: player1 / password)");
    
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
    
    // Auto-join first club 'c-1' as 'pending' (Need Verification) because profile is empty
    const wallets: Wallet[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLETS) || '[]');
    wallets.push({
        userId: newUser.id,
        clubId: 'c-1',
        balance: 0,
        points: 0,
        joinDate: new Date().toISOString(),
        status: 'pending' // Needs ID verification
    });
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, newUser.id);
    return newUser;
  }

  async logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  // --- User Profile Updates ---

  async updateUserProfile(user: User): Promise<User> {
      await delay(400);
      const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const index = users.findIndex(u => u.id === user.id);
      if (index !== -1) {
          users[index] = user;
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
      return user;
  }

  async updateUserSensitiveData(user: User): Promise<User> {
      await delay(800);
      const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const index = users.findIndex(u => u.id === user.id);
      
      if (index !== -1) {
          // 1. Update User
          users[index] = { ...user, isProfileComplete: true };
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

          // 2. Reset ALL Wallets to 'pending'
          const wallets: Wallet[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLETS) || '[]');
          let walletUpdated = false;
          const updatedWallets = wallets.map(w => {
              if (w.userId === user.id) {
                  walletUpdated = true;
                  return { ...w, status: 'pending' as MembershipStatus };
              }
              return w;
          });

          if (walletUpdated) {
              localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(updatedWallets));
          }
          
          return users[index];
      }
      throw new Error("User not found");
  }

  // --- Wallet & Club Membership ---

  async getWallet(userId: string, clubId: string): Promise<Wallet | null> {
    await delay(300);
    const wallets: Wallet[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLETS) || '[]');
    const wallet = wallets.find(w => w.userId === userId && w.clubId === clubId);
    return wallet || null;
  }

  // New method to fetch all wallets for profile view
  async getAllWallets(userId: string): Promise<Wallet[]> {
      await delay(300);
      const wallets: Wallet[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLETS) || '[]');
      return wallets.filter(w => w.userId === userId && w.status !== 'banned');
  }

  async joinClub(userId: string, clubId: string): Promise<Wallet> {
      await delay(600);
      
      // 1. Check Profile Completion
      const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error("User not found");

      if (!user.isProfileComplete || !user.name || !user.nationalId || !user.birthday) {
          throw new Error("請先至「個人檔案」完成實名資料填寫與證件上傳，方可申請加入協會。");
      }

      const wallets: Wallet[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLETS) || '[]');
      
      if (wallets.find(w => w.userId === userId && w.clubId === clubId)) {
          throw new Error("您已是該協會會員或是申請審核中");
      }

      const newWallet: Wallet = {
          userId,
          clubId,
          balance: 0,
          points: 0,
          joinDate: new Date().toISOString(),
          status: 'applying' // Start as applying
      };

      wallets.push(newWallet);
      localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));

      // 3. Mock 8-second auto-approval
      setTimeout(() => {
          const currentWallets: Wallet[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLETS) || '[]');
          const targetIndex = currentWallets.findIndex(w => w.userId === userId && w.clubId === clubId);
          if (targetIndex !== -1) {
              currentWallets[targetIndex].status = 'active'; 
              localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(currentWallets));
              console.log(`[MockApi] Auto-approved user ${userId} for club ${clubId}`);
          }
      }, 8000);

      return newWallet;
  }

  // --- Tournaments ---

  async getTournaments(clubId: string): Promise<Tournament[]> {
    await delay(300);
    
    const registrations: Registration[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
    
    return SEED_TOURNAMENTS.filter(t => t.clubId === clubId).map(t => {
      // Basic logic: Count real registrations
      const realCount = registrations.filter(r => r.tournamentId === t.id && r.status !== 'cancelled').length;
      
      // Force T-2 & T-2-2 to be over capacity mock for demo
      if (t.id === 't-2' || t.id === 't-2-2') {
          return { ...t, reservedCount: Math.max(t.maxCap + 2, realCount) };
      }

      // Default mock add-on for others to look lively
      return { ...t, reservedCount: Math.min(t.maxCap, realCount + 5) };
    });
  }

  async getMyRegistrations(userId: string): Promise<{registration: Registration, tournament: Tournament}[]> {
    await delay(300);
    const registrations: Registration[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
    const myRegs = registrations.filter(r => r.userId === userId && r.status !== 'cancelled');
    
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const currentUser = users.find(u => u.id === userId);

    return myRegs.map(reg => {
      const tournament = SEED_TOURNAMENTS.find(t => t.id === reg.tournamentId);
      // Ensure display info exists
      reg.userDisplayName = currentUser?.nickname || currentUser?.username || 'Me';
      reg.userLocalId = '888'; 
      return { registration: reg, tournament: tournament! };
    });
  }

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
              userLocalId: u ? '888' : '000'
          };
      });

      // Generate Mock Users
      const mockRegs: Registration[] = [
          { id: 'mock-1', tournamentId, userId: 'm-1', status: 'reserved', timestamp: new Date(Date.now() - 100000).toISOString(), userDisplayName: 'BigBlind_King', userLocalId: '001' },
          { id: 'mock-2', tournamentId, userId: 'm-2', status: 'paid', timestamp: new Date(Date.now() - 200000).toISOString(), userDisplayName: 'PokerFace', userLocalId: '023' },
          { id: 'mock-3', tournamentId, userId: 'm-3', status: 'paid', timestamp: new Date(Date.now() - 300000).toISOString(), userDisplayName: 'AllInJoe', userLocalId: '105' },
          { id: 'mock-4', tournamentId, userId: 'm-4', status: 'reserved', timestamp: new Date(Date.now() - 400000).toISOString(), userDisplayName: 'FishHunter', userLocalId: '099' },
          { id: 'mock-5', tournamentId, userId: 'm-5', status: 'paid', timestamp: new Date(Date.now() - 500000).toISOString(), userDisplayName: 'StackBuilder', userLocalId: '007' },
      ];

      return [...hydratedReal, ...mockRegs].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async registerTournament(userId: string, tournamentId: string, type: 'reserve' | 'buy-in'): Promise<Registration> {
    await delay(600);
    
    const tournament = SEED_TOURNAMENTS.find(t => t.id === tournamentId);
    if (!tournament) throw new Error("賽事不存在");

    if (tournament.isLateRegEnded) throw new Error("此賽事已截止報名，無法預約。");

    const wallets: Wallet[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLETS) || '[]');
    const walletIndex = wallets.findIndex(w => w.userId === userId && w.clubId === tournament.clubId);

    // Check Membership
    if (walletIndex === -1) throw new Error("您尚未加入該協會");
    
    const userWallet = wallets[walletIndex];
    if (userWallet.status === 'applying') throw new Error("您的入會申請正在審核中，請稍候。");
    if (userWallet.status === 'pending') throw new Error("您的身份驗證狀態為「待驗證」，請至櫃檯完成真人核對後方可報名。");
    if (userWallet.status === 'banned') throw new Error("您已被該協會停權。");

    const registrations: Registration[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
    
    // Check Duplicate or Upgrade
    const existingIndex = registrations.findIndex(r => r.userId === userId && r.tournamentId === tournamentId && r.status !== 'cancelled');
    
    if (existingIndex !== -1) {
        const existing = registrations[existingIndex];
        
        if (existing.status === 'reserved' && type === 'buy-in') {
             const totalCost = tournament.buyIn + tournament.fee;
             if (wallets[walletIndex].balance < totalCost) {
                 throw new Error(`餘額不足。需 $${totalCost.toLocaleString()}，當前餘額: $${wallets[walletIndex]?.balance.toLocaleString() || 0}`);
             }
             wallets[walletIndex].balance -= totalCost;
             localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));

             existing.status = 'paid';
             localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));
             return existing;
        }

        throw new Error("您已經報名過此賽事");
    }

    // Waitlist logic allows over cap
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

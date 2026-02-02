
import { User, Club, Wallet, Tournament, Registration, RegistrationStatus, MembershipStatus } from '../types';
import { SEED_CLUBS, SEED_TOURNAMENTS } from '../constants';
import { registerUser, loginUser, getUserById, updateUserProfile as updateSupabaseUser } from './supabaseAuth';
import { isSupabaseAvailable } from '../lib/supabaseClient';
import { joinClubInSupabase, getUserClubMemberships } from './supabaseClubMember';

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

/**
 * Helper function to determine if a club uses Supabase data
 * Supabase clubs have numeric IDs (e.g., '1', '2')
 * Mock clubs have 'c-' prefix (e.g., 'c-1', 'c-2', 'c-3')
 */
export function isSupabaseClub(clubId: string): boolean {
  return !clubId.startsWith('c-') && !isNaN(Number(clubId));
}

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
                clubId: 'c-1', // Hyper Club (Mock: Fully Active for functional testing)
                balance: 50000, 
                points: 1200,
                joinDate: new Date().toISOString(),
                status: 'active' // 已加入
            },
            {
                userId: 'player1',
                clubId: 'c-2', // Ace High Club (Original Mock: Pending Verification for demo purposes)
                balance: 100000, 
                points: 500,
                joinDate: new Date(Date.now() - 86400000 * 30).toISOString(),
                status: 'pending' // 需驗證身份
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
    // Try Supabase first if available
    if (isSupabaseAvailable()) {
      try {
        const user = await loginUser(username, password);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, user.id);
        return user;
      } catch (error: any) {
        // If Supabase fails, fall back to mock (for testing)
        console.warn('Supabase login failed, falling back to mock:', error.message);
      }
    }

    // Fallback to mock API
    await delay(500);
    const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) throw new Error("帳號或密碼錯誤 (測試帳號: player1 / password)");
    
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, user.id);
    return user;
  }

  async register(username: string, password: string, mobile: string = ''): Promise<User> {
    // Try Supabase first if available
    if (isSupabaseAvailable()) {
      try {
        const user = await registerUser(username, password, mobile);
        
        // Don't auto-join any club - user needs to apply manually
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, user.id);
        return user;
      } catch (error: any) {
        // If Supabase fails, fall back to mock (for testing)
        console.warn('Supabase registration failed, falling back to mock:', error.message);
        throw error; // Re-throw to show error to user
      }
    }

    // Fallback to mock API
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
      // Try Supabase first if available
      if (isSupabaseAvailable()) {
        try {
          const updatedUser = await updateSupabaseUser(user);
          return updatedUser;
        } catch (error: any) {
          console.warn('Supabase update failed, falling back to mock:', error.message);
          // Fall through to mock API
        }
      }

      // Fallback to mock API
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
      // Try Supabase first if available
      if (isSupabaseAvailable()) {
        try {
          const updatedUser = await updateSupabaseUser({
            ...user,
            isProfileComplete: true
          });

          // 2. Reset ALL Wallets to 'pending' (still use localStorage for wallets)
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

          return updatedUser;
        } catch (error: any) {
          console.warn('Supabase update failed, falling back to mock:', error.message);
          // Fall through to mock API
        }
      }

      // Fallback to mock API
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
      // Strict separation: Supabase clubs use ONLY Supabase data, mock clubs use ONLY mock data
      if (isSupabaseClub(clubId)) {
        // Supabase club: ONLY use Supabase data, no fallback to localStorage
        if (!isSupabaseAvailable()) {
          console.warn(`[getWallet] Supabase not available for club ${clubId}, returning null`);
          return null;
        }
        
        try {
          const memberId = parseInt(userId);
          const clubIdNum = parseInt(clubId);
          
          if (!isNaN(memberId) && !isNaN(clubIdNum)) {
            const memberships = await getUserClubMemberships(memberId);
            const membership = memberships.find(cm => cm.club_id === clubIdNum);
            
            if (membership) {
              // Map member_status to Wallet status
              let status: MembershipStatus = 'applying';
              if (membership.member_status === 'activated') {
                status = 'active';
              } else if (membership.member_status === 'deactivated') {
                status = 'banned';
              } else if (membership.member_status === 'pending_approval') {
                status = 'applying';
              }
              
              // Map kyc_status
              let kycStatus: 'verified' | 'unverified' | null = null;
              if (membership.kyc_status === 'verified') {
                kycStatus = 'verified';
              } else if (membership.kyc_status === 'unverified') {
                kycStatus = 'unverified';
              }
              
              return {
                userId: userId,
                clubId: clubId,
                balance: membership.balance || 0,
                points: 0, // TODO: Add points field to club_member if needed
                joinDate: membership.joined_date || new Date().toISOString(),
                status: status,
                kycStatus: kycStatus,
              };
            }
            // If no membership found in Supabase for Supabase club, return null (not joined)
            return null;
          }
        } catch (error: any) {
          console.error(`[getWallet] Failed to get wallet from Supabase for club ${clubId}:`, error.message);
          return null; // Return null instead of falling back to localStorage
        }
      }

      // Mock club: ONLY use localStorage data
      await delay(300);
      const wallets: Wallet[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLETS) || '[]');
      const wallet = wallets.find(w => w.userId === userId && w.clubId === clubId);
      return wallet || null;
  }

  // New method to fetch all wallets for profile view
  async getAllWallets(userId: string): Promise<Wallet[]> {
      const supabaseWallets: Wallet[] = [];
      const mockWallets: Wallet[] = [];
      
      // Fetch Supabase wallets (for Supabase clubs only)
      if (isSupabaseAvailable()) {
        try {
          const memberId = parseInt(userId);
          if (!isNaN(memberId)) {
            const memberships = await getUserClubMemberships(memberId);
            console.log('[getAllWallets] Supabase memberships:', memberships);
            
            // Convert club_member to Wallet format
            // Include ALL memberships regardless of status (activated, pending_approval, etc.)
            supabaseWallets.push(...memberships.map(cm => {
              // Map member_status to Wallet status
              let status: MembershipStatus = 'applying';
              if (cm.member_status === 'activated') {
                status = 'active';
              } else if (cm.member_status === 'deactivated') {
                status = 'banned';
              } else if (cm.member_status === 'pending_approval') {
                status = 'applying'; // Keep as 'applying' to show "申請審核中" badge
              }
              
              // Map kyc_status
              let kycStatus: 'verified' | 'unverified' | null = null;
              if (cm.kyc_status === 'verified') {
                kycStatus = 'verified';
              } else if (cm.kyc_status === 'unverified') {
                kycStatus = 'unverified';
              }
              
              return {
                userId: userId,
                clubId: cm.club_id.toString(),
                balance: cm.balance || 0,
                points: 0, // TODO: Add points field to club_member if needed
                joinDate: cm.joined_date || new Date().toISOString(),
                status: status,
                kycStatus: kycStatus,
              };
            }));
          }
        } catch (error: any) {
          console.error('[getAllWallets] Failed to get wallets from Supabase:', error.message);
          // Continue to fetch mock wallets even if Supabase fails
        }
      }

      // Fetch mock wallets (for mock clubs only - those with 'c-' prefix)
      await delay(300);
      const localWallets: Wallet[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLETS) || '[]');
      mockWallets.push(...localWallets.filter(w => 
        w.userId === userId && 
        w.status !== 'banned' &&
        isSupabaseClub(w.clubId) === false // Only include mock clubs
      ));
      
      // Combine Supabase and mock wallets (they're for different clubs, so no conflict)
      // Deduplicate by clubId (Supabase takes priority)
      const allWallets = [...supabaseWallets, ...mockWallets];
      const uniqueWallets = allWallets.filter((w, index, self) => 
        index === self.findIndex(t => t.clubId === w.clubId)
      );
      
      console.log('[getAllWallets] Final wallets:', uniqueWallets);
      return uniqueWallets;
  }

  async joinClub(userId: string, clubId: string): Promise<Wallet> {
      await delay(600);
      
      // 1. Get user (try Supabase first, then fallback to localStorage)
      let user: User | null = null;
      if (isSupabaseAvailable()) {
        try {
          user = await getUserById(userId);
        } catch (e) {
          console.warn('Failed to get user from Supabase:', e);
        }
      }
      
      if (!user) {
        const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        user = users.find(u => u.id === userId) || null;
      }

      if (!user) throw new Error("User not found");

      if (!user.isProfileComplete || !user.name || !user.nationalId || !user.birthday) {
          throw new Error("請先至「個人檔案」完成實名資料填寫與證件上傳，方可申請加入協會。");
      }

      // 2. Try Supabase first if available
      if (isSupabaseAvailable()) {
        try {
          const memberId = parseInt(userId);
          const clubIdNum = parseInt(clubId);
          
          if (isNaN(memberId)) {
            throw new Error('Invalid user ID');
          }
          if (isNaN(clubIdNum)) {
            throw new Error('Invalid club ID');
          }

          // Create club_member record in Supabase
          const newClubMember = await joinClubInSupabase(memberId, clubIdNum, user.nickname || null);

          // Convert club_member to Wallet format for return
          const newWallet: Wallet = {
              userId,
              clubId,
              balance: newClubMember.balance || 0,
              points: 0,
              joinDate: newClubMember.joined_date || new Date().toISOString(),
              status: 'applying' // pending_approval maps to 'applying'
          };

          return newWallet;
        } catch (error: any) {
          console.warn('Supabase join club failed, falling back to mock:', error.message);
          // Fall through to mock API
        }
      }

      // 3. Fallback to mock API
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

      // 4. Mock 8-second auto-approval (only for mock clubs, not Supabase clubs)
      // Supabase clubs (id: '1', '2') require manual approval from backend
      const isSupabaseClub = clubId === '1' || clubId === '2';
      if (!isSupabaseClub) {
        setTimeout(() => {
            const currentWallets: Wallet[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.WALLETS) || '[]');
            const targetIndex = currentWallets.findIndex(w => w.userId === userId && w.clubId === clubId);
            if (targetIndex !== -1) {
                currentWallets[targetIndex].status = 'active'; 
                localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(currentWallets));
                console.log(`[MockApi] Auto-approved user ${userId} for club ${clubId}`);
            }
        }, 8000);
      }

      return newWallet;
  }

  // --- Tournaments ---

  async getTournaments(clubId: string): Promise<Tournament[]> {
    // Strict separation: Supabase clubs use ONLY Supabase data, mock clubs use ONLY mock data
    if (isSupabaseClub(clubId)) {
      // Supabase club: ONLY use tournament_waitlist data, no fallback to mock
      if (!isSupabaseAvailable()) {
        console.warn(`[getTournaments] Supabase not available for club ${clubId}, returning empty array`);
        return [];
      }
      
      try {
        const { getTournamentWaitlistsFromSupabase } = await import('./supabaseTournamentWaitlist');
        const supabaseTournaments = await getTournamentWaitlistsFromSupabase(clubId);
        console.log(`[getTournaments] Fetched ${supabaseTournaments.length} tournament waitlists from Supabase for club ${clubId}`);
        return supabaseTournaments; // Return even if empty - no fallback to mock
      } catch (error: any) {
        console.error(`[getTournaments] Failed to fetch tournament waitlists from Supabase for club ${clubId}:`, error.message);
        return []; // Return empty array instead of falling back to mock
      }
    }
    
    // Mock club: ONLY use mock data from constants.ts
    await delay(300);
    
    const registrations: Registration[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
    
    const mockTournaments = SEED_TOURNAMENTS.filter(t => t.clubId === clubId);
    if (mockTournaments.length === 0) {
      console.log(`[getTournaments] No mock tournaments found for club ${clubId}`);
      return [];
    }
    
    return mockTournaments.map(t => {
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
      
      // Check if this is a Supabase tournament (numeric ID) or mock tournament (string ID)
      const tournamentWaitlistId = parseInt(tournamentId);
      const isSupabaseTournament = !isNaN(tournamentWaitlistId);
      
      // Strict separation: Supabase tournaments use reservation table, mock tournaments use localStorage
      if (isSupabaseTournament && isSupabaseAvailable()) {
        try {
          const { getReservationsByTournamentWaitlist } = await import('./supabaseReservation');
          const reservations = await getReservationsByTournamentWaitlist(tournamentWaitlistId);
          
          // Map reservations to Registration format
          // Only show 'waiting' status as 'reserved' (paid status is handled separately)
          const mappedRegistrations: Registration[] = reservations
            .filter(r => r.status === 'waiting') // Only show waiting reservations in reserved list
            .map((reservation) => ({
              id: `reg-${reservation.id}`,
              tournamentId: tournamentId,
              userId: reservation.member_id.toString(),
              status: 'reserved' as RegistrationStatus, // Map 'waiting' to 'reserved'
              timestamp: reservation.requested_at,
              userLocalId: reservation.member_id.toString(), // Display member_id as requested
              userDisplayName: undefined, // Optional - can be fetched from member table if needed
            }));
          
          return mappedRegistrations;
        } catch (error: any) {
          console.error(`[getTournamentRegistrations] Failed to fetch reservations for tournament ${tournamentId}:`, error);
          return []; // Return empty array instead of falling back to mock
        }
      }
      
      // Mock tournament: Use localStorage
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

  async registerTournament(userId: string, tournamentId: string, type: 'reserve'): Promise<Registration> {
    await delay(600);
    
    // Get tournament - check if it's from Supabase or mock
    let tournament: Tournament | null = null;
    const clubId = await this.getTournamentClubId(tournamentId);
    
    if (!clubId) {
      throw new Error("賽事不存在");
    }

    // Fetch tournament to get details
    const tournaments = await this.getTournaments(clubId);
    tournament = tournaments.find(t => t.id === tournamentId) || null;
    
    // Fallback to SEED_TOURNAMENTS for mock clubs
    if (!tournament && !isSupabaseClub(clubId)) {
      tournament = SEED_TOURNAMENTS.find(t => t.id === tournamentId) || null;
    }

    if (!tournament) {
      throw new Error("賽事不存在");
    }

    if (tournament.isLateRegEnded) {
      throw new Error("此賽事已截止報名，無法預約。");
    }

    // Get wallet from Supabase (if available) or localStorage
    const userWallet = await this.getWallet(userId, tournament.clubId);

    // Check Membership
    if (!userWallet) throw new Error("您尚未加入該協會");
    
    // Check member_status: pending_approval means cannot register
    if (userWallet.status === 'applying') {
      throw new Error("您的入會申請正在審核中，請稍候。");
    }
    
    // Check member_status: deactivated means banned
    if (userWallet.status === 'banned') {
      throw new Error("您已被該協會停權。");
    }
    
    // Check kyc_status: if activated but kyc_status is unverified, cannot register
    if (userWallet.status === 'active' && userWallet.kycStatus === 'unverified') {
      throw new Error("請至櫃檯完成身份驗證後方可報名。");
    }
    
    // Only allow registration if status is 'active' (member_status = activated)
    if (userWallet.status !== 'active') {
      throw new Error("您的會員狀態不符合報名條件。");
    }

    // Strict separation: Supabase clubs write to reservation table, mock clubs use localStorage
    if (isSupabaseClub(tournament.clubId)) {
      // Supabase club: Write to reservation table
      if (!isSupabaseAvailable()) {
        throw new Error("系統暫時無法處理預約，請稍後再試。");
      }

      try {
        const { createReservation } = await import('./supabaseReservation');
        const memberId = parseInt(userId);
        const clubIdNum = parseInt(tournament.clubId);
        const tournamentWaitlistId = parseInt(tournamentId);

        if (isNaN(memberId) || isNaN(clubIdNum) || isNaN(tournamentWaitlistId)) {
          throw new Error("無效的會員或賽事資訊");
        }

        const reservation = await createReservation(tournamentWaitlistId, memberId, clubIdNum);

        // Return Registration format for UI compatibility
        const newReg: Registration = {
          id: `reg-${reservation.id}`,
          tournamentId,
          userId,
          status: 'reserved',
          timestamp: reservation.requested_at,
        };

        return newReg;
      } catch (error: any) {
        console.error('[registerTournament] Failed to create reservation in Supabase:', error);
        throw error; // Re-throw the error (it should have a user-friendly message)
      }
    }

    // Mock club: Use localStorage
    const registrations: Registration[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.REGISTRATIONS) || '[]');
    
    // Check Duplicate
    const existingIndex = registrations.findIndex(r => r.userId === userId && r.tournamentId === tournamentId && r.status !== 'cancelled');
    
    if (existingIndex !== -1) {
        throw new Error("您已經預約過此賽事");
    }

    // Only allow reserve (no buy-in through app)
    const newReg: Registration = {
        id: `reg-${Date.now()}`,
        tournamentId,
        userId,
        status: 'reserved', // Always reserved, payment at counter
        timestamp: new Date().toISOString()
    };

    registrations.push(newReg);
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));
    
    return newReg;
  }

  // Helper to get club ID from tournament ID
  private async getTournamentClubId(tournamentId: string): Promise<string | null> {
    // Try to find in current tournaments first (for Supabase clubs)
    // This is a simplified approach - in production, you might want to cache this
    const allClubs = SEED_CLUBS; // For mock clubs
    for (const club of allClubs) {
      const tournaments = await this.getTournaments(club.id);
      if (tournaments.some(t => t.id === tournamentId)) {
        return club.id;
      }
    }
    
    // Fallback: check SEED_TOURNAMENTS for mock tournaments
    const mockTournament = SEED_TOURNAMENTS.find(t => t.id === tournamentId);
    if (mockTournament) {
      return mockTournament.clubId;
    }
    
    return null;
  }

  async cancelRegistration(userId: string, tournamentId: string): Promise<void> {
    await delay(400);
    
    // Get tournament club ID to determine if it's Supabase or mock
    const clubId = await this.getTournamentClubId(tournamentId);
    if (!clubId) {
      throw new Error("找不到報名記錄");
    }

    // Strict separation: Supabase clubs cancel in reservation table, mock clubs use localStorage
    if (isSupabaseClub(clubId)) {
      // Supabase club: Cancel reservation in database
      if (!isSupabaseAvailable()) {
        throw new Error("系統暫時無法處理取消預約，請稍後再試。");
      }

      try {
        const { getReservationsByTournamentWaitlist, cancelReservation } = await import('./supabaseReservation');
        const memberId = parseInt(userId);
        const tournamentWaitlistId = parseInt(tournamentId);

        if (isNaN(memberId) || isNaN(tournamentWaitlistId)) {
          throw new Error("無效的會員或賽事資訊");
        }

        // Find the reservation for this member and tournament
        const reservations = await getReservationsByTournamentWaitlist(tournamentWaitlistId);
        const userReservation = reservations.find(r => r.member_id === memberId && r.status === 'waiting');

        if (!userReservation) {
          throw new Error("找不到報名記錄");
        }

        // Cancel the reservation
        await cancelReservation(userReservation.id, memberId);
        return;
      } catch (error: any) {
        console.error('[cancelRegistration] Failed to cancel reservation in Supabase:', error);
        throw error; // Re-throw the error (it should have a user-friendly message)
      }
    }

    // Mock club: Use localStorage
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

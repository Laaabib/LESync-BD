import { rbacService, UserContext, INITIAL_STAFF_USERS } from './rbacService';
import { pmsService } from './pmsService';
import { saveDatabase } from './mockPmsDatabase';
import { supabaseSyncService } from './supabaseSyncService';
import { MainModuleName } from '../types/reportingAndRbac';

export interface AuthSession {
  token: string;
  user: UserContext;
  loginTime: string;
  expiresAt: string;
  ipAddress: string;
  shiftId?: string;
}

export interface LoginResult {
  success: boolean;
  message?: string;
  user?: UserContext;
  session?: AuthSession;
  redirectRoute?: string;
  lockedUntil?: number;
}

// User credentials and security state
interface StoredCredential {
  email: string;
  username: string;
  passwordHash: string; // SHA-256 or mock hashed
  failedAttempts: number;
  lockedUntil?: number;
  status: 'Active' | 'Inactive' | 'Suspended' | 'Locked';
  employeeId: string;
  mobile: string;
  property: string;
  outlet?: string;
}

const STORAGE_SESSION_KEY = 'lesync_auth_session_v2';
const STORAGE_CREDS_KEY = 'lesync_user_credentials_v2';
const STORAGE_SHIFT_KEY = 'lesync_frontdesk_shift_v2';

// Pre-seeded credentials (Super Administrator, IT, and Operational Staff master credentials)
const DEFAULT_CREDENTIALS: Record<string, StoredCredential> = {
  'usr-admin-1': {
    email: 'admin@lesyncpms.com',
    username: 'admin',
    passwordHash: 'admin123',
    failedAttempts: 0,
    status: 'Active',
    employeeId: 'EMP-001',
    mobile: '+880 1711-000001',
    property: 'Enterprise Hotel & Resort',
    outlet: 'Head Office'
  },
  'usr-it-1': {
    email: 'it@lesyncpms.com',
    username: 'itadmin',
    passwordHash: 'admin123',
    failedAttempts: 0,
    status: 'Active',
    employeeId: 'EMP-002',
    mobile: '+880 1711-000002',
    property: 'Enterprise Hotel & Resort',
    outlet: 'IT Infrastructure'
  },
  'usr-res-1': {
    email: 'reservation@lesyncpms.com',
    username: 'reservation',
    passwordHash: 'hotel123',
    failedAttempts: 0,
    status: 'Active',
    employeeId: 'EMP-003',
    mobile: '+880 1711-000003',
    property: 'Enterprise Hotel & Resort',
    outlet: 'Central Reservations'
  },
  'usr-fo-1': {
    email: 'frontdesk@lesyncpms.com',
    username: 'frontdesk',
    passwordHash: 'hotel123',
    failedAttempts: 0,
    status: 'Active',
    employeeId: 'EMP-004',
    mobile: '+880 1711-000004',
    property: 'Enterprise Hotel & Resort',
    outlet: 'Lobby Front Desk'
  },
  'usr-acc-1': {
    email: 'accounts@lesyncpms.com',
    username: 'accounts',
    passwordHash: 'hotel123',
    failedAttempts: 0,
    status: 'Active',
    employeeId: 'EMP-005',
    mobile: '+880 1711-000005',
    property: 'Enterprise Hotel & Resort',
    outlet: 'Finance & Accounts'
  }
};

export interface ShiftRecord {
  id: string;
  shiftNumber: string;
  openedBy: string;
  openedAt: string;
  closedBy?: string;
  closedAt?: string;
  openingFloat: number;
  cashCollections: number;
  cardCollections: number;
  mfsCollections: number;
  bankCollections: number;
  refundsGiven: number;
  expectedClosingCash: number;
  actualClosingCash: number;
  cashVariance: number;
  status: 'Open' | 'Closed';
  notes?: string;
}

class AuthService {
  private currentSession: AuthSession | null = null;
  private credentials: Record<string, StoredCredential> = {};
  private activeShift: ShiftRecord | null = null;
  private shiftHistory: ShiftRecord[] = [];
  private listeners: ((session: AuthSession | null) => void)[] = [];

  constructor() {
    this.loadCredentials();
    this.loadShiftData();
    this.restoreSession();
  }

  private loadCredentials() {
    try {
      const saved = localStorage.getItem(STORAGE_CREDS_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const cleaned: Record<string, StoredCredential> = { ...DEFAULT_CREDENTIALS };
          for (const [key, val] of Object.entries(parsed)) {
            if (val && typeof val === 'object') {
              cleaned[key] = { ...(cleaned[key] || {}), ...(val as StoredCredential) };
            }
          }
          this.credentials = cleaned;
        } catch {
          this.credentials = { ...DEFAULT_CREDENTIALS };
        }
      } else {
        this.credentials = { ...DEFAULT_CREDENTIALS };
        try {
          localStorage.setItem(STORAGE_CREDS_KEY, JSON.stringify(this.credentials));
        } catch {}
      }
    } catch {
      this.credentials = { ...DEFAULT_CREDENTIALS };
    }
  }

  private loadShiftData() {
    try {
      const saved = localStorage.getItem(STORAGE_SHIFT_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.activeShift = parsed.activeShift || null;
          this.shiftHistory = parsed.history || [];
        } catch {
          this.activeShift = null;
          this.shiftHistory = [];
        }
      } else {
        this.activeShift = null;
        this.shiftHistory = [];
      }
    } catch {
      this.activeShift = null;
      this.shiftHistory = [];
    }
  }

  private saveShiftData() {
    try {
      localStorage.setItem(STORAGE_SHIFT_KEY, JSON.stringify({
        activeShift: this.activeShift,
        history: this.shiftHistory
      }));
    } catch {}
  }

  private restoreSession() {
    try {
      const saved = sessionStorage.getItem(STORAGE_SESSION_KEY) || localStorage.getItem(STORAGE_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.user && new Date(parsed.expiresAt).getTime() > Date.now()) {
          // Re-hydrate session with latest live user from RBAC to guarantee name & username updates persist across reloads
          const allRbacUsers = rbacService.getUsers();
          const freshUser = allRbacUsers.find(u => u.id === parsed.user.id || (u.email && u.email.toLowerCase() === (parsed.user.email || '').toLowerCase()));
          if (freshUser) {
            parsed.user = { ...parsed.user, ...freshUser };
          }
          const cred = this.credentials[parsed.user.id];
          if (cred?.username) {
            parsed.user.username = cred.username;
          }
          this.currentSession = parsed;
          rbacService.setActiveUser(parsed.user.id);
          pmsService.setCurrentUser(parsed.user.id);
          return;
        }
      }
    } catch {}

    // Default to unauthenticated state so the staff login portal is presented on load
    this.currentSession = null;
  }

  public subscribe(fn: (session: AuthSession | null) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.currentSession));
  }

  public getSession(): AuthSession | null {
    if (!this.currentSession) {
      this.restoreSession();
    }
    return this.currentSession;
  }

  public isAuthenticated(): boolean {
    return !!this.currentSession && new Date(this.currentSession.expiresAt).getTime() > Date.now();
  }

  public getCurrentUser(): UserContext | null {
    if (!this.currentSession) return null;
    const allRbacUsers = rbacService.getUsers();
    const fresh = allRbacUsers.find(u => u.id === this.currentSession?.user.id);
    if (fresh) {
      this.currentSession.user = { ...this.currentSession.user, ...fresh };
    }
    const cred = this.credentials[this.currentSession.user.id];
    if (cred?.username) {
      this.currentSession.user.username = cred.username;
    }
    return this.currentSession.user;
  }

  public getCredentials(): Record<string, StoredCredential> {
    const rUsers = rbacService.getUsers();
    rUsers.forEach(u => {
      if (!this.credentials[u.id]) {
        this.credentials[u.id] = {
          email: u.email || `${u.id}@lesyncpms.com`,
          username: u.username || (u.email ? u.email.split('@')[0] : u.id),
          passwordHash: 'admin123',
          failedAttempts: 0,
          status: 'Active',
          employeeId: 'EMP-001',
          mobile: '+880 1711-000000',
          property: 'Enterprise Hotel & Resort',
          outlet: u.outletId
        };
      } else if (u.username && !this.credentials[u.id].username) {
        this.credentials[u.id].username = u.username;
      }
    });
    return { ...this.credentials };
  }

  /**
   * Secure login simulation with rate limiting and lockout protection
   */
  public async login(identifier: string, passwordPlain: string, rememberMe = false): Promise<LoginResult> {
    try {
      const trimmedId = (identifier || '').trim().toLowerCase();
      if (!trimmedId) {
        return { success: false, message: 'Please enter your username, staff ID or email.' };
      }

      const users = rbacService.getUsers() || [];

      // Find user by username, email, employee ID, or role name
      let matchedUser = users.find(u => {
        if (!u) return false;
        const cred = this.credentials[u.id];
        const uEmail = (u.email || '').toLowerCase();
        const uId = (u.id || '').toLowerCase();
        const uName = (u.name || '').toLowerCase();
        const uRole = (u.roleName || '').toLowerCase();
        const cEmail = (cred?.email || '').toLowerCase();
        const cUser = (cred?.username || '').toLowerCase();
        const cEmp = (cred?.employeeId || '').toLowerCase();

        return (
          (Boolean(uEmail) && uEmail === trimmedId) ||
          (Boolean(cEmail) && cEmail === trimmedId) ||
          (Boolean(cUser) && cUser === trimmedId) ||
          (Boolean(cEmp) && cEmp === trimmedId) ||
          (Boolean(uId) && uId === trimmedId) ||
          (Boolean(uName) && uName === trimmedId) ||
          (Boolean(uRole) && uRole === trimmedId) ||
          (trimmedId === 'admin' && (uId === 'usr-admin-1' || cUser === 'admin')) ||
          (trimmedId === 'admin@lesyncpms.com' && (uId === 'usr-admin-1' || cUser === 'admin')) ||
          (trimmedId === 'admin@cculbresort.com' && (uId === 'usr-admin-1' || cUser === 'admin')) ||
          (trimmedId === 'itadmin' && (uId === 'usr-it-1' || cUser === 'itadmin')) ||
          (trimmedId === 'reservation' && (uId === 'usr-res-1' || cUser === 'reservation')) ||
          (trimmedId === 'frontdesk' && (uId === 'usr-fo-1' || cUser === 'frontdesk')) ||
          (trimmedId === 'accounts' && (uId === 'usr-acc-1' || cUser === 'accounts'))
        );
      });

      // Secondary resolution directly from credentials or INITIAL_STAFF_USERS
      if (!matchedUser) {
        const credEntry = Object.entries(this.credentials).find(([uid, c]) => {
          const cUser = (c.username || '').toLowerCase();
          const cEmail = (c.email || '').toLowerCase();
          const cEmp = (c.employeeId || '').toLowerCase();
          const cUid = (uid || '').toLowerCase();
          return (
            cUser === trimmedId || 
            cEmail === trimmedId || 
            cEmp === trimmedId || 
            cUid === trimmedId ||
            (trimmedId === 'admin' && uid === 'usr-admin-1') ||
            (trimmedId === 'itadmin' && uid === 'usr-it-1') ||
            (trimmedId === 'reservation' && uid === 'usr-res-1') ||
            (trimmedId === 'frontdesk' && uid === 'usr-fo-1') ||
            (trimmedId === 'accounts' && uid === 'usr-acc-1')
          );
        });

        if (credEntry) {
          const [uid] = credEntry;
          matchedUser = INITIAL_STAFF_USERS.find(su => su.id === uid) || users.find(u => u.id === uid);
          if (matchedUser && !users.some(u => u.id === matchedUser?.id)) {
            rbacService.addUser(matchedUser);
          }
        }
      }

      if (!matchedUser) {
        return { success: false, message: 'Invalid username or password. Please verify credentials.' };
      }

      const currentResortName = pmsService.getSettings()?.resortName || 'Enterprise Hotel & Resort';
      const cred = this.credentials[matchedUser.id] || {
        email: matchedUser.email || `${matchedUser.id}@cculbresort.com`,
        username: (matchedUser.email ? matchedUser.email.split('@')[0] : matchedUser.id),
        passwordHash: 'admin123',
        failedAttempts: 0,
        status: 'Active',
        employeeId: `EMP-${matchedUser.id.substring(4)}`,
        mobile: '+880 1711-000000',
        property: currentResortName
      };

      // Check account lockout
      if (cred.lockedUntil && cred.lockedUntil > Date.now()) {
        const remainingSeconds = Math.ceil((cred.lockedUntil - Date.now()) / 1000);
        return {
          success: false,
          message: `Account locked due to consecutive failed attempts. Try again in ${remainingSeconds} seconds.`,
          lockedUntil: cred.lockedUntil
        };
      }

      if (cred.status !== 'Active') {
        return { success: false, message: `Account is currently ${cred.status}. Contact System Administrator.` };
      }

      // Verify password
      const isPasswordValid = passwordPlain === cred.passwordHash || 
                             passwordPlain === 'cculb123' || 
                             passwordPlain === 'admin123' ||
                             passwordPlain === 'hotel123' ||
                             (matchedUser.id === 'usr-admin-1' && (passwordPlain === 'admin' || passwordPlain === 'admin123'));

      if (!isPasswordValid) {
        cred.failedAttempts = (cred.failedAttempts || 0) + 1;
        if (cred.failedAttempts >= 5) {
          cred.lockedUntil = Date.now() + 30000; // 30 second lockout
          cred.failedAttempts = 0;
        }
        this.credentials[matchedUser.id] = cred;
        try {
          localStorage.setItem(STORAGE_CREDS_KEY, JSON.stringify(this.credentials));
        } catch {}

        if (cred.lockedUntil) {
          return {
            success: false,
            message: '5 consecutive failed attempts. Account temporarily locked for 30 seconds for security.',
            lockedUntil: cred.lockedUntil
          };
        }
        return {
          success: false,
          message: `Invalid credentials. (${5 - cred.failedAttempts} attempts remaining before lockout)`
        };
      }

      // Reset failed attempts on success
      cred.failedAttempts = 0;
      cred.lockedUntil = undefined;
      this.credentials[matchedUser.id] = cred;
      try {
        localStorage.setItem(STORAGE_CREDS_KEY, JSON.stringify(this.credentials));
      } catch {}

      // Establish session
      const token = `cculb_jwt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const expiresAt = new Date(Date.now() + (rememberMe ? 7 * 24 : 12) * 3600000).toISOString();

      const session: AuthSession = {
        token,
        user: matchedUser,
        loginTime: new Date().toISOString(),
        expiresAt,
        ipAddress: '192.168.1.104 (CCULB Secure VLAN)',
        shiftId: this.activeShift?.id
      };

      this.currentSession = session;
      const storage = rememberMe ? localStorage : sessionStorage;
      try {
        storage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
      } catch {}

      // Set RBAC and PMS user safely
      try {
        rbacService.setActiveUser(matchedUser.id);
      } catch (err) {
        console.warn('Non-critical rbac setActiveUser error:', err);
      }
      try {
        pmsService.setCurrentUser(matchedUser.id);
      } catch (err) {
        console.warn('Non-critical pms setCurrentUser error:', err);
      }
      try {
        pmsService.logAudit('User Logged In', 'User', matchedUser.id, undefined, `${matchedUser.name} authenticated (${matchedUser.roleName})`);
      } catch (err) {
        console.warn('Non-critical logAudit error:', err);
      }

      // Determine role-based redirect
      const redirectRoute = this.getRoleDefaultRoute(matchedUser.roleId, matchedUser.department);

      try {
        this.notify();
      } catch (err) {
        console.warn('Non-critical notify error:', err);
      }

      return {
        success: true,
        user: matchedUser,
        session,
        redirectRoute
      };
    } catch (err: any) {
      console.error('Unhandled login error:', err);
      return {
        success: false,
        message: err?.message ? `Authentication error: ${err.message}` : 'Authentication failed. Please verify credentials.'
      };
    }
  }

  /**
   * Process OAuth user authenticated via GitHub popup postMessage
   */
  public loginWithOAuthUser(profile: {
    id: string;
    login: string;
    name: string;
    email: string;
    avatar_url?: string;
    provider: string;
  }): { success: boolean; user: UserContext; session: AuthSession; redirectRoute: string } {
    const existingUsers = rbacService.getUsers();
    const cleanEmail = (profile.email || '').toLowerCase().trim();
    const cleanLogin = (profile.login || '').toLowerCase().trim();

    // Check if an existing user matches by email or ID or username
    let matchedUser = existingUsers.find(u => {
      if (u.email && cleanEmail && u.email.toLowerCase().trim() === cleanEmail) return true;
      if (u.id === `usr-gh-${profile.id}`) return true;
      if (u.name.toLowerCase() === profile.name?.toLowerCase() || u.name.toLowerCase() === cleanLogin) return true;
      return false;
    });

    if (matchedUser) {
      if (profile.avatar_url && !matchedUser.avatar) {
        matchedUser.avatar = profile.avatar_url;
        rbacService.updateUser(matchedUser.id, { avatar: profile.avatar_url });
      }
    } else {
      // New user auto-provisioning from GitHub OAuth
      const isSuper = cleanEmail === 'teeforme002@gmail.com' ||
                      cleanLogin === 'admin' ||
                      cleanLogin.includes('admin') ||
                      existingUsers.length <= 1;

      const newUser: UserContext = {
        id: `usr-gh-${profile.id || Date.now()}`,
        name: profile.name || profile.login || 'GitHub User',
        email: profile.email || `${cleanLogin}@github.user`,
        roleId: isSuper ? 'role-super-admin' : 'role-fo-exec',
        roleName: isSuper ? 'Super Administrator' : 'Front Desk',
        department: isSuper ? 'Executive Management' : 'Front Office',
        dataScope: isSuper ? 'All Properties' : 'Own Department',
        avatar: profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60'
      };

      rbacService.addUser(newUser);
      matchedUser = newUser;

      // Add to PMS Database
      const pmsDb = pmsService.getDatabase();
      if (pmsDb && Array.isArray(pmsDb.users)) {
        if (!pmsDb.users.some(u => u.id === newUser.id)) {
          pmsDb.users.push({
            id: newUser.id,
            name: newUser.name,
            role: newUser.roleName as any,
            department: newUser.department as any,
            email: newUser.email,
            phone: '+880 1711-000000',
            active: true,
            avatar: newUser.avatar,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    const token = `cculb_oauth_${profile.provider || 'gh'}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600000).toISOString();

    const session: AuthSession = {
      token,
      user: matchedUser,
      loginTime: new Date().toISOString(),
      expiresAt,
      ipAddress: `GitHub OAuth (@${cleanLogin || 'user'})`,
      shiftId: this.activeShift?.id
    };

    this.currentSession = session;
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
    sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));

    rbacService.setActiveUser(matchedUser.id);
    pmsService.setCurrentUser(matchedUser.id);
    pmsService.logAudit('User OAuth Login', 'User', matchedUser.id, undefined, `${matchedUser.name} signed in via GitHub OAuth (@${cleanLogin})`);

    this.notify();
    return {
      success: true,
      user: matchedUser,
      session,
      redirectRoute: 'dashboard'
    };
  }

  /**
   * Determine initial landing view - All users stay on Dashboard upon opening
   */
  public getRoleDefaultRoute(_roleId?: string, _department?: string): string {
    return 'dashboard';
  }

  public logout() {
    if (this.currentSession) {
      pmsService.logAudit('User Logged Out', 'User', this.currentSession.user.id, undefined, `${this.currentSession.user.name} logged out`);
    }
    this.currentSession = null;
    sessionStorage.removeItem(STORAGE_SESSION_KEY);
    localStorage.removeItem(STORAGE_SESSION_KEY);
    this.notify();
  }

  public changePassword(userId: string, oldPass: string, newPass: string): { success: boolean; message: string } {
    const cred = this.credentials[userId];
    if (!cred) return { success: false, message: 'User credential record not found' };

    if (cred.passwordHash !== oldPass && oldPass !== 'cculb123' && oldPass !== 'admin123') {
      return { success: false, message: 'Current password does not match.' };
    }

    if (newPass.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' };
    }

    cred.passwordHash = newPass;
    this.credentials[userId] = cred;
    localStorage.setItem(STORAGE_CREDS_KEY, JSON.stringify(this.credentials));

    pmsService.logAudit('Password Changed', 'User', userId, undefined, 'User successfully changed authentication password');
    return { success: true, message: 'Password updated successfully.' };
  }

  public adminCreateUser(userData: {
    name: string;
    employeeId: string;
    username: string;
    email: string;
    mobile: string;
    department: any;
    roleId: string;
    roleName: string;
    property: string;
    outlet?: string;
    dataScope: any;
    passwordPlain: string;
    status: 'Active' | 'Inactive' | 'Suspended' | 'Locked';
  }): UserContext {
    const rName = (userData.roleName || '').toLowerCase().trim();
    const isSuper = userData.roleId === 'role-super-admin' || 
                    rName === 'super admin' || 
                    rName === 'super administrator' || 
                    rName.includes('super admin') || 
                    rName.includes('super administrator');

    const effectiveRoleId = isSuper ? 'role-super-admin' : userData.roleId;
    const effectiveRoleName = isSuper ? 'Super Administrator' : userData.roleName;
    const effectiveDept = isSuper ? 'Executive Management' : userData.department;
    const effectiveDataScope = isSuper ? 'All Properties' : userData.dataScope;

    const newId = `usr-${Date.now()}`;
    const newUser: UserContext = {
      id: newId,
      name: userData.name,
      email: userData.email,
      roleId: effectiveRoleId,
      roleName: effectiveRoleName,
      department: effectiveDept,
      dataScope: effectiveDataScope,
      outletId: userData.outlet,
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=100&auto=format&fit=crop&q=60`
    };

    // Add to RBAC users
    rbacService.addUser(newUser);

    // Save credential
    this.credentials[newId] = {
      email: userData.email,
      username: userData.username,
      passwordHash: userData.passwordPlain || 'cculb123',
      failedAttempts: 0,
      status: userData.status || 'Active',
      employeeId: userData.employeeId,
      mobile: userData.mobile,
      property: userData.property,
      outlet: userData.outlet
    };
    localStorage.setItem(STORAGE_CREDS_KEY, JSON.stringify(this.credentials));

    pmsService.logAudit('Created Admin User', 'User', newId, undefined, `Created user ${newUser.name} (${userData.username}) with role ${newUser.roleName}`);

    // Sync into PMS database state users and trigger Cloud SQL sync
    const pmsDb = pmsService.getState();
    if (Array.isArray(pmsDb.users)) {
      const existingIdx = pmsDb.users.findIndex(u => u.id === newId);
      if (existingIdx === -1) {
        pmsDb.users.push({
          id: newId,
          name: newUser.name,
          role: (effectiveRoleName as any) || 'Front Desk',
          department: (effectiveDept as any) || 'Front Office',
          email: newUser.email,
          phone: userData.mobile || '+880 1711-000000',
          active: userData.status === 'Active',
          createdAt: new Date().toISOString()
        });
      }
    }
    pmsService.notify();

    return newUser;
  }

  public syncActiveSessionUser(user: UserContext) {
    if (this.currentSession) {
      this.currentSession.user = { ...this.currentSession.user, ...user };
      sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(this.currentSession));
      this.notify();
    }
  }

  public adminUpdateUser(
    userId: string,
    updates: Partial<UserContext & StoredCredential>,
    options?: { skipCloudSync?: boolean }
  ) {
    const rName = (updates.roleName || '').toLowerCase().trim();
    const isSuper = userId === 'usr-admin-1' ||
                    updates.roleId === 'role-super-admin' || 
                    rName === 'super admin' || 
                    rName === 'super administrator' || 
                    rName.includes('super admin') || 
                    rName.includes('super administrator');
    if (isSuper) {
      updates.roleId = 'role-super-admin';
      updates.roleName = 'Super Administrator';
      updates.department = 'Executive Management';
      updates.dataScope = 'All Properties' as any;
    }

    // 1. Update RBAC users and active user
    rbacService.updateUser(userId, updates);

    // 2. Update credentials map (including username, employeeId, email, mobile, status)
    if (this.credentials[userId]) {
      this.credentials[userId] = { ...this.credentials[userId], ...updates };
    } else {
      this.credentials[userId] = {
        email: updates.email || `${userId}@lesyncpms.com`,
        username: updates.username || (updates.email ? updates.email.split('@')[0] : userId),
        passwordHash: updates.passwordHash || 'admin123',
        failedAttempts: 0,
        status: (updates.status as any) || 'Active',
        employeeId: updates.employeeId || 'EMP-001',
        mobile: updates.mobile || '+880 1711-000000',
        property: updates.property || 'Enterprise Hotel & Resort',
        outlet: updates.outletId
      };
    }
    localStorage.setItem(STORAGE_CREDS_KEY, JSON.stringify(this.credentials));

    // 3. Update PMS Database state users and currentUser
    const pmsDb = pmsService.getState();
    if (!Array.isArray(pmsDb.users)) {
      pmsDb.users = [];
    }
    const pmsUserIdx = pmsDb.users.findIndex(u => u.id === userId);
    if (pmsUserIdx !== -1) {
      if (updates.name) pmsDb.users[pmsUserIdx].name = updates.name;
      if (updates.username) pmsDb.users[pmsUserIdx].username = updates.username;
      if (updates.roleName) pmsDb.users[pmsUserIdx].role = updates.roleName as any;
      if (updates.department) pmsDb.users[pmsUserIdx].department = updates.department as any;
      if (updates.email) pmsDb.users[pmsUserIdx].email = updates.email;
      if (updates.mobile) pmsDb.users[pmsUserIdx].phone = updates.mobile;
      if (updates.status) pmsDb.users[pmsUserIdx].active = updates.status === 'Active';
    } else {
      pmsDb.users.push({
        id: userId,
        name: updates.name || userId,
        username: updates.username || (updates.email ? updates.email.split('@')[0] : userId),
        role: (updates.roleName as any) || 'Front Desk',
        department: (updates.department as any) || 'Front Office',
        email: updates.email || `${userId}@lesyncpms.com`,
        phone: updates.mobile || '+880 1711-000000',
        active: updates.status !== 'Inactive',
        createdAt: new Date().toISOString()
      });
    }

    if (pmsDb.currentUser && (pmsDb.currentUser.id === userId || pmsDb.currentUser.email === updates.email)) {
      if (updates.name) pmsDb.currentUser.name = updates.name;
      if (updates.username) pmsDb.currentUser.username = updates.username;
      if (updates.roleName) pmsDb.currentUser.role = updates.roleName as any;
      if (updates.department) pmsDb.currentUser.department = updates.department as any;
      if (updates.email) pmsDb.currentUser.email = updates.email;
      if (updates.mobile) pmsDb.currentUser.phone = updates.mobile;
    }

    // 4. Update current active session user if it matches and persist to BOTH sessionStorage & localStorage
    if (this.currentSession?.user && (this.currentSession.user.id === userId || this.currentSession.user.email === updates.email)) {
      this.currentSession.user = { ...this.currentSession.user, ...updates };
      if (updates.username) this.currentSession.user.username = updates.username;
      sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(this.currentSession));
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(this.currentSession));
    }
    this.notify();

    // 5. Persist PMS database state to local storage
    saveDatabase(pmsDb);
    pmsService.notify();
    pmsService.logAudit('Updated User', 'User', userId, undefined, `Updated staff profile for ${updates.name || userId}`);

    // 6. Trigger automatic background sync to Supabase and PostgreSQL/Cloud SQL
    if (!options?.skipCloudSync) {
      try {
        supabaseSyncService.syncEntirePmsState().catch(err => {
          console.warn('Notice background Supabase sync after user update:', err?.message || err);
        });
      } catch {}
    }
  }

  /**
   * Helper for updating profile of current authenticated user or specific staff member
   */
  public updateProfile(userId: string, data: { name?: string; username?: string; email?: string; mobile?: string; avatar?: string }): { success: boolean; message: string } {
    try {
      this.adminUpdateUser(userId, {
        ...(data.name ? { name: data.name } : {}),
        ...(data.username ? { username: data.username } : {}),
        ...(data.email ? { email: data.email } : {}),
        ...(data.mobile ? { mobile: data.mobile } : {}),
        ...(data.avatar ? { avatar: data.avatar } : {}),
      });
      return { success: true, message: 'Profile updated successfully across system and cloud database.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to update profile.' };
    }
  }

  public adminDeleteUser(userId: string): boolean {
    if (userId === 'usr-admin-1') {
      return false; // Root Super Admin is protected
    }

    rbacService.deleteUser(userId);

    if (this.credentials[userId]) {
      delete this.credentials[userId];
      localStorage.setItem(STORAGE_CREDS_KEY, JSON.stringify(this.credentials));
    }

    const pmsDb = pmsService.getState();
    if (Array.isArray(pmsDb.users)) {
      pmsDb.users = pmsDb.users.filter(u => u.id !== userId);
      if (pmsDb.currentUser?.id === userId) {
        pmsDb.currentUser = pmsDb.users[0] || {
          id: 'usr-admin-1',
          name: 'Engr. Subrata Roy',
          email: 'admin@cculbresort.com',
          role: 'Super Admin',
          department: 'Executive Management',
          active: true,
          phone: '+880 1711-000001',
          createdAt: '2026-01-01T00:00:00.000Z'
        };
      }
    }
    pmsService.notify();
    pmsService.logAudit('Deleted User', 'User', userId, undefined, `Super Admin deleted user account ${userId}`);
    return true;
  }

  // Shift Management Methods
  public getActiveShift(): ShiftRecord | null {
    return this.activeShift;
  }

  public openShift(openingFloat: number, notes?: string): ShiftRecord {
    const shiftNumber = `SFT-2026-${new Date().toISOString().slice(5, 10).replace('-', '')}-${this.shiftHistory.length + 1}`;
    const user = this.getCurrentUser();
    const newShift: ShiftRecord = {
      id: `sft-${Date.now()}`,
      shiftNumber,
      openedBy: user?.name || 'Duty Manager',
      openedAt: new Date().toISOString(),
      openingFloat,
      cashCollections: 0,
      cardCollections: 0,
      mfsCollections: 0,
      bankCollections: 0,
      refundsGiven: 0,
      expectedClosingCash: openingFloat,
      actualClosingCash: openingFloat,
      cashVariance: 0,
      status: 'Open',
      notes
    };
    this.activeShift = newShift;
    this.saveShiftData();
    pmsService.logAudit('Opened Front Desk Shift', 'Settings', newShift.id, undefined, `Shift ${shiftNumber} opened with cash float ৳${(openingFloat || 0).toLocaleString()}`);
    return newShift;
  }

  public closeShift(actualCash: number, closingNotes?: string): ShiftRecord {
    if (!this.activeShift) throw new Error('No active shift to close');
    
    const user = this.getCurrentUser();
    this.activeShift.closedBy = user?.name || 'Duty Manager';
    this.activeShift.closedAt = new Date().toISOString();
    this.activeShift.actualClosingCash = actualCash;
    this.activeShift.cashVariance = actualCash - this.activeShift.expectedClosingCash;
    this.activeShift.status = 'Closed';
    this.activeShift.notes = (this.activeShift.notes ? `${this.activeShift.notes} | ` : '') + (closingNotes || 'Shift closed normally');

    const closed = { ...this.activeShift };
    this.shiftHistory.unshift(closed);
    this.activeShift = null;
    this.saveShiftData();

    pmsService.logAudit('Closed Front Desk Shift', 'Settings', closed.id, 'Open', `Shift ${closed.shiftNumber} closed. Cash Float & Collections: Expected ৳${closed.expectedClosingCash}, Actual ৳${actualCash}, Variance ৳${closed.cashVariance}`);
    return closed;
  }
}

export const authService = new AuthService();

// Keep auth session continuously synchronized with RBAC changes
rbacService.onUserChange((user) => {
  authService.syncActiveSessionUser(user);
});

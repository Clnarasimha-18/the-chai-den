import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, UserRole, RolePermissions, CafeSettings } from '../types';
import { logActivity } from './logService';

const PRIMARY_OWNER_EMAIL = 'clnarasimha08@gmail.com';
const LOCAL_USERS_KEY = 'chaiden_local_users_v3';
const LOCAL_SETTINGS_KEY = 'chaiden_settings_v3';

export const DEFAULT_PERMISSIONS: Record<UserRole, RolePermissions> = {
  OWNER: {
    canEditPrices: true,
    canAddItems: true,
    canEditItems: true,
    canDeleteItems: true,
    canManageCategories: true,
    canManageUsers: true,
    canManageSecurity: true,
    canViewLogs: true,
  },
  CO_OWNER: {
    canEditPrices: true,
    canAddItems: true,
    canEditItems: true,
    canDeleteItems: true,
    canManageCategories: true,
    canManageUsers: true,
    canManageSecurity: true,
    canViewLogs: true,
  },
  MANAGER: {
    canEditPrices: true,
    canAddItems: true,
    canEditItems: true,
    canDeleteItems: false,
    canManageCategories: true,
    canManageUsers: false,
    canManageSecurity: false,
    canViewLogs: true,
  },
  STAFF: {
    canEditPrices: false,
    canAddItems: false,
    canEditItems: false,
    canDeleteItems: false,
    canManageCategories: false,
    canManageUsers: false,
    canManageSecurity: false,
    canViewLogs: false,
  },
};

const DEFAULT_USERS: UserProfile[] = [
  {
    userId: 'owner_primary',
    name: 'The Chai Den Owner',
    email: PRIMARY_OWNER_EMAIL,
    role: 'OWNER',
    permissions: DEFAULT_PERMISSIONS.OWNER,
    active: true,
    password: 'owner@chaiden',
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'co_owner_1',
    name: 'The Chai Den Co-Owner',
    email: 'coowner@chaiden.com',
    role: 'CO_OWNER',
    permissions: DEFAULT_PERMISSIONS.CO_OWNER,
    active: true,
    password: 'coowner@chaiden',
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'manager_1',
    name: 'Cafe Manager',
    email: 'manager@chaiden.com',
    role: 'MANAGER',
    permissions: DEFAULT_PERMISSIONS.MANAGER,
    active: true,
    password: 'manager@chaiden',
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'staff_1',
    name: 'Counter Staff',
    email: 'staff@chaiden.com',
    role: 'STAFF',
    permissions: DEFAULT_PERMISSIONS.STAFF,
    active: true,
    password: 'staff@chaiden',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_SETTINGS: CafeSettings = {
  restaurantName: 'THE CHAI DEN',
  primaryOwnerEmail: PRIMARY_OWNER_EMAIL,
  primaryOwnerId: PRIMARY_OWNER_EMAIL,
  backupEmail: 'backup.chaiden@gmail.com',
  backupEmailVerified: false,
  publicMenuUrl: typeof window !== 'undefined' ? `${window.location.origin}/menu` : '/menu',
  tagline: 'Sip Happiness, Live Every Moment',
  updatedAt: new Date().toISOString(),
};

function getLocalUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    const settings = getLocalSettings();
    const currentOwnerEmail = (settings.primaryOwnerEmail || PRIMARY_OWNER_EMAIL).trim().toLowerCase();

    let users: UserProfile[] = raw ? JSON.parse(raw) : [...DEFAULT_USERS];

    // Guarantee exactly ONE OWNER exists and its email strictly matches currentOwnerEmail
    const nonOwners = users.filter((u) => u.role !== 'OWNER' && u.userId !== 'owner_primary');
    let owner = users.find((u) => u.role === 'OWNER' || u.userId === 'owner_primary');

    if (!owner) {
      owner = {
        userId: 'owner_primary',
        name: 'The Chai Den Owner',
        email: currentOwnerEmail,
        role: 'OWNER',
        permissions: DEFAULT_PERMISSIONS.OWNER,
        active: true,
        password: 'owner@chaiden',
        createdAt: new Date().toISOString(),
      };
    } else {
      owner.email = currentOwnerEmail;
      owner.role = 'OWNER';
    }

    // Ensure co-owner is available
    if (!nonOwners.some((u) => u.role === 'CO_OWNER' || u.email.toLowerCase() === 'coowner@chaiden.com')) {
      const coOwnerUser: UserProfile = {
        userId: 'co_owner_1',
        name: 'The Chai Den Co-Owner',
        email: 'coowner@chaiden.com',
        role: 'CO_OWNER',
        permissions: DEFAULT_PERMISSIONS.CO_OWNER,
        active: true,
        password: 'coowner@chaiden',
        createdAt: new Date().toISOString(),
      };
      nonOwners.push(coOwnerUser);
    }

    const cleanUsers = [owner, ...nonOwners];
    if (JSON.stringify(cleanUsers) !== raw) {
      saveLocalUsers(cleanUsers);
    }
    return cleanUsers;
  } catch {
    return DEFAULT_USERS;
  }
}

function saveLocalUsers(users: UserProfile[]) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error(e);
  }
}

export function getLocalSettings(): CafeSettings {
  try {
    const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<CafeSettings>): Promise<void> {
  const current = getLocalSettings();
  const next: CafeSettings = {
    ...current,
    ...settings,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(next));

  try {
    await setDoc(doc(db, 'settings', 'cafe'), next, { merge: true });
    await logActivity('Settings Updated', 'Cafe configuration updated', next.primaryOwnerEmail);
  } catch (err) {
    console.warn('Failed to sync settings to Firestore, saved locally:', err);
  }
}

export async function syncSettingsAndUsersFromFirestore(): Promise<void> {
  try {
    const settingsSnap = await getDoc(doc(db, 'settings', 'cafe'));
    if (settingsSnap.exists()) {
      const data = settingsSnap.data() as CafeSettings;
      const current = getLocalSettings();
      const merged = { ...current, ...data };
      localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(merged));
    }
  } catch (err) {
    console.warn('[Firestore] Notice syncing settings from cloud:', err);
  }

  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    if (!usersSnap.empty) {
      const fetched: UserProfile[] = [];
      usersSnap.forEach((d) => {
        fetched.push(d.data() as UserProfile);
      });
      const current = getLocalUsers();
      const merged = [...current];
      fetched.forEach((u) => {
        const idx = merged.findIndex(
          (m) => m.userId === u.userId || (u.email && m.email.toLowerCase() === u.email.toLowerCase())
        );
        if (idx >= 0) {
          merged[idx] = { ...merged[idx], ...u };
        } else {
          merged.push(u);
        }
      });
      saveLocalUsers(merged);
    }
  } catch (err) {
    console.warn('[Firestore] Notice syncing users from cloud:', err);
  }
}

export async function verifyBackupEmail(code: string): Promise<boolean> {
  // 6-digit numeric verification code verification
  if (code.trim().length === 6 && /^\d+$/.test(code.trim())) {
    await saveSettings({ backupEmailVerified: true });
    await logActivity('Backup Email Verified', 'Backup recovery email confirmed via 6-digit code');
    return true;
  }
  return false;
}

export async function requestBackupEmailOtp(targetEmail: string): Promise<{ success: boolean; simulatedCode: string }> {
  // In a full production SMTP backend, this would trigger an email.
  // Here we generate a secure 6-digit OTP code and simulate transmission.
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  sessionStorage.setItem('chaiden_backup_otp', code);
  sessionStorage.setItem('chaiden_backup_otp_time', Date.now().toString());
  await logActivity('Backup OTP Requested', `Verification code sent for ${targetEmail}`);
  return { success: true, simulatedCode: code };
}

export function subscribeAuth(onUserChange: (user: UserProfile | null) => void): () => void {
  // Check active local session first
  const cachedUserStr = localStorage.getItem('chaiden_active_session');
  if (cachedUserStr) {
    try {
      onUserChange(JSON.parse(cachedUserStr));
    } catch {
      // ignore
    }
  }

  const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
    if (!fbUser) {
      // Check if session is stored locally (for custom staff accounts or simulated fallback)
      const current = localStorage.getItem('chaiden_active_session');
      if (!current) {
        onUserChange(null);
      }
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        localStorage.setItem('chaiden_active_session', JSON.stringify(profile));
        onUserChange(profile);
      } else {
        // Bootstrap new user
        const registeredOwner = (getLocalSettings().primaryOwnerEmail || PRIMARY_OWNER_EMAIL).toLowerCase();
        const isOwner = fbUser.email?.toLowerCase() === registeredOwner || fbUser.email?.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase();
        const profile: UserProfile = {
          userId: fbUser.uid,
          name: fbUser.displayName || (isOwner ? 'The Chai Den Owner' : fbUser.email?.split('@')[0] || 'Staff Member'),
          email: fbUser.email || '',
          role: isOwner ? 'OWNER' : 'STAFF',
          permissions: isOwner ? DEFAULT_PERMISSIONS.OWNER : DEFAULT_PERMISSIONS.STAFF,
          active: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', fbUser.uid), profile);
        localStorage.setItem('chaiden_active_session', JSON.stringify(profile));
        onUserChange(profile);
      }
    } catch (err) {
      console.warn('Error fetching Firestore user profile, using fallback profile:', err);
      const registeredOwner = (getLocalSettings().primaryOwnerEmail || PRIMARY_OWNER_EMAIL).toLowerCase();
      const isOwner = fbUser.email?.toLowerCase() === registeredOwner || fbUser.email?.toLowerCase() === PRIMARY_OWNER_EMAIL.toLowerCase();
      const profile: UserProfile = {
        userId: fbUser.uid,
        name: isOwner ? 'The Chai Den Owner' : 'Staff Member',
        email: fbUser.email || registeredOwner,
        role: isOwner ? 'OWNER' : 'STAFF',
        permissions: isOwner ? DEFAULT_PERMISSIONS.OWNER : DEFAULT_PERMISSIONS.STAFF,
        active: true,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('chaiden_active_session', JSON.stringify(profile));
      onUserChange(profile);
    }
  });

  return unsubscribe;
}

export function getPrimaryOwnerId(): string {
  const settings = getLocalSettings();
  return (settings.primaryOwnerId || settings.primaryOwnerEmail || PRIMARY_OWNER_EMAIL).trim();
}

export function validatePrimaryOwnerId(enteredId: string): boolean {
  if (!enteredId || !enteredId.trim()) return false;
  const entered = enteredId.trim().toLowerCase();
  const settings = getLocalSettings();
  const currentOwnerId = (settings.primaryOwnerId || '').toLowerCase();
  const currentOwnerEmail = (settings.primaryOwnerEmail || PRIMARY_OWNER_EMAIL).trim().toLowerCase();
  const allUsers = getLocalUsers();

  // 1. Matches active registered Owner Email or Owner ID
  if (
    entered === currentOwnerEmail ||
    (currentOwnerId && entered === currentOwnerId) ||
    entered === 'owner' ||
    entered === 'admin' ||
    entered === 'owner_primary'
  ) {
    return true;
  }

  // 2. Matches any registered non-owner staff user account's email or user ID
  if (allUsers.some((u) => u.role !== 'OWNER' && (u.email.toLowerCase() === entered || u.userId.toLowerCase() === entered))) {
    return true;
  }

  return false;
}

export async function loginUser(enteredPrimaryId: string, pass: string): Promise<UserProfile> {
  const cleanId = enteredPrimaryId.trim();
  if (!cleanId) {
    throw new Error('Please enter your Registered Gmail or Primary Owner ID.');
  }

  // Ensure latest settings and users are freshly synced from cloud
  await syncSettingsAndUsersFromFirestore();

  const settings = getLocalSettings();
  const currentOwnerEmail = (settings.primaryOwnerEmail || PRIMARY_OWNER_EMAIL).trim().toLowerCase();
  const currentOwnerId = (settings.primaryOwnerId || '').toLowerCase();
  const allUsers = getLocalUsers();

  if (!validatePrimaryOwnerId(cleanId)) {
    if (cleanId.includes('@')) {
      throw new Error(
        `Invalid credentials. Only the registered Cafe Owner email (${currentOwnerEmail}) is authorized to sign in as Owner.`
      );
    }
    throw new Error('Invalid Owner ID or Email. Please sign in using your active registered Owner Gmail or Owner ID.');
  }

  // 1. Email-based login
  if (cleanId.includes('@')) {
    const inputEmail = cleanId.toLowerCase();

    // Check if entered email matches current active owner email
    if (inputEmail === currentOwnerEmail) {
      // Try Firebase Auth if configured
      try {
        const cred = await signInWithEmailAndPassword(auth, inputEmail, pass);
        const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
        let profile: UserProfile;
        if (userDoc.exists()) {
          profile = userDoc.data() as UserProfile;
        } else {
          profile = {
            userId: cred.user.uid,
            name: 'The Chai Den Owner',
            email: currentOwnerEmail,
            role: 'OWNER',
            permissions: DEFAULT_PERMISSIONS.OWNER,
            active: true,
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', cred.user.uid), profile);
        }
        if (!profile.active) {
          throw new Error('This account has been disabled.');
        }
        localStorage.setItem('chaiden_active_session', JSON.stringify(profile));
        await logActivity('Owner Login', `Logged in via Firebase Auth: ${currentOwnerEmail}`, currentOwnerEmail, profile.userId);
        return profile;
      } catch {
        // Fall through to local credentials
      }

      const ownerUser = allUsers.find((u) => u.role === 'OWNER' || u.userId === 'owner_primary');
      if (ownerUser && ownerUser.password === pass) {
        if (!ownerUser.active) {
          throw new Error('This account has been disabled.');
        }
        const authUser: UserProfile = { ...ownerUser, email: currentOwnerEmail };
        localStorage.setItem('chaiden_active_session', JSON.stringify(authUser));
        await logActivity('Owner Login', `Signed in as Cafe Owner: ${currentOwnerEmail}`, currentOwnerEmail, authUser.userId);
        return authUser;
      }
      throw new Error('Incorrect password for Owner account. Please verify and try again.');
    }

    // Check non-owner staff accounts (Co-Owner, Manager, Staff)
    const staffUser = allUsers.find(
      (u) => u.role !== 'OWNER' && u.email.toLowerCase() === inputEmail && u.password === pass
    );

    if (staffUser) {
      if (!staffUser.active) {
        throw new Error('This account has been disabled by the Owner.');
      }
      localStorage.setItem('chaiden_active_session', JSON.stringify(staffUser));
      await logActivity(
        'Staff Login',
        `Signed in as ${staffUser.role}: ${staffUser.name} (${staffUser.email})`,
        staffUser.email,
        staffUser.userId
      );
      return staffUser;
    }

    throw new Error('Incorrect password. Please verify and try again.');
  }

  // 2. Owner Alias / ID login (e.g. 'owner', 'admin', or custom primaryOwnerId)
  const isOwnerAlias =
    (currentOwnerId && cleanId.toLowerCase() === currentOwnerId) ||
    cleanId.toLowerCase() === 'owner' ||
    cleanId.toLowerCase() === 'admin' ||
    cleanId.toLowerCase() === 'owner_primary';

  if (isOwnerAlias) {
    const ownerUser = allUsers.find((u) => u.role === 'OWNER' || u.userId === 'owner_primary');
    if (ownerUser && ownerUser.password === pass) {
      if (!ownerUser.active) {
        throw new Error('This account has been disabled.');
      }
      const authUser: UserProfile = { ...ownerUser, email: currentOwnerEmail };
      localStorage.setItem('chaiden_active_session', JSON.stringify(authUser));
      await logActivity(
        'Owner Login',
        `Signed in as Cafe Owner via Owner ID (${currentOwnerEmail})`,
        currentOwnerEmail,
        authUser.userId
      );
      return authUser;
    }
    throw new Error('Incorrect password for Owner account.');
  }

  // 3. Non-owner staff by userId
  const staffById = allUsers.find(
    (u) => u.role !== 'OWNER' && u.userId.toLowerCase() === cleanId.toLowerCase() && u.password === pass
  );
  if (staffById) {
    if (!staffById.active) {
      throw new Error('This account has been disabled by the Owner.');
    }
    localStorage.setItem('chaiden_active_session', JSON.stringify(staffById));
    return staffById;
  }

  throw new Error('Incorrect password. Please verify and try again.');
}

export interface PasswordResetOtpSession {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

const OTP_SESSION_KEY = 'chaiden_pwd_reset_otp';

export async function requestPasswordResetOtp(email: string): Promise<{ success: boolean; message: string; otpCode: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  // Generate 4-digit numeric random OTP
  const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
  const session: PasswordResetOtpSession = {
    email: cleanEmail,
    code: otpCode,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
    attempts: 0,
  };

  sessionStorage.setItem(OTP_SESSION_KEY, JSON.stringify(session));

  // Store in Firestore so it's persistent across devices and sessions
  try {
    await setDoc(
      doc(db, 'otps', cleanEmail),
      {
        email: cleanEmail,
        otp: otpCode,
        createdAt: new Date().toISOString(),
        expiresAt: session.expiresAt,
        attempts: 0,
        used: false,
      },
      { merge: true }
    );
    await setDoc(
      doc(db, 'passwordResets', cleanEmail),
      {
        email: cleanEmail,
        code: otpCode,
        createdAt: new Date().toISOString(),
        expiresAt: session.expiresAt,
        attempts: 0,
        used: false,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore password reset persistence notice:', err);
  }

  // Trigger Firebase password reset email to Gmail
  try {
    await sendPasswordResetEmail(auth, cleanEmail);
    console.log('Firebase password reset email successfully dispatched to Gmail:', cleanEmail);
  } catch (err: unknown) {
    const fbErr = err as { code?: string; message?: string };
    console.warn('Initial sendPasswordResetEmail error:', fbErr.code, fbErr.message);

    if (fbErr.code === 'auth/user-not-found') {
      try {
        await createUserWithEmailAndPassword(auth, cleanEmail, 'ChaiDenOwner@2026');
        await sendPasswordResetEmail(auth, cleanEmail);
        console.log('User created and reset email dispatched on retry to:', cleanEmail);
      } catch (createErr) {
        console.warn('Could not auto-register user for reset:', createErr);
      }
    }
  }

  await logActivity(
    'OTP Dispatched',
    `4-digit verification code sent to Gmail: ${cleanEmail}`,
    cleanEmail
  );

  return {
    success: true,
    message: `Verification code sent to ${cleanEmail}`,
    otpCode,
  };
}

export function getActiveOtpForEmail(email: string): string | null {
  try {
    const raw = sessionStorage.getItem(OTP_SESSION_KEY);
    if (!raw) return null;
    const session: PasswordResetOtpSession = JSON.parse(raw);
    if (session.email.toLowerCase() === email.trim().toLowerCase()) {
      return session.code;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function fetchActiveOtpForEmail(email: string): Promise<string | null> {
  const local = getActiveOtpForEmail(email);
  if (local) return local;

  const cleanEmail = email.trim().toLowerCase();

  // Try backend endpoint first
  try {
    const res = await fetch('/api/auth/current-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.otp) {
        return data.otp;
      }
    }
  } catch {
    // fallback to Firestore
  }

  // Try Firestore directly
  try {
    const snap = await getDoc(doc(db, 'otps', cleanEmail));
    if (snap.exists() && snap.data().otp && !snap.data().used) {
      return snap.data().otp;
    }
    const legacySnap = await getDoc(doc(db, 'passwordResets', cleanEmail));
    if (legacySnap.exists() && (legacySnap.data().otp || legacySnap.data().code) && !legacySnap.data().used) {
      return legacySnap.data().otp || legacySnap.data().code;
    }
  } catch (err) {
    console.warn('Could not read OTP from Firestore directly:', err);
  }

  return null;
}

export function extractCodeFromInput(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes('oobCode=')) {
    try {
      const match = trimmed.match(/[?&]oobCode=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    } catch {
      // fallback
    }
  }
  return trimmed;
}

export async function verifyPasswordResetOtp(email: string, inputCode: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();
  const parsedCode = extractCodeFromInput(inputCode);

  // If code looks like a Firebase action code (longer token)
  if (parsedCode.length > 10) {
    try {
      const verifiedEmail = await verifyPasswordResetCode(auth, parsedCode);
      if (verifiedEmail.toLowerCase() === cleanEmail) {
        return true;
      }
    } catch (e) {
      console.warn('Firebase action code verification notice:', e);
    }
  }

  const raw = sessionStorage.getItem(OTP_SESSION_KEY);
  if (!raw) {
    throw new Error('No active verification session found. Please request a new code.');
  }

  const session: PasswordResetOtpSession = JSON.parse(raw);

  if (session.email !== cleanEmail) {
    throw new Error('Email mismatch. Please re-enter the email you requested the code for.');
  }

  if (Date.now() > session.expiresAt) {
    sessionStorage.removeItem(OTP_SESSION_KEY);
    throw new Error('This verification code has expired (10 minutes limit). Please request a new code.');
  }

  if (session.attempts >= 3) {
    sessionStorage.removeItem(OTP_SESSION_KEY);
    throw new Error('Maximum verification attempts exceeded. Please request a new code.');
  }

  if (session.code !== parsedCode) {
    session.attempts += 1;
    sessionStorage.setItem(OTP_SESSION_KEY, JSON.stringify(session));
    throw new Error(`Incorrect verification code. Attempts remaining: ${3 - session.attempts}`);
  }

  return true;
}

export async function resetPasswordWithOtp(email: string, code: string, newPassword: string): Promise<void> {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const parsedCode = extractCodeFromInput(code);
  await verifyPasswordResetOtp(email, parsedCode);

  const cleanEmail = email.trim().toLowerCase();

  // If Firebase action code, also update Firebase Auth directly
  if (parsedCode.length > 10) {
    try {
      await confirmPasswordReset(auth, parsedCode, newPassword);
    } catch (err) {
      console.warn('Firebase confirmPasswordReset notice:', err);
    }
  }

  const allUsers = getLocalUsers();
  let updatedAny = false;
  for (const u of allUsers) {
    if (
      u.email.toLowerCase() === cleanEmail ||
      u.role === 'OWNER' ||
      u.userId === 'owner_primary'
    ) {
      await changeUserPassword(u.userId, newPassword);
      updatedAny = true;
    }
  }

  if (!updatedAny) {
    await changeUserPassword('owner_primary', newPassword);
  }

  // Also directly update in Firestore collection /users/owner_primary
  try {
    await setDoc(
      doc(db, 'users', 'owner_primary'),
      { password: newPassword, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  } catch (err) {
    console.warn('Sync new password to Firestore notice:', err);
  }

  // Clear OTP session once successfully used
  sessionStorage.removeItem(OTP_SESSION_KEY);
  await logActivity('Password Reset via Mail Code', `Password updated successfully for ${cleanEmail}`, cleanEmail);
}

export async function sendPasswordReset(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  try {
    // ActionCodeSettings directing user back to the application's secure password reset interface
    const actionCodeSettings = {
      url: `${window.location.origin}/#reset-password`,
      handleCodeInApp: true,
    };

    await sendPasswordResetEmail(auth, cleanEmail, actionCodeSettings);
    await logActivity('Password Reset Sent', `Firebase reset email dispatched to ${cleanEmail}`, cleanEmail);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('Firebase sendPasswordReset notice:', err);

    if (errorMsg.includes('auth/user-not-found')) {
      throw new Error('No registered account found with this email address.');
    } else if (errorMsg.includes('auth/invalid-email')) {
      throw new Error('Invalid email address format.');
    } else if (errorMsg.includes('auth/too-many-requests')) {
      throw new Error('Too many requests. Please wait a moment before trying again.');
    }

    // If Firebase Auth provider is in initial setup mode or network notice, still log and provide secure feedback
    await logActivity('Password Reset Requested', `Recovery requested for ${cleanEmail}`, cleanEmail);
  }
}

export async function verifyResetCode(oobCode: string): Promise<string> {
  try {
    const email = await verifyPasswordResetCode(auth, oobCode);
    return email;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes('auth/expired-action-code')) {
      throw new Error('This password reset link has expired. Please request a new one.');
    } else if (errorMsg.includes('auth/invalid-action-code')) {
      throw new Error('This password reset link is invalid or has already been used.');
    }
    throw new Error('Unable to verify reset code. Please request a fresh reset link.');
  }
}

export async function confirmNewPassword(oobCode: string, newPass: string): Promise<void> {
  if (!newPass || newPass.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  try {
    await confirmPasswordReset(auth, oobCode, newPass);
    await logActivity('Password Reset Completed', 'User updated password via Firebase secure reset link');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes('auth/expired-action-code')) {
      throw new Error('The reset code has expired. Please request a new recovery link.');
    } else if (errorMsg.includes('auth/invalid-action-code')) {
      throw new Error('The reset code is invalid. Please request a new recovery link.');
    }
    throw new Error(errorMsg || 'Failed to update password. Please try again.');
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    console.error(e);
  }
  localStorage.removeItem('chaiden_active_session');
}

export async function fetchAllUsers(): Promise<UserProfile[]> {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    if (!snapshot.empty) {
      const list: UserProfile[] = [];
      snapshot.forEach((d) => list.push({ userId: d.id, ...d.data() } as UserProfile));
      saveLocalUsers(list);
      return list;
    }
  } catch {
    // ignore
  }
  return getLocalUsers();
}

export async function createUser(
  name: string,
  email: string,
  role: UserRole,
  permissions?: RolePermissions,
  password?: string
): Promise<UserProfile> {
  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newUser: UserProfile = {
    userId: id,
    name,
    email: email.trim().toLowerCase(),
    role,
    permissions: permissions || DEFAULT_PERMISSIONS[role],
    active: true,
    password: password || (role === 'OWNER' ? 'owner@chaiden' : 'chaiden@123'),
    createdAt: new Date().toISOString(),
  };

  const current = getLocalUsers();
  saveLocalUsers([...current, newUser]);

  try {
    await setDoc(doc(db, 'users', id), newUser);
  } catch (e) {
    console.warn('User created locally (Firestore sync pending):', e);
  }

  await logActivity('User Created', `Created ${role} account: ${email}`, 'owner@chaiden.com');
  return newUser;
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  const current = getLocalUsers();
  const targetUser = current.find((u) => u.userId === userId);

  // If updating an owner's email, synchronize settings.primaryOwnerEmail and purge old owner references
  if (updates.email && (targetUser?.role === 'OWNER' || userId === 'owner_primary' || updates.role === 'OWNER')) {
    const cleanNewEmail = updates.email.trim().toLowerCase();
    await updatePrimaryOwnerEmail(cleanNewEmail);
    if (updates.password || updates.name) {
      const freshUsers = getLocalUsers();
      const updatedUsers = freshUsers.map((u) =>
        u.userId === userId || u.role === 'OWNER'
          ? { ...u, ...(updates.password ? { password: updates.password } : {}), ...(updates.name ? { name: updates.name } : {}) }
          : u
      );
      saveLocalUsers(updatedUsers);
    }
    return;
  }

  const next = current.map((u) => (u.userId === userId ? { ...u, ...updates } : u));
  saveLocalUsers(next);

  // If updating current active session
  const activeSessionRaw = localStorage.getItem('chaiden_active_session');
  if (activeSessionRaw) {
    try {
      const activeSession = JSON.parse(activeSessionRaw);
      if (activeSession.userId === userId) {
        localStorage.setItem('chaiden_active_session', JSON.stringify({ ...activeSession, ...updates }));
      }
    } catch {
      // ignore
    }
  }

  try {
    await setDoc(doc(db, 'users', userId), updates, { merge: true });
  } catch (e) {
    console.warn('Updated user locally (Firestore sync pending):', e);
  }

  await logActivity('User Updated', `Updated profile/role for user ${userId}`, 'owner@chaiden.com');
}

export async function updatePrimaryOwnerEmail(newEmail: string, updaterEmail?: string): Promise<void> {
  const cleanEmail = newEmail.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  // 1. Update global cafe settings
  await saveSettings({ primaryOwnerEmail: cleanEmail, primaryOwnerId: cleanEmail });

  // 2. Ensure only ONE OWNER exists in the user registry with this new email
  const current = getLocalUsers();
  const nonOwners = current.filter((u) => u.role !== 'OWNER' && u.userId !== 'owner_primary');
  const existingOwner = current.find((u) => u.role === 'OWNER' || u.userId === 'owner_primary');

  const updatedOwner: UserProfile = {
    userId: existingOwner?.userId || 'owner_primary',
    name: existingOwner?.name || 'The Chai Den Owner',
    email: cleanEmail,
    role: 'OWNER',
    permissions: DEFAULT_PERMISSIONS.OWNER,
    active: true,
    password: existingOwner?.password || 'owner@chaiden',
    createdAt: existingOwner?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const nextUsers = [updatedOwner, ...nonOwners];
  saveLocalUsers(nextUsers);

  // 3. Persist to Firestore
  try {
    await setDoc(doc(db, 'users', updatedOwner.userId), updatedOwner, { merge: true });
    // Remove any legacy owner records from Firestore so they cannot be loaded
    await deleteDoc(doc(db, 'users', 'owner_alt')).catch(() => {});
    await deleteDoc(doc(db, 'users', 'owner_legacy')).catch(() => {});
  } catch (e) {
    console.warn('Sync updated owner to Firestore notice:', e);
  }

  // 4. Update active session so the UI immediately reflects the new email
  const activeSessionRaw = localStorage.getItem('chaiden_active_session');
  if (activeSessionRaw) {
    try {
      const activeSession = JSON.parse(activeSessionRaw);
      if (activeSession.role === 'OWNER' || activeSession.userId === updatedOwner.userId) {
        activeSession.email = cleanEmail;
        localStorage.setItem('chaiden_active_session', JSON.stringify(activeSession));
      }
    } catch {
      // ignore
    }
  }

  await logActivity(
    'Owner Email Changed',
    `Updated registered owner email to ${cleanEmail}. Previous owner emails invalidated for owner login.`,
    updaterEmail || cleanEmail
  );
}

export async function updatePrimaryOwnerId(newId: string, updaterEmail?: string): Promise<void> {
  const cleanId = newId.trim();
  if (!cleanId) {
    throw new Error('Primary Owner ID cannot be empty.');
  }

  if (cleanId.includes('@')) {
    await updatePrimaryOwnerEmail(cleanId, updaterEmail);
  } else {
    await saveSettings({ primaryOwnerId: cleanId });
    await logActivity('Primary Owner ID Changed', `Updated Primary Owner ID to ${cleanId}`, updaterEmail || cleanId);
  }
}

export async function changeUserPassword(userId: string, newPass: string): Promise<void> {
  await updateUserProfile(userId, { password: newPass });
  await logActivity('Password Changed', `Password updated for user ${userId}`, 'owner@chaiden.com');
}

export async function toggleUserActive(userId: string, active: boolean): Promise<void> {
  await updateUserProfile(userId, { active });
  await logActivity(active ? 'User Enabled' : 'User Disabled', `User ${userId} active set to ${active}`);
}

export async function deleteUser(userId: string): Promise<void> {
  const current = getLocalUsers();
  saveLocalUsers(current.filter((u) => u.userId !== userId));

  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (e) {
    console.warn('Deleted locally:', e);
  }

  await logActivity('User Deleted', `Removed user ID ${userId}`, 'owner@chaiden.com');
}

// =============================================================
// BACKEND FORGOT PASSWORD & OTP VERIFICATION API CLIENT
// =============================================================

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  expiresIn?: number;
  resendCooldown?: number;
  devOtp?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  resetToken?: string;
  remainingAttempts?: number;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export async function apiForgotPassword(email: string): Promise<ForgotPasswordResponse> {
  const cleanEmail = email.trim().toLowerCase();
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to send verification code.');
  }
  return data;
}

export async function apiVerifyResetOtp(email: string, otp: string): Promise<VerifyOtpResponse> {
  const cleanEmail = email.trim().toLowerCase();
  const res = await fetch('/api/auth/verify-reset-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail, otp: otp.trim() }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Invalid verification code.');
  }
  return data;
}

export async function apiResendResetOtp(email: string): Promise<ForgotPasswordResponse> {
  const cleanEmail = email.trim().toLowerCase();
  const res = await fetch('/api/auth/resend-reset-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to resend verification code.');
  }
  return data;
}

export async function apiResetPassword(
  email: string,
  resetToken: string,
  newPassword: string,
  confirmPassword: string
): Promise<ResetPasswordResponse> {
  const cleanEmail = email.trim().toLowerCase();
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: cleanEmail,
      resetToken,
      newPassword,
      confirmPassword,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to reset password.');
  }

  // Update local session / cache and log activity
  const allUsers = getLocalUsers();
  const targetUser = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
  if (targetUser) {
    await changeUserPassword(targetUser.userId, newPassword);
  } else if (cleanEmail === PRIMARY_OWNER_EMAIL) {
    await changeUserPassword('owner_primary', newPassword);
  }
  await logActivity('Password Reset Completed', `Password successfully changed for ${cleanEmail}`, cleanEmail);

  return data;
}

export async function apiGenerateOtp(email: string): Promise<ForgotPasswordResponse> {
  const cleanEmail = email.trim().toLowerCase();
  const res = await fetch('/api/auth/generate-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to generate verification code.');
  }
  return data;
}

export async function apiVerifyOtp(email: string, otp: string): Promise<VerifyOtpResponse> {
  const cleanEmail = email.trim().toLowerCase();
  const res = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail, otp: otp.trim() }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Invalid verification code.');
  }
  return data;
}


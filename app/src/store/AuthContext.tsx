import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ADMIN_EMAIL, auth, firebaseConfigured } from '../firebase';

interface AuthContextValue {
  isAdmin: boolean;
  authReady: boolean;
  login: (password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(!firebaseConfigured);

  useEffect(() => {
    if (!firebaseConfigured) return;
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const login = async (password: string) => {
    if (!firebaseConfigured) return { ok: false, error: 'Firebase ยังไม่ได้ตั้งค่า' };
    try {
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
      return { ok: true };
    } catch {
      return { ok: false, error: 'รหัสไม่ถูกต้อง' };
    }
  };

  const logout = async () => {
    if (!firebaseConfigured) return;
    await signOut(auth);
  };

  return <AuthContext.Provider value={{ isAdmin, authReady, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

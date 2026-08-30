import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User as FirebaseUser,
} from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { auth } from '@/lib/firebase';
import { CURRENT_USER_KEY, MY_BANK_ACCOUNT_KEY } from '@/features/users/hooks';
import type { AuthState } from '../types';

export const AuthContext = createContext<AuthState | null>(null);

const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [initializing, setInitializing] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const previousUidRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const prevUid = previousUidRef.current;
      const nextUid = user?.uid ?? null;
      previousUidRef.current = nextUid;

      // Handle account switch or logout - cancel and clear user-scoped queries
      if (prevUid && prevUid !== nextUid) {
        await Promise.allSettled([
          queryClient.cancelQueries({ queryKey: CURRENT_USER_KEY }),
          queryClient.cancelQueries({ queryKey: MY_BANK_ACCOUNT_KEY }),
        ]);

        queryClient.removeQueries({ queryKey: CURRENT_USER_KEY });
        queryClient.removeQueries({ queryKey: MY_BANK_ACCOUNT_KEY });
      }

      setFirebaseUser(user);
      setInitializing(false);
    });
    return unsubscribe;
  }, [queryClient]);

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: unknown) {
      // User closed the popup or other error
      const code =
        error instanceof Object && 'code' in error
          ? (error as { code: string }).code
          : '';
      if (code === 'auth/popup-closed-by-user') {
        // Silently ignore — user cancelled
        return;
      }
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await Promise.allSettled([
        queryClient.cancelQueries({ queryKey: CURRENT_USER_KEY }),
        queryClient.cancelQueries({ queryKey: MY_BANK_ACCOUNT_KEY }),
      ]);

      queryClient.removeQueries({ queryKey: CURRENT_USER_KEY });
      queryClient.removeQueries({ queryKey: MY_BANK_ACCOUNT_KEY });
    } finally {
      await firebaseSignOut(auth);
    }
  }, [queryClient]);

  const value = useMemo<AuthState>(
    () => ({
      initializing,
      firebaseUser,
      signInWithGoogle,
      signOut,
    }),
    [initializing, firebaseUser, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import type { User as FirebaseUser } from 'firebase/auth';

export interface AuthState {
  /** True while Firebase SDK is initializing (first onAuthStateChanged hasn't fired) */
  initializing: boolean;
  /** Firebase user object, null if not authenticated */
  firebaseUser: FirebaseUser | null;
  /** Sign in with Google popup */
  signInWithGoogle: () => Promise<void>;
  /** Sign out of Firebase */
  signOut: () => Promise<void>;
}

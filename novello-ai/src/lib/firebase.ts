/**
 * Local-First Firebase Client Stub
 */

export const initializeApp = () => ({});
export const getAuth = () => ({
  onAuthStateChanged: (callback: (user: unknown) => void) => () => {},
});
export const getFirestore = () => ({});
export const getStorage = () => ({});

// Firestore stubs
export const collection = (..._args: unknown[]) => ({});
export const query = (..._args: unknown[]) => ({});
export const where = (..._args: unknown[]) => ({});
export const orderBy = (..._args: unknown[]) => ({});
export const limit = (..._args: unknown[]) => ({});
export const getDocs = async (..._args: unknown[]) => ({ docs: [] as unknown[] });
export const doc = (..._args: unknown[]) => ({});
export const getDoc = async (..._args: unknown[]) => ({ exists: () => false, data: () => ({}) as Record<string, unknown> });
export const setDoc = async (..._args: unknown[]) => ({});
export const updateDoc = async (..._args: unknown[]) => ({});
export const deleteDoc = async (..._args: unknown[]) => ({});
export const onSnapshot = (..._args: unknown[]) => () => {};
export const writeBatch = (..._args: unknown[]) => ({
  set: () => {},
  update: () => {},
  delete: () => {},
  commit: async () => {},
});

// Legacy/Helper exports
export const getFirebaseDb = (..._args: unknown[]) => ({});
export const Timestamp = {
  now: () => new Date(),
  fromDate: (date: Date) => date,
};

// Auth stubs
export const signInWithPopup = async (..._args: unknown[]) => ({ user: { uid: 'local-user' } });
export const GoogleAuthProvider = class {};

export default {
  initializeApp,
  getAuth,
  getFirestore,
  getStorage,
};

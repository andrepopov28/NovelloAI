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
export const collection = (...args: unknown[]) => ({});
export const query = (...args: unknown[]) => ({});
export const where = (...args: unknown[]) => ({});
export const orderBy = (...args: unknown[]) => ({});
export const limit = (...args: unknown[]) => ({});
export const getDocs = async (...args: unknown[]) => ({ docs: [] as unknown[] });
export const doc = (...args: unknown[]) => ({});
export const getDoc = async (...args: unknown[]) => ({ exists: () => false, data: () => ({}) as Record<string, unknown> });
export const setDoc = async (...args: unknown[]) => ({});
export const updateDoc = async (...args: unknown[]) => ({});
export const deleteDoc = async (...args: unknown[]) => ({});
export const onSnapshot = (...args: unknown[]) => () => {};
export const writeBatch = (...args: unknown[]) => ({
  set: () => {},
  update: () => {},
  delete: () => {},
  commit: async () => {},
});

// Legacy/Helper exports
export const getFirebaseDb = (...args: unknown[]) => ({});
export const Timestamp = {
  now: () => new Date(),
  fromDate: (date: Date) => date,
};

// Auth stubs
export const signInWithPopup = async (...args: unknown[]) => ({ user: { uid: 'local-user' } });
export const GoogleAuthProvider = class {};

export default {
  initializeApp,
  getAuth,
  getFirestore,
  getStorage,
};

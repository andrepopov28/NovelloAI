/**
 * Local-First Firebase Client Stub
 */

export const initializeApp = () => ({});
export const getAuth = () => ({
  onAuthStateChanged: (callback: any) => () => {},
});
export const getFirestore = () => ({});
export const getStorage = () => ({});

// Firestore stubs
export const collection = (...args: any[]) => ({});
export const query = (...args: any[]) => ({});
export const where = (...args: any[]) => ({});
export const orderBy = (...args: any[]) => ({});
export const limit = (...args: any[]) => ({});
export const getDocs = async (...args: any[]) => ({ docs: [] as any[] });
export const doc = (...args: any[]) => ({});
export const getDoc = async (...args: any[]) => ({ exists: () => false, data: () => ({}) as any });
export const setDoc = async (...args: any[]) => ({});
export const updateDoc = async (...args: any[]) => ({});
export const deleteDoc = async (...args: any[]) => ({});
export const onSnapshot = (...args: any[]) => () => {};
export const writeBatch = (...args: any[]) => ({
  set: () => {},
  update: () => {},
  delete: () => {},
  commit: async () => {},
});

// Legacy/Helper exports
export const getFirebaseDb = (...args: any[]) => ({});
export const Timestamp = {
  now: () => new Date(),
  fromDate: (date: Date) => date,
};

// Auth stubs
export const signInWithPopup = async (...args: any[]) => ({ user: { uid: 'local-user' } });
export const GoogleAuthProvider = class {};

export default {
  initializeApp,
  getAuth,
  getFirestore,
  getStorage,
};

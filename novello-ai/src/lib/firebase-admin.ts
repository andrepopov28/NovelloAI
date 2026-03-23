/**
 * Local-First Firebase Admin Stub
 */

const MOCK_USER = {
  uid: 'local-user',
  email: 'local@novello.ai',
  displayName: 'Local Author',
};

export const auth = {
  verifyIdToken: async (token: string) => MOCK_USER,
  getUser: async (uid: string) => MOCK_USER,
};

const mockFirestore = () => ({
  collection: (name: string) => ({
    doc: (id?: string) => {
      const docId = id || `mock-id-${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: docId,
        get: async () => ({ 
          id: docId,
          exists: true, 
          data: () => ({ userId: MOCK_USER.uid }) as any 
        }),
        set: async (data: any) => ({}),
        update: async (data: any) => ({}),
        delete: async () => ({}),
      };
    },
    add: async (data: any) => ({ id: 'mock-id' }),
    where: function(...args: any[]) { return this; },
    orderBy: function(...args: any[]) { return this; },
    limit: function(...args: any[]) { return this; },
    get: async () => ({ 
        empty: false, 
        docs: [] as any[] 
    }),
  }),
});

export const db = mockFirestore();
export const firestore = mockFirestore;

export const storage = () => ({
  bucket: () => ({
    file: () => ({
      save: async (data: any) => ({}),
      download: async () => [Buffer.from([])],
      delete: async () => ({}),
      getSignedUrl: async (options: any) => ['#'],
    }),
  }),
});

export async function verifyIdToken(authHeader: string | null) {
  return MOCK_USER;
}

// Support for import * as admin from 'firebase-admin'
export default {
  auth: () => ({ ...auth }),
  firestore,
  storage,
};

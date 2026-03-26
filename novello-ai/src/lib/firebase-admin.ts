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

const mockFirestore = () => {
  const collection: any = (name: string) => ({
    doc: (id?: string) => {
      const docId = id || `mock-id-${Math.random().toString(36).substring(2, 9)}`;
      return {
        id: docId,
        get: async () => ({ 
          id: docId,
          exists: true, 
          data: () => ({ userId: MOCK_USER.uid }) as Record<string, unknown>
        }),
        set: async (data: Record<string, unknown>) => ({}),
        update: async (data: Record<string, unknown>) => ({}),
        delete: async () => ({}),
      };
    },
    add: async (data: Record<string, unknown>) => ({ id: 'mock-id' }),
    where: function(...args: unknown[]) { return this; },
    orderBy: function(...args: unknown[]) { return this; },
    limit: function(...args: unknown[]) { return this; },
    get: async () => ({ 
        empty: false, 
        docs: [] as unknown[] 
    }),
  });
  return collection;
};

export const db = mockFirestore();
export const firestore = mockFirestore;

export const storage = () => ({
  bucket: () => ({
    file: () => ({
      save: async (data: Buffer | string | Uint8Array) => ({}),
      download: async () => [Buffer.from([])],
      delete: async () => ({}),
      getSignedUrl: async (options: { action: string; expires: string | number | Date }) => ['#'],
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

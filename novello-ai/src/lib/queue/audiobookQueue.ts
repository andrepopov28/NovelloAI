// Stub: BullMQ audiobook queue is not used in local-first mode.
// The API route handles job enqueueing synchronously or via a local worker.

export const AUDIOBOOK_QUEUE_NAME = 'audiobook-generation';

export const audiobookQueue = {
  add: async (_name: string, _data: unknown, _opts?: unknown) => {
    console.warn('[audiobookQueue] BullMQ not available in local mode. Job skipped.');
    return { id: 'local-stub' };
  },
  getJob: async (_id: string) => null,
  close: async () => {},
};

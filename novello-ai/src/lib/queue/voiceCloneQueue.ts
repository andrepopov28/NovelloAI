// Stub: BullMQ voice clone queue is not used in local-first mode.
// The API route handles job enqueueing synchronously or via a local worker.

export const VOICE_CLONE_QUEUE_NAME = 'voice-clone-generation';

export const voiceCloneQueue = {
  add: async (_name: string, _data: unknown, _opts?: unknown) => {
    console.warn('[voiceCloneQueue] BullMQ not available in local mode. Job skipped.');
    return { id: 'local-stub' };
  },
  getJob: async (_id: string) => null,
  close: async () => {},
};

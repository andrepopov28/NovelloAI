/**
 * Offline Storage Layer using IndexedDB
 * Provides local fallback when Firestore writes fail
 * PRD Reference: US-004-01 (Offline mode)
 */

interface OfflineChapter {
    id: string;
    projectId: string;
    content: string;
    contentJSON: any;
    wordCount: number;
    savedAt: number;
    synced: boolean;
}

const DB_NAME = 'novello-offline';
const DB_VERSION = 1;
const STORE_NAME = 'chapters';

/**
 * Open IndexedDB connection
 */
async function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create object store if it doesn't exist
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('projectId', 'projectId', { unique: false });
                store.createIndex('synced', 'synced', { unique: false });
                store.createIndex('savedAt', 'savedAt', { unique: false });
            }
        };
    });
}

/**
 * Save chapter to IndexedDB (offline fallback)
 */
export async function saveChapterOffline(
    chapterId: string,
    projectId: string,
    content: string,
    contentJSON: any,
    wordCount: number
): Promise<void> {
    try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const chapter: OfflineChapter = {
            id: chapterId,
            projectId,
            content,
            contentJSON,
            wordCount,
            savedAt: Date.now(),
            synced: false,
        };

        await new Promise<void>((resolve, reject) => {
            const request = store.put(chapter);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        db.close();
    } catch (error) {
        console.error('Failed to save to IndexedDB:', error);
        throw error;
    }
}

/**
 * Get unsynced chapters from IndexedDB
 */
export async function getUnsyncedChapters(): Promise<OfflineChapter[]> {
    try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        // Get all chapters and filter for unsynced
        const chapters = await new Promise<OfflineChapter[]>((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const all = request.result as OfflineChapter[];
                resolve(all.filter(ch => !ch.synced));
            };
            request.onerror = () => reject(request.error);
        });

        db.close();
        return chapters;
    } catch (error) {
        console.error('Failed to get unsynced chapters:', error);
        return [];
    }
}

/**
 * Mark chapter as synced in IndexedDB
 */
export async function markChapterSynced(chapterId: string): Promise<void> {
    try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const chapter = await new Promise<OfflineChapter | undefined>((resolve, reject) => {
            const request = store.get(chapterId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        if (chapter) {
            chapter.synced = true;
            await new Promise<void>((resolve, reject) => {
                const request = store.put(chapter);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }

        db.close();
    } catch (error) {
        console.error('Failed to mark chapter as synced:', error);
    }
}

/**
 * Sync all unsynced chapters to Firestore
 */
export async function syncOfflineChanges(): Promise<{ success: number; failed: number }> {
    const chapters = await getUnsyncedChapters();
    let success = 0;
    let failed = 0;

    for (const chapter of chapters) {
        try {
            // Call the API to save to Firestore
            const response = await fetch(`/api/chapters/${chapter.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: chapter.content,
                    contentJSON: chapter.contentJSON,
                    wordCount: chapter.wordCount,
                    updatedAtClient: chapter.savedAt,
                }),
            });

            if (response.ok) {
                await markChapterSynced(chapter.id);
                success++;
            } else {
                failed++;
            }
        } catch (error) {
            console.error(`Failed to sync chapter ${chapter.id}:`, error);
            failed++;
        }
    }

    return { success, failed };
}

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Listen for online/offline events and auto-sync
 */
export function setupAutoSync(onSyncComplete?: (result: { success: number; failed: number }) => void): () => void {
    if (typeof window === 'undefined') return () => { };

    const handleOnline = async () => {
        console.log('Browser is online, syncing offline changes...');
        const result = await syncOfflineChanges();
        console.log(`Sync complete: ${result.success} succeeded, ${result.failed} failed`);
        onSyncComplete?.(result);
    };

    window.addEventListener('online', handleOnline);

    return () => {
        window.removeEventListener('online', handleOnline);
    };
}

/**
 * Clear all offline data (use with caution)
 */
export async function clearOfflineData(): Promise<void> {
    try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        await new Promise<void>((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        db.close();
    } catch (error) {
        console.error('Failed to clear offline data:', error);
    }
}

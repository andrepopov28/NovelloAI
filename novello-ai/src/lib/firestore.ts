import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    writeBatch,
    onSnapshot,
    Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import type { Project, Chapter, Entity, ChapterVersion, Series } from './types';
import { arrayUnion, arrayRemove } from 'firebase/firestore';
import { computeProjectStyle } from './style-engine';

// =============================================
// Lazy Collection Accessors
// =============================================
const projectsCol = () => collection(getFirebaseDb(), 'projects');
const chaptersCol = () => collection(getFirebaseDb(), 'chapters');
const entitiesCol = () => collection(getFirebaseDb(), 'entities');
const docRef = (colName: string, id: string) => doc(getFirebaseDb(), colName, id);

// =============================================
// Projects
// =============================================

export async function createProject(
    userId: string,
    data: { title: string; genre: string; synopsis: string }
): Promise<string> {
    const docRef = await addDoc(projectsCol(), {
        userId,
        title: data.title,
        genre: data.genre,
        synopsis: data.synopsis,
        seriesId: null,
        wordCount: 0,
        chapterCount: 0,
        coverImage: '',
        settings: { aiProvider: 'ollama' as const, modelName: 'llama3', temperature: 0.7 },
        styleProfile: null,
        contextRollup: { chapterSummaries: [], lastUpdated: serverTimestamp() },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    await createChapter(docRef.id, userId, { title: 'Chapter 1', order: 0 });
    return docRef.id;
}

export async function updateProject(
    projectId: string,
    data: Partial<Omit<Project, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
    const ref = doc(getFirebaseDb(), 'projects', projectId);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteProject(projectId: string): Promise<void> {
    const chaptersQuery = query(chaptersCol(), where('projectId', '==', projectId));
    const chaptersSnapshot = await getDocs(chaptersQuery);

    const entitiesQuery = query(entitiesCol(), where('projectId', '==', projectId));
    const entitiesSnapshot = await getDocs(entitiesQuery);

    const batch = writeBatch(getFirebaseDb());
    chaptersSnapshot.docs.forEach((d) => batch.delete(d.ref));
    entitiesSnapshot.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(getFirebaseDb(), 'projects', projectId));

    await batch.commit();
}

export function subscribeToUserProjects(
    userId: string,
    callback: (projects: Project[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    // Simple query without orderBy to avoid composite index requirement
    const q = query(projectsCol(), where('userId', '==', userId));
    return onSnapshot(
        q,
        (snapshot) => {
            const projects = snapshot.docs
                .map((d) => ({ id: d.id, ...d.data() }) as Project)
                .sort((a, b) => {
                    const aTime = a.updatedAt?.toMillis?.() ?? 0;
                    const bTime = b.updatedAt?.toMillis?.() ?? 0;
                    return bTime - aTime; // descending
                });
            callback(projects);
        },
        (err) => onError(err as Error)
    );
}

export function subscribeToSeriesProjects(
    seriesId: string,
    callback: (projects: Project[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(projectsCol(), where('seriesId', '==', seriesId));
    return onSnapshot(
        q,
        (snapshot) => {
            const projects = snapshot.docs
                .map((d) => ({ id: d.id, ...d.data() }) as Project)
                .sort((a, b) => {
                    const aTime = a.updatedAt?.toMillis?.() ?? 0;
                    const bTime = b.updatedAt?.toMillis?.() ?? 0;
                    return bTime - aTime;
                });
            callback(projects);
        },
        (err) => onError(err as Error)
    );
}

// =============================================
// Chapters
// =============================================

export async function createChapter(
    projectId: string,
    userId: string,
    data: { title: string; order: number; content?: string }
): Promise<string> {
    const ref = await addDoc(chaptersCol(), {
        projectId,
        userId,
        title: data.title,
        order: data.order,
        content: data.content || '',
        synopsis: '',
        status: 'draft' as const,
        lastSummary: '',
        wordCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updateChapter(
    chapterId: string,
    data: Partial<Omit<Chapter, 'id' | 'userId' | 'projectId' | 'createdAt'>>
): Promise<void> {
    const ref = doc(getFirebaseDb(), 'chapters', chapterId);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteChapter(chapterId: string): Promise<void> {
    await deleteDoc(doc(getFirebaseDb(), 'chapters', chapterId));
}

export async function reorderChapters(
    projectId: string,
    orderedIds: string[]
): Promise<void> {
    const batch = writeBatch(getFirebaseDb());
    orderedIds.forEach((id, index) => {
        batch.update(doc(getFirebaseDb(), 'chapters', id), {
            order: index,
            updatedAt: serverTimestamp(),
        });
    });
    await batch.commit();
}

export function subscribeToChapters(
    projectId: string,
    callback: (chapters: Chapter[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(chaptersCol(), where('projectId', '==', projectId));
    return onSnapshot(
        q,
        (snapshot) => {
            const chapters = snapshot.docs
                .map((d) => ({ id: d.id, ...d.data() }) as Chapter)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            callback(chapters);
        },
        (err) => onError(err as Error)
    );
}

// =============================================
// Versions
// =============================================
const versionsCol = (chapterId: string) => collection(getFirebaseDb(), 'chapters', chapterId, 'versions');

export async function saveVersion(
    chapterId: string,
    userId: string,
    content: string,
    source: ChapterVersion['source'] = 'autosave'
): Promise<string> {
    // 1. Get word count
    const text = content.replace(/<[^>]*>/g, ' ');
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

    const ref = await addDoc(versionsCol(chapterId), {
        chapterId,
        userId,
        content,
        wordCount,
        source,
        isPinned: false,
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

export function subscribeToVersions(
    chapterId: string,
    callback: (versions: ChapterVersion[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(versionsCol(chapterId), orderBy('createdAt', 'desc'));
    return onSnapshot(
        q,
        (snapshot) => {
            const versions = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ChapterVersion);
            callback(versions);
        },
        (err) => onError(err as Error)
    );
}

// =============================================
// Entities
// =============================================

export async function createEntity(
    projectId: string,
    userId: string,
    data: { name: string; type: Entity['type']; description: string }
): Promise<string> {
    const ref = await addDoc(entitiesCol(), {
        projectId,
        userId,
        name: data.name,
        type: data.type,
        description: data.description,
        appearance: '',
        motivations: '',
        lore: '',
        appearances: [],
        relationships: [],
        isShared: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updateEntity(
    entityId: string,
    data: Partial<Omit<Entity, 'id' | 'userId' | 'projectId' | 'createdAt'>>
): Promise<void> {
    const ref = doc(getFirebaseDb(), 'entities', entityId);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteEntity(entityId: string): Promise<void> {
    await deleteDoc(doc(getFirebaseDb(), 'entities', entityId));
}

export function subscribeToEntities(
    projectId: string,
    callback: (entities: Entity[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(entitiesCol(), where('projectId', '==', projectId));
    return onSnapshot(
        q,
        (snapshot) => {
            const entities = snapshot.docs
                .map((d) => ({ id: d.id, ...d.data() }) as Entity)
                .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
            callback(entities);
        },
        (err) => onError(err as Error)
    );
}

// =============================================
// Aggregate Helpers
// =============================================

export async function recalculateProjectWordCount(projectId: string): Promise<void> {
    const q = query(chaptersCol(), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    const totalWords = snapshot.docs.reduce((sum, d) => {
        const content = d.data().content || '';
        // Basic word count on HTML content
        const text = content.replace(/<[^>]*>/g, ' ');
        return sum + (text.trim() ? text.trim().split(/\s+/).length : 0);
    }, 0);
    await updateProject(projectId, { wordCount: totalWords });
}

export async function recalculateProjectStyle(projectId: string): Promise<void> {
    const q = query(chaptersCol(), where('projectId', '==', projectId));
    const snapshot = await getDocs(q);
    const chapters = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Chapter);

    // Compute style profile
    const styleProfile = computeProjectStyle(chapters);

    if (styleProfile) {
        await updateProject(projectId, { styleProfile });
    }
}

// =============================================
// Series
// =============================================
const seriesCol = () => collection(getFirebaseDb(), 'series');

export async function createSeries(
    userId: string,
    data: { title: string; description: string }
): Promise<string> {
    const ref = await addDoc(seriesCol(), {
        userId,
        title: data.title,
        description: data.description,
        projectIds: [],
        sharedEntityIds: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updateSeries(
    seriesId: string,
    data: Partial<Omit<Series, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
    const ref = doc(getFirebaseDb(), 'series', seriesId);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteSeries(seriesId: string): Promise<void> {
    const db = getFirebaseDb();
    const batch = writeBatch(db);

    // 1. Fetch the series document to get sharedEntityIds
    const seriesRef = doc(db, 'series', seriesId);
    const { getDoc } = await import('firebase/firestore');
    const seriesSnap = await getDoc(seriesRef);

    if (seriesSnap.exists()) {
        const seriesData = seriesSnap.data() as Omit<Series, 'id'>;

        // 2. Unshare entities (PRD cascade rule D.2)
        if (seriesData.sharedEntityIds && seriesData.sharedEntityIds.length > 0) {
            for (const entityId of seriesData.sharedEntityIds) {
                const entityRef = doc(db, 'entities', entityId);
                batch.update(entityRef, { isShared: false, updatedAt: serverTimestamp() });
            }
        }
    }

    // 3. Unlink projects from series
    const projectsQuery = query(projectsCol(), where('seriesId', '==', seriesId));
    const projectsSnapshot = await getDocs(projectsQuery);
    projectsSnapshot.docs.forEach((d) => {
        batch.update(d.ref, { seriesId: null, updatedAt: serverTimestamp() });
    });

    // 4. Delete Series Doc
    batch.delete(seriesRef);

    await batch.commit();
}

// Series type imported at top of file

export function subscribeToSeries(
    seriesId: string,
    callback: (series: Series | null) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const ref = doc(getFirebaseDb(), 'series', seriesId);
    return onSnapshot(
        ref,
        (snapshot) => {
            if (snapshot.exists()) {
                callback({ id: snapshot.id, ...snapshot.data() } as Series);
            } else {
                callback(null);
            }
        },
        (err) => onError(err as Error)
    );
}

export function subscribeToUserSeries(
    userId: string,
    callback: (series: Series[]) => void,
    onError: (error: Error) => void
): Unsubscribe {
    const q = query(seriesCol(), where('userId', '==', userId));
    return onSnapshot(
        q,
        (snapshot) => {
            const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Series);
            // Sort by updatedAt desc
            list.sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
            callback(list);
        },
        (err) => onError(err as Error)
    );
}

// arrayUnion/arrayRemove imported at top of file

export async function addProjectToSeries(seriesId: string, projectId: string): Promise<void> {
    const batch = writeBatch(getFirebaseDb());
    const seriesRef = doc(getFirebaseDb(), 'series', seriesId);
    const projectRef = doc(getFirebaseDb(), 'projects', projectId);

    batch.update(seriesRef, {
        projectIds: arrayUnion(projectId),
        updatedAt: serverTimestamp()
    });
    batch.update(projectRef, {
        seriesId: seriesId,
        updatedAt: serverTimestamp()
    });

    await batch.commit();
}

export async function removeProjectFromSeries(seriesId: string, projectId: string): Promise<void> {
    const batch = writeBatch(getFirebaseDb());
    const seriesRef = doc(getFirebaseDb(), 'series', seriesId);
    const projectRef = doc(getFirebaseDb(), 'projects', projectId);

    batch.update(seriesRef, {
        projectIds: arrayRemove(projectId),
        updatedAt: serverTimestamp()
    });
    batch.update(projectRef, {
        seriesId: null,
        updatedAt: serverTimestamp()
    });

    await batch.commit();
}

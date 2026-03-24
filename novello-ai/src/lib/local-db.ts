import { openDB, IDBPDatabase } from 'idb';
import { Project, Chapter, Entity, Series, VoiceClone, WritingSession, ChapterCritique } from './types';

const DB_NAME = 'novello-ai-local';


interface NovelloSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { 'by-updated': number };
  };
  chapters: {
    key: string;
    value: Chapter;
    indexes: { 'by-project': string; 'by-order': number };
  };
  entities: {
    key: string;
    value: Entity;
    indexes: { 'by-project': string; 'by-type': string };
  };
  series: {
    key: string;
    value: Series;
    indexes: { 'by-updated': number };
  };
  clones: {
    key: string;
    value: VoiceClone;
    indexes: { 'by-user': string; 'by-status': string };
  };
  versions: {
    key: string;
    value: import('./types').ChapterVersion;
    indexes: { 'by-chapter': string };
  };
  writing_sessions: {
    key: string;
    value: WritingSession;
    indexes: { 'by-project': string; 'by-date': string };
  };
  chapter_critiques: {
    key: string;
    value: ChapterCritique;
    indexes: { 'by-chapter': string };
  };
}

let dbPromise: Promise<IDBPDatabase<NovelloSchema>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<NovelloSchema>(DB_NAME, 3, {
      upgrade(db, oldVersion) {
        // Version 1 — core stores
        if (oldVersion < 1) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('by-updated', 'updatedAt');

          const chapterStore = db.createObjectStore('chapters', { keyPath: 'id' });
          chapterStore.createIndex('by-project', 'projectId');
          chapterStore.createIndex('by-order', 'order');

          const entityStore = db.createObjectStore('entities', { keyPath: 'id' });
          entityStore.createIndex('by-project', 'projectId');
          entityStore.createIndex('by-type', 'type');

          const seriesStore = db.createObjectStore('series', { keyPath: 'id' });
          seriesStore.createIndex('by-updated', 'updatedAt');
        }
        // Version 2 — voice clones store
        if (oldVersion < 2) {
          const clonesStore = db.createObjectStore('clones', { keyPath: 'id' });
          clonesStore.createIndex('by-user', 'userId');
          clonesStore.createIndex('by-status', 'status');
        }
        // Version 3 — version history store
        if (oldVersion < 3) {
          const versionsStore = db.createObjectStore('versions', { keyPath: 'id' });
          versionsStore.createIndex('by-chapter', 'chapterId');
        }
        // Version 4 — writing sessions + chapter critiques
        if (oldVersion < 4) {
          const sessionsStore = db.createObjectStore('writing_sessions', { keyPath: 'id' });
          sessionsStore.createIndex('by-project', 'projectId');
          sessionsStore.createIndex('by-date', 'date');

          const critiquesStore = db.createObjectStore('chapter_critiques', { keyPath: 'id' });
          critiquesStore.createIndex('by-chapter', 'chapterId');
        }
      },
    });
  }
  return dbPromise;
};

/* ─── Project Operations ─────────────────────────────────────── */
export async function saveProject(project: Project) {
  const db = await getDB();
  await db.put('projects', {
    ...project,
    updatedAt: Date.now(),
  });
}

export async function getProject(id: string) {
  const db = await getDB();
  return db.get('projects', id);
}

export async function getAllProjects() {
  const db = await getDB();
  return db.getAllFromIndex('projects', 'by-updated');
}

export async function deleteProject(id: string) {
  const db = await getDB();
  const tx = db.transaction(['projects', 'chapters', 'entities'], 'readwrite');
  
  // Delete project
  await tx.objectStore('projects').delete(id);
  
  // Delete associated chapters (cascade)
  const chapters = await tx.objectStore('chapters').index('by-project').getAllKeys(id);
  for (const cId of chapters) {
    await tx.objectStore('chapters').delete(cId);
  }
  
  // Delete associated entities
  const entities = await tx.objectStore('entities').index('by-project').getAllKeys(id);
  for (const eId of entities) {
    await tx.objectStore('entities').delete(eId);
  }
  
  await tx.done;
}

/* ─── Chapter Operations ─────────────────────────────────────── */
export async function saveChapter(chapter: Chapter) {
  const db = await getDB();
  await db.put('chapters', chapter);
}

export async function getChapters(projectId: string) {
  const db = await getDB();
  return db.getAllFromIndex('chapters', 'by-project', projectId);
}

export async function deleteChapter(id: string) {
  const db = await getDB();
  const tx = db.transaction(['chapters', 'versions'], 'readwrite');
  await tx.objectStore('chapters').delete(id);
  await deleteVersionsForChapter(tx, id);
  await tx.done;
}

/* ─── Entity Operations ──────────────────────────────────────── */
export async function saveEntity(entity: Entity) {
  const db = await getDB();
  await db.put('entities', entity);
}

export async function getEntities(projectId: string) {
  const db = await getDB();
  return db.getAllFromIndex('entities', 'by-project', projectId);
}

export async function deleteEntity(id: string) {
  const db = await getDB();
  await db.delete('entities', id);
}

/* ─── Voice Clone Operations ─────────────────────────────────── */
export async function saveClone(clone: VoiceClone) {
  const db = await getDB();
  await db.put('clones', { ...clone, updatedAt: Date.now() });
}

export async function getClone(id: string) {
  const db = await getDB();
  return db.get('clones', id);
}

export async function getAllClones(userId?: string) {
  const db = await getDB();
  if (userId) {
    return db.getAllFromIndex('clones', 'by-user', userId);
  }
  return db.getAll('clones');
}

export async function updateClone(id: string, updates: Partial<VoiceClone>) {
  const db = await getDB();
  const existing = await db.get('clones', id);
  if (!existing) throw new Error(`Clone ${id} not found`);
  await db.put('clones', { ...existing, ...updates, updatedAt: Date.now() });
}

export async function deleteClone(id: string) {
  const db = await getDB();
  await db.delete('clones', id);
}

/* ─── Version History Operations ─────────────────────────────── */
export async function saveVersionToDB(version: import('./types').ChapterVersion) {
  const db = await getDB();
  await db.put('versions', version);
}

export async function getVersionsForChapter(chapterId: string) {
  const db = await getDB();
  return db.getAllFromIndex('versions', 'by-chapter', chapterId);
}

export async function deleteVersionsForChapter(tx: any, chapterId: string) {
  const versions = await tx.objectStore('versions').index('by-chapter').getAllKeys(chapterId);
  for (const vId of versions) {
    await tx.objectStore('versions').delete(vId);
  }
}

/* ─── Backup & Restore ───────────────────────────────────────── */
export async function exportDatabase() {
  const db = await getDB();
  const data = {
    projects: await db.getAll('projects'),
    chapters: await db.getAll('chapters'),
    entities: await db.getAll('entities'),
    series: await db.getAll('series'),
    clones: await db.getAll('clones'),
    versions: await db.getAll('versions'),
  };
  return JSON.stringify(data);
}

export async function importDatabase(jsonData: string) {
  const db = await getDB();
  const data = JSON.parse(jsonData);
  const tx = db.transaction(['projects', 'chapters', 'entities', 'series', 'clones', 'versions'], 'readwrite');
  
  if (data.projects) for (const item of data.projects) await tx.objectStore('projects').put(item);
  if (data.chapters) for (const item of data.chapters) await tx.objectStore('chapters').put(item);
  if (data.entities) for (const item of data.entities) await tx.objectStore('entities').put(item);
  if (data.series) for (const item of data.series) await tx.objectStore('series').put(item);
  if (data.clones) for (const item of data.clones) await tx.objectStore('clones').put(item);
  if (data.versions) for (const item of data.versions) await tx.objectStore('versions').put(item);

  await tx.done;
}

/* ─── Writing Session Operations ─────────────────────────────── */
export async function saveWritingSession(session: WritingSession) {
  const db = await getDB();
  await db.put('writing_sessions', session);
}

export async function getSessionsForProject(projectId: string): Promise<WritingSession[]> {
  const db = await getDB();
  return db.getAllFromIndex('writing_sessions', 'by-project', projectId);
}

export async function getSessionForDate(projectId: string, date: string): Promise<WritingSession | undefined> {
  const db = await getDB();
  const all = await db.getAllFromIndex('writing_sessions', 'by-project', projectId);
  return all.find(s => s.date === date);
}

/* ─── Chapter Critique Operations ────────────────────────────── */
export async function saveChapterCritique(critique: ChapterCritique) {
  const db = await getDB();
  await db.put('chapter_critiques', critique);
}

export async function getCritiqueForChapter(chapterId: string): Promise<ChapterCritique | undefined> {
  const db = await getDB();
  const results = await db.getAllFromIndex('chapter_critiques', 'by-chapter', chapterId);
  return results.sort((a, b) => b.createdAt - a.createdAt)[0];
}


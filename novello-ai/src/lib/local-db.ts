import { openDB, IDBPDatabase } from 'idb';
import { Project, Chapter, Entity, Series, VoiceClone } from './types';

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
}

let dbPromise: Promise<IDBPDatabase<NovelloSchema>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<NovelloSchema>(DB_NAME, 2, {
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
  await db.delete('chapters', id);
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


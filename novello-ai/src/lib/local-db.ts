import { openDB, IDBPDatabase } from 'idb';
import { Project, Chapter, Entity, Series } from './types';

const DB_NAME = 'novello-ai-local';
const DB_VERSION = 1;

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
}

let dbPromise: Promise<IDBPDatabase<NovelloSchema>> | null = null;

export const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<NovelloSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Projects store
        const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
        projectStore.createIndex('by-updated', 'updatedAt');

        // Chapters store
        const chapterStore = db.createObjectStore('chapters', { keyPath: 'id' });
        chapterStore.createIndex('by-project', 'projectId');
        chapterStore.createIndex('by-order', 'order');

        // Entities store
        const entityStore = db.createObjectStore('entities', { keyPath: 'id' });
        entityStore.createIndex('by-project', 'projectId');
        entityStore.createIndex('by-type', 'type');

        // Series store
        const seriesStore = db.createObjectStore('series', { keyPath: 'id' });
        seriesStore.createIndex('by-updated', 'updatedAt');
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

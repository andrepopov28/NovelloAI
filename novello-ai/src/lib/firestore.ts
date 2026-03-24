import { 
  getDB,
  saveProject as dbSaveProject, 
  getProject as dbGetProject, 
  getAllProjects as dbGetAllProjects, 
  deleteProject as dbDeleteProject,
  saveChapter as dbSaveChapter,
  getChapters as dbGetChapters,
  deleteChapter as dbDeleteChapter,
  saveEntity as dbSaveEntity,
  getEntities as dbGetEntities,
  deleteEntity as dbDeleteEntity,
  saveVersionToDB,
  getVersionsForChapter
} from './local-db';
import type { Project, Chapter, Entity, ChapterVersion, Series } from './types';
import { computeProjectStyle } from './style-engine';

// Simple EventEmitter-like pattern for subscriptions
class LocalEventEmitter {
  private listeners: { [key: string]: Function[] } = {};
  
  subscribe(event: string, callback: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }
  
  emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}

const events = new LocalEventEmitter();

/* ─── Project Operations ─────────────────────────────────────── */
export async function createProject(
  userId: string,
  data: { title: string; genre: string; synopsis: string; targetWordCount?: number; targetChapterCount?: number }
): Promise<string> {
  const id = crypto.randomUUID();
  const now = Date.now();
  const newProject: Project = {
    id,
    userId,
    title: data.title,
    genre: data.genre,
    synopsis: data.synopsis,
    seriesId: null,
    blurb: null,
    metadata: null,
    wordCount: 0,
    targetWordCount: data.targetWordCount ?? 80000,
    targetChapterCount: data.targetChapterCount ?? 0,
    chapterCount: 0,
    coverImage: '',
    settings: {
      aiProvider: 'ollama' as const,
      modelName: '',  // resolved at generation time from OLLAMA_MODEL env var
      temperature: 0.7,
      includeSeriesContext: false,
    },
    styleProfile: null,
    contextRollup: { chapterSummaries: [], lastUpdated: now },
    createdAt: now,
    updatedAt: now,
  };
  
  await dbSaveProject(newProject);
  await createChapter(id, userId, { title: 'Chapter 1', order: 0 });
  events.emit('projects-changed');
  return id;
}

export async function updateProject(projectId: string, data: Partial<Omit<Project, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
  const existing = await dbGetProject(projectId);
  if (!existing) return;
  await dbSaveProject({ ...existing, ...data, updatedAt: Date.now() });
  events.emit('projects-changed');
}

export async function updateProjectWordCountDelta(projectId: string, delta: number): Promise<void> {
    if (delta === 0) return;
    const existing = await dbGetProject(projectId);
    if (!existing) return;
    await updateProject(projectId, { wordCount: (existing.wordCount || 0) + delta });
}

export async function deleteProject(projectId: string): Promise<void> {
  await dbDeleteProject(projectId);
  events.emit('projects-changed');
}

export function subscribeToUserProjects(userId: string, callback: (projects: Project[]) => void, onError: (error: Error) => void) {
  const refresh = async () => {
    try {
      const projects = await dbGetAllProjects();
      callback(projects.reverse()); // desc updated
    } catch (e) {
      onError(e as Error);
    }
  };
  refresh();
  return events.subscribe('projects-changed', refresh);
}

/* ─── Chapter Operations ─────────────────────────────────────── */
export async function createChapter(
  projectId: string,
  userId: string,
  data: { title: string; order: number; content?: string }
): Promise<string> {
  const id = crypto.randomUUID();
  const now = Date.now();
  const newChapter: Chapter = {
    id,
    projectId,
    userId,
    title: data.title,
    order: data.order,
    content: data.content || '',
    synopsis: '',
    status: 'draft' as const,
    lastSummary: '',
    wordCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await dbSaveChapter(newChapter);
  events.emit(`chapters-changed-${projectId}`);
  return id;
}

export async function updateChapter(chapterId: string, data: Partial<Omit<Chapter, 'id' | 'userId' | 'projectId' | 'createdAt'>>): Promise<void> {
  const db = await getDB();
  const existing = await db.get('chapters', chapterId);
  if (!existing) return;
  const updated = { ...existing, ...data, updatedAt: Date.now() };
  await db.put('chapters', updated);
  events.emit(`chapters-changed-${existing.projectId}`);
}

export async function deleteChapter(chapterId: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('chapters', chapterId);
  if (!existing) return;
  await dbDeleteChapter(chapterId);
  events.emit(`chapters-changed-${existing.projectId}`);
}

export function subscribeToChapters(projectId: string, userId: string, callback: (chapters: Chapter[]) => void, onError: (error: Error) => void) {
  const refresh = async () => {
    try {
      const chapters = await dbGetChapters(projectId);
      callback(chapters.sort((a,b) => (a.order || 0) - (b.order || 0)));
    } catch (e) {
      onError(e as Error);
    }
  };
  refresh();
  return events.subscribe(`chapters-changed-${projectId}`, refresh);
}

/* ─── Entity Operations ──────────────────────────────────────── */
export async function createEntity(projectId: string, userId: string, data: { name: string; type: Entity['type']; description: string }): Promise<string> {
  const id = crypto.randomUUID();
  const now = Date.now();
  const newEntity: Entity = {
    id,
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
    createdAt: now,
    updatedAt: now,
  };
  await dbSaveEntity(newEntity);
  events.emit(`entities-changed-${projectId}`);
  return id;
}

export async function updateEntity(entityId: string, data: Partial<Omit<Entity, 'id' | 'userId' | 'projectId' | 'createdAt'>>): Promise<void> {
    const db = await getDB();
    const existing = await db.get('entities', entityId);
    if (!existing) return;
    await db.put('entities', { ...existing, ...data, updatedAt: Date.now() });
    events.emit(`entities-changed-${existing.projectId}`);
}

export async function deleteEntity(entityId: string): Promise<void> {
    const db = await getDB();
    const existing = await db.get('entities', entityId);
    if (!existing) return;
    await dbDeleteEntity(entityId);
    events.emit(`entities-changed-${existing.projectId}`);
}

export function subscribeToEntities(projectId: string, userId: string, callback: (entities: Entity[]) => void, onError: (error: Error) => void) {
  const refresh = async () => {
    try {
      const entities = await dbGetEntities(projectId);
      callback(entities.sort((a,b) => (a.name || '').localeCompare(b.name || '')));
    } catch (e) {
      onError(e as Error);
    }
  };
  refresh();
  return events.subscribe(`entities-changed-${projectId}`, refresh);
}

/* ─── Aggregate Helpers ──────────────────────────────────────── */
export async function recalculateProjectWordCount(projectId: string): Promise<void> {
    const chapters = await dbGetChapters(projectId);
    const totalWords = chapters.reduce((sum, d) => {
        const content = d.content || '';
        const text = content.replace(/<[^>]*>/g, ' ');
        return sum + (text.trim() ? text.trim().split(/\s+/).length : 0);
    }, 0);
    await updateProject(projectId, { wordCount: totalWords });
}

/* ─── Series Operations ──────────────────────────────────────── */
export async function createSeries(userId: string, data: { title: string; description: string }): Promise<string> {
    const db = await getDB();
    const id = crypto.randomUUID();
    const now = Date.now();
    const newSeries: Series = {
        id,
        userId,
        title: data.title,
        description: data.description,
        projectIds: [],
        sharedEntityIds: [],
        createdAt: now,
        updatedAt: now,
    };
    await db.put('series', newSeries);
    events.emit('series-changed');
    return id;
}

export function subscribeToUserSeries(userId: string, callback: (series: Series[]) => void, onError: (error: Error) => void) {
  const refresh = async () => {
    try {
      const db = await getDB();
      const list = await db.getAllFromIndex('series', 'by-updated');
      callback(list.reverse());
    } catch (e) {
      onError(e as Error);
    }
  };
  refresh();
  return events.subscribe('series-changed', refresh);
}

// Stubs for complex batch operations not strictly needed for basic local functionality
export async function reorderChapters(projectId: string, orderedIds: string[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('chapters', 'readwrite');
    for (const [index, id] of orderedIds.entries()) {
        const existing = await tx.store.get(id);
        if (existing) {
            await tx.store.put({ ...existing, order: index, updatedAt: Date.now() });
        }
    }
    await tx.done;
    events.emit(`chapters-changed-${projectId}`);
}

// Other stubs...
export function subscribeToProject(projectId: string, callback: (project: Project | null) => void, onError: (error: Error) => void) {
    const refresh = async () => {
        try {
            const p = await dbGetProject(projectId);
            callback(p || null);
        } catch (e) {
            onError(e as Error);
        }
    };
    refresh();
    return events.subscribe('projects-changed', refresh);
}

export function subscribeToSeries(seriesId: string, callback: (series: Series | null) => void, onError: (error: Error) => void) {
    const refresh = async () => {
        try {
            const db = await getDB();
            const s = await db.get('series', seriesId);
            callback(s || null);
        } catch (e) {
            onError(e as Error);
        }
    };
    refresh();
    return events.subscribe('series-changed', refresh);
}

/* ─── Series Management ──────────────────────────────────────── */

export async function updateSeries(seriesId: string, data: Partial<Series>): Promise<void> {
    const db = await getDB();
    const existing = await db.get('series', seriesId);
    if (!existing) return;
    await db.put('series', { ...existing, ...data, updatedAt: Date.now() });
    events.emit('series-changed');
}

export async function deleteSeries(seriesId: string): Promise<void> {
    const db = await getDB();
    await db.delete('series', seriesId);
    events.emit('series-changed');
}

export async function addProjectToSeries(seriesId: string, projectId: string): Promise<void> {
    const db = await getDB();
    const existing = await db.get('series', seriesId);
    if (!existing) return;
    const projectIds = Array.from(new Set([...(existing.projectIds || []), projectId]));
    await db.put('series', { ...existing, projectIds, updatedAt: Date.now() });
    events.emit('series-changed');
}

export async function removeProjectFromSeries(seriesId: string, projectId: string): Promise<void> {
    const db = await getDB();
    const existing = await db.get('series', seriesId);
    if (!existing) return;
    const projectIds = (existing.projectIds || []).filter((id: string) => id !== projectId);
    await db.put('series', { ...existing, projectIds, updatedAt: Date.now() });
    events.emit('series-changed');
}

export function subscribeToSeriesProjects(seriesId: string, callback: (projects: Project[]) => void, onError: (error: Error) => void) {
    const refresh = async () => {
        try {
            const db = await getDB();
            const series = await db.get('series', seriesId);
            if (!series?.projectIds?.length) { callback([]); return; }
            const projects = await Promise.all(
                series.projectIds.map((id: string) => dbGetProject(id))
            );
            callback(projects.filter(Boolean) as Project[]);
        } catch (e) {
            onError(e as Error);
        }
    };
    refresh();
    return events.subscribe('series-changed', refresh);
}

/* ─── Version History ────────────────────────────────────────── */

export async function saveVersion(
    chapterId: string, 
    userId: string, 
    content: string, 
    source: 'autosave' | 'manual' | 'ai-generation' | 'import' = 'manual'
): Promise<string> {
    const id = crypto.randomUUID();
    const wordCount = content ? content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length : 0;
    const version: ChapterVersion = {
        id, chapterId, content,
        userId: userId || 'local',
        source,
        isPinned: false,
        wordCount,
        createdAt: Date.now()
    };
    
    await saveVersionToDB(version);
    events.emit(`versions-changed-${chapterId}`);
    return id;
}

export function subscribeToVersions(chapterId: string, callback: (versions: ChapterVersion[]) => void, onError: (error: Error) => void) {
    const refresh = async () => {
        try {
            const versions = await getVersionsForChapter(chapterId);
            callback(versions.sort((a,b) => b.createdAt - a.createdAt)); // latest first
        } catch (e) {
            onError(e as Error);
        }
    };
    refresh();
    return events.subscribe(`versions-changed-${chapterId}`, refresh);
}


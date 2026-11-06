import { StudyDocument } from '../types';

const DB_NAME = 'qalami_study_db_v1';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

export const isIndexedDBAvailable = (): boolean => {
  return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
};

/**
 * Open or retrieve the existing IndexedDB connection
 */
export function getDb(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (dbInitPromise) {
    return dbInitPromise;
  }

  if (!isIndexedDBAvailable()) {
    return Promise.reject(new Error('IndexedDB is not available in this environment'));
  }

  dbInitPromise = new Promise<IDBDatabase>((resolve, reject) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('subject', 'subject', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;

        dbInstance.onversionchange = () => {
          dbInstance?.close();
          dbInstance = null;
          dbInitPromise = null;
        };

        resolve(dbInstance);
      };

      request.onerror = (event) => {
        const error = (event.target as IDBOpenDBRequest).error;
        console.warn('IndexedDB open error, using in-memory store:', error);
        dbInitPromise = null;
        reject(error);
      };
    } catch (err) {
      dbInitPromise = null;
      reject(err);
    }
  });

  return dbInitPromise;
}

/**
 * Fetch all documents from IndexedDB
 */
export async function getAllDocumentsFromDb(): Promise<StudyDocument[]> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = (request.result as StudyDocument[]) || [];
        // Sort by updatedAt descending
        result.sort((a, b) => {
          const tA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const tB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return tB - tA;
        });
        resolve(result);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch (err) {
    console.warn('Could not read from IndexedDB, returning empty', err);
    return [];
  }
}

/**
 * Get single document by ID from IndexedDB
 */
export async function getDocumentFromDb(id: string): Promise<StudyDocument | null> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve((request.result as StudyDocument) || null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Save or update document in IndexedDB
 */
export async function saveDocumentToDb(doc: StudyDocument): Promise<void> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(doc);

      request.onsuccess = () => resolve();
      request.onerror = (e) => reject((e.target as IDBRequest).error);
    });
  } catch (err) {
    console.warn('IndexedDB put error, doc cached in memory only:', err);
  }
}

/**
 * Delete document by ID from IndexedDB
 */
export async function deleteDocumentFromDb(id: string): Promise<void> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
}

/**
 * Migrate legacy documents from localStorage into IndexedDB
 * and clean up localStorage to prevent QuotaExceededError
 */
export async function migrateFromLocalStorage(storageKey: string): Promise<StudyDocument[]> {
  if (typeof window === 'undefined') return [];

  let migrated: StudyDocument[] = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        migrated = parsed;
        // Save each to IndexedDB
        for (const doc of migrated) {
          await saveDocumentToDb(doc);
        }
      }
      // Remove the bloated data URL array from localStorage to free up browser quota!
      localStorage.removeItem(storageKey);
      console.info(`Migrated ${migrated.length} documents from localStorage to IndexedDB.`);
    }
  } catch (err) {
    console.warn('Migration from localStorage note:', err);
  }
  return migrated;
}

import { VideoItem } from '../types';

const DB_NAME = 'qalami_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'videos_blob_store';

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.warn('IndexedDB open error:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
}

// In-memory cache of live blob URLs for videos
const activeBlobUrlCache = new Map<string, string>();

/**
 * Permanently save a recorded or uploaded video Blob into IndexedDB
 */
export async function storeVideoBlob(videoId: string, blob: Blob): Promise<void> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, videoId);

      req.onsuccess = () => {
        // Cache the live URL
        try {
          const liveUrl = URL.createObjectURL(blob);
          activeBlobUrlCache.set(videoId, liveUrl);
        } catch {}
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to store video in IndexedDB:', err);
  }
}

/**
 * Retrieve a stored video Blob from IndexedDB
 */
export async function getVideoBlob(videoId: string): Promise<Blob | null> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(videoId);

      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to get video from IndexedDB:', err);
    return null;
  }
}

/**
 * Delete a stored video Blob from IndexedDB
 */
export async function deleteVideoBlob(videoId: string): Promise<void> {
  try {
    const cached = activeBlobUrlCache.get(videoId);
    if (cached) {
      URL.revokeObjectURL(cached);
      activeBlobUrlCache.delete(videoId);
    }

    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(videoId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to delete video from IndexedDB:', err);
  }
}

/**
 * Get or create an active, playable video URL for a VideoItem.
 * If the original videoUrl is a dead blob URL (from previous session),
 * it restores the Blob from IndexedDB and produces a fresh live URL!
 */
export async function resolveVideoUrl(video: VideoItem): Promise<string> {
  if (!video) return '';

  // 1. If it's already a regular HTTP / HTTPS URL (like demo videos) or Data URL, use directly
  if (video.videoUrl.startsWith('http://') || video.videoUrl.startsWith('https://') || video.videoUrl.startsWith('data:')) {
    return video.videoUrl;
  }

  // 2. Check active in-memory cache
  if (activeBlobUrlCache.has(video.id)) {
    return activeBlobUrlCache.get(video.id)!;
  }

  // 3. Try to restore from IndexedDB
  const blob = await getVideoBlob(video.id);
  if (blob) {
    try {
      const liveUrl = URL.createObjectURL(blob);
      activeBlobUrlCache.set(video.id, liveUrl);
      return liveUrl;
    } catch (e) {
      console.warn('Error creating object URL from blob:', e);
    }
  }

  // 4. Return videoUrl as fallback
  return video.videoUrl;
}

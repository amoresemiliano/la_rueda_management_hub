import { AppDataset } from '../domain/types';

export interface IDataRepository {
  load(): Promise<AppDataset | null>;
  save(data: AppDataset): Promise<void>;
  clear(): Promise<void>;
  getStorageBackendLabel(): string;
}

const DB_NAME = 'LaRueda1975DemoDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';
const STATE_KEY = 'dataset_v1';
const FALLBACK_LS_KEY = 'la_rueda_1975_demo_dataset_v1';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no disponible'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class IndexedDBDemoRepository implements IDataRepository {
  private usedFallback = false;

  getStorageBackendLabel(): string {
    return this.usedFallback ? 'LocalStorage (respaldo local)' : 'IndexedDB (persistencia local del navegador)';
  }

  async load(): Promise<AppDataset | null> {
    try {
      const db = await openDB();
      return await new Promise<AppDataset | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(STATE_KEY);
        req.onsuccess = () => resolve((req.result as AppDataset) ?? null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      this.usedFallback = true;
      try {
        const raw = localStorage.getItem(FALLBACK_LS_KEY);
        return raw ? (JSON.parse(raw) as AppDataset) : null;
      } catch {
        return null;
      }
    }
  }

  async save(data: AppDataset): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(data, STATE_KEY);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      this.usedFallback = true;
      localStorage.setItem(FALLBACK_LS_KEY, JSON.stringify(data));
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(STATE_KEY);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Ignore if IndexedDB unavailable
    }
    try {
      localStorage.removeItem(FALLBACK_LS_KEY);
    } catch {
      // Ignore
    }
  }
}

export const demoRepository: IDataRepository = new IndexedDBDemoRepository();

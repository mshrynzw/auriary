/**
 * IndexedDB によるオフラインストレージ操作ユーティリティ
 * 将来実装: オフライン時の日記下書き保存などに使用
 */

const DB_NAME = 'auriary-offline';
const DB_VERSION = 1;
const STORE_NAME = 'diary-drafts';

interface DiaryDraft {
  id?: number;
  journal_date: string;
  note?: string;
  sleep_quality?: number;
  wake_level?: number;
  daytime_level?: number;
  pre_sleep_level?: number;
  med_adherence_level?: number;
  appetite_level?: number;
  sleep_desire_level?: number;
  has_od?: boolean;
  sleep_start_at?: string;
  sleep_end_at?: string;
  bath_start_at?: string;
  bath_end_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * IndexedDB を開く
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('journal_date', 'journal_date', { unique: false });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
    };
  });
}

/**
 * 下書きを保存
 */
export async function saveDraft(draft: Omit<DiaryDraft, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  const draftWithMetadata: DiaryDraft = {
    ...draft,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const request = store.add(draftWithMetadata);
    request.onsuccess = () => {
      resolve(request.result as number);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * 下書きを更新
 */
export async function updateDraft(id: number, draft: Partial<DiaryDraft>): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const existing = getRequest.result;
      if (!existing) {
        reject(new Error('Draft not found'));
        return;
      }

      const updated: DiaryDraft = {
        ...existing,
        ...draft,
        updated_at: new Date().toISOString(),
      };

      const putRequest = store.put(updated);
      putRequest.onsuccess = () => {
        resolve();
      };
      putRequest.onerror = () => {
        reject(putRequest.error);
      };
    };
    getRequest.onerror = () => {
      reject(getRequest.error);
    };
  });
}

/**
 * 下書きを取得
 */
export async function getDraft(id: number): Promise<DiaryDraft | null> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * すべての下書きを取得
 */
export async function getAllDrafts(): Promise<DiaryDraft[]> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * 下書きを削除
 */
export async function deleteDraft(id: number): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * すべての下書きを削除
 */
export async function clearAllDrafts(): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}


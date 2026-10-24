import {
  emptyProgress,
  recoverProgress,
  SCHEMA_VERSION,
  type Progress,
} from "./model";
export interface Database {
  read(): Promise<unknown>;
  write(value: Progress): Promise<void>;
}
export interface ProgressStorage {
  read(): Promise<Progress>;
  save(value: Progress): Promise<boolean>;
  flush(): Promise<void>;
}
export function indexedDatabase(factory: IDBFactory): Database {
  let connection: Promise<IDBDatabase> | null = null;
  const open = () =>
    (connection ??= new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open("studybench", 1);
      let expired = false;
      const timer = setTimeout(() => {
        expired = true;
        reject(new Error("IndexedDB did not open in time"));
      }, 1500);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("progress"))
          request.result.createObjectStore("progress");
      };
      request.onsuccess = () => {
        clearTimeout(timer);
        if (expired) {
          request.result.close();
          return;
        }
        request.result.onversionchange = () => {
          request.result.close();
          connection = null;
        };
        resolve(request.result);
      };
      request.onerror = () => {
        clearTimeout(timer);
        reject(request.error);
      };
      request.onblocked = () => {
        clearTimeout(timer);
        expired = true;
        reject(new Error("IndexedDB is blocked"));
      };
    }));
  return {
    async read() {
      const db = await open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("progress", "readonly");
        const request = tx.objectStore("progress").get("current");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.onabort = () => reject(tx.error);
      });
    },
    async write(value) {
      const db = await open();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction("progress", "readwrite");
        tx.objectStore("progress").put(value, "current");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    },
  };
}
const KEY = "studybench.progress.v2";
const LEGACY = "studybench.progress.v1";
export function createProgressStorage(
  database: Database | null,
  local: Pick<Storage, "getItem" | "setItem"> | null,
  now: () => number = Date.now,
): ProgressStorage {
  let queue: Promise<unknown> = Promise.resolve();
  let db = database;
  let readOnly = false;
  const isNewer = (raw: unknown) =>
    !!raw &&
    typeof raw === "object" &&
    Number((raw as { schemaVersion?: number }).schemaVersion) > SCHEMA_VERSION;
  function localRead() {
    for (const key of [KEY, LEGACY])
      try {
        const raw = local?.getItem(key);
        if (raw) return JSON.parse(raw);
      } catch {
        /* Try the previous format if this journal cannot be decoded. */
      }
    return null;
  }
  function journal(p: Progress) {
    try {
      if (!local) return false;
      local.setItem(KEY, JSON.stringify(p));
      return true;
    } catch {
      return false;
    }
  }
  return {
    async read() {
      const backup = localRead();
      let primary: unknown = null;
      try {
        primary = await db?.read();
      } catch {
        db = null;
      }
      if (isNewer(primary) || isNewer(backup)) {
        readOnly = true;
        throw new Error(
          "Saved progress needs a newer app version. Its data has been preserved.",
        );
      }
      const a = recoverProgress(backup, now());
      const b = recoverProgress(primary, now());
      const p = backup && (!primary || a.revision >= b.revision) ? a : b;
      return backup || primary ? p : emptyProgress();
    },
    save(value) {
      if (readOnly || isNewer(localRead())) return Promise.resolve(false);
      // Executes before any await, preserving the latest answer during immediate tab closure.
      const backupSaved = journal(value);
      const write = queue.then(async () => {
        if (!db) return backupSaved;
        try {
          await db.write(value);
          return true;
        } catch {
          db = null;
          return backupSaved;
        }
      });
      queue = write.catch(() => false);
      return write;
    },
    async flush() {
      await queue;
    },
  };
}
export function browserProgressStorage(): ProgressStorage {
  let local: Storage | null = null;
  let database: Database | null = null;
  try {
    local = globalThis.localStorage;
  } catch {
    /* Some private contexts deny storage. */
  }
  try {
    if (globalThis.indexedDB) database = indexedDatabase(globalThis.indexedDB);
  } catch {
    /* Use localStorage fallback. */
  }
  return createProgressStorage(database, local);
}

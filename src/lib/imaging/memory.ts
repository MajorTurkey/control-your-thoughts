const DB_NAME = "imaging-bay";
const STORE = "memory";
const LEGACY_KEY = "imaging-bay-liked";

type Row = { id: number; url: string };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readMemory(): Promise<string[]> {
  try {
    const legacy = readLegacy();
    const database = await openDb();
    const rows = await new Promise<Row[]>((resolve, reject) => {
      const request = database.transaction(STORE, "readonly").objectStore(STORE).getAll();
      request.onsuccess = () => resolve((request.result as Row[]) ?? []);
      request.onerror = () => reject(request.error);
    });
    database.close();
    const saved = rows
      .filter((row) => typeof row.url === "string")
      .sort((a, b) => b.id - a.id)
      .map((row) => row.url);
    const merged = [...legacy, ...saved].filter((url, index, all) => all.indexOf(url) === index);
    return merged.slice(0, 8);
  } catch {
    return readLegacy();
  }
}

export async function rememberPlate(url: string): Promise<string[]> {
  const next = [url, ...(await readMemory()).filter((item) => item !== url)].slice(0, 8);
  try {
    const database = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      store.clear();
      next.forEach((item, index) => store.put({ id: next.length - index, url: item }));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    database.close();
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* memory stays in this visit */
  }
  return next;
}

function readLegacy(): string[] {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const saved = JSON.parse(raw) as unknown;
    if (!Array.isArray(saved)) return [];
    return saved.filter((item) => typeof item === "string").slice(0, 8);
  } catch {
    return [];
  }
}

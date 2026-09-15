import { clone, projectMeta, type Project, type ProjectMeta } from "./model";
import { uid } from "@/lib/utils";

/**
 * Project library persistence.
 *
 * Reports embed images as data URLs, so a single project can run into tens of
 * megabytes — far past the ~5 MB localStorage ceiling. IndexedDB is the primary
 * store; localStorage is kept as a small-metadata fallback for browsers where
 * IndexedDB is unavailable (private windows, hardened settings) so the app still
 * opens and warns instead of losing work silently.
 */

const DB_NAME = "faisal-reports";
const DB_VERSION = 1;
const PROJECTS = "projects";
const SETTINGS = "settings";
const LS_PROJECTS = "diwan-projects-v1";
const LS_SETTINGS = "diwan-settings-v1";

export type SettingsKey = "activeProjectId" | "dark" | "zoom";

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PROJECTS)) {
        const store = db.createObjectStore(PROJECTS, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      }
      if (!db.objectStoreNames.contains(SETTINGS)) {
        db.createObjectStore(SETTINGS, { keyPath: "key" });
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
  return dbPromise;
}

function tx<T>(
  db: IDBDatabase,
  stores: string | string[],
  mode: IDBTransactionMode,
  run: (t: IDBTransaction) => Promise<T> | T,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let t: IDBTransaction;
    try {
      t = db.transaction(stores, mode);
    } catch (err) {
      reject(err);
      return;
    }
    t.onerror = () => reject(t.error ?? new Error("IndexedDB transaction failed"));
    t.onabort = () => reject(t.error ?? new Error("IndexedDB transaction aborted"));
    t.oncomplete = () => resolve(result as T);
    let result: T;
    Promise.resolve(run(t)).then((value) => {
      result = value;
    }, reject);
  });
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB request failed"));
  });
}

/** localStorage mirror used only when IndexedDB is unavailable. */
const fallback = {
  all(): Project[] {
    try {
      const raw = localStorage.getItem(LS_PROJECTS);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? (parsed as Project[]) : [];
    } catch {
      return [];
    }
  },
  write(list: Project[]) {
    localStorage.setItem(LS_PROJECTS, JSON.stringify(list));
  },
  get(id: string) {
    return this.all().find((p) => p.id === id) || null;
  },
  put(project: Project) {
    const list = this.all().filter((p) => p.id !== project.id);
    list.push(project);
    this.write(list);
  },
  remove(id: string) {
    this.write(this.all().filter((p) => p.id !== id));
  },
};

export function storageMode(): "indexeddb" | "localstorage" {
  return typeof indexedDB === "undefined" ? "localstorage" : "indexeddb";
}

export async function listProjects(): Promise<ProjectMeta[]> {
  const db = await openDb();
  if (!db) return fallback.all().map(projectMeta).sort(byRecency);
  try {
    const rows = await tx(db, PROJECTS, "readonly", (t) => request(t.objectStore(PROJECTS).getAll()));
    return (rows as Project[]).map(projectMeta).sort(byRecency);
  } catch {
    return [];
  }
}

function byRecency(a: ProjectMeta, b: ProjectMeta) {
  return b.updatedAt - a.updatedAt;
}

export async function getProject(id: string): Promise<Project | null> {
  const db = await openDb();
  if (!db) return fallback.get(id);
  try {
    const row = await tx(db, PROJECTS, "readonly", (t) => request(t.objectStore(PROJECTS).get(id)));
    return (row as Project | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function saveProject(project: Project): Promise<Project> {
  const stamped: Project = {
    ...project,
    id: project.id || uid("proj"),
    createdAt: project.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  const db = await openDb();
  if (!db) {
    fallback.put(stamped);
    return stamped;
  }
  await tx(db, PROJECTS, "readwrite", (t) => request(t.objectStore(PROJECTS).put(clone(stamped))));
  return stamped;
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDb();
  if (!db) {
    fallback.remove(id);
    return;
  }
  await tx(db, PROJECTS, "readwrite", (t) => request(t.objectStore(PROJECTS).delete(id)));
}

export async function duplicateProject(id: string): Promise<Project | null> {
  const source = await getProject(id);
  if (!source) return null;
  const copy: Project = {
    ...clone(source),
    id: uid("proj"),
    name: `${source.name} نسخة`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pages: source.pages.map((p) => ({ ...clone(p), id: uid("page"), elements: p.elements.map((e) => ({ ...clone(e), id: uid("el") })) })),
  };
  return saveProject(copy);
}

export async function getSetting<T = unknown>(key: SettingsKey): Promise<T | null> {
  const db = await openDb();
  if (!db) {
    try {
      const raw = localStorage.getItem(LS_SETTINGS);
      const parsed = raw ? JSON.parse(raw) : {};
      return (parsed?.[key] ?? null) as T | null;
    } catch {
      return null;
    }
  }
  try {
    const row = await tx(db, SETTINGS, "readonly", (t) => request(t.objectStore(SETTINGS).get(key)));
    return ((row as { key: string; value: unknown } | undefined)?.value ?? null) as T | null;
  } catch {
    return null;
  }
}

export async function setSetting(key: SettingsKey, value: unknown): Promise<void> {
  const db = await openDb();
  if (!db) {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(localStorage.getItem(LS_SETTINGS) || "{}") || {};
    } catch {
      parsed = {};
    }
    parsed[key] = value;
    localStorage.setItem(LS_SETTINGS, JSON.stringify(parsed));
    return;
  }
  try {
    await tx(db, SETTINGS, "readwrite", (t) =>
      request(t.objectStore(SETTINGS).put({ key, value })),
    );
  } catch {
    /* settings are best-effort; losing one must not break the editor */
  }
}

/**
 * One-time upgrade of the pre-upgrade single-project autosave slot into the
 * library. Returns the migrated project so the caller can open it directly.
 */
export async function migrateLegacyProject(raw: unknown): Promise<Project | null> {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<Project> & { activePageId?: string };
  if (!Array.isArray(data.pages) || data.pages.length === 0) return null;
  const project: Project = {
    version: data.version || 2,
    name: data.name || "تقرير مستعاد",
    theme: data.theme || "official",
    orgName: data.orgName || "",
    defaultSize: data.defaultSize || "a4-portrait",
    id: uid("proj"),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pages: data.pages,
  };
  return saveProject(project);
}

export async function clearAllProjects(): Promise<void> {
  const db = await openDb();
  if (!db) {
    fallback.write([]);
    return;
  }
  await tx(db, PROJECTS, "readwrite", (t) => request(t.objectStore(PROJECTS).clear()));
}

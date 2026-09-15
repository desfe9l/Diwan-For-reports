import { create } from "zustand";
import { toast } from "sonner";
import {
  A4,
  GRID,
  THEMES,
  clone,
  constrainElement,
  createElement,
  nextZ,
  normalizeZ,
  pageSize,
  sizePreset,
  type CanvasEl,
  type ElType,
  type Page,
  type PackId,
  type Project,
  type ProjectMeta,
  type SizeId,
  type ThemeId,
} from "./model";
import {
  deleteProject as removeProject,
  duplicateProject as copyProject,
  getProject,
  getSetting,
  listProjects,
  migrateLegacyProject,
  saveProject,
  setSetting,
  storageMode,
} from "./storage";
import { createProject, createTemplatePage } from "./templates";
import { LEGACY_STORE_KEY, UI_KEY } from "./model";
import { clamp, uid } from "@/lib/utils";

export type LeftTab = "elements" | "templates" | "theme" | "pages" | "settings";
export type RightTab = "properties" | "layers";
export type View = "home" | "editor";
export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

interface Ui {
  activePageId: string;
  selectedId: string | null;
  zoom: number;
  showGrid: boolean;
  snapGrid: boolean;
  snapElements: boolean;
  previewAll: boolean;
  dark: boolean;
  leftTab: LeftTab;
  rightTab: RightTab;
  leftOpen: boolean;
  rightOpen: boolean;
  exportOpen: boolean;
  pageManagerOpen: boolean;
  saveState: SaveState;
  savedAt: number | null;
  /** Re-renders the "saved N minutes ago" label without polling the store. */
  clockTick: number;
}

interface History {
  past: string[];
  future: string[];
}

export interface StorageInfo {
  mode: "indexeddb" | "localstorage";
  persistent: boolean;
}

interface EditorStore extends Project, Ui, History {
  hydrated: boolean;
  clipboard: CanvasEl | null;
  projects: ProjectMeta[];
  projectsLoading: boolean;
  storage: StorageInfo;
  hydrate: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  createProject: (pack: PackId, theme?: ThemeId) => Promise<void>;
  openProject: (id: string) => Promise<void>;
  saveNow: () => Promise<void>;
  renameProject: (id: string, name: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  importProject: (data: Partial<Project>) => Promise<void>;
  setZoom: (z: number) => void;
  toggle: (
    key: keyof Pick<
      Ui,
      "showGrid" | "snapGrid" | "snapElements" | "previewAll" | "dark" | "leftOpen" | "rightOpen" | "exportOpen" | "pageManagerOpen"
    >,
  ) => void;
  setLeftTab: (t: LeftTab) => void;
  setRightTab: (t: RightTab) => void;
  setTheme: (id: ThemeId) => void;
  setName: (name: string) => void;
  setOrg: (org: string) => void;
  setActivePage: (id: string) => void;
  select: (id: string | null) => void;
  addElement: (type: ElType, over?: Partial<CanvasEl>) => void;
  updateElement: (id: string, patch: Partial<CanvasEl>, live?: boolean) => void;
  updateStyle: (id: string, patch: CanvasEl["style"], live?: boolean) => void;
  replaceElement: (el: CanvasEl, live?: boolean) => void;
  duplicateSelected: () => void;
  copySelected: () => void;
  pasteClipboard: () => void;
  deleteSelected: () => void;
  bring: (dir: "forward" | "back" | "front" | "bottom") => void;
  toggleLock: () => void;
  toggleHidden: () => void;
  addPage: (size?: SizeId) => void;
  addTemplatePage: (id: string) => void;
  duplicatePage: (id?: string) => void;
  deletePage: (id?: string) => void;
  movePage: (dir: -1 | 1) => void;
  movePageById: (id: string, dir: -1 | 1) => void;
  reorderPages: (from: number, to: number) => void;
  renamePage: (id: string, name: string) => void;
  setPageSize: (id: string, sizeId: SizeId, custom?: { w: number; h: number }) => void;
  setAllPageSizes: (sizeId: SizeId, custom?: { w: number; h: number }) => void;
  alignPage: (edge: "left" | "right" | "center" | "top" | "middle" | "bottom") => void;
  undo: () => void;
  redo: () => void;
  commit: () => void;
}

function projectSlice(s: Project): Project {
  return {
    version: s.version,
    name: s.name,
    theme: s.theme,
    orgName: s.orgName,
    pages: s.pages,
    id: s.id,
    createdAt: s.createdAt,
    defaultSize: s.defaultSize,
  };
}

function snap(v: number, enabled: boolean) {
  if (!enabled) return v;
  return Math.round(v / GRID) * GRID;
}

const blank = createProject("official");

function activePageOf(s: { pages: Page[]; activePageId: string }) {
  return s.pages.find((p) => p.id === s.activePageId) || s.pages[0];
}

/** Normalises anything loaded from disk, a file, or an older schema version. */
function normalizeProject(incoming: Project): Project {
  const pages = incoming.pages?.length ? incoming.pages : createProject("blank").pages;
  pages.forEach((p) => {
    p.elements ||= [];
    p.w = pageSize(p).w;
    p.h = pageSize(p).h;
    const size = pageSize(p);
    p.elements.forEach((el) => {
      el.style ||= {};
      el.opacity ??= 1;
      el.rotation ??= 0;
      constrainElement(el, size);
    });
    normalizeZ(p);
  });
  return {
    version: incoming.version || 2,
    name: incoming.name || "تقرير",
    theme: incoming.theme || "official",
    orgName: incoming.orgName || "",
    pages,
    id: incoming.id,
    createdAt: incoming.createdAt,
    updatedAt: incoming.updatedAt,
    defaultSize: incoming.defaultSize || "a4-portrait",
  };
}

export const useEditor = create<EditorStore>((set, get) => {
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  /** Debounced autosave. Kept off the render path: no store writes until it fires. */
  const scheduleSave = (delay = 900) => {
    if (saveTimer) clearTimeout(saveTimer);
    if (get().saveState !== "saving") set({ saveState: "dirty" });
    saveTimer = setTimeout(() => {
      void get().saveNow();
    }, delay);
  };

  const pushHistory = () => {
    const snapStr = JSON.stringify(projectSlice(get()));
    const past = [...get().past, snapStr];
    if (past.length > 60) past.shift();
    set({ past, future: [] });
    scheduleSave();
  };

  const applyProject = (incoming: Project, extra: Partial<EditorStore> = {}) => {
    const project = normalizeProject(incoming);
    set({
      ...project,
      activePageId: extra.activePageId || project.pages[0]?.id,
      selectedId: null,
      ...extra,
    });
  };

  return {
    ...blank,
    activePageId: blank.pages[0].id,
    selectedId: null,
    zoom: 0.82,
    showGrid: false,
    snapGrid: true,
    snapElements: true,
    previewAll: false,
    dark: false,
    leftTab: "elements",
    rightTab: "properties",
    leftOpen: false,
    rightOpen: false,
    exportOpen: false,
    pageManagerOpen: false,
    saveState: "idle",
    savedAt: null,
    clockTick: 0,
    hydrated: false,
    clipboard: null,
    past: [],
    future: [],
    projects: [],
    projectsLoading: true,
    storage: { mode: "indexeddb", persistent: true },

    hydrate: async () => {
      if (get().hydrated) return;
      const mode = storageMode();
      set({ storage: { mode, persistent: mode === "indexeddb" } });

      try {
        const ui = readUi();
        const legacy = localStorage.getItem(LEGACY_STORE_KEY);
        let list = await listProjects();
        if (!list.length && legacy) {
          try {
            const migrated = await migrateLegacyProject(JSON.parse(legacy));
            if (migrated) {
              list = await listProjects();
              toast.success("تم ترحيل مشروعك المحفوظ إلى مكتبة المشاريع");
            }
          } catch {
            /* a corrupt legacy blob must not block startup */
          }
        }
        const activeId = (await getSetting<string>("activeProjectId")) || ui.activeProjectId;
        const active = activeId ? await getProject(activeId) : null;
        set({
          projects: list,
          projectsLoading: false,
          dark: Boolean(ui.dark),
          zoom: typeof ui.zoom === "number" ? clamp(ui.zoom, 0.35, 1.6) : 0.82,
        });
        if (active) applyProject(active, { zoom: get().zoom });
      } catch {
        set({ projectsLoading: false });
      }

      document.documentElement.classList.toggle("dark", get().dark);
      document.documentElement.lang = "ar";
      document.documentElement.dir = "rtl";
      set({ hydrated: true, past: [JSON.stringify(projectSlice(get()))], future: [], saveState: "saved", savedAt: Date.now() });
    },

    refreshProjects: async () => {
      set({ projectsLoading: true });
      const list = await listProjects();
      set({ projects: list, projectsLoading: false });
    },

    createProject: async (pack, theme) => {
      const s = get();
      const project = createProject(pack, theme || (pack === "eid" ? "eid" : "official"), s.orgName);
      const saved = await saveProject(project);
      applyProject(saved, { zoom: 0.82 });
      set({
        past: [JSON.stringify(projectSlice(get()))],
        future: [],
        saveState: "saved",
        savedAt: Date.now(),
      });
      await setSetting("activeProjectId", saved.id);
      await get().refreshProjects();
    },

    openProject: async (id) => {
      const project = await getProject(id);
      if (!project) {
        toast.error("تعذر فتح المشروع");
        await get().refreshProjects();
        return;
      }
      applyProject(project, { zoom: get().zoom || 0.82 });
      set({ past: [JSON.stringify(projectSlice(get()))], future: [], saveState: "saved", savedAt: Date.now() });
      await setSetting("activeProjectId", project.id);
    },

    saveNow: async () => {
      const s = get();
      if (!s.pages?.length) return;
      set({ saveState: "saving" });
      try {
        const saved = await saveProject({
          ...projectSlice(s),
          version: s.version,
          updatedAt: Date.now(),
        });
        set({
          id: saved.id,
          createdAt: saved.createdAt,
          saveState: "saved",
          savedAt: Date.now(),
        });
        await setSetting("activeProjectId", saved.id);
        await get().refreshProjects();
      } catch (err) {
        console.error("[editor] autosave failed", err);
        set({ saveState: "error" });
      }
    },

    renameProject: async (id, name) => {
      const project = await getProject(id);
      if (!project) return;
      await saveProject({ ...project, name, id });
      if (get().id === id) set({ name });
      await get().refreshProjects();
    },

    duplicateProject: async (id) => {
      const copy = await copyProject(id);
      if (!copy) {
        toast.error("تعذر نسخ المشروع");
        return;
      }
      await get().refreshProjects();
      toast.success(`تم إنشاء «${copy.name}»`);
    },

    deleteProject: async (id) => {
      await removeProject(id);
      const s = get();
      if (s.id === id) {
        applyProject(createProject("blank", s.theme), { selectedId: null });
        await setSetting("activeProjectId", null);
      }
      await get().refreshProjects();
    },

    importProject: async (data) => {
      if (!data || !Array.isArray(data.pages) || !data.pages.length) {
        toast.error("ملف المشروع غير صالح — لا يحتوي على صفحات");
        return;
      }
      const incoming = normalizeProject({
        version: data.version || 2,
        name: data.name || "مشروع مستورد",
        theme: (data.theme as ThemeId) || "official",
        orgName: data.orgName || "",
        defaultSize: data.defaultSize,
        pages: data.pages,
        id: uid("proj"),
        createdAt: Date.now(),
      });
      const saved = await saveProject(incoming);
      applyProject(saved);
      set({ past: [JSON.stringify(projectSlice(get()))], future: [], saveState: "saved", savedAt: Date.now() });
      await setSetting("activeProjectId", saved.id);
      await get().refreshProjects();
      toast.success("تم استيراد المشروع");
    },

    setZoom: (z) => {
      const zoom = clamp(z, 0.2, 2);
      set({ zoom });
      void setSetting("zoom", zoom);
    },
    toggle: (key) => {
      const next = !get()[key];
      set({ [key]: next } as Partial<EditorStore>);
      if (key === "dark") {
        document.documentElement.classList.toggle("dark", next);
        void setSetting("dark", next);
      }
    },
    setLeftTab: (leftTab) => set({ leftTab, leftOpen: true }),
    setRightTab: (rightTab) => set({ rightTab, rightOpen: true }),
    setTheme: (theme) => {
      set({ theme });
      pushHistory();
    },
    setName: (name) => {
      set({ name });
      scheduleSave(500);
    },
    setOrg: (orgName) => {
      set({ orgName });
      scheduleSave(500);
    },
    setActivePage: (id) => {
      if (id === get().activePageId && !get().previewAll) return;
      set({ activePageId: id, selectedId: null, previewAll: false });
    },
    select: (id) => set((s) => ({ selectedId: id, rightOpen: id ? true : s.rightOpen })),

    addElement: (type, over) => {
      const s = get();
      const page = activePageOf(s);
      if (!page) return;
      const theme = THEMES[s.theme];
      const size = pageSize(page);
      const el = createElement(
        type,
        {
          x: Math.min(28, size.w - 40),
          y: Math.min(36 + (page.elements.length % 8) * 6, size.h - 20),
          z: nextZ(page),
          ...over,
        },
        theme,
      );
      constrainElement(el, size);
      set({
        pages: s.pages.map((p) => (p.id === page.id ? { ...p, elements: [...p.elements, el] } : p)),
        selectedId: el.id,
        rightTab: "properties",
      });
      pushHistory();
    },

    updateElement: (id, patch, live) => {
      const s = get();
      const pages = s.pages.map((p) => {
        if (!p.elements.some((el) => el.id === id)) return p;
        const size = pageSize(p);
        return {
          ...p,
          elements: p.elements.map((el) => {
            if (el.id !== id) return el;
            const next = { ...el, ...patch, style: { ...el.style, ...(patch.style || {}) } };
            if (patch.x != null && !live) next.x = snap(Number(patch.x), s.snapGrid);
            if (patch.y != null && !live) next.y = snap(Number(patch.y), s.snapGrid);
            constrainElement(next, size);
            return next;
          }),
        };
      });
      set({ pages });
      if (live) scheduleSave(400);
      else pushHistory();
    },

    updateStyle: (id, patch, live) => {
      const s = get();
      set({
        pages: s.pages.map((p) => ({
          ...p,
          elements: p.elements.map((el) => (el.id === id ? { ...el, style: { ...el.style, ...patch } } : el)),
        })),
      });
      if (live) scheduleSave(400);
      else pushHistory();
    },

    replaceElement: (el, live) => {
      const s = get();
      const pages = s.pages.map((p) => {
        if (!p.elements.some((e) => e.id === el.id)) return p;
        const size = pageSize(p);
        const next = clone(el);
        constrainElement(next, size);
        return { ...p, elements: p.elements.map((e) => (e.id === el.id ? next : e)) };
      });
      set({ pages });
      if (live) scheduleSave(600);
      else pushHistory();
    },

    duplicateSelected: () => {
      const s = get();
      const page = activePageOf(s);
      const el = page?.elements.find((e) => e.id === s.selectedId);
      if (!page || !el) return;
      const size = pageSize(page);
      const copy = clone(el);
      copy.id = uid("el");
      copy.x = clamp(el.x + 6, 0, size.w - el.w);
      copy.y = clamp(el.y + 6, 0, size.h - el.h);
      copy.z = nextZ(page);
      copy.name = `${el.name} نسخة`;
      set({
        pages: s.pages.map((p) => (p.id === page.id ? { ...p, elements: [...p.elements, copy] } : p)),
        selectedId: copy.id,
      });
      pushHistory();
    },

    copySelected: () => {
      const s = get();
      const page = activePageOf(s);
      const el = page?.elements.find((e) => e.id === s.selectedId);
      if (!el) return;
      set({ clipboard: clone(el) });
    },

    pasteClipboard: () => {
      const s = get();
      if (!s.clipboard) return;
      const page = activePageOf(s);
      if (!page) return;
      const size = pageSize(page);
      const el = clone(s.clipboard);
      el.id = uid("el");
      el.x = clamp(el.x + 8, 0, size.w - el.w);
      el.y = clamp(el.y + 8, 0, size.h - el.h);
      el.z = nextZ(page);
      constrainElement(el, size);
      set({
        pages: s.pages.map((p) => (p.id === page.id ? { ...p, elements: [...p.elements, el] } : p)),
        selectedId: el.id,
      });
      pushHistory();
    },

    deleteSelected: () => {
      const s = get();
      const page = activePageOf(s);
      const el = page?.elements.find((e) => e.id === s.selectedId);
      if (!page || !el || el.locked) return;
      set({
        pages: s.pages.map((p) =>
          p.id === page.id ? { ...p, elements: p.elements.filter((e) => e.id !== el.id) } : p,
        ),
        selectedId: null,
      });
      pushHistory();
    },

    bring: (dir) => {
      const s = get();
      const page = activePageOf(s);
      const el = page?.elements.find((e) => e.id === s.selectedId);
      if (!page || !el) return;
      const moved = clone(el);
      if (dir === "forward") moved.z += 1.5;
      if (dir === "back") moved.z -= 1.5;
      if (dir === "front") moved.z = page.elements.length + 2;
      if (dir === "bottom") moved.z = 0;
      const pages = s.pages.map((p) => {
        if (p.id !== page.id) return p;
        const next = { ...p, elements: p.elements.map((e) => (e.id === el.id ? moved : e)) };
        normalizeZ(next);
        return next;
      });
      set({ pages });
      pushHistory();
    },

    toggleLock: () => {
      const s = get();
      set({
        pages: s.pages.map((p) => ({
          ...p,
          elements: p.elements.map((e) => (e.id === s.selectedId ? { ...e, locked: !e.locked } : e)),
        })),
      });
      pushHistory();
    },

    toggleHidden: () => {
      const s = get();
      set({
        pages: s.pages.map((p) => ({
          ...p,
          elements: p.elements.map((e) => (e.id === s.selectedId ? { ...e, hidden: !e.hidden } : e)),
        })),
      });
      pushHistory();
    },

    addPage: (sizeId) => {
      const s = get();
      const preset = sizePreset(sizeId || s.defaultSize || "a4-portrait");
      const p: Page = {
        id: uid("page"),
        name: `صفحة ${s.pages.length + 1}`,
        elements: [],
        bg: THEMES[s.theme].paper,
        w: preset.w,
        h: preset.h,
      };
      set({ pages: [...s.pages, p], activePageId: p.id, selectedId: null, previewAll: false });
      pushHistory();
    },

    addTemplatePage: (id) => {
      const s = get();
      const p = createTemplatePage(id, THEMES[s.theme], s.orgName);
      set({ pages: [...s.pages, p], activePageId: p.id, selectedId: null, previewAll: false });
      pushHistory();
    },

    duplicatePage: (id) => {
      const s = get();
      const targetId = id || s.activePageId;
      const page = s.pages.find((p) => p.id === targetId);
      if (!page) return;
      const copy: Page = {
        ...clone(page),
        id: uid("page"),
        name: `${page.name} نسخة`,
        elements: page.elements.map((e) => ({ ...clone(e), id: uid("el") })),
      };
      const idx = s.pages.findIndex((p) => p.id === page.id);
      const pages = [...s.pages];
      pages.splice(idx + 1, 0, copy);
      set({ pages, activePageId: copy.id, selectedId: null });
      pushHistory();
    },

    deletePage: (id) => {
      const s = get();
      if (s.pages.length <= 1) {
        toast.error("لا يمكن حذف الصفحة الوحيدة");
        return;
      }
      const targetId = id || s.activePageId;
      const idx = s.pages.findIndex((p) => p.id === targetId);
      if (idx < 0) return;
      const pages = s.pages.filter((p) => p.id !== targetId);
      const nextActive =
        targetId === s.activePageId ? pages[Math.max(0, idx - 1)].id : s.activePageId;
      set({ pages, activePageId: nextActive, selectedId: null });
      pushHistory();
    },

    movePage: (dir) => {
      const s = get();
      const idx = s.pages.findIndex((p) => p.id === s.activePageId);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= s.pages.length) return;
      const pages = [...s.pages];
      const [item] = pages.splice(idx, 1);
      pages.splice(next, 0, item);
      set({ pages });
      pushHistory();
    },

    movePageById: (id, dir) => {
      const s = get();
      const idx = s.pages.findIndex((p) => p.id === id);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= s.pages.length) return;
      const pages = [...s.pages];
      const [item] = pages.splice(idx, 1);
      pages.splice(next, 0, item);
      set({ pages });
      pushHistory();
    },

    reorderPages: (from, to) => {
      const s = get();
      if (from === to || from < 0 || to < 0 || from >= s.pages.length || to >= s.pages.length) return;
      const pages = [...s.pages];
      const [item] = pages.splice(from, 1);
      pages.splice(to, 0, item);
      set({ pages });
      pushHistory();
    },

    renamePage: (id, name) => {
      set({ pages: get().pages.map((p) => (p.id === id ? { ...p, name } : p)) });
      scheduleSave(500);
    },

    setPageSize: (id, sizeId, custom) => {
      const s = get();
      const preset = sizePreset(sizeId);
      const w = sizeId === "custom" ? Number(custom?.w) || preset.w : preset.w;
      const h = sizeId === "custom" ? Number(custom?.h) || preset.h : preset.h;
      set({
        defaultSize: sizeId === "custom" ? s.defaultSize : sizeId,
        pages: s.pages.map((p) => {
          if (p.id !== id) return p;
          const next: Page = { ...p, w, h, elements: p.elements.map((e) => clone(e)) };
          next.elements.forEach((e) => constrainElement(e, { w, h }));
          return next;
        }),
      });
      pushHistory();
    },

    setAllPageSizes: (sizeId, custom) => {
      const s = get();
      const preset = sizePreset(sizeId);
      const w = sizeId === "custom" ? Number(custom?.w) || preset.w : preset.w;
      const h = sizeId === "custom" ? Number(custom?.h) || preset.h : preset.h;
      set({
        defaultSize: sizeId,
        pages: s.pages.map((p) => {
          const next: Page = { ...p, w, h, elements: p.elements.map((e) => clone(e)) };
          next.elements.forEach((e) => constrainElement(e, { w, h }));
          return next;
        }),
      });
      pushHistory();
    },

    alignPage: (edge) => {
      const s = get();
      const page = activePageOf(s);
      const el = page?.elements.find((e) => e.id === s.selectedId);
      if (!page || !el || el.locked) return;
      const size = pageSize(page);
      const next = { ...el, style: { ...el.style } };
      if (edge === "left") next.x = 0;
      if (edge === "right") next.x = size.w - el.w;
      if (edge === "center") next.x = (size.w - el.w) / 2;
      if (edge === "top") next.y = 0;
      if (edge === "bottom") next.y = size.h - el.h;
      if (edge === "middle") next.y = (size.h - el.h) / 2;
      constrainElement(next, size);
      set({
        pages: s.pages.map((p) =>
          p.id === page.id ? { ...p, elements: p.elements.map((e) => (e.id === el.id ? next : e)) } : p,
        ),
      });
      pushHistory();
    },

    undo: () => {
      const { past, future } = get();
      if (past.length <= 1) return;
      const current = past[past.length - 1];
      const prev = past[past.length - 2];
      applyProject(JSON.parse(prev) as Project);
      set({ past: past.slice(0, -1), future: [current, ...future], selectedId: null });
      scheduleSave(300);
    },

    redo: () => {
      const { past, future } = get();
      if (!future.length) return;
      const [next, ...rest] = future;
      applyProject(JSON.parse(next) as Project);
      set({ past: [...past, next], future: rest, selectedId: null });
      scheduleSave(300);
    },

    commit: () => pushHistory(),
  };
});

interface PersistedUi {
  activeProjectId?: string;
  dark?: boolean;
  zoom?: number;
}

function readUi(): PersistedUi {
  try {
    const raw = localStorage.getItem(UI_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return typeof parsed === "object" && parsed ? (parsed as PersistedUi) : {};
  } catch {
    return {};
  }
}

export function getActivePage(): Page {
  return activePageOf(useEditor.getState());
}

export function getSelected(): CanvasEl | null {
  const s = useEditor.getState();
  return activePageOf(s)?.elements.find((e) => e.id === s.selectedId) || null;
}

/** Human label for the autosave indicator. */
export function saveLabel(state: SaveState, savedAt: number | null, now: number): string {
  if (state === "saving") return "جارٍ الحفظ…";
  if (state === "error") return "تعذر الحفظ — تحقق من مساحة المتصفح";
  if (state === "dirty") return "تغييرات غير محفوظة…";
  if (!savedAt) return "جاهز";
  const seconds = Math.max(0, Math.round((now - savedAt) / 1000));
  if (seconds < 5) return "تم الحفظ";
  if (seconds < 60) return `آخر حفظ منذ ${seconds} ثانية`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `آخر حفظ منذ ${minutes} دقيقة`;
  const hours = Math.round(minutes / 60);
  return `آخر حفظ منذ ${hours} ساعة`;
}

export { UI_KEY };
export const A4_SIZE = A4;

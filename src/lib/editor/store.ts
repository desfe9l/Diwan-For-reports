import { create } from "zustand";
import { toast } from "sonner";
import {
  A4,
  GRID,
  STORE_KEY,
  THEMES,
  type CanvasEl,
  type ElType,
  type Page,
  type Project,
  type ThemeId,
  clone,
  constrainElement,
  createElement,
  nextZ,
  normalizeZ,
} from "./model";
import { createProject, createTemplatePage } from "./templates";
import { clamp, uid } from "@/lib/utils";

type LeftTab = "elements" | "templates" | "theme";
type RightTab = "properties" | "layers";
type View = "home" | "editor";

interface Ui {
  view: View;
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
  autosaveLabel: string;
}

interface History {
  past: string[];
  future: string[];
}

interface EditorStore extends Project, Ui, History {
  hydrated: boolean;
  clipboard: CanvasEl | null;
  hydrate: () => void;
  newFromPack: (pack: Parameters<typeof createProject>[0], theme?: ThemeId) => void;
  loadProject: (data: Partial<Project> & { pages?: Page[] }) => void;
  setView: (view: View) => void;
  setZoom: (z: number) => void;
  toggle: (key: keyof Pick<Ui, "showGrid" | "snapGrid" | "snapElements" | "previewAll" | "dark" | "leftOpen" | "rightOpen" | "exportOpen">) => void;
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
  deleteSelected: () => void;
  bring: (dir: "forward" | "back" | "front" | "bottom") => void;
  toggleLock: () => void;
  toggleHidden: () => void;
  addPage: () => void;
  addTemplatePage: (id: string) => void;
  duplicatePage: () => void;
  deletePage: () => void;
  movePage: (dir: -1 | 1) => void;
  renamePage: (id: string, name: string) => void;
  alignPage: (edge: "left" | "right" | "center" | "top" | "middle" | "bottom") => void;
  undo: () => void;
  redo: () => void;
  commit: () => void;
  snapshotNow: () => void;
}

function projectSlice(s: Project): Project {
  return {
    version: s.version,
    name: s.name,
    theme: s.theme,
    orgName: s.orgName,
    pages: s.pages,
  };
}

function snap(v: number, enabled: boolean) {
  if (!enabled) return v;
  return Math.round(v / GRID) * GRID;
}

const blank = createProject("official");

export const useEditor = create<EditorStore>((set, get) => {
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  const persist = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        const s = get();
        localStorage.setItem(
          STORE_KEY,
          JSON.stringify({ ...projectSlice(s), activePageId: s.activePageId, zoom: s.zoom, dark: s.dark }),
        );
        set({ autosaveLabel: "حُفظ تلقائياً" });
      } catch {
        set({ autosaveLabel: "تعذر الحفظ — المساحة ممتلئة" });
      }
    }, 600);
  };

  const pushHistory = () => {
    const snapStr = JSON.stringify(projectSlice(get()));
    const past = [...get().past, snapStr];
    if (past.length > 50) past.shift();
    set({ past, future: [] });
    persist();
  };

  const applyProject = (incoming: Project, extra: Partial<EditorStore> = {}) => {
    const pages = incoming.pages?.length ? incoming.pages : createProject("blank").pages;
    pages.forEach((p) => {
      p.elements ||= [];
      p.elements.forEach((el) => {
        el.style ||= {};
        el.opacity ??= 1;
        el.rotation ??= 0;
      });
      normalizeZ(p);
    });
    set({
      version: incoming.version || 2,
      name: incoming.name || "تقرير",
      theme: incoming.theme || "official",
      orgName: incoming.orgName || "الجهة الرسمية",
      pages,
      activePageId: extra.activePageId || pages[0]?.id,
      selectedId: null,
      ...extra,
    });
  };

  return {
    ...blank,
    view: "home",
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
    autosaveLabel: "جاهز",
    hydrated: false,
    clipboard: null,
    past: [],
    future: [],

    hydrate: () => {
      if (get().hydrated) return;
      try {
        const raw = localStorage.getItem(STORE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.pages?.length) {
            applyProject(parsed, {
              activePageId: parsed.activePageId,
              zoom: parsed.zoom || 0.82,
              dark: Boolean(parsed.dark),
              view: "home",
            });
          }
        }
        if (parsedDark()) {
          /* noop - dark from project */
        }
      } catch {
        /* ignore */
      }
      document.documentElement.classList.toggle("dark", get().dark);
      document.documentElement.lang = "ar";
      document.documentElement.dir = "rtl";
      set({ hydrated: true, past: [JSON.stringify(projectSlice(get()))], future: [] });
    },

    newFromPack: (pack, theme) => {
      const project = createProject(pack, theme || (pack === "eid" ? "eid" : "official"), get().orgName);
      applyProject(project, { view: "editor", zoom: 0.82 });
      set({ past: [JSON.stringify(projectSlice(get()))], future: [] });
      persist();
    },

    loadProject: (data) => {
      if (!data.pages?.length) {
        toast.error("ملف المشروع غير صالح");
        return;
      }
      applyProject(data as Project, { view: "editor", zoom: 0.82 });
      set({ past: [JSON.stringify(projectSlice(get()))], future: [] });
      persist();
      toast.success("تم فتح المشروع");
    },

    setView: (view) => set({ view, selectedId: view === "home" ? null : get().selectedId }),
    setZoom: (z) => set({ zoom: clamp(z, 0.35, 1.6) }),
    toggle: (key) => {
      const next = !get()[key];
      set({ [key]: next } as Partial<EditorStore>);
      if (key === "dark") document.documentElement.classList.toggle("dark", next);
    },
    setLeftTab: (leftTab) => set({ leftTab, leftOpen: true }),
    setRightTab: (rightTab) => set({ rightTab, rightOpen: true }),
    setTheme: (theme) => {
      set({ theme });
      pushHistory();
    },
    setName: (name) => {
      set({ name });
      persist();
    },
    setOrg: (orgName) => {
      set({ orgName });
      persist();
    },
    setActivePage: (id) => set({ activePageId: id, selectedId: null, previewAll: false }),
    select: (id) => set({ selectedId: id, rightOpen: true }),

    addElement: (type, over) => {
      const s = get();
      const page = s.pages.find((p) => p.id === s.activePageId);
      if (!page) return;
      const theme = THEMES[s.theme];
      const el = createElement(
        type,
        {
          x: 28,
          y: 36 + (page.elements.length % 8) * 6,
          z: nextZ(page),
          ...over,
        },
        theme,
      );
      constrainElement(el);
      set({
        pages: s.pages.map((p) => (p.id === page.id ? { ...p, elements: [...p.elements, el] } : p)),
        selectedId: el.id,
        rightTab: "properties",
      });
      pushHistory();
    },

    updateElement: (id, patch, live) => {
      const s = get();
      const pages = s.pages.map((p) => ({
        ...p,
        elements: p.elements.map((el) => {
          if (el.id !== id) return el;
          const next = { ...el, ...patch, style: { ...el.style, ...(patch.style || {}) } };
          if (patch.x != null) next.x = snap(Number(patch.x), s.snapGrid && !live ? s.snapGrid : false);
          constrainElement(next);
          return next;
        }),
      }));
      set({ pages });
      if (!live) pushHistory();
      else persist();
    },

    updateStyle: (id, patch, live) => {
      const s = get();
      set({
        pages: s.pages.map((p) => ({
          ...p,
          elements: p.elements.map((el) => (el.id === id ? { ...el, style: { ...el.style, ...patch } } : el)),
        })),
      });
      if (!live) pushHistory();
      else persist();
    },

    replaceElement: (el, live) => {
      constrainElement(el);
      set({
        pages: get().pages.map((p) => ({
          ...p,
          elements: p.elements.map((e) => (e.id === el.id ? el : e)),
        })),
      });
      if (!live) pushHistory();
      else persist();
    },

    duplicateSelected: () => {
      const s = get();
      const page = s.pages.find((p) => p.id === s.activePageId);
      const el = page?.elements.find((e) => e.id === s.selectedId);
      if (!page || !el) return;
      const copy = clone(el);
      copy.id = uid("el");
      copy.x = clamp(el.x + 6, 0, A4.w - el.w);
      copy.y = clamp(el.y + 6, 0, A4.h - el.h);
      copy.z = nextZ(page);
      copy.name = `${el.name} نسخة`;
      set({
        pages: s.pages.map((p) => (p.id === page.id ? { ...p, elements: [...p.elements, copy] } : p)),
        selectedId: copy.id,
      });
      pushHistory();
    },

    deleteSelected: () => {
      const s = get();
      const page = s.pages.find((p) => p.id === s.activePageId);
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
      const page = s.pages.find((p) => p.id === s.activePageId);
      const el = page?.elements.find((e) => e.id === s.selectedId);
      if (!page || !el) return;
      if (dir === "forward") el.z += 1.5;
      if (dir === "back") el.z -= 1.5;
      if (dir === "front") el.z = page.elements.length + 2;
      if (dir === "bottom") el.z = 0;
      const pages = s.pages.map((p) => {
        if (p.id !== page.id) return p;
        const next = { ...p, elements: p.elements.map((e) => (e.id === el.id ? { ...el } : e)) };
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

    addPage: () => {
      const s = get();
      const p: Page = { id: uid("page"), name: `صفحة ${s.pages.length + 1}`, elements: [], bg: THEMES[s.theme].paper };
      set({ pages: [...s.pages, p], activePageId: p.id, selectedId: null });
      pushHistory();
    },

    addTemplatePage: (id) => {
      const s = get();
      const p = createTemplatePage(id, THEMES[s.theme], s.orgName);
      set({ pages: [...s.pages, p], activePageId: p.id, selectedId: null });
      pushHistory();
    },

    duplicatePage: () => {
      const s = get();
      const page = s.pages.find((p) => p.id === s.activePageId);
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

    deletePage: () => {
      const s = get();
      if (s.pages.length <= 1) {
        toast.error("لا يمكن حذف الصفحة الوحيدة");
        return;
      }
      const idx = s.pages.findIndex((p) => p.id === s.activePageId);
      const pages = s.pages.filter((p) => p.id !== s.activePageId);
      set({ pages, activePageId: pages[Math.max(0, idx - 1)].id, selectedId: null });
      pushHistory();
    },

    movePage: (dir) => {
      const s = get();
      const idx = s.pages.findIndex((p) => p.id === s.activePageId);
      const next = idx + dir;
      if (next < 0 || next >= s.pages.length) return;
      const pages = [...s.pages];
      const [item] = pages.splice(idx, 1);
      pages.splice(next, 0, item);
      set({ pages });
      pushHistory();
    },

    renamePage: (id, name) => {
      set({ pages: get().pages.map((p) => (p.id === id ? { ...p, name } : p)) });
      persist();
    },

    alignPage: (edge) => {
      const s = get();
      const page = s.pages.find((p) => p.id === s.activePageId);
      const el = page?.elements.find((e) => e.id === s.selectedId);
      if (!page || !el || el.locked) return;
      const next = { ...el };
      if (edge === "left") next.x = 0;
      if (edge === "right") next.x = A4.w - el.w;
      if (edge === "center") next.x = (A4.w - el.w) / 2;
      if (edge === "top") next.y = 0;
      if (edge === "bottom") next.y = A4.h - el.h;
      if (edge === "middle") next.y = (A4.h - el.h) / 2;
      constrainElement(next);
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
      applyProject(JSON.parse(prev));
      set({ past: past.slice(0, -1), future: [current, ...future], selectedId: null });
      persist();
    },

    redo: () => {
      const { past, future } = get();
      if (!future.length) return;
      const [next, ...rest] = future;
      applyProject(JSON.parse(next));
      set({ past: [...past, next], future: rest, selectedId: null });
      persist();
    },

    commit: () => {
      pushHistory();
    },

    snapshotNow: persist,
  };
});

function parsedDark() {
  return false;
}

export function getActivePage() {
  const s = useEditor.getState();
  return s.pages.find((p) => p.id === s.activePageId) || s.pages[0];
}

export function getSelected() {
  const s = useEditor.getState();
  for (const p of s.pages) {
    const el = p.elements.find((e) => e.id === s.selectedId);
    if (el) return el;
  }
  return null;
}

import { create } from "zustand";

const STORAGE_KEY = "admin:sidebar-collapsed";

function loadInitial(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

function applyToBody(collapsed: boolean) {
  if (typeof document === "undefined") return;
  if (collapsed) {
    document.body.setAttribute("data-sidebar-size", "sm");
  } else {
    document.body.removeAttribute("data-sidebar-size");
  }
}

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
  set: (v: boolean) => void;
}

const initial = loadInitial();
applyToBody(initial);

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: initial,
  toggle: () =>
    set((s) => {
      const next = !s.collapsed;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      applyToBody(next);
      return { collapsed: next };
    }),
  set: (v) =>
    set(() => {
      window.localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
      applyToBody(v);
      return { collapsed: v };
    }),
}));

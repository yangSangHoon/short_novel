import type { Novel, NovelPage, Theme } from "../types";
import { createId } from "./id";

const NOVELS_KEY = "short-novel:novels:v1";
const THEME_KEY = "short-novel:theme:v1";

/** localStorage 는 사생활 모드·용량 초과 등으로 언제든 throw 할 수 있다. */
function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function createPage(text = ""): NovelPage {
  return { id: createId("p_"), text, seed: 1 };
}

export function createNovel(partial?: Partial<Novel>): Novel {
  const now = Date.now();
  return {
    id: createId("n_"),
    title: "",
    logline: "",
    author: "",
    pages: [createPage()],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

export function loadNovels(): Novel[] {
  const list = safeRead<Novel[]>(NOVELS_KEY, []);
  if (!Array.isArray(list)) return [];
  // 저장 포맷이 어긋난 항목은 조용히 버린다 — 서재 전체가 깨지는 편보다 낫다.
  return list.filter(
    (n): n is Novel => !!n && typeof n.id === "string" && Array.isArray(n.pages),
  );
}

export function saveNovels(novels: Novel[]): boolean {
  return safeWrite(NOVELS_KEY, novels);
}

export function loadTheme(): Theme {
  const stored = safeRead<Theme | null>(THEME_KEY, null);
  if (stored === "light" || stored === "dark") return stored;
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export function saveTheme(theme: Theme): void {
  safeWrite(THEME_KEY, theme);
}

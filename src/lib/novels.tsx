import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Novel, NovelPage } from "../types";
import { createNovel, createPage, loadNovels, saveNovels } from "./storage";

export type SaveState = "idle" | "saving" | "saved" | "error";

interface NovelsValue {
  novels: Novel[];
  saveState: SaveState;
  getNovel: (id: string) => Novel | undefined;
  addNovel: (partial?: Partial<Novel>) => Novel;
  updateNovel: (id: string, patch: Partial<Omit<Novel, "id">>) => void;
  removeNovel: (id: string) => void;
  updatePage: (novelId: string, pageId: string, patch: Partial<NovelPage>) => void;
  insertPage: (novelId: string, afterIndex: number, text?: string) => string;
  removePage: (novelId: string, pageId: string) => void;
  movePage: (novelId: string, from: number, to: number) => void;
  replacePages: (novelId: string, texts: string[]) => void;
}

const NovelsContext = createContext<NovelsValue | null>(null);

export function NovelsProvider({ children }: { children: ReactNode }): ReactNode {
  const [novels, setNovels] = useState<Novel[]>(() => loadNovels());
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const firstRun = useRef(true);

  // 타이핑마다 직렬화하면 긴 원고에서 끊긴다. 한 박자 쉬고 모아서 쓴다.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      setSaveState(saveNovels(novels) ? "saved" : "error");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [novels]);

  // "저장됨" 표시는 잠깐만 띄우고 지운다.
  useEffect(() => {
    if (saveState !== "saved") return;
    const timer = window.setTimeout(() => setSaveState("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [saveState]);

  const touch = useCallback((novel: Novel): Novel => ({ ...novel, updatedAt: Date.now() }), []);

  const mutate = useCallback(
    (id: string, fn: (novel: Novel) => Novel) => {
      setNovels((prev) => prev.map((n) => (n.id === id ? touch(fn(n)) : n)));
    },
    [touch],
  );

  const value = useMemo<NovelsValue>(
    () => ({
      novels,
      saveState,
      getNovel: (id) => novels.find((n) => n.id === id),
      addNovel: (partial) => {
        const novel = createNovel(partial);
        setNovels((prev) => [novel, ...prev]);
        return novel;
      },
      updateNovel: (id, patch) => mutate(id, (n) => ({ ...n, ...patch })),
      removeNovel: (id) => setNovels((prev) => prev.filter((n) => n.id !== id)),
      updatePage: (novelId, pageId, patch) =>
        mutate(novelId, (n) => ({
          ...n,
          pages: n.pages.map((p) => (p.id === pageId ? { ...p, ...patch } : p)),
        })),
      insertPage: (novelId, afterIndex, text = "") => {
        const page = createPage(text);
        mutate(novelId, (n) => {
          const pages = [...n.pages];
          pages.splice(afterIndex + 1, 0, page);
          return { ...n, pages };
        });
        return page.id;
      },
      removePage: (novelId, pageId) =>
        mutate(novelId, (n) => {
          // 마지막 한 장은 지우지 않고 비운다 — 페이지가 0개인 원고는 편집할 수가 없다.
          if (n.pages.length <= 1) return { ...n, pages: [createPage()] };
          return { ...n, pages: n.pages.filter((p) => p.id !== pageId) };
        }),
      movePage: (novelId, from, to) =>
        mutate(novelId, (n) => {
          if (to < 0 || to >= n.pages.length) return n;
          const pages = [...n.pages];
          const [moved] = pages.splice(from, 1);
          pages.splice(to, 0, moved);
          return { ...n, pages };
        }),
      replacePages: (novelId, texts) =>
        mutate(novelId, (n) => ({
          ...n,
          pages: texts.length ? texts.map((t) => createPage(t)) : [createPage()],
        })),
    }),
    [novels, saveState, mutate],
  );

  return <NovelsContext.Provider value={value}>{children}</NovelsContext.Provider>;
}

export function useNovels(): NovelsValue {
  const context = useContext(NovelsContext);
  if (!context) throw new Error("useNovels 는 NovelsProvider 안에서만 쓸 수 있습니다.");
  return context;
}

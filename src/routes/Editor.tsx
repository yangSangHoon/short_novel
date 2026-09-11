import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { SceneControls } from "../components/SceneControls";
import { Illustration } from "../illustration/Illustration";
import { analyzeScene, type SceneSpec } from "../illustration/analyze";
import { LABELS } from "../illustration/lexicon";
import { useNovels } from "../lib/novels";
import { countChars, readingMinutes, splitIntoPages } from "../lib/text";
import type { NovelPage } from "../types";
import "./editor.css";

/** 한 컷이 이 정도를 넘어가면 그림 한 장으로 감당하기 어렵다. */
const PAGE_TARGET = 320;
const PAGE_LIMIT = 700;

const SAVE_LABEL: Record<string, string> = {
  idle: "자동 저장됨",
  saving: "저장 중…",
  saved: "자동 저장됨 · 방금",
  error: "저장하지 못했습니다",
};

/** 추출한 장면을 한 줄로 읽어 준다 — "밤 도시 · 비 · 1명 · 우산". */
function describeScene(scene: SceneSpec): string {
  const parts = [
    `${LABELS[scene.time]} ${LABELS[scene.place]}`,
    scene.weather === "clear" ? null : LABELS[scene.weather],
    LABELS[scene.mood],
    scene.characters > 0 ? `인물 ${scene.characters}` : null,
    ...scene.props.map((prop) => LABELS[prop]),
  ];
  return parts.filter(Boolean).join(" · ");
}

/** 컷 띠에 들어가는 작은 미리보기. */
function Thumb({
  page,
  index,
  current,
  onSelect,
}: {
  page: NovelPage;
  index: number;
  current: boolean;
  onSelect: () => void;
}): ReactNode {
  const scene = useMemo(
    () => analyzeScene(page.text, page.seed, page.sceneOverride),
    [page],
  );
  return (
    <button
      type="button"
      className="thumb"
      aria-current={current}
      onClick={onSelect}
      aria-label={`${index + 1}컷으로`}
    >
      <span className="thumb__plate">
        <Illustration scene={scene} alt="" />
      </span>
      <span className="thumb__no ui">p.{index + 1}</span>
    </button>
  );
}

export function Editor(): ReactNode {
  const { id = "" } = useParams();
  const {
    getNovel,
    updateNovel,
    updatePage,
    insertPage,
    removePage,
    movePage,
    replacePages,
    saveState,
  } = useNovels();

  const novel = getNovel(id);
  const [index, setIndex] = useState(0);
  const [sceneOpen, setSceneOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const pageCount = novel?.pages.length ?? 0;
  const safeIndex = Math.min(index, Math.max(0, pageCount - 1));
  const page = novel?.pages[safeIndex];

  const scene = useMemo(
    () => analyzeScene(page?.text ?? "", page?.seed ?? 1, page?.sceneOverride),
    [page],
  );

  // 본문 길이에 맞춰 입력창이 자란다 — 스크롤바 두 개는 글쓰기를 방해한다.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [page?.text, page?.id, focusMode]);

  // 고르는 컷이 바뀌면 띠도 따라 움직인다.
  useEffect(() => {
    stripRef.current
      ?.querySelector('[aria-current="true"]')
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [safeIndex]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const goTo = useCallback(
    (next: number) => {
      if (!novel) return;
      setIndex(Math.max(0, Math.min(novel.pages.length - 1, next)));
      window.requestAnimationFrame(() => textareaRef.current?.focus());
    },
    [novel],
  );

  const addPage = useCallback(() => {
    if (!novel) return;
    insertPage(novel.id, safeIndex);
    goTo(safeIndex + 1);
  }, [novel, insertPage, safeIndex, goTo]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key === "Enter") {
        event.preventDefault();
        addPage();
      } else if (meta && event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(safeIndex - 1);
      } else if (meta && event.key === "ArrowRight") {
        event.preventDefault();
        goTo(safeIndex + 1);
      } else if (event.key === "Escape") {
        if (sheetOpen) setSheetOpen(false);
        else if (focusMode) setFocusMode(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addPage, goTo, safeIndex, focusMode, sheetOpen]);

  if (!novel || !page) {
    return (
      <div className="empty">
        <h2>원고를 찾을 수 없습니다</h2>
        <p>주소가 바뀌었거나 이 브라우저에서 지워진 원고입니다.</p>
        <Link to="/" className="btn btn--outline">
          서재로 돌아가기
        </Link>
      </div>
    );
  }

  const whole = novel.pages.map((p) => p.text).join("\n");
  const chars = countChars(page.text);
  const overLimit = page.text.length > PAGE_LIMIT;

  const splitCurrent = () => {
    const pages = splitIntoPages(page.text, PAGE_TARGET);
    if (pages.length <= 1) return;
    const before = novel.pages.slice(0, safeIndex).map((p) => p.text);
    const after = novel.pages.slice(safeIndex + 1).map((p) => p.text);
    replacePages(novel.id, [...before, ...pages, ...after]);
    setIndex(safeIndex);
  };

  return (
    <div className={`ed ${focusMode ? "ed--focus" : ""}`}>
      <div className="ed__inner">
        <header className="edhead">
          <Link to="/" className="edhead__back" aria-label="서재로">
            ‹
          </Link>
          <div className="edhead__mid">
            <div className="edhead__title">{novel.title || "제목 없는 이야기"}</div>
            <div className="edhead__save ui" data-state={saveState}>
              <span className="edhead__savedot" />
              {SAVE_LABEL[saveState]}
            </div>
          </div>
          <Link to={`/read/${novel.id}`} className="edhead__action ui">
            미리 읽기
          </Link>
        </header>

        <div className="edstats">
          <span className="pill">{countChars(whole).toLocaleString()}자</span>
          <span className="pill">{novel.pages.length}컷</span>
          <span className="pill">읽기 {readingMinutes(whole)}분</span>
        </div>

        <div className="edstrip" ref={stripRef}>
          {novel.pages.map((p, i) => (
            <Thumb key={p.id} page={p} index={i} current={i === safeIndex} onSelect={() => goTo(i)} />
          ))}
          <button type="button" className="thumb thumb--new" onClick={addPage}>
            <span className="thumb__plus">＋</span>
            <span className="thumb__no ui">새 컷</span>
          </button>
        </div>

        <div className="edrule" />

        <main className="edbody">
          <div className="edbody__head">
            <span className="kicker">페이지 {safeIndex + 1}</span>
            <span className="edbody__count ui">
              {safeIndex + 1} / {novel.pages.length}
            </span>
            <div className="edbody__tools">
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                onClick={() => movePage(novel.id, safeIndex, safeIndex - 1)}
                disabled={safeIndex === 0}
                aria-label="앞으로 옮기기"
              >
                <Icon name="left" size={14} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                onClick={() => movePage(novel.id, safeIndex, safeIndex + 1)}
                disabled={safeIndex === novel.pages.length - 1}
                aria-label="뒤로 옮기기"
              >
                <Icon name="right" size={14} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                danger
                onClick={() => {
                  removePage(novel.id, page.id);
                  setIndex(Math.max(0, safeIndex - 1));
                }}
                aria-label="이 컷 지우기"
              >
                <Icon name="trash" size={14} />
              </Button>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            className="edtext"
            value={page.text}
            placeholder={"이 컷에서 일어나는 일을 적어 보세요.\n\n장소와 시간이 드러나면 그림이 더 잘 맞습니다."}
            onChange={(e) => updatePage(novel.id, page.id, { text: e.target.value })}
            spellCheck={false}
            aria-label={`${safeIndex + 1}컷 본문`}
          />

          <p className="edcount ui">
            {chars.toLocaleString()}자
            <span className="edcount__bar">
              <span
                style={{ width: `${Math.min(100, (chars / PAGE_TARGET) * 100)}%` }}
                data-over={chars > PAGE_TARGET}
              />
            </span>
            권장 {PAGE_TARGET}자
          </p>

          {overLimit && (
            <div className="notice">
              <p className="ui">
                한 컷이 {chars.toLocaleString()}자입니다. 그림 한 장이 담기엔 조금 깁니다 — 문단을
                살려 여러 컷으로 나눌까요?
              </p>
              <Button size="sm" variant="outline" onClick={splitCurrent}>
                자동으로 나누기
              </Button>
            </div>
          )}

          {/* 이 페이지 삽화 — 디자인의 점선 상자 */}
          <section className="edscene">
            <div className="edscene__head">
              <span className="ui">이 페이지 삽화</span>
              <button
                type="button"
                className="edscene__redraw ui"
                onClick={() => updatePage(novel.id, page.id, { seed: page.seed + 1 })}
              >
                다시 그리기
              </button>
            </div>
            <p className="edscene__summary ui">추출한 장면 — {describeScene(scene)}</p>
            <div className="edscene__preview">
              <div className="plate">
                <Illustration scene={scene} alt={page.text.slice(0, 60)} />
              </div>
            </div>
            {sceneOpen && (
              <SceneControls
                scene={scene}
                override={page.sceneOverride ?? {}}
                onChange={(next) => updatePage(novel.id, page.id, { sceneOverride: next })}
                onReseed={() => updatePage(novel.id, page.id, { seed: page.seed + 1 })}
              />
            )}
          </section>

          <p className="shortcuts ui">
            <kbd>⌘</kbd>
            <kbd>↵</kbd> 새 컷 · <kbd>⌘</kbd>
            <kbd>←</kbd>
            <kbd>→</kbd> 컷 이동 · <kbd>Esc</kbd> 닫기
          </p>
        </main>
      </div>

      {/* ---- 하단 고정 조작부 ---- */}
      <div className="edbar">
        <div className="edbar__inner">
          <button type="button" className="edbar__btn" onClick={splitCurrent}>
            페이지 나누기
          </button>
          <button
            type="button"
            className="edbar__btn edbar__btn--rose"
            aria-pressed={sceneOpen}
            onClick={() => setSceneOpen((v) => !v)}
          >
            장면 고르기
          </button>
          <button
            type="button"
            className="edbar__btn edbar__btn--leaf"
            onClick={() => setSheetOpen(true)}
          >
            작품
          </button>
        </div>
      </div>

      {/* ---- 작품 정보 시트 ---- */}
      <div className="sheet" data-open={sheetOpen} aria-hidden={!sheetOpen}>
        <div className="sheet__grip" />
        <div className="sheet__head">
          <span>작품 정보</span>
          <button type="button" className="sheet__close ui" onClick={() => setSheetOpen(false)}>
            닫기
          </button>
        </div>
        <label className="sheetfield">
          <span className="ui">제목</span>
          <input
            value={novel.title}
            placeholder="제목을 붙여 주세요"
            onChange={(e) => updateNovel(novel.id, { title: e.target.value })}
          />
        </label>
        <label className="sheetfield">
          <span className="ui">한 줄 소개</span>
          <input
            value={novel.logline}
            placeholder="독자가 표지에서 보게 될 문장"
            onChange={(e) => updateNovel(novel.id, { logline: e.target.value })}
          />
        </label>
        <label className="sheetfield">
          <span className="ui">작가명</span>
          <input
            value={novel.author}
            placeholder="필명"
            onChange={(e) => updateNovel(novel.id, { author: e.target.value })}
          />
        </label>
        <button
          type="button"
          className="sheet__toggle ui"
          onClick={() => {
            setFocusMode((v) => !v);
            setSheetOpen(false);
          }}
        >
          {focusMode ? "집중 모드 끄기" : "집중 모드 켜기"}
        </button>
      </div>
      {sheetOpen && <button type="button" className="sheet__scrim" onClick={() => setSheetOpen(false)} aria-label="닫기" />}
    </div>
  );
}

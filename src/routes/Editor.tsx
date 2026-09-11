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
import { TopBar } from "../components/TopBar";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { SceneControls } from "../components/SceneControls";
import { Illustration } from "../illustration/Illustration";
import { analyzeScene } from "../illustration/analyze";
import { useNovels } from "../lib/novels";
import { countChars, splitIntoPages } from "../lib/text";
import "./editor.css";

/** 한 장이 이 정도를 넘어가면 읽을 때 그림 한 컷으로 감당하기 어렵다. */
const PAGE_TARGET = 320;
const PAGE_LIMIT = 700;

export function Editor(): ReactNode {
  const { id = "" } = useParams();
  const { getNovel, updateNovel, updatePage, insertPage, removePage, movePage, replacePages } =
    useNovels();

  const novel = getNovel(id);
  const [index, setIndex] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [railOpen, setRailOpen] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const pageCount = novel?.pages.length ?? 0;
  const safeIndex = Math.min(index, Math.max(0, pageCount - 1));
  const page = novel?.pages[safeIndex];

  const scene = useMemo(
    () => analyzeScene(page?.text ?? "", page?.seed ?? 1, page?.sceneOverride),
    [page],
  );

  // 본문 길이에 맞춰 입력창이 자라게 한다 — 스크롤바 두 개는 글쓰기를 방해한다.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [page?.text, page?.id, focusMode]);

  // 에디터를 열면 바로 쓸 수 있어야 한다.
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const goTo = useCallback(
    (next: number) => {
      if (!novel) return;
      const clamped = Math.max(0, Math.min(novel.pages.length - 1, next));
      setIndex(clamped);
      // 페이지를 옮기면 곧장 이어서 쓸 수 있어야 한다.
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
      } else if (event.key === "Escape" && focusMode) {
        setFocusMode(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addPage, goTo, safeIndex, focusMode]);

  if (!novel || !page) {
    return (
      <>
        <TopBar />
        <div className="empty">
          <h2>원고를 찾을 수 없습니다</h2>
          <p>주소가 바뀌었거나 이 브라우저에서 지워진 원고입니다.</p>
          <Link to="/" className="btn btn--outline">
            서재로 돌아가기
          </Link>
        </div>
      </>
    );
  }

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
    <div className={`editor ${focusMode ? "editor--focus" : ""}`}>
      <TopBar showSave>
        <Button
          variant="quiet"
          onClick={() => setFocusMode((v) => !v)}
          title="집중 모드 (Esc 로 해제)"
        >
          <Icon name="eye" size={16} />
          <span className="topbar__label">{focusMode ? "전체 보기" : "집중"}</span>
        </Button>
        <Link to={`/read/${novel.id}`} className="btn btn--primary">
          <Icon name="play" size={15} />
          <span className="topbar__label">미리 읽기</span>
        </Link>
      </TopBar>

      <div className="editor__body">
        {/* ---- 왼쪽: 장 목록 ---- */}
        <aside className={`rail ${railOpen ? "" : "rail--collapsed"}`} aria-label="장 목록">
          <div className="rail__head">
            <span className="rail__title">{novel.pages.length}장</span>
            <Button
              size="sm"
              variant="quiet"
              iconOnly
              onClick={() => setRailOpen((v) => !v)}
              aria-label={railOpen ? "목록 접기" : "목록 펼치기"}
            >
              <Icon name={railOpen ? "left" : "grid"} size={15} />
            </Button>
          </div>
          <ol className="rail__list">
            {novel.pages.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="rail__item"
                  aria-current={i === safeIndex}
                  onClick={() => goTo(i)}
                >
                  <span className="rail__num">{i + 1}</span>
                  <span className="rail__text">
                    {p.text.trim().split("\n")[0] || <em>빈 장</em>}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <div className="rail__foot">
            <Button size="sm" variant="outline" onClick={addPage}>
              <Icon name="plus" size={14} />장 추가
            </Button>
          </div>
        </aside>

        {/* ---- 가운데: 원고 ---- */}
        <main className="sheet">
          <div className="sheet__inner">
            <div className="sheet__meta">
              <input
                className="sheet__title"
                value={novel.title}
                placeholder="제목을 붙여 주세요"
                onChange={(e) => updateNovel(novel.id, { title: e.target.value })}
                aria-label="제목"
              />
              <input
                className="sheet__logline"
                value={novel.logline}
                placeholder="한 줄 소개 — 독자가 첫 화면에서 보게 될 문장"
                onChange={(e) => updateNovel(novel.id, { logline: e.target.value })}
                aria-label="한 줄 소개"
              />
            </div>

            <div className="sheet__pagebar">
              <span className="sheet__pageno">{safeIndex + 1}장</span>
              <span className="sheet__rule" />
              <div className="sheet__pagetools">
                <Button
                  size="sm"
                  variant="quiet"
                  iconOnly
                  onClick={() => movePage(novel.id, safeIndex, safeIndex - 1)}
                  disabled={safeIndex === 0}
                  aria-label="앞으로 옮기기"
                >
                  <Icon name="left" size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="quiet"
                  iconOnly
                  onClick={() => movePage(novel.id, safeIndex, safeIndex + 1)}
                  disabled={safeIndex === novel.pages.length - 1}
                  aria-label="뒤로 옮기기"
                >
                  <Icon name="right" size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="quiet"
                  iconOnly
                  danger
                  onClick={() => {
                    removePage(novel.id, page.id);
                    setIndex(Math.max(0, safeIndex - 1));
                  }}
                  aria-label="이 장 지우기"
                >
                  <Icon name="trash" size={14} />
                </Button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              className="sheet__text"
              value={page.text}
              placeholder={"이 장에서 일어나는 일을 적어 보세요.\n\n장소와 시간이 드러나면 그림이 더 잘 맞습니다."}
              onChange={(e) => updatePage(novel.id, page.id, { text: e.target.value })}
              spellCheck={false}
              aria-label={`${safeIndex + 1}장 본문`}
            />

            {overLimit && (
              <div className="notice">
                <p>
                  한 장이 {chars.toLocaleString()}자입니다. 그림 한 컷이 담기엔 조금 깁니다 —
                  문단을 살려 여러 장으로 나눌까요?
                </p>
                <Button size="sm" variant="outline" onClick={splitCurrent}>
                  <Icon name="split" size={14} />
                  자동으로 나누기
                </Button>
              </div>
            )}

            <div className="sheet__foot">
              <div className="counter">
                <span className="counter__bar">
                  <span
                    className="counter__fill"
                    style={{ width: `${Math.min(100, (chars / PAGE_TARGET) * 100)}%` }}
                    data-over={chars > PAGE_TARGET}
                  />
                </span>
                <span className="counter__text">
                  {chars.toLocaleString()}자 · 권장 {PAGE_TARGET}자
                </span>
              </div>
              <div className="row" style={{ gap: "var(--s2)" }}>
                <Button variant="quiet" onClick={() => goTo(safeIndex - 1)} disabled={safeIndex === 0}>
                  <Icon name="left" size={15} />앞 장
                </Button>
                {safeIndex === novel.pages.length - 1 ? (
                  <Button variant="outline" onClick={addPage}>
                    <Icon name="plus" size={15} />다음 장 쓰기
                  </Button>
                ) : (
                  <Button variant="quiet" onClick={() => goTo(safeIndex + 1)}>
                    다음 장
                    <Icon name="right" size={15} />
                  </Button>
                )}
              </div>
            </div>
            <p className="shortcuts">
              <kbd>⌘</kbd>
              <kbd>↵</kbd> 다음 장 · <kbd>⌘</kbd>
              <kbd>←</kbd>
              <kbd>→</kbd> 장 이동 · <kbd>Esc</kbd> 집중 모드 해제
            </p>
          </div>
        </main>

        {/* ---- 오른쪽: 삽화 미리보기 ---- */}
        <aside className="preview" aria-label="삽화 미리보기">
          <div className="preview__frame">
            <Illustration scene={scene} alt={page.text.slice(0, 60)} className="preview__art" />
          </div>
          <SceneControls
            scene={scene}
            override={page.sceneOverride ?? {}}
            onChange={(next) => updatePage(novel.id, page.id, { sceneOverride: next })}
            onReseed={() => updatePage(novel.id, page.id, { seed: page.seed + 1 })}
          />
        </aside>
      </div>
    </div>
  );
}

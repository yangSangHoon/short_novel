import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { Illustration } from "../illustration/Illustration";
import { analyzeScene, type SceneSpec } from "../illustration/analyze";
import { LABELS } from "../illustration/lexicon";
import { useNovels } from "../lib/novels";
import { useTheme } from "../lib/theme";
import { readingMinutes } from "../lib/text";
import type { Novel, NovelPage } from "../types";
import "./reader.css";

type Mode = "panel" | "scroll";

/** 점 인디케이터가 읽히는 한계. 이보다 길면 머릿글의 숫자로 대신한다. */
const DOT_LIMIT = 12;

function usePageScene(page: NovelPage | undefined) {
  return useMemo(
    () => analyzeScene(page?.text ?? "", page?.seed ?? 1, page?.sceneOverride),
    [page],
  );
}

/** 장면에서 뽑은 분위기 꼬리표 — 표지에서 작품의 결을 미리 보여 준다. */
function sceneTags(scene: SceneSpec): { label: string; tone: string }[] {
  const tags = [
    { label: LABELS[scene.mood], tone: "rose" },
    { label: `${LABELS[scene.time]} ${LABELS[scene.place]}`, tone: "leaf" },
  ];
  if (scene.props[0]) tags.push({ label: LABELS[scene.props[0]], tone: "wave" });
  return tags;
}

/** 그림 한 컷 + 그에 딸린 글. 웹툰의 한 칸에 해당한다. */
function Panel({ page }: { page: NovelPage }): ReactNode {
  const scene = usePageScene(page);
  return (
    <article className="panel">
      <div className="plate">
        <Illustration scene={scene} alt={page.text.slice(0, 60)} />
      </div>
      <p className="panel__caption ui">
        <span className="panel__dot" aria-hidden="true" />이 페이지의 장면을 자동으로 그렸습니다
      </p>
      <div className="panel__text">
        {page.text
          .split(/\n+/)
          .filter((line) => line.trim())
          .map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        {!page.text.trim() && <p className="panel__blank">아직 쓰이지 않은 장입니다.</p>}
      </div>
    </article>
  );
}

function Cover({ novel }: { novel: Novel }): ReactNode {
  const first = novel.pages.find((p) => p.text.trim()) ?? novel.pages[0];
  const scene = usePageScene(first);
  const body = novel.pages.map((p) => p.text).join("\n");

  return (
    <article className="panel cover">
      <div className="plate">
        <Illustration scene={scene} alt={novel.title || "표지"} />
      </div>
      <p className="kicker cover__kicker">
        전 {novel.pages.length}컷 · 평균 {readingMinutes(body)}분
      </p>
      <h1 className="cover__title">{novel.title || "무제"}</h1>
      <p className="cover__meta ui">
        {novel.author || "이름 없는 작가"} · {novel.pages.length}장
      </p>
      <div className="cover__tags">
        {sceneTags(scene).map((tag) => (
          <span key={tag.label} className={`pill pill--${tag.tone}`}>
            {tag.label}
          </span>
        ))}
      </div>
      {novel.logline && <p className="cover__logline">{novel.logline}</p>}
    </article>
  );
}

export function Reader(): ReactNode {
  const { id = "" } = useParams();
  const { getNovel } = useNovels();
  const { theme, toggle } = useTheme();
  const novel = getNovel(id);

  const pages = novel?.pages ?? [];
  const last = pages.length + 1; // 0 = 표지, 1..n = 본문, n+1 = 끝
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<Mode>("panel");
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (delta: number) => setStep((s) => Math.max(0, Math.min(last, s + delta))),
    [last],
  );

  useEffect(() => {
    if (mode !== "panel") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === " " || event.key === "Enter") {
        event.preventDefault();
        go(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, mode]);

  // 새 칸으로 넘어가면 언제나 글의 첫 줄부터 보이게 한다.
  useEffect(() => {
    if (mode === "panel") window.scrollTo({ top: 0 });
  }, [step, mode]);

  if (!novel) {
    return (
      <div className="empty">
        <h2>읽을 원고가 없습니다</h2>
        <Link to="/" className="btn btn--outline">
          서재로 돌아가기
        </Link>
      </div>
    );
  }

  const progress = (step / last) * 100;
  const label = step === 0 ? "표지" : step === last ? "끝" : `${step} / ${pages.length}`;

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null || mode !== "panel") return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  return (
    <div className="reader" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <header className="rhead">
        <Link to="/" className="rhead__back" aria-label="서재로">
          ‹
        </Link>
        <div className="rhead__mid">
          <div className="rhead__title">{novel.title || "무제"}</div>
          <div className="rhead__count ui">{label}</div>
        </div>
        <div className="rhead__tools">
          <button
            type="button"
            className="rhead__tool ui"
            onClick={() => setMode((m) => (m === "panel" ? "scroll" : "panel"))}
          >
            {mode === "panel" ? "이어보기" : "한 칸씩"}
          </button>
          <button
            type="button"
            className="rhead__tool ui"
            onClick={toggle}
            aria-label={theme === "dark" ? "밝게" : "어둡게"}
            title={theme === "dark" ? "밝게" : "어둡게"}
          >
            Aa
          </button>
          <Link to={`/write/${novel.id}`} className="rhead__tool ui" aria-label="이 글 고치기">
            <Icon name="pen" size={14} />
          </Link>
        </div>
      </header>

      {mode === "panel" && (
        <div className="rprogress" role="progressbar" aria-valuenow={Math.round(progress)}>
          <span style={{ width: `${progress}%` }} />
        </div>
      )}

      {mode === "panel" ? (
        <>
          <main className="stage">
            {/* 그림이 바뀌었다는 걸 몸으로 알 수 있게 key 로 애니메이션을 다시 태운다 */}
            <div className="stage__slot" key={step}>
              {step === 0 && <Cover novel={novel} />}
              {step > 0 && step <= pages.length && <Panel page={pages[step - 1]} />}
              {step === last && (
                <div className="ending">
                  <p className="ending__mark">끝</p>
                  <h2>{novel.title || "무제"}</h2>
                  <div className="ending__actions">
                    <Button variant="outline" onClick={() => setStep(0)}>
                      처음부터
                    </Button>
                    <Link to="/" className="btn btn--primary">
                      서재로
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* 화면 좌우 절반이 곧 이전/다음 버튼이다 */}
          <button
            type="button"
            className="tap tap--prev"
            onClick={() => go(-1)}
            disabled={step === 0}
            aria-label="이전"
          />
          <button
            type="button"
            className="tap tap--next"
            onClick={() => go(1)}
            disabled={step === last}
            aria-label="다음"
          />

          <nav className="rnav">
            {last <= DOT_LIMIT && (
              <div className="rnav__dots" aria-hidden="true">
                {Array.from({ length: last + 1 }, (_, i) => (
                  <span key={i} data-on={i === step} />
                ))}
              </div>
            )}
            <div className="rnav__row">
              <button
                type="button"
                className="rnav__prev"
                onClick={() => go(-1)}
                disabled={step === 0}
              >
                이전
              </button>
              <button
                type="button"
                className="rnav__next"
                onClick={() => (step === last ? setStep(0) : go(1))}
              >
                {step === 0 ? "읽기 시작" : step === last ? "처음으로" : "다음"}
              </button>
            </div>
          </nav>
        </>
      ) : (
        <main className="stream">
          <Cover novel={novel} />
          {pages.map((page) => (
            <Panel key={page.id} page={page} />
          ))}
          <div className="ending">
            <p className="ending__mark">끝</p>
            <Link to="/" className="btn btn--primary">
              서재로
            </Link>
          </div>
        </main>
      )}
    </div>
  );
}

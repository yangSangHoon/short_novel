import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { Illustration } from "../illustration/Illustration";
import { analyzeScene } from "../illustration/analyze";
import { useNovels } from "../lib/novels";
import { useTheme } from "../lib/theme";
import { readingMinutes } from "../lib/text";
import type { Novel, NovelPage } from "../types";
import "./reader.css";

type Mode = "panel" | "scroll";

function usePageScene(page: NovelPage | undefined) {
  return useMemo(
    () => analyzeScene(page?.text ?? "", page?.seed ?? 1, page?.sceneOverride),
    [page],
  );
}

/** 그림 한 컷 + 그에 딸린 글 한 덩이. 웹툰의 한 칸에 해당한다. */
function Panel({ page, index, total }: { page: NovelPage; index: number; total: number }): ReactNode {
  const scene = usePageScene(page);
  return (
    <article className="panel">
      <div className="panel__art">
        <Illustration scene={scene} alt={page.text.slice(0, 60)} />
      </div>
      <div className="panel__text">
        {page.text
          .split(/\n+/)
          .filter((line) => line.trim())
          .map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        {!page.text.trim() && <p className="panel__blank">아직 쓰이지 않은 장입니다.</p>}
      </div>
      <span className="panel__no" aria-hidden="true">
        {index + 1} / {total}
      </span>
    </article>
  );
}

function Cover({ novel }: { novel: Novel }): ReactNode {
  const scene = usePageScene(novel.pages.find((p) => p.text.trim()) ?? novel.pages[0]);
  const body = novel.pages.map((p) => p.text).join("\n");
  return (
    <article className="panel panel--cover">
      <div className="panel__art">
        <Illustration scene={scene} alt={novel.title || "표지"} />
        <div className="cover__scrim" />
        <div className="cover__copy">
          <h1>{novel.title || "무제"}</h1>
          {novel.logline && <p>{novel.logline}</p>}
          <span className="cover__meta">
            {novel.author ? `${novel.author} · ` : ""}
            {novel.pages.length}장 · 약 {readingMinutes(body)}분
          </span>
        </div>
      </div>
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
      <header className="reader__bar">
        <Link to="/" className="btn btn--quiet btn--sm" aria-label="서재로">
          <Icon name="close" size={16} />
        </Link>
        <span className="reader__title">{novel.title || "무제"}</span>
        <span className="topbar__spacer" />
        <Button
          size="sm"
          variant="quiet"
          onClick={() => setMode((m) => (m === "panel" ? "scroll" : "panel"))}
          title={mode === "panel" ? "이어보기로" : "한 칸씩 보기로"}
        >
          <Icon name={mode === "panel" ? "split" : "grid"} size={15} />
          <span className="topbar__label">{mode === "panel" ? "이어보기" : "한 칸씩"}</span>
        </Button>
        <Button size="sm" variant="quiet" iconOnly onClick={toggle} aria-label="화면 밝기 전환">
          <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
        </Button>
        <Link to={`/write/${novel.id}`} className="btn btn--quiet btn--sm" aria-label="이 글 고치기">
          <Icon name="pen" size={15} />
        </Link>
      </header>

      {mode === "panel" && (
        <div className="reader__progress" role="progressbar" aria-valuenow={Math.round(progress)}>
          <span style={{ width: `${progress}%` }} />
        </div>
      )}

      {mode === "panel" ? (
        <>
          <main className="stage">
            {/* 그림이 바뀌었다는 걸 몸으로 알 수 있게 key 로 애니메이션을 다시 태운다 */}
            <div className="stage__slot" key={step}>
              {step === 0 && <Cover novel={novel} />}
              {step > 0 && step <= pages.length && (
                <Panel page={pages[step - 1]} index={step - 1} total={pages.length} />
              )}
              {step === last && (
                <div className="ending">
                  <p className="ending__mark">끝</p>
                  <h2>{novel.title || "무제"}</h2>
                  <div className="ending__actions">
                    <Button variant="outline" onClick={() => setStep(0)}>
                      <Icon name="refresh" size={15} />
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

          <nav className="reader__nav">
            <Button variant="outline" onClick={() => go(-1)} disabled={step === 0}>
              <Icon name="left" size={16} />
              이전
            </Button>
            <span className="reader__count">
              {step === 0 ? "표지" : step === last ? "끝" : `${step} / ${pages.length}`}
            </span>
            <Button variant="primary" onClick={() => go(1)} disabled={step === last}>
              {step === 0 ? "읽기 시작" : "다음"}
              <Icon name="right" size={16} />
            </Button>
          </nav>
        </>
      ) : (
        <main className="stream">
          <Cover novel={novel} />
          {pages.map((page, i) => (
            <Panel key={page.id} page={page} index={i} total={pages.length} />
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

import { useMemo, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import { Button } from "../components/Button";
import { Illustration } from "../illustration/Illustration";
import { analyzeScene } from "../illustration/analyze";
import { LABELS } from "../illustration/lexicon";
import { useNovels } from "../lib/novels";
import { countChars, readingMinutes } from "../lib/text";
import type { Novel } from "../types";
import "./library.css";

function NovelCard({ novel }: { novel: Novel }): ReactNode {
  const first = novel.pages.find((p) => p.text.trim()) ?? novel.pages[0];
  const scene = useMemo(
    () => analyzeScene(first?.text ?? "", first?.seed ?? 1, first?.sceneOverride),
    [first],
  );
  const body = novel.pages.map((p) => p.text).join("\n");
  const written = novel.pages.filter((p) => p.text.trim()).length;

  return (
    <article className="card">
      <Link to={`/read/${novel.id}`} className="card__cover" aria-label={`${novel.title || "무제"} 읽기`}>
        <span className="plate card__plate">
          <Illustration scene={scene} alt={novel.title || "표지"} />
        </span>
      </Link>
      <div className="card__body">
        <p className="kicker">
          {written}컷 · 약 {readingMinutes(body)}분
        </p>
        <h3 className="card__title">{novel.title || "무제"}</h3>
        <p className="card__meta ui">
          {novel.author || "이름 없는 작가"} · {countChars(body).toLocaleString()}자
        </p>
        <div className="card__tags">
          <span className="pill pill--rose">{LABELS[scene.mood]}</span>
          <span className="pill pill--leaf">
            {LABELS[scene.time]} {LABELS[scene.place]}
          </span>
        </div>
        <p className="card__logline">{novel.logline || "아직 소개가 없습니다."}</p>
      </div>
      <div className="card__actions">
        <Link to={`/write/${novel.id}`} className="btn btn--outline btn--sm">
          이어쓰기
        </Link>
        <Link to={`/read/${novel.id}`} className="btn btn--primary btn--sm">
          읽기
        </Link>
      </div>
    </article>
  );
}

export function Library(): ReactNode {
  const { novels, addNovel } = useNovels();
  const navigate = useNavigate();

  const sorted = useMemo(() => [...novels].sort((a, b) => b.updatedAt - a.updatedAt), [novels]);

  const startNew = () => {
    const novel = addNovel();
    navigate(`/write/${novel.id}`);
  };

  return (
    <>
      <TopBar>
        <Button variant="primary" onClick={startNew}>
          새 이야기
        </Button>
      </TopBar>

      <main className="library">
        <section className="hero">
          <p className="kicker">한 페이지 = 한 컷</p>
          <h1 className="hero__title">
            한 장에 한 장면.
            <br />
            쓰면 그림이 따라옵니다.
          </h1>
          <p className="hero__lead">
            페이지마다 본문을 읽어 장소·시간·날씨·인물을 추려내고, 그에 맞는 삽화를 그립니다.
            독자는 그림책처럼 넘기며 읽습니다.
          </p>
          <div className="hero__actions">
            <Button variant="primary" onClick={startNew}>
              첫 컷 쓰기
            </Button>
          </div>
        </section>

        {sorted.length === 0 ? (
          <div className="empty">
            <h2>서재가 비어 있습니다</h2>
            <p>새 이야기를 만들면 여기에 쌓입니다. 원고는 이 브라우저에만 저장됩니다.</p>
          </div>
        ) : (
          <section className="shelf">
            <div className="shelf__head">
              <h2 className="shelf__title">내 서재</h2>
              <span className="shelf__count ui">{sorted.length}편</span>
            </div>
            <div className="grid">
              {sorted.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { Button } from "./Button";
import type { SceneSpec } from "../illustration/analyze";
import { LABELS, MOODS, PLACES, TIMES, WEATHERS } from "../illustration/lexicon";
import type { SceneOverride } from "../types";

type Key = keyof SceneOverride;

const GROUPS: { key: Key; label: string; options: readonly string[] }[] = [
  { key: "place", label: "장소", options: PLACES },
  { key: "time", label: "시간", options: TIMES },
  { key: "weather", label: "날씨", options: WEATHERS },
  { key: "mood", label: "분위기", options: MOODS },
];

interface Props {
  scene: SceneSpec;
  override: Partial<SceneOverride>;
  onChange: (next: Partial<SceneOverride>) => void;
  onReseed: () => void;
}

export function SceneControls({ scene, override, onChange, onReseed }: Props): ReactNode {
  const set = (key: Key, value: string | number | undefined) => {
    const next = { ...override };
    if (value === undefined) delete next[key];
    else (next as Record<string, unknown>)[key] = value;
    onChange(next);
  };

  const allAuto = Object.keys(override).length === 0;

  return (
    <div className="scene">
      <div className="scene__head">
        <h3 className="scene__title">장면</h3>
        <div className="row" style={{ gap: "var(--s1)" }}>
          <Button size="sm" variant="quiet" onClick={onReseed} title="같은 글로 다른 구도 그리기">
            <Icon name="refresh" size={14} />
            다시 그리기
          </Button>
          <Button size="sm" variant="quiet" onClick={() => onChange({})} disabled={allAuto}>
            자동으로
          </Button>
        </div>
      </div>

      <p className="scene__hint">
        본문에서 읽어낸 값입니다. 누르면 직접 고를 수 있고, 고르지 않은 항목은 계속 자동으로 따라갑니다.
      </p>

      {GROUPS.map((group) => {
        const current = String(scene[group.key as keyof SceneSpec]);
        const isAuto = override[group.key] === undefined;
        return (
          <div className="scene__group" key={group.key}>
            <div className="scene__label">
              {group.label}
              {isAuto && <span className="scene__auto">자동</span>}
            </div>
            <div className="scene__chips">
              {group.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="chip"
                  aria-pressed={current === option}
                  onClick={() => set(group.key, current === option && !isAuto ? undefined : option)}
                >
                  {LABELS[option] ?? option}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <div className="scene__group">
        <div className="scene__label">
          인물
          {override.characters === undefined && <span className="scene__auto">자동</span>}
        </div>
        <div className="scene__chips">
          {[0, 1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              className="chip"
              aria-pressed={scene.characters === n}
              onClick={() =>
                set("characters", scene.characters === n && override.characters !== undefined ? undefined : n)
              }
            >
              {n === 0 ? "없음" : `${n}명`}
            </button>
          ))}
        </div>
      </div>

      {scene.props.length > 0 && (
        <div className="scene__group">
          <div className="scene__label">
            소품<span className="scene__auto">본문에서</span>
          </div>
          <div className="scene__chips">
            {scene.props.map((prop) => (
              <span key={prop} className="chip chip--static">
                {LABELS[prop] ?? prop}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

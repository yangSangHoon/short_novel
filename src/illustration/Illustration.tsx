import { useId, useMemo, type ReactNode } from "react";
import { makeRandom, type SceneSpec } from "./analyze";
import { getPalette, type Palette } from "./palette";
import { Backdrop, GROUND_Y, H, INDOOR, Interior, W, WINDOW } from "./places";
import type { Prop } from "./lexicon";

interface Props {
  scene: SceneSpec;
  /** 접근성 대체 텍스트. 보통 해당 페이지 본문의 앞부분. */
  alt?: string;
  className?: string;
}

const times = <T,>(n: number, fn: (i: number) => T): T[] =>
  Array.from({ length: n }, (_, i) => fn(i));

const range = (rand: () => number, min: number, max: number) => min + rand() * (max - min);

/* ------------------------------------------------------------------ */
/* 인물 실루엣                                                          */
/* ------------------------------------------------------------------ */

interface FigureProps {
  x: number;
  baseY: number;
  scale: number;
  fill: string;
  variant: number;
  facing: 1 | -1;
}

function Figure({ x, baseY, scale, fill, variant, facing }: FigureProps): ReactNode {
  const skirt = variant % 3 === 0;
  const armsBack = variant % 2 === 0;
  const longHair = variant % 5 < 2;

  return (
    <g transform={`translate(${x} ${baseY}) scale(${scale * facing} ${scale})`} fill={fill}>
      <circle cx={0} cy={-88} r={10.5} />
      {longHair && <path d="M-11,-90 q0,-14 11,-14 q11,0 11,14 l2,22 q-13,6 -26,0 Z" />}
      {/* 몸통 */}
      {skirt ? (
        <path d="M-12,-76 q12,-7 24,0 l10,44 q-22,9 -44,0 Z" />
      ) : (
        <path d="M-12,-76 q12,-7 24,0 l4,42 q-16,7 -32,0 Z" />
      )}
      {/* 팔 */}
      {armsBack ? (
        <>
          <path d="M-12,-72 l-7,38 l6,2 l9,-34 Z" />
          <path d="M12,-72 l7,38 l-6,2 l-9,-34 Z" />
        </>
      ) : (
        <>
          <path d="M-12,-72 l-14,28 l5,4 l15,-24 Z" />
          <path d="M12,-72 l16,22 l-4,5 l-17,-19 Z" />
        </>
      )}
      {/* 다리 */}
      {!skirt && (
        <>
          <path d="M-11,-36 L-13,2 L-4,2 L-2,-36 Z" />
          <path d="M2,-36 L4,2 L13,2 L11,-36 Z" />
        </>
      )}
      {skirt && (
        <>
          <path d="M-8,-32 L-9,2 L-2,2 L-2,-32 Z" />
          <path d="M2,-32 L2,2 L9,2 L8,-32 Z" />
        </>
      )}
    </g>
  );
}

function Figures({ spec, p, rand }: { spec: SceneSpec; p: Palette; rand: () => number }): ReactNode {
  if (spec.characters <= 0) return null;
  const baseY = GROUND_Y[spec.place];
  // 인물을 화면 중앙에서 살짝 비켜 세워 여백이 답답해지지 않게 한다.
  const slots = [[0.42], [0.34, 0.62], [0.26, 0.5, 0.74]][spec.characters - 1] ?? [0.5];

  return (
    <g>
      {slots.map((ratio, i) => {
        const x = W * ratio + range(rand, -18, 18);
        const scale = range(rand, 0.92, 1.16) * (spec.place === "space" ? 0.86 : 1);
        const facing: 1 | -1 = rand() > 0.35 ? 1 : -1;
        return (
          <g key={i}>
            <ellipse
              cx={x}
              cy={baseY + 3}
              rx={26 * scale}
              ry={5 * scale}
              fill={p.figure}
              opacity={0.28}
            />
            <Figure
              x={x}
              baseY={baseY}
              scale={scale}
              fill={p.figure}
              variant={Math.floor(rand() * 10)}
              facing={facing}
            />
          </g>
        );
      })}
    </g>
  );
}

function Crowd({ p, rand, baseY }: { p: Palette; rand: () => number; baseY: number }): ReactNode {
  return (
    <g opacity={0.55}>
      {times(14, (i) => (
        <Figure
          key={i}
          x={range(rand, -20, W + 20)}
          baseY={baseY - range(rand, 8, 26)}
          scale={range(rand, 0.42, 0.6)}
          fill={p.near}
          variant={Math.floor(rand() * 10)}
          facing={rand() > 0.5 ? 1 : -1}
        />
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* 소품                                                                */
/* ------------------------------------------------------------------ */

function PropLayer({
  prop,
  spec,
  p,
  rand,
  uid,
}: {
  prop: Prop;
  spec: SceneSpec;
  p: Palette;
  rand: () => number;
  uid: string;
}): ReactNode {
  const baseY = GROUND_Y[spec.place];
  const heroX = W * 0.42;

  switch (prop) {
    case "umbrella":
      return (
        <g fill={p.figure}>
          <path d={`M${heroX - 46} ${baseY - 104} a 46 46 0 0 1 92 0 Z`} />
          <rect x={heroX - 1.5} y={baseY - 104} width={3} height={46} />
        </g>
      );
    case "book":
      return (
        <g>
          <path
            d={`M${heroX + 34} ${baseY - 60} l 34 -8 l 2 22 l -34 8 Z`}
            fill={p.figure}
          />
          <path d={`M${heroX + 34} ${baseY - 60} l 34 -8`} stroke={p.haze} strokeWidth={1.5} opacity={0.5} />
        </g>
      );
    case "sword":
      return (
        <g stroke={p.figure} strokeLinecap="round" fill="none">
          <line x1={heroX + 28} y1={baseY - 66} x2={heroX + 78} y2={baseY - 150} strokeWidth={5} />
          <line x1={heroX + 22} y1={baseY - 58} x2={heroX + 36} y2={baseY - 78} strokeWidth={8} />
        </g>
      );
    case "flower":
      return (
        <g>
          {times(4, (i) => {
            const x = range(rand, 40, W - 40);
            const y = range(rand, H - 70, H - 14);
            return (
              <g key={i}>
                <path d={`M${x} ${y} q 4 -26 0 -40`} stroke={p.figure} strokeWidth={2} fill="none" />
                {times(5, (j) => (
                  <circle
                    key={j}
                    cx={x + Math.cos((j / 5) * Math.PI * 2) * 6}
                    cy={y - 42 + Math.sin((j / 5) * Math.PI * 2) * 6}
                    r={4}
                    fill={p.haze}
                    opacity={0.9}
                  />
                ))}
              </g>
            );
          })}
        </g>
      );
    case "cat":
      return (
        <g fill={p.figure} transform={`translate(${W * 0.74} ${baseY})`}>
          <path d="M0,0 q2,-22 18,-22 q16,0 18,22 Z" />
          <circle cx={36} cy={-28} r={9} />
          <path d="M29,-34 l2,-10 l7,6 Z M43,-34 l-2,-10 l-7,6 Z" />
          <path d="M0,0 q-14,-4 -12,-24" stroke={p.figure} strokeWidth={3.5} fill="none" strokeLinecap="round" />
        </g>
      );
    case "bird":
      return (
        <g stroke={p.figure} strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.75}>
          {times(5, (i) => {
            const x = range(rand, 80, W - 80);
            const y = range(rand, 50, 200);
            const s = range(rand, 0.7, 1.4);
            return <path key={i} d={`M${x} ${y} q ${8 * s} ${-7 * s} ${16 * s} 0 q ${8 * s} ${-7 * s} ${16 * s} 0`} />;
          })}
        </g>
      );
    case "lantern": {
      const x = W * 0.68;
      const y = baseY - 130;
      return (
        <g>
          {/* 땅에서 올라오는 기둥 — 가로등처럼 읽힌다 */}
          <rect x={x - 2.5} y={y + 18} width={5} height={baseY - y - 18} fill={p.figure} />
          <rect x={x - 12} y={y - 12} width={24} height={30} rx={5} fill={p.figure} />
          <rect x={x - 7} y={y - 7} width={14} height={20} rx={3} fill={p.glow} />
          <circle cx={x} cy={y + 3} r={54} fill={p.glow} opacity={0.16} filter={`url(#${uid}-blur)`} />
        </g>
      );
    }
    case "train": {
      const y = baseY - 86;
      return (
        <g fill={p.mid}>
          <rect x={W - 330} y={y} width={310} height={44} rx={8} />
          <path d={`M${W - 330} ${y} h -44 q -18 0 -18 20 v 24 h 62 Z`} />
          {times(7, (i) => (
            <rect key={i} x={W - 310 + i * 42} y={y + 10} width={26} height={18} fill={p.glow} opacity={0.55} />
          ))}
          <rect x={W - 400} y={y + 46} width={400} height={5} fill={p.near} />
        </g>
      );
    }
    case "letter":
      return (
        <g transform={`translate(${W * 0.16} ${H - 74}) rotate(-8)`}>
          <rect x={0} y={0} width={92} height={62} rx={4} fill={p.haze} opacity={0.92} />
          <path d="M0,0 L46,34 L92,0" stroke={p.near} strokeWidth={2.5} fill="none" />
        </g>
      );
    case "cup": {
      const x = INDOOR.has(spec.place) ? 500 : W * 0.66;
      const y = INDOOR.has(spec.place) ? 314 : baseY - 4;
      return (
        <g fill={p.figure}>
          <path d={`M${x - 13} ${y - 24} h 26 l -4 24 h -18 Z`} />
          <path d={`M${x + 13} ${y - 20} q 12 4 0 14`} stroke={p.figure} strokeWidth={3} fill="none" />
          <path
            d={`M${x - 4} ${y - 34} q 6 -8 0 -16`}
            stroke={p.haze}
            strokeWidth={2}
            fill="none"
            opacity={0.5}
          />
        </g>
      );
    }
    case "boat": {
      const y = baseY - 66;
      const x = W * 0.72;
      return (
        <g fill={p.figure}>
          <path d={`M${x - 46} ${y} h 92 l -14 20 h -64 Z`} />
          <rect x={x - 2} y={y - 62} width={4} height={62} />
          <path d={`M${x + 4} ${y - 60} l 40 54 h -40 Z`} opacity={0.85} />
        </g>
      );
    }
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* 하늘 · 날씨                                                          */
/* ------------------------------------------------------------------ */

function Sky({ p, rand, uid, spec }: { p: Palette; rand: () => number; uid: string; spec: SceneSpec }): ReactNode {
  const showStars = p.stars && spec.weather !== "rain" && spec.weather !== "snow";
  const luminaryX = range(rand, 120, W - 120);
  const luminaryY = range(rand, 60, 170);
  const hidden = spec.weather === "rain" || spec.weather === "fog" || spec.place === "space";

  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill={`url(#${uid}-sky)`} />
      {showStars &&
        times(70, (i) => (
          <circle
            key={i}
            cx={range(rand, 0, W)}
            cy={range(rand, 0, 320)}
            r={range(rand, 0.6, 1.9)}
            fill={p.particle}
            opacity={range(rand, 0.25, 0.95)}
          />
        ))}
      {!hidden && (
        <g>
          <circle cx={luminaryX} cy={luminaryY} r={78} fill={p.luminaryGlow} opacity={0.22} filter={`url(#${uid}-blur)`} />
          <circle cx={luminaryX} cy={luminaryY} r={p.stars ? 26 : 34} fill={p.luminary} />
          {p.stars && (
            // 초승달 — 원 하나를 살짝 겹쳐 깎는다
            <circle cx={luminaryX + 11} cy={luminaryY - 7} r={24} fill={p.skyTop} opacity={0.92} />
          )}
        </g>
      )}
    </g>
  );
}

function Clouds({ p, rand, dense }: { p: Palette; rand: () => number; dense: boolean }): ReactNode {
  return (
    <g fill={p.haze} opacity={dense ? 0.5 : 0.3}>
      {times(dense ? 6 : 3, (i) => {
        const x = range(rand, -60, W);
        const y = range(rand, 30, 190);
        const s = range(rand, 0.7, 1.5);
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse cx={0} cy={0} rx={54} ry={17} />
            <ellipse cx={-26} cy={5} rx={34} ry={13} />
            <ellipse cx={30} cy={6} rx={40} ry={14} />
          </g>
        );
      })}
    </g>
  );
}

function Weather({ spec, p, rand, uid }: { spec: SceneSpec; p: Palette; rand: () => number; uid: string }): ReactNode {
  if (spec.weather === "rain") {
    return (
      <g stroke={p.particle} strokeWidth={1.4} opacity={0.45} strokeLinecap="round">
        {times(110, (i) => {
          const x = range(rand, -40, W + 40);
          const y = range(rand, -20, H);
          const len = range(rand, 14, 34);
          return <line key={i} x1={x} y1={y} x2={x - len * 0.32} y2={y + len} />;
        })}
      </g>
    );
  }
  if (spec.weather === "snow") {
    return (
      <g fill={p.particle}>
        {times(90, (i) => (
          <circle
            key={i}
            cx={range(rand, 0, W)}
            cy={range(rand, 0, H)}
            r={range(rand, 1.2, 3.6)}
            opacity={range(rand, 0.3, 0.95)}
          />
        ))}
      </g>
    );
  }
  if (spec.weather === "fog") {
    return (
      <g filter={`url(#${uid}-blur)`}>
        {times(6, (i) => (
          <ellipse
            key={i}
            cx={range(rand, 100, W - 100)}
            cy={range(rand, 200, H - 40)}
            rx={range(rand, 180, 340)}
            ry={range(rand, 22, 46)}
            fill={p.haze}
            opacity={range(rand, 0.18, 0.4)}
          />
        ))}
      </g>
    );
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* 조합                                                                */
/* ------------------------------------------------------------------ */

export function Illustration({ scene, alt, className }: Props): ReactNode {
  const rawId = useId();
  const uid = useMemo(() => `ill${rawId.replace(/[^a-zA-Z0-9]/g, "")}`, [rawId]);
  // 우주는 시간대가 무의미하다 — 언제나 밤하늘로 그린다.
  const p = useMemo(
    () => getPalette(scene.place === "space" ? "night" : scene.time, scene.mood),
    [scene.place, scene.time, scene.mood],
  );

  const indoor = INDOOR.has(scene.place);
  const horizon = indoor ? WINDOW.y + WINDOW.h : 330;

  const content = useMemo(() => {
    // 레이어 순서가 곧 난수 소비 순서다. 매번 시드에서 새로 만들어야 같은 글이 같은 그림이 된다.
    const rand = makeRandom(scene.seed);
    const cloudy = scene.weather === "cloud" || scene.weather === "rain" || scene.weather === "snow";
    return (
      <>
        <Sky p={p} rand={rand} uid={uid} spec={scene} />
        {cloudy && !indoor && <Clouds p={p} rand={rand} dense={scene.weather !== "cloud"} />}
        {indoor ? (
          <Interior place={scene.place} p={p} rand={rand} horizon={horizon} uid={uid} />
        ) : (
          <Backdrop place={scene.place} p={p} rand={rand} horizon={horizon} uid={uid} />
        )}
        {scene.crowd && <Crowd p={p} rand={rand} baseY={GROUND_Y[scene.place]} />}
        <Figures spec={scene} p={p} rand={rand} />
        {scene.props.map((prop) => (
          <PropLayer key={prop} prop={prop} spec={scene} p={p} rand={rand} uid={uid} />
        ))}
        {!indoor && <Weather spec={scene} p={p} rand={rand} uid={uid} />}
        <rect x={0} y={0} width={W} height={H} fill={p.tint} opacity={p.tintAlpha} />
        <rect x={0} y={0} width={W} height={H} fill={`url(#${uid}-vig)`} />
        <rect x={0} y={0} width={W} height={H} filter={`url(#${uid}-grain)`} opacity={0.14} />
      </>
    );
    // rand 는 시드에서 파생되므로 scene 이 바뀔 때만 다시 만들어진다.
  }, [scene, p, uid, indoor, horizon]);

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={alt ? `삽화: ${alt}` : "본문에서 자동 생성된 삽화"}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.skyTop} />
          <stop offset="55%" stopColor={p.skyMid} />
          <stop offset="100%" stopColor={p.skyBottom} />
        </linearGradient>
        <linearGradient id={`${uid}-sea`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.haze} stopOpacity="0.35" />
          <stop offset="100%" stopColor={p.ground} stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id={`${uid}-vig`} cx="50%" cy="46%" r="76%">
          <stop offset="60%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.34" />
        </radialGradient>
        <filter id={`${uid}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      {content}
    </svg>
  );
}

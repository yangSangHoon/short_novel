import type { ReactNode } from "react";
import type { Palette } from "./palette";
import type { Place } from "./lexicon";

export interface SceneryProps {
  p: Palette;
  rand: () => number;
  /** SVG 인스턴스별 고유 접두사 — filter/gradient id 충돌을 막는다. */
  uid: string;
  /** 원경이 끝나고 땅이 시작되는 y. */
  horizon: number;
}

export const W = 800;
export const H = 500;

/** 하늘 대신 벽이 보이는 장소들. */
export const INDOOR: ReadonlySet<Place> = new Set<Place>(["room", "cafe"]);

/** 인물이 발을 딛는 y 좌표. */
export const GROUND_Y: Record<Place, number> = {
  room: 452,
  city: 428,
  forest: 432,
  sea: 442,
  mountain: 436,
  field: 434,
  school: 430,
  cafe: 450,
  road: 440,
  space: 462,
  ruins: 436,
};

function times<T>(n: number, fn: (i: number) => T): T[] {
  return Array.from({ length: n }, (_, i) => fn(i));
}

const range = (rand: () => number, min: number, max: number) => min + rand() * (max - min);

/* ------------------------------------------------------------------ */
/* 실외 배경                                                           */
/* ------------------------------------------------------------------ */

function City({ p, rand, horizon, uid }: SceneryProps): ReactNode {
  const litOpacity = p.lowLight ? 0.55 : 0.14;

  // 뒤쪽은 옅은 덩어리로, 앞쪽은 박공지붕을 얹은 파스텔 집으로 — 언덕 위 마을처럼.
  const distant = times(12, (i) => ({
    x: i * 68 - 20 + range(rand, -10, 10),
    w: range(rand, 34, 70),
    h: range(rand, 46, 150),
  }));
  const houses = times(9, (i) => ({
    x: i * 92 - 26 + range(rand, -8, 8),
    w: range(rand, 56, 92),
    h: range(rand, 52, 104),
    wall: p.wall[Math.floor(rand() * 3)],
    roof: p.roof[Math.floor(rand() * 2)],
  }));

  return (
    <g>
      {distant.map((b, i) => (
        <rect key={`f${i}`} x={b.x} y={horizon - b.h} width={b.w} height={b.h + 10} fill={p.far} />
      ))}
      {houses.map((b, i) => (
        <g key={`h${i}`} filter={`url(#${uid}-drop)`}>
          <rect
            x={b.x}
            y={horizon - b.h}
            width={b.w}
            height={b.h + 8}
            fill={b.wall}
            stroke={p.outline}
            strokeWidth={0.8}
          />
          <path
            d={`M${b.x - 6} ${horizon - b.h} H${b.x + b.w + 6} L${b.x + b.w / 2} ${horizon - b.h - b.w * 0.34} Z`}
            fill={b.roof}
          />
          {times(Math.max(1, Math.floor(b.h / 34)), (j) => (
            <rect
              key={j}
              x={b.x + 10 + (j % 2) * (b.w - 36)}
              y={horizon - b.h + 16 + j * 30}
              width={16}
              height={18}
              rx={1}
              fill={p.lowLight ? p.glow : "#a7c2d3"}
              opacity={rand() > 0.4 ? litOpacity + 0.3 : litOpacity}
            />
          ))}
        </g>
      ))}
      <rect x={0} y={horizon} width={W} height={H - horizon} fill={p.ground} />
      <path
        d={`M0 ${horizon + 52} H${W}`}
        stroke={p.outline}
        strokeWidth={1.5}
        opacity={0.4}
        fill="none"
      />
    </g>
  );
}

function Forest({ p, rand, horizon }: SceneryProps): ReactNode {
  return (
    <g>
      <path
        d={`M0 ${horizon} Q 200 ${horizon - 70} 400 ${horizon - 20} T 800 ${horizon - 40} V ${H} H0 Z`}
        fill={p.far}
      />
      {times(11, (i) => {
        const x = i * 78 + range(rand, -16, 16);
        const top = horizon - range(rand, 60, 150);
        return (
          <g key={i} fill={p.mid}>
            <rect x={x - 5} y={top + 40} width={10} height={horizon - top} />
            <path d={`M${x} ${top} L${x + 42} ${top + 82} H${x - 42} Z`} />
            <path d={`M${x} ${top + 34} L${x + 48} ${top + 124} H${x - 48} Z`} />
          </g>
        );
      })}
      <rect x={0} y={horizon + 30} width={W} height={H} fill={p.ground} />
      {/* 근경 나무 두 그루가 프레임을 만든다 */}
      {[60, 742].map((x, i) => (
        <g key={i} fill={p.near}>
          <rect x={x - 17} y={90} width={34} height={H - 90} />
          <path d={`M${x} 0 L${x + 96} 168 H${x - 96} Z`} />
          <path d={`M${x} 74 L${x + 112} 268 H${x - 112} Z`} />
        </g>
      ))}
    </g>
  );
}

function Sea({ p, rand, horizon, uid }: SceneryProps): ReactNode {
  return (
    <g>
      <path
        d={`M${range(rand, 80, 260)} ${horizon} q 60 -46 130 0 Z`}
        fill={p.far}
        opacity={0.8}
      />
      <rect x={0} y={horizon} width={W} height={H - horizon} fill={p.water} />
      <rect x={0} y={horizon} width={W} height={H - horizon} fill={`url(#${uid}-sea)`} />
      {times(16, (i) => {
        const y = horizon + 10 + i * 9 + rand() * 5;
        const x = range(rand, -40, 600);
        const w = range(rand, 60, 220);
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={w}
            height={3}
            rx={1.5}
            fill={p.haze}
            opacity={0.4 + rand() * 0.4}
          />
        );
      })}
      {/* 젖은 모래 — 인물이 설 자리 */}
      <path d={`M0 ${H - 78} Q 400 ${H - 108} 800 ${H - 72} V ${H} H0 Z`} fill={p.ground} />
    </g>
  );
}

function Mountain({ p, rand, horizon }: SceneryProps): ReactNode {
  const peak = (x: number, h: number, fill: string, snow: boolean) => (
    <g>
      <path d={`M${x} ${horizon - h} L${x + h * 1.25} ${horizon + 40} H${x - h * 1.25} Z`} fill={fill} />
      {snow && (
        <path
          d={`M${x} ${horizon - h} l ${h * 0.3} ${h * 0.36} l -${h * 0.13} -0.06 l -${h * 0.1} 0.12 l -${h * 0.14} -0.14 l -${h * 0.12} 0.1 Z`}
          fill={p.haze}
          opacity={0.85}
        />
      )}
    </g>
  );
  return (
    <g>
      {peak(range(rand, 120, 220), range(rand, 150, 210), p.far, true)}
      {peak(range(rand, 520, 680), range(rand, 130, 190), p.far, true)}
      {peak(range(rand, 300, 460), range(rand, 180, 250), p.mid, true)}
      <path
        d={`M0 ${horizon + 20} Q 240 ${horizon - 24} 520 ${horizon + 16} T 800 ${horizon + 4} V ${H} H0 Z`}
        fill={p.near}
      />
      <path d={`M0 ${H - 60} Q 400 ${H - 96} 800 ${H - 54} V ${H} H0 Z`} fill={p.ground} />
    </g>
  );
}

function Field({ p, rand, horizon }: SceneryProps): ReactNode {
  return (
    <g>
      <path
        d={`M0 ${horizon + 10} Q 220 ${horizon - 40} 480 ${horizon + 6} T 800 ${horizon - 10} V ${H} H0 Z`}
        fill={p.far}
      />
      <path
        d={`M0 ${horizon + 58} Q 300 ${horizon + 8} 560 ${horizon + 54} T 800 ${horizon + 40} V ${H} H0 Z`}
        fill={p.mid}
      />
      <path d={`M0 ${H - 96} Q 380 ${H - 140} 800 ${H - 86} V ${H} H0 Z`} fill={p.ground} />
      {times(34, (i) => {
        const x = range(rand, 0, W);
        const y = range(rand, H - 92, H - 6);
        const h = range(rand, 8, 22);
        return (
          <path
            key={i}
            d={`M${x} ${y} q ${range(rand, -6, 6)} -${h} ${range(rand, -3, 3)} -${h}`}
            stroke={p.near}
            strokeWidth={1.6}
            fill="none"
            opacity={0.55}
          />
        );
      })}
    </g>
  );
}

function School({ p, rand, horizon, uid }: SceneryProps): ReactNode {
  const bx = 190;
  const by = horizon - 150;
  return (
    <g>
      <rect x={0} y={horizon} width={W} height={H - horizon} fill={p.ground} />
      <g filter={`url(#${uid}-drop)`}>
        <rect x={bx} y={by} width={420} height={170} fill={p.wall[0]} stroke={p.outline} strokeWidth={0.9} />
        <path d={`M${bx - 18} ${by} H${bx + 438} L${bx + 210} ${by - 42} Z`} fill={p.roof[0]} />
      </g>
      {times(3, (r) =>
        times(7, (c) => (
          <rect
            key={`${r}-${c}`}
            x={bx + 26 + c * 56}
            y={by + 22 + r * 46}
            width={34}
            height={28}
            rx={1}
            fill={p.lowLight ? p.glow : "#a7c2d3"}
            opacity={rand() > 0.5 ? (p.lowLight ? 0.62 : 0.5) : 0.24}
          />
        )),
      )}
      <rect x={bx + 190} y={by + 118} width={44} height={52} rx={2} fill={p.roof[1]} opacity={0.8} />
      {times(14, (i) => (
        <rect key={i} x={i * 58 + 14} y={horizon - 26} width={3.5} height={28} fill={p.outline} opacity={0.6} />
      ))}
      <path d={`M0 ${horizon - 13} H${W}`} stroke={p.outline} strokeWidth={1.5} opacity={0.5} />
    </g>
  );
}

function Road({ p, rand, horizon }: SceneryProps): ReactNode {
  const vp = 400 + range(rand, -60, 60);
  return (
    <g>
      <path
        d={`M0 ${horizon + 4} Q 220 ${horizon - 30} 460 ${horizon + 2} T 800 ${horizon - 6} V ${H} H0 Z`}
        fill={p.far}
      />
      <rect x={0} y={horizon + 40} width={W} height={H} fill={p.ground} />
      <path d={`M${vp - 26} ${horizon + 30} L${vp + 26} ${horizon + 30} L ${W} ${H} H -60 Z`} fill={p.near} />
      {times(6, (i) => {
        const t = i / 6;
        const y = horizon + 46 + t * t * (H - horizon - 40) * 1.5;
        const w = 6 + t * t * 30;
        return <rect key={i} x={vp - w / 2 + (400 - vp) * t * t} y={y} width={w} height={6 + t * 14} fill={p.haze} opacity={0.35} />;
      })}
      {times(4, (i) => {
        const t = (i + 1) / 4;
        const x = vp - 60 - t * t * 360;
        const y = horizon + 26;
        const h = 40 + t * t * 190;
        return (
          <g key={i}>
            <rect x={x} y={y - h + 40} width={3 + t * 4} height={h} fill={p.near} />
            <circle cx={x + 2} cy={y - h + 42} r={4 + t * 4} fill={p.glow} opacity={0.65} />
          </g>
        );
      })}
    </g>
  );
}

function Space({ p, rand, uid }: SceneryProps): ReactNode {
  return (
    <g>
      {times(3, (i) => (
        <ellipse
          key={i}
          cx={range(rand, 100, 700)}
          cy={range(rand, 60, 280)}
          rx={range(rand, 120, 240)}
          ry={range(rand, 50, 110)}
          fill={p.tint}
          opacity={0.16}
          filter={`url(#${uid}-blur)`}
        />
      ))}
      <circle cx={range(rand, 120, 260)} cy={range(rand, 90, 170)} r={range(rand, 26, 48)} fill={p.far} />
      <path d={`M-120 ${H - 34} Q 400 ${H - 190} 920 ${H - 34} V ${H} H -120 Z`} fill={p.ground} />
      <path
        d={`M-120 ${H - 34} Q 400 ${H - 190} 920 ${H - 34}`}
        stroke={p.glow}
        strokeWidth={2}
        fill="none"
        opacity={0.4}
      />
    </g>
  );
}

function Ruins({ p, rand, horizon }: SceneryProps): ReactNode {
  return (
    <g>
      <rect x={0} y={horizon} width={W} height={H - horizon} fill={p.ground} />
      {times(6, (i) => {
        const x = i * 132 + range(rand, -20, 20);
        const h = range(rand, 40, 110);
        const w = range(rand, 50, 110);
        return (
          <path
            key={i}
            d={`M${x} ${horizon + 6} V ${horizon - h} l ${w * 0.18} ${range(rand, 18, 46)} l ${w * 0.2} -${range(rand, 10, 34)} l ${w * 0.22} ${range(rand, 20, 52)} l ${w * 0.2} -${range(rand, 8, 26)} l ${w * 0.2} ${range(rand, 24, 58)} V ${horizon + 6} Z`}
            fill={i % 2 ? p.mid : p.far}
          />
        );
      })}
      {times(3, (i) => {
        const x = range(rand, 80, 700);
        const h = range(rand, 70, 130);
        return (
          <g key={`c${i}`}>
            <rect x={x} y={horizon - h} width={16} height={h} fill={p.near} />
            {/* 무너져 비스듬히 걸친 슬래브 */}
            <path
              d={`M${x + 16} ${horizon + 4} l ${range(rand, 40, 90)} -${range(rand, 14, 38)} l 10 12 l -${range(rand, 40, 90)} ${range(rand, 16, 40)} Z`}
              fill={p.near}
            />
          </g>
        );
      })}
      {times(9, (i) => (
        <rect
          key={`r${i}`}
          x={range(rand, 0, W)}
          y={range(rand, horizon + 10, H - 20)}
          width={range(rand, 10, 34)}
          height={range(rand, 5, 12)}
          rx={2}
          fill={p.near}
          opacity={0.7}
        />
      ))}
    </g>
  );
}

const OUTDOOR: Partial<Record<Place, (props: SceneryProps) => ReactNode>> = {
  city: City,
  forest: Forest,
  sea: Sea,
  mountain: Mountain,
  field: Field,
  school: School,
  road: Road,
  space: Space,
  ruins: Ruins,
};

export function Backdrop({ place, ...props }: SceneryProps & { place: Place }): ReactNode {
  const Component = OUTDOOR[place] ?? Field;
  return <Component {...props} />;
}

/* ------------------------------------------------------------------ */
/* 실내 — 벽으로 하늘을 가리고 창문만 뚫는다                            */
/* ------------------------------------------------------------------ */

export const WINDOW = { x: 470, y: 84, w: 250, h: 190 };

/** 바깥 하늘 위에 덮이는 실내. 창문 자리는 evenodd 로 뚫어 하늘이 비치게 한다. */
export function Interior({ place, p, uid }: SceneryProps & { place: Place }): ReactNode {
  const { x, y, w, h } = WINDOW;
  const floorY = 372;
  return (
    <g>
      <path
        fillRule="evenodd"
        d={`M0 0 H${W} V${H} H0 Z M${x} ${y} H${x + w} V${y + h} H${x} Z`}
        fill={p.near}
      />
      {/* 창틀 */}
      <g stroke={p.figure} strokeWidth={6} fill="none">
        <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} />
        <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} />
        <line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} />
      </g>
      {/* 창에서 흘러드는 빛 */}
      <path
        d={`M${x} ${y + h} L${x + w} ${y + h} L${x + w + 60} ${H} L${x - 90} ${H} Z`}
        fill={p.glow}
        opacity={0.12}
      />
      <rect x={0} y={floorY} width={W} height={H - floorY} fill={p.ground} />
      <rect x={0} y={floorY} width={W} height={2} fill={p.figure} opacity={0.4} />

      {place === "room" ? (
        <RoomProps p={p} floorY={floorY} uid={uid} />
      ) : (
        <CafeProps p={p} floorY={floorY} uid={uid} />
      )}
    </g>
  );
}

function RoomProps({ p, floorY, uid }: { p: Palette; floorY: number; uid: string }): ReactNode {
  return (
    <g>
      {/* 커튼 */}
      <path d={`M${WINDOW.x - 34} ${WINDOW.y - 14} q 22 ${WINDOW.h / 2} 0 ${WINDOW.h + 40} h -22 V ${WINDOW.y - 14} Z`} fill={p.mid} />
      <path d={`M${WINDOW.x + WINDOW.w + 34} ${WINDOW.y - 14} q -22 ${WINDOW.h / 2} 0 ${WINDOW.h + 40} h 22 V ${WINDOW.y - 14} Z`} fill={p.mid} />
      {/* 책상과 스탠드 */}
      <rect x={80} y={floorY - 76} width={230} height={12} rx={3} fill={p.mid} />
      <rect x={92} y={floorY - 64} width={9} height={64} fill={p.mid} />
      <rect x={290} y={floorY - 64} width={9} height={64} fill={p.mid} />
      <rect x={150} y={floorY - 96} width={40} height={20} rx={3} fill={p.figure} />
      <path d={`M244 ${floorY - 76} v -52 h 34 l -14 20`} stroke={p.figure} strokeWidth={5} fill="none" />
      <ellipse cx={268} cy={floorY - 116} rx={20} ry={11} fill={p.glow} opacity={0.75} />
      <ellipse cx={268} cy={floorY - 96} rx={62} ry={26} fill={p.glow} opacity={0.14} filter={`url(#${uid}-blur)`} />
    </g>
  );
}

function CafeProps({ p, floorY, uid }: { p: Palette; floorY: number; uid: string }): ReactNode {
  return (
    <g>
      {/* 펜던트 조명 */}
      {[130, 250, 370].map((x) => (
        <g key={x}>
          <line x1={x} y1={0} x2={x} y2={92} stroke={p.figure} strokeWidth={3} />
          <path d={`M${x - 26} 122 L${x} 92 L${x + 26} 122 Z`} fill={p.figure} />
          <circle cx={x} cy={126} r={7} fill={p.glow} opacity={0.9} />
          <circle cx={x} cy={130} r={42} fill={p.glow} opacity={0.12} filter={`url(#${uid}-blur)`} />
        </g>
      ))}
      {/* 카운터 */}
      <rect x={60} y={floorY - 104} width={300} height={104} fill={p.mid} />
      <rect x={52} y={floorY - 112} width={316} height={14} rx={4} fill={p.figure} />
      {/* 테이블 */}
      <rect x={430} y={floorY - 58} width={150} height={9} rx={4} fill={p.mid} />
      <rect x={500} y={floorY - 49} width={10} height={49} fill={p.mid} />
      <rect x={470} y={floorY - 4} width={70} height={6} rx={3} fill={p.mid} />
    </g>
  );
}

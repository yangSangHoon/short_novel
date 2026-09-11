import type { Mood, TimeOfDay } from "./lexicon";

export interface Palette {
  /** 하늘 그라디언트 (위 → 아래). */
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  /** 지평선 부근에 깔리는 옅은 빛. */
  haze: string;
  /** 해·달 본체와 그 후광. */
  luminary: string;
  luminaryGlow: string;
  /** 원경 → 근경으로 갈수록 어두워지는 3단 실루엣. */
  far: string;
  mid: string;
  near: string;
  ground: string;
  /** 인물 실루엣. 근경보다 한 단계 더 어둡다. */
  figure: string;
  /** 창문·등불처럼 스스로 빛나는 것. */
  glow: string;
  /** 분위기 보정용 전면 틴트. */
  tint: string;
  tintAlpha: number;
  /** 비/눈/안개 입자. */
  particle: string;
  stars: boolean;
  /** 해가 낮은 시간대 — 창문·간판 불빛이 켜지는 기준. */
  lowLight: boolean;
}

const BASE: Record<TimeOfDay, Palette> = {
  dawn: {
    skyTop: "#3d4a72",
    skyMid: "#8d7d9c",
    skyBottom: "#f0c3a4",
    haze: "#f7dcc4",
    luminary: "#fff0d2",
    luminaryGlow: "#ffd9a6",
    far: "#7d7f9e",
    mid: "#5a5b7c",
    near: "#3a3a56",
    ground: "#2c2c43",
    figure: "#1f1f30",
    glow: "#ffd79a",
    tint: "#f0b98f",
    tintAlpha: 0.06,
    particle: "#e8e2f0",
    stars: false,
    lowLight: true,
  },
  day: {
    skyTop: "#6fb0dd",
    skyMid: "#a8d3ea",
    skyBottom: "#e2eef2",
    haze: "#f3f7f4",
    luminary: "#fff6dd",
    luminaryGlow: "#ffe9b0",
    far: "#9dbfc4",
    mid: "#7ba0a4",
    near: "#537a7d",
    ground: "#3f5f60",
    figure: "#2b4243",
    glow: "#fff3cf",
    tint: "#ffe9b8",
    tintAlpha: 0.05,
    particle: "#ffffff",
    stars: false,
    lowLight: false,
  },
  dusk: {
    skyTop: "#3b2a52",
    skyMid: "#8e4f61",
    skyBottom: "#e8895a",
    haze: "#f7b982",
    luminary: "#ffd9a0",
    luminaryGlow: "#ff9f5e",
    far: "#8a5a6a",
    mid: "#5c3b4f",
    near: "#3a2436",
    ground: "#291823",
    figure: "#1a0f18",
    glow: "#ffc078",
    tint: "#ff9a5c",
    tintAlpha: 0.08,
    particle: "#ffd8bd",
    stars: false,
    lowLight: true,
  },
  night: {
    skyTop: "#0b1130",
    skyMid: "#182247",
    skyBottom: "#32406b",
    haze: "#4a5a86",
    luminary: "#f4f1e2",
    luminaryGlow: "#cfd8f0",
    far: "#2b3760",
    mid: "#1d2647",
    near: "#131A33",
    ground: "#0c1124",
    figure: "#05070f",
    glow: "#ffd28a",
    tint: "#3d5a9e",
    tintAlpha: 0.1,
    particle: "#dce6ff",
    stars: true,
    lowLight: true,
  },
};

/** 감정은 색을 갈아엎기보다 얇게 덮어 성격만 바꾼다. */
const MOOD_TINT: Record<Mood, { tint: string; alpha: number }> = {
  calm: { tint: "#8fb3c9", alpha: 0.05 },
  warm: { tint: "#ffb774", alpha: 0.1 },
  sad: { tint: "#6b7fa8", alpha: 0.12 },
  tense: { tint: "#6e2b2b", alpha: 0.14 },
  mystic: { tint: "#7b62c4", alpha: 0.13 },
  bright: { tint: "#ffe59a", alpha: 0.09 },
};

export function getPalette(time: TimeOfDay, mood: Mood): Palette {
  const base = BASE[time];
  const mod = MOOD_TINT[mood];
  return {
    ...base,
    tint: mod.tint,
    // 원래 시간대 틴트와 감정 틴트를 합쳐, 밤에 과하게 덮이지 않도록 상한을 둔다.
    tintAlpha: Math.min(0.2, base.tintAlpha + mod.alpha),
  };
}

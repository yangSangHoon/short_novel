import type { Mood, TimeOfDay } from "./lexicon";

/**
 * 삽화 색. 디자인의 레퍼런스 그림(파스텔 해안 마을, 종이 위에 얹은 듯한 질감)을
 * 따라 전 시간대를 밝게 가져간다. 밤도 검게 떨어뜨리지 않고 연보라로 둔다.
 */
export interface Palette {
  /** 하늘 그라디언트 (위 → 아래). */
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  /** 지평선 부근의 옅은 빛과 구름. */
  haze: string;
  /** 해·달 본체와 그 후광. */
  luminary: string;
  luminaryGlow: string;
  /** 원경 → 근경으로 가며 짙어지는 3단. */
  far: string;
  mid: string;
  near: string;
  ground: string;
  /** 물 — 중경 색을 그대로 쓰면 시간대에 따라 물이 물처럼 안 보인다. */
  water: string;
  /** 인물. 새까만 실루엣 대신 부드러운 자주빛. */
  figure: string;
  /** 창문·등불처럼 스스로 빛나는 것. */
  glow: string;
  /** 건물·소품에 돌려쓰는 파스텔 삼색과 지붕색. */
  wall: [string, string, string];
  roof: [string, string];
  /** 형태를 잡아 주는 가는 윤곽선. */
  outline: string;
  /** 분위기 보정용 전면 틴트. */
  tint: string;
  tintAlpha: number;
  /** 비/눈/안개 입자. */
  particle: string;
  stars: boolean;
  /** 해가 낮은 시간대 — 창문·간판 불빛이 켜지는 기준. */
  lowLight: boolean;
}

/** 시간대와 무관하게 유지되는 마을 색 — 그림의 성격을 만드는 축. */
const VILLAGE = {
  wall: ["#fbf3e4", "#f3c9c5", "#dfe9dc"] as [string, string, string],
  roof: ["#d9906b", "#cf8462"] as [string, string],
  outline: "#b5a189",
};

const BASE: Record<TimeOfDay, Palette> = {
  dawn: {
    skyTop: "#e3dbee",
    skyMid: "#f6e3dc",
    skyBottom: "#fdf2e8",
    haze: "#fef7ee",
    luminary: "#fbeacb",
    luminaryGlow: "#f8d9b4",
    far: "#d8c8d3",
    mid: "#bfa9bb",
    near: "#c9b79f",
    ground: "#e3d5c6",
    water: "#a3b3cc",
    figure: "#97848f",
    glow: "#f6e2c5",
    ...VILLAGE,
    tint: "#f7d9c2",
    tintAlpha: 0.04,
    particle: "#e9e2f0",
    stars: false,
    lowLight: true,
  },
  day: {
    skyTop: "#d6e7f1",
    skyMid: "#eaf2f6",
    skyBottom: "#f7f3ee",
    haze: "#fdfcfb",
    luminary: "#f6e2c5",
    luminaryGlow: "#f9edd6",
    far: "#cbdae2",
    mid: "#a7c2d3",
    near: "#c9b79f",
    ground: "#dfd2bf",
    water: "#a7c2d3",
    figure: "#9b8590",
    glow: "#f6e2c5",
    ...VILLAGE,
    tint: "#f7efdc",
    tintAlpha: 0.03,
    particle: "#dbe8f0",
    stars: false,
    lowLight: false,
  },
  dusk: {
    skyTop: "#cfc0d8",
    skyMid: "#f0c8b6",
    skyBottom: "#fadcc4",
    haze: "#fdeadc",
    luminary: "#f9d9a8",
    luminaryGlow: "#f5b892",
    far: "#d2b2b5",
    mid: "#b79299",
    near: "#a8838c",
    ground: "#d9c3b7",
    water: "#c0959c",
    figure: "#8a7581",
    glow: "#f6d29a",
    ...VILLAGE,
    tint: "#f6b78d",
    tintAlpha: 0.05,
    particle: "#f3ded0",
    stars: false,
    lowLight: true,
  },
  night: {
    skyTop: "#cbc6dc",
    skyMid: "#dad6e7",
    skyBottom: "#e9e6ef",
    haze: "#f1eff5",
    luminary: "#f6e2c5",
    luminaryGlow: "#f8ecd4",
    far: "#aca5bd",
    mid: "#8ea6bd",
    near: "#8d8397",
    ground: "#b3a9ba",
    water: "#8ea6bd",
    figure: "#88808f",
    glow: "#f6e2c5",
    ...VILLAGE,
    tint: "#b9b0d2",
    tintAlpha: 0.06,
    particle: "#bdb5cd",
    stars: true,
    lowLight: true,
  },
};

/** 감정은 색을 갈아엎지 않고 아주 얇게 덮어 성격만 바꾼다. */
const MOOD_TINT: Record<Mood, { tint: string; alpha: number }> = {
  calm: { tint: "#cfe0e8", alpha: 0.05 },
  warm: { tint: "#f8d9c0", alpha: 0.09 },
  sad: { tint: "#cdd4e6", alpha: 0.09 },
  tense: { tint: "#e7c2bc", alpha: 0.1 },
  mystic: { tint: "#ddd2ec", alpha: 0.11 },
  bright: { tint: "#fdf0cf", alpha: 0.08 },
};

export function getPalette(time: TimeOfDay, mood: Mood): Palette {
  const base = BASE[time];
  const mod = MOOD_TINT[mood];
  return {
    ...base,
    tint: mod.tint,
    // 파스텔 위에 틴트를 두껍게 올리면 금방 탁해진다. 상한을 낮게 둔다.
    tintAlpha: Math.min(0.14, base.tintAlpha + mod.alpha),
  };
}

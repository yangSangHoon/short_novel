import {
  CROWD_WORDS,
  MOOD_WORDS,
  PERSON_WORDS,
  PLACE_WORDS,
  PROPS,
  PROP_WORDS,
  TIME_WORDS,
  WEATHER_WORDS,
  type Mood,
  type Place,
  type Prop,
  type TimeOfDay,
  type Weather,
} from "./lexicon";
import type { SceneOverride } from "../types";

export interface SceneSpec {
  place: Place;
  time: TimeOfDay;
  weather: Weather;
  mood: Mood;
  /** 실루엣으로 그릴 인물 수 (0–3). */
  characters: number;
  props: Prop[];
  /** 군중 실루엣을 배경에 깔지 여부. */
  crowd: boolean;
  seed: number;
  /** 자동 추론으로 정해진 항목 — UI에서 "자동" 배지를 붙이는 데 쓴다. */
  inferred: Record<"place" | "time" | "weather" | "mood" | "characters", boolean>;
}

const JOSA = "이가은는을를에의와과도만로랑";
const BOUNDARY = `[${JOSA}\\s.,!?"'”’)…\\]]`;

/** 한 글자짜리 한국어 키워드는 조사/공백이 뒤따를 때만 인정한다 ("비" vs "비밀"). */
function countMatches(text: string, word: string): number {
  if (!word) return 0;
  const isSingleHangul = word.length === 1 && /[가-힣]/.test(word);
  const pattern = isSingleHangul
    ? new RegExp(`${word}(?=${BOUNDARY}|$)`, "g")
    : new RegExp(escapeRegExp(word), "g");
  return text.match(pattern)?.length ?? 0;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scoreDict<T extends string>(
  text: string,
  dict: Record<T, string[]>,
): { winner: T | null; scores: Record<string, number> } {
  const scores: Record<string, number> = {};
  let winner: T | null = null;
  let best = 0;
  for (const key of Object.keys(dict) as T[]) {
    let score = 0;
    for (const word of dict[key]) {
      // 긴 키워드일수록 우연히 걸릴 확률이 낮으니 가중치를 더 준다.
      score += countMatches(text, word) * (word.length > 2 ? 1.4 : 1);
    }
    scores[key] = score;
    if (score > best) {
      best = score;
      winner = key;
    }
  }
  return { winner, scores };
}

/** 문자열 → 32비트 해시. 같은 글은 항상 같은 그림이 되도록 하는 근거. */
export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** 시드 기반 난수 (mulberry32) — 같은 시드면 언제나 같은 수열. */
export function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function estimateCharacters(text: string): number {
  // 대사 한 줄은 말하는 사람이 최소 한 명 있다는 뜻이다.
  const quotes = (text.match(/["“”']/g)?.length ?? 0) / 2;
  const dialogueLines = text.match(/^\s*[-–—]\s?\S/gm)?.length ?? 0;

  let people = 0;
  for (const word of PERSON_WORDS) {
    if (countMatches(text, word) > 0) people += 1;
  }

  const estimate = Math.max(
    people > 0 ? 1 : 0,
    quotes >= 2 ? 2 : quotes >= 1 ? 1 : 0,
    dialogueLines >= 2 ? 2 : dialogueLines >= 1 ? 1 : 0,
    people >= 4 ? 3 : people >= 2 ? 2 : 0,
  );
  return Math.min(3, estimate);
}

const FALLBACK_PLACES: Place[] = ["field", "room", "road", "forest", "city"];

/**
 * 본문을 읽어 장면 명세를 만든다.
 * 키워드가 하나도 안 잡히면 해시로 정해진 무난한 장면을 돌려주되,
 * 같은 글에는 언제나 같은 결과가 나온다.
 */
export function analyzeScene(
  text: string,
  seed: number,
  override?: Partial<SceneOverride>,
): SceneSpec {
  const source = text.toLowerCase();
  const textSeed = hashString(text.trim() || "empty") ^ Math.imul(seed, 0x9e3779b1);
  const random = makeRandom(textSeed);

  const place = scoreDict(source, PLACE_WORDS);
  const time = scoreDict(source, TIME_WORDS);
  const weather = scoreDict(source, WEATHER_WORDS);
  const mood = scoreDict(source, MOOD_WORDS);

  const resolvedPlace =
    (override?.place as Place) ??
    place.winner ??
    FALLBACK_PLACES[Math.floor(random() * FALLBACK_PLACES.length)];

  // 실내는 날씨를 크게 드러내지 않는다 — 창밖 정도로만 남긴다.
  const indoor = resolvedPlace === "room" || resolvedPlace === "cafe";

  const props: Prop[] = [];
  for (const prop of PROPS) {
    let hits = 0;
    for (const word of PROP_WORDS[prop]) hits += countMatches(source, word);
    if (hits > 0) props.push(prop);
  }

  const characters = override?.characters ?? estimateCharacters(text);

  return {
    place: resolvedPlace,
    time: (override?.time as TimeOfDay) ?? time.winner ?? (random() > 0.6 ? "dusk" : "day"),
    weather: (override?.weather as Weather) ?? weather.winner ?? "clear",
    mood: (override?.mood as Mood) ?? mood.winner ?? "calm",
    characters,
    // 소품이 너무 많으면 화면이 시끄러워진다. 앞의 세 개만 쓴다.
    props: props.slice(0, 3),
    crowd: !indoor && CROWD_WORDS.some((word) => countMatches(source, word) > 0),
    seed: textSeed,
    inferred: {
      place: override?.place === undefined,
      time: override?.time === undefined,
      weather: override?.weather === undefined,
      mood: override?.mood === undefined,
      characters: override?.characters === undefined,
    },
  };
}

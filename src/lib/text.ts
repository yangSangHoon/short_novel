/** 공백을 제외한 글자 수 — 원고 분량의 기준. */
export function countChars(text: string): number {
  return text.replace(/\s/g, "").length;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** 한국어 기준 분당 500자 정도로 잡은 예상 읽기 시간(분). */
export function readingMinutes(text: string): number {
  return Math.max(1, Math.round(countChars(text) / 500));
}

/**
 * 긴 원고를 페이지 단위로 쪼갠다.
 * 문단을 최우선으로 보존하고, 한 문단이 통째로 너무 길면 문장 단위로 나눈다.
 */
export function splitIntoPages(text: string, target = 320): string[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return [];

  const pages: string[] = [];
  let buffer = "";

  const flush = () => {
    if (buffer.trim()) pages.push(buffer.trim());
    buffer = "";
  };

  for (const paragraph of paragraphs) {
    for (const chunk of splitLongParagraph(paragraph, target)) {
      const candidate = buffer ? `${buffer}\n\n${chunk}` : chunk;
      if (candidate.length > target * 1.35 && buffer) {
        flush();
        buffer = chunk;
      } else {
        buffer = candidate;
      }
    }
  }
  flush();
  return pages;
}

function splitLongParagraph(paragraph: string, target: number): string[] {
  if (paragraph.length <= target * 1.35) return [paragraph];

  // 문장 끝(. ! ? …)과 닫는 따옴표까지 한 덩어리로 본다.
  const sentences = paragraph.match(/[^.!?…]+[.!?…]*["'”’)]*\s*/g) ?? [paragraph];
  const chunks: string[] = [];
  let buffer = "";
  for (const sentence of sentences) {
    if (buffer.length + sentence.length > target && buffer) {
      chunks.push(buffer.trim());
      buffer = sentence;
    } else {
      buffer += sentence;
    }
  }
  if (buffer.trim()) chunks.push(buffer.trim());
  return chunks;
}

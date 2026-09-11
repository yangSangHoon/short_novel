/** 짧고 충돌 가능성이 낮은 로컬 ID. */
export function createId(prefix = ""): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}${time}${rand}`;
}

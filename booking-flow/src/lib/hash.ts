/** Stable positive int from string for seeded RNG. */
export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  const u = h >>> 0;
  return u === 0 ? 1 : u;
}

// 种子化 RNG：FNV-1a 32 位哈希 + mulberry32 PRNG
// 同一 puzzleId 永远产出同一条浮点流（每日同题种子局的地基）。
// @impl M02.F02.I01 — fnv1a/mulberry32/createDailyRng（function-tree M02.F02）

/** FNV-1a 32 位哈希（offset 2166136261 / prime 16777619，Math.imul 保 u32 语义） */
export function fnv1a(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  // 转无符号 32 位
  return hash >>> 0;
}

/** mulberry32：u32 状态，返回 [0,1) 浮点流 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 每日同题种子 RNG：等价 mulberry32(fnv1a("#" + puzzleId)) */
export function createDailyRng(puzzleId: string): () => number {
  return mulberry32(fnv1a("#" + puzzleId));
}

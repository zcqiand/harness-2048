/** 每日题号：UTC+8 日界（凌晨零点换题），同一天全球同题。 */

/** 把时刻归到 UTC+8 日界，产出 YYYYMMDD 题号（无横线）。 */
export function puzzleIdFor(date: Date): string {
  const shifted = new Date(date.getTime() + 8 * 3600_000);
  return shifted.toISOString().slice(0, 10).replace(/-/g, "");
}

/** 当前时刻的题号（= puzzleIdFor(new Date())）。 */
export function currentPuzzleId(): string {
  return puzzleIdFor(new Date());
}

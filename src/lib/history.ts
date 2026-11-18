/** 本地成绩册与续玩态：localStorage 注入式读写（测试传假件），损坏 JSON 回退空值不抛。 */

import { DIRECTIONS } from "./contract";
import type { Direction } from "./contract";
import { puzzleIdFor } from "./daily";

/** 一天的完赛记录（每天至多一条，按 puzzleId upsert）。 */
export interface RunRecord {
  puzzleId: string;
  score: number;
  maxTile: number;
  moves: Direction[];
  finishedAt: number;
}

/** 续玩态：某题号已走的步日志。 */
export interface SavedRun {
  puzzleId: string;
  moves: Direction[];
}

const RECORDS_KEY = "h2048.v1.records";
const RUN_KEY = "h2048.v1.run";
const WIN_SEEN_KEY = "h2048.v1.winseen";

/** 读 + JSON.parse，缺失/损坏一律回 null，绝不抛。 */
function readJson<T>(storage: Storage, key: string): T | null {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** 全量成绩册；键缺失或 JSON 损坏回空数组。 */
export function loadRecords(storage: Storage): RunRecord[] {
  const v = readJson<RunRecord[]>(storage, RECORDS_KEY);
  return Array.isArray(v) ? v : [];
}

/** 按 puzzleId upsert：同题旧记录被新记录替换，不产生第二条。 */
export function saveRecord(storage: Storage, rec: RunRecord): void {
  const records = loadRecords(storage).filter((r) => r.puzzleId !== rec.puzzleId);
  records.push(rec);
  storage.setItem(RECORDS_KEY, JSON.stringify(records));
}

/** 历史最高分；空册=0。 */
export function bestScore(records: RunRecord[]): number {
  return records.reduce((m, r) => Math.max(m, r.score), 0);
}

/**
 * 连续完赛天数：锚=今天已完赛则今天，否则昨天（今天未完赛不断签）；
 * 从锚按题号逐日回溯，断日清零。题号经 puzzleIdFor 归一，与记录存储键同源。
 */
export function streak(records: RunRecord[], today: Date): number {
  const done = new Set(records.map((r) => r.puzzleId));
  const todayId = puzzleIdFor(today);
  let cursor = today.getTime();
  if (!done.has(todayId)) cursor -= 24 * 3600_000;
  let count = 0;
  while (done.has(puzzleIdFor(new Date(cursor)))) {
    count++;
    cursor -= 24 * 3600_000;
  }
  return count;
}

/** 读续玩态；缺失/损坏回 null。moves 存在但含非法方向元素同样回 null（replay 会抛白屏）。 */
export function loadRun(storage: Storage): SavedRun | null {
  const v = readJson<SavedRun>(storage, RUN_KEY);
  if (v === null || typeof v !== "object") return null;
  if (typeof v.puzzleId !== "string" || !Array.isArray(v.moves)) return null;
  if (!v.moves.every((m) => DIRECTIONS.includes(m))) return null;
  return v;
}

/** 覆写续玩态。 */
export function saveRun(storage: Storage, run: SavedRun): void {
  storage.setItem(RUN_KEY, JSON.stringify(run));
}

/** 清除续玩态（完赛/新局时调用）。 */
export function clearRun(storage: Storage): void {
  storage.removeItem(RUN_KEY);
}

/** 记「今日胜利横幅已看过」：存当日题号，横幅一次性。 */
export function saveWinSeen(storage: Storage, puzzleId: string): void {
  storage.setItem(WIN_SEEN_KEY, JSON.stringify(puzzleId));
}

/** 当日是否已看过横幅（题号不同=未看过）；缺失/损坏回 null。 */
export function loadWinSeen(storage: Storage): string | null {
  const v = readJson<string>(storage, WIN_SEEN_KEY);
  return typeof v === "string" ? v : null;
}

/** 完赛记录形状守卫：loadRecords 只验数组不验单条，缺 moves/score、moves 含非法元素的畸形记录会在渲染层抛 TypeError 白屏——读册后过滤一次，渲染层只见良构记录。 */

import { DIRECTIONS } from "./lib/contract";
import type { RunRecord } from "./lib/history";

/** 单条记录形状判定：题号/分数/最大块为数值串型、步日志为全合法方向的数组，缺一即畸形。 */
export function isWellFormedRecord(r: unknown): r is RunRecord {
  if (typeof r !== "object" || r === null) return false;
  const rec = r as Partial<RunRecord>;
  return (
    typeof rec.puzzleId === "string" &&
    typeof rec.score === "number" &&
    typeof rec.maxTile === "number" &&
    Array.isArray(rec.moves) &&
    rec.moves.every((m) => DIRECTIONS.includes(m))
  );
}

/** 全量过滤：剔除畸形记录，保持原有顺序（渲染层与 streak/bestScore 均只吃良构记录）。 */
export function sanitizeRecords(records: RunRecord[]): RunRecord[] {
  return records.filter(isWellFormedRecord);
}

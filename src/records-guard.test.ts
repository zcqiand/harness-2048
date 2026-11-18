/** 形状守卫回归：缺 moves/score 的损坏记录（旧版写入/手改 localStorage）不得进渲染层。 */

import { describe, expect, it } from "vitest";
import type { Direction } from "./lib/contract";
import type { RunRecord } from "./lib/history";
import { isWellFormedRecord, sanitizeRecords } from "./records-guard";

function rec(overrides: Partial<RunRecord>): RunRecord {
  return {
    puzzleId: "20261118",
    score: 1024,
    maxTile: 128,
    moves: ["up", "left"] as Direction[],
    finishedAt: 1700000000000,
    ...overrides,
  };
}

describe("isWellFormedRecord", () => {
  it("良构记录判定通过", () => {
    expect(isWellFormedRecord(rec({}))).toBe(true);
  });

  it("缺 moves 的损坏记录判定不过（白屏事故回归）", () => {
    const broken = rec({}) as Partial<RunRecord>;
    delete broken.moves;
    expect(isWellFormedRecord(broken)).toBe(false);
  });

  it("缺 score / 缺 puzzleId / 缺 maxTile 均判定不过", () => {
    const noScore = rec({}) as Partial<RunRecord>;
    delete noScore.score;
    const noId = rec({}) as Partial<RunRecord>;
    delete noId.puzzleId;
    const noMax = rec({}) as Partial<RunRecord>;
    delete noMax.maxTile;
    expect(isWellFormedRecord(noScore)).toBe(false);
    expect(isWellFormedRecord(noId)).toBe(false);
    expect(isWellFormedRecord(noMax)).toBe(false);
  });

  it("moves 非数组（如被改写成字符串）判定不过", () => {
    expect(isWellFormedRecord(rec({ moves: "upleft" as unknown as Direction[] }))).toBe(false);
  });

  it("非对象/null 判定不过", () => {
    expect(isWellFormedRecord(null)).toBe(false);
    expect(isWellFormedRecord(42)).toBe(false);
  });
});

describe("sanitizeRecords", () => {
  it("混合列表剔除畸形条目并保持原有顺序", () => {
    const broken = rec({ puzzleId: "20261117" }) as Partial<RunRecord>;
    delete broken.moves;
    const good1 = rec({ puzzleId: "20261115" });
    const good2 = rec({ puzzleId: "20261118" });
    const out = sanitizeRecords([good1, broken as RunRecord, good2]);
    expect(out).toEqual([good1, good2]);
  });

  it("空册与全畸形列表均回空数组不抛", () => {
    const broken = rec({}) as Partial<RunRecord>;
    delete broken.score;
    expect(sanitizeRecords([])).toEqual([]);
    expect(sanitizeRecords([broken as RunRecord])).toEqual([]);
  });
});

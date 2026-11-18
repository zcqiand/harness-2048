import { describe, expect, it } from "vitest";
import type { Direction } from "./contract";
import type { RunRecord } from "./history";
import {
  bestScore,
  clearRun,
  loadRecords,
  loadRun,
  loadWinSeen,
  saveRecord,
  saveRun,
  saveWinSeen,
  streak,
} from "./history";

/** 内存假件：与 Storage 同形状，构造函数接受预置内容（可塞坏 JSON）。 */
function fakeStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    length: map.size,
    clear: () => map.clear(),
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    key: (i: number) => ([...map.keys()][i] ?? null),
    removeItem: (k: string) => void map.delete(k),
    setItem: (k: string, v: string) => void map.set(k, v),
  } as Storage;
}

function rec(puzzleId: string, score = 100, moves: Direction[] = ["left"]): RunRecord {
  return { puzzleId, score, maxTile: 512, moves, finishedAt: 0 };
}

describe("history", () => {
  it("损坏 JSON 回退空数组不抛", () => {
    const storage = fakeStorage({ "h2048.v1.records": "not-json" });
    expect(loadRecords(storage)).toEqual([]);
  });

  it("saveRecord 按 puzzleId upsert，不重复", () => {
    const storage = fakeStorage();
    saveRecord(storage, rec("20261118", 100));
    saveRecord(storage, rec("20261118", 999));
    const records = loadRecords(storage);
    expect(records).toHaveLength(1);
    expect(records[0].score).toBe(999);
  });

  it("bestScore 空册=0，有册=最大", () => {
    expect(bestScore([])).toBe(0);
    expect(bestScore([rec("20261117", 300), rec("20261118", 1200)])).toBe(1200);
  });

  it("streak：17/18 两天完赛且今天 18=锚 → 2", () => {
    const records = [rec("20261117"), rec("20261118")];
    expect(streak(records, new Date("2026-11-18T12:00:00Z"))).toBe(2);
  });

  it("streak：16/17 完赛、18 未完赛 → 锚昨天=17 → 2（今天未完赛不断签）", () => {
    const records = [rec("20261116"), rec("20261117")];
    expect(streak(records, new Date("2026-11-18T12:00:00Z"))).toBe(2);
  });

  it("streak：16 完赛、17 断、18 完赛 → 1", () => {
    const records = [rec("20261116"), rec("20261118")];
    expect(streak(records, new Date("2026-11-18T12:00:00Z"))).toBe(1);
  });

  it("run 往返：saveRun→loadRun 一致；clearRun 后为 null", () => {
    const storage = fakeStorage();
    expect(loadRun(storage)).toBeNull();
    const run = { puzzleId: "20261118", moves: ["up", "left"] as Direction[] };
    saveRun(storage, run);
    expect(loadRun(storage)).toEqual(run);
    clearRun(storage);
    expect(loadRun(storage)).toBeNull();
  });

  it("winSeen 往返：saveWinSeen→loadWinSeen 一致；缺失/损坏回退 null", () => {
    const storage = fakeStorage();
    expect(loadWinSeen(storage)).toBeNull();
    saveWinSeen(storage, "20261118");
    expect(loadWinSeen(storage)).toBe("20261118");
    const broken = fakeStorage({ "h2048.v1.winseen": "{{bad" });
    expect(loadWinSeen(broken)).toBeNull();
  });
});

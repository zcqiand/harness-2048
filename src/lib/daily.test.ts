import { describe, expect, it } from "vitest";
import { currentPuzzleId, puzzleIdFor } from "./daily";

describe("puzzleIdFor", () => {
  it("UTC 16:00 前=前一天（UTC+8 已跨天）", () => {
    expect(puzzleIdFor(new Date("2026-11-18T15:59:00Z"))).toBe("20261118"); // +8 = 18 日 23:59
  });
  it("UTC 16:00 整=次日（UTC+8 已跨天）", () => {
    expect(puzzleIdFor(new Date("2026-11-18T16:00:00Z"))).toBe("20261119"); // +8 = 19 日 00:00
  });
});

describe("currentPuzzleId", () => {
  it("当前时刻题号 = puzzleIdFor(new Date())（导出无断言漏网回归）", () => {
    expect(currentPuzzleId()).toBe(puzzleIdFor(new Date()));
  });
});

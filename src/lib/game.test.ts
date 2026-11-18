import { describe, expect, it } from "vitest";
import { slideLine } from "./game";

describe("slideLine", () => {
  it("[2,2,2,2] → [4,4,0,0]，得 8 分（合并一次规则）", () => {
    const r = slideLine([2, 2, 2, 2]);
    expect(r.line).toEqual([4, 4, 0, 0]);
    expect(r.gained).toBe(8);
  });
  it("[0,2,0,2] → [4,0,0,0]，得 4 分", () => {
    const r = slideLine([0, 2, 0, 2]);
    expect(r.line).toEqual([4, 0, 0, 0]);
    expect(r.gained).toBe(4);
  });
  it("[4,2,2,0] → [4,4,0,0]，得 4 分（不相邻同值不跨位合并）", () => {
    const r = slideLine([4, 2, 2, 0]);
    expect(r.line).toEqual([4, 4, 0, 0]);
    expect(r.gained).toBe(4);
  });
  it("[2,0,0,0] → [2,0,0,0]，得 0 分", () => {
    const r = slideLine([2, 0, 0, 0]);
    expect(r.line).toEqual([2, 0, 0, 0]);
    expect(r.gained).toBe(0);
  });
});

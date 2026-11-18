import { describe, expect, it } from "vitest";
import { createDailyRng, fnv1a, mulberry32 } from "./rng";

describe("fnv1a", () => {
  it("同串同哈希，异串异哈希", () => {
    expect(fnv1a("20261118")).toBe(fnv1a("20261118"));
    expect(fnv1a("20261118")).not.toBe(fnv1a("20261119"));
  });
});

describe("mulberry32", () => {
  it("同种子流逐位一致", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });
  it("输出落在 [0,1)", () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("createDailyRng", () => {
  it("同题号同流，异题号异流", () => {
    const a = createDailyRng("20261118");
    const b = createDailyRng("20261118");
    const c = createDailyRng("20261119");
    expect(a()).toBe(b());
    expect(a()).not.toBe(c());
  });
});

import { describe, expect, it } from "vitest";
import {
  applyMove,
  initialState,
  isDead,
  maxTile,
  pickSpawnValue,
  replay,
  slideLine,
} from "./game";
import type { GameState } from "./game";
import type { Direction } from "./contract";
import { createDailyRng } from "./rng";

/** 固定题号：本文件全部引擎测试共用。 */
const PID = "20261118";

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

describe("applyMove/replay", () => {
  it("确定性：同题号同走子序列，最终局面与分数一致", () => {
    // 手探可行序列（当题种子下每步均有效且有生成）：left,up,right,down,left
    const moves: Direction[] = ["left", "up", "right", "down", "left"];
    let a = initialState(PID);
    for (const d of moves) a = applyMove(a, d, PID).state;
    const b = replay(PID, moves);
    expect(a.cells).toEqual(b.cells);
    expect(a.score).toBe(b.score);
    expect(a.spawns).toBe(b.spawns);
    // 同步钉住当日种子的确定性值（探针实测）：score=16、最大方块=8
    expect(b.score).toBe(16);
    expect(maxTile(b)).toBe(8);
  });

  it("无效移动不进日志：moved=false、cells/score/spawns 不变", () => {
    // 探针实测：当题种子下前 3 步 left 均有效；走完路径 left,left,left 后再 left 无效
    let s = initialState(PID);
    for (const d of ["left", "left", "left"] as Direction[]) s = applyMove(s, d, PID).state;
    const cells = s.cells;
    const score = s.score;
    const spawns = s.spawns;
    const r = applyMove(s, "left", PID);
    expect(r.moved).toBe(false);
    expect(r.state.cells).toEqual(cells);
    expect(r.state.score).toBe(score);
    expect(r.state.spawns).toBe(spawns);
  });

  it("悔棋=日志前缀重放：replay(prefix) 与逐步步进到该步的状态一致", () => {
    // 手探六步全有效的序列
    const moves: Direction[] = ["left", "up", "right", "down", "left", "up"];
    const states: GameState[] = [initialState(PID)];
    for (const d of moves) {
      states.push(applyMove(states[states.length - 1], d, PID).state);
    }
    const prefix = replay(PID, moves.slice(0, 4));
    expect(prefix.cells).toEqual(states[4].cells);
    expect(prefix.score).toBe(states[4].score);
    expect(prefix.spawns).toBe(states[4].spawns);
  });

  it("满板可合并=可动；满板无相邻同值=dead", () => {
    const mergeable = [
      [2, 2, 4, 4],
      [2, 2, 4, 4],
      [2, 2, 4, 4],
      [2, 2, 4, 4],
    ];
    expect(isDead(mergeable)).toBe(false);
    const stuck = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(isDead(stuck)).toBe(true);
  });

  it("长局重放：2000 步 replay 与逐步步进一致且 <100ms", () => {
    // repeating [left,up,right,down]：当题种子下 149 步即 dead；此后补满到 2000 步
    // （dead 后各向均为无效步=原地区，replay/步进两侧同语义，等价性覆盖到死局尾巴）
    const cycle: Direction[] = ["left", "up", "right", "down"];
    const moves: Direction[] = [];
    let s = initialState(PID);
    while (moves.length < 2000 && !s.dead) {
      const d = cycle[moves.length % 4];
      s = applyMove(s, d, PID).state;
      moves.push(d);
    }
    while (moves.length < 2000) moves.push(cycle[moves.length % 4]);
    expect(moves.length).toBe(2000);
    expect(s.dead).toBe(true);
    const t0 = performance.now();
    const r = replay(PID, moves);
    const elapsed = performance.now() - t0;
    expect(r.cells).toEqual(s.cells);
    expect(r.score).toBe(s.score);
    expect(r.spawns).toBe(s.spawns);
    expect(r.dead).toBe(s.dead);
    expect(elapsed).toBeLessThan(100);
  });

  it("生成权重 9:1：固定种子下连续 2000 次生成里 2 明显占多数（>1600）", () => {
    // 直接驱动内部生成路径 pickSpawnValue（与 applyMove 生成同一取流表达式）
    const rng = createDailyRng(PID);
    const N = 2000;
    let twos = 0;
    for (let i = 0; i < N; i++) if (pickSpawnValue(rng) === 2) twos++;
    expect(twos).toBeGreaterThan(1600);
  });
});

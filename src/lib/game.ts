/** 棋盘滑动/合并纯逻辑 + 整盘游戏引擎（GameState/applyMove/replay/isDead/maxTile）。 */

import { emptyBoard } from "./board";
import { SPAWN_VALUES, WIN_TILE } from "./contract";
import type { Direction } from "./contract";
import { createDailyRng } from "./rng";

/** 棋盘滑动/合并纯逻辑——单行滑动合并。 */

/** 单行左滑动：非零压左 → 相邻同值合并一次 → 右侧补零。gained = 合并产生值之和。 */
export function slideLine(line: number[]): { line: number[]; gained: number } {
  const tiles = line.filter((v) => v !== 0);
  const out: number[] = [];
  let gained = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
      const merged = tiles[i] * 2;
      out.push(merged);
      gained += merged;
      i++; // 合并一次规则：被合并的partner不再参与
    } else {
      out.push(tiles[i]);
    }
  }
  while (out.length < line.length) {
    out.push(0);
  }
  return { line: out, gained };
}

// ---------------------------------------------------------------------------
// 整盘游戏引擎
// ---------------------------------------------------------------------------

/** 游戏状态。cells 行=列序（cells[r][c]），0=空格。 */
export interface GameState {
  cells: number[][];
  score: number;
  /** 已发生的生成次数（initialState 即为 2）。 */
  spawns: number;
  /** 是否已达胜利方块（只翻转一次，达到后恒真）。 */
  won: boolean;
  /** 死局：满板且无横竖相邻同值。 */
  dead: boolean;
}

/** 生成值抽取（内部生成路径单步）：先值后位两次取流中的「取值」这一步。 */
export function pickSpawnValue(rng: () => number): 2 | 4 {
  return SPAWN_VALUES[Math.floor(rng() * SPAWN_VALUES.length)];
}

/** 在 cells 上生成一格：先值后位，各取流一次。cells 必须有空格。 */
function spawnInto(cells: number[][], rng: () => number): void {
  const empties: Array<[number, number]> = [];
  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      if (cells[r][c] === 0) empties.push([r, c]);
    }
  }
  const value = pickSpawnValue(rng);
  const [r, c] = empties[Math.floor(rng() * empties.length)];
  cells[r][c] = value;
}

/** 满板且无横竖相邻同值 = 死局。导出以便直测满板边界。 */
export function isDead(cells: number[][]): boolean {
  const n = cells.length;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      if (cells[r][c] === 0) return false;
      if (c + 1 < cells[r].length && cells[r][c] === cells[r][c + 1]) return false;
      if (r + 1 < n && cells[r][c] === cells[r + 1][c]) return false;
    }
  }
  return true;
}

function maxTileOf(cells: number[][]): number {
  let max = 0;
  for (const row of cells) {
    for (const v of row) {
      if (v > max) max = v;
    }
  }
  return max;
}

/** 当前局面最大方块值。 */
export function maxTile(state: GameState): number {
  return maxTileOf(state.cells);
}

/** 按方向提取第 i 条待滑线（left=原行；right=反转；up=取列；down=取列反转）。 */
function extractLine(cells: number[][], dir: Direction, i: number): number[] {
  switch (dir) {
    case "left":
      return cells[i].slice();
    case "right":
      return cells[i].slice().reverse();
    case "up":
      return cells.map((row) => row[i]);
    case "down":
      return cells.map((row) => row[i]).reverse();
  }
}

/** 把滑动结果按方向回注第 i 条线（与 extractLine 的方向语义互逆）。 */
function writeBackLine(cells: number[][], dir: Direction, i: number, line: number[]): void {
  const horizontal = dir === "left" || dir === "right";
  const reversed = dir === "right" || dir === "down";
  for (let k = 0; k < line.length; k++) {
    const idx = reversed ? line.length - 1 - k : k;
    if (horizontal) cells[i][idx] = line[k];
    else cells[idx][i] = line[k];
  }
}

/** 整盘单步滑动（不生成）：moved = 任一格位置或值变化。 */
function slideBoard(
  cells: number[][],
  dir: Direction,
): { cells: number[][]; gained: number; moved: boolean } {
  const n = cells.length;
  const next = cells.map((row) => row.slice());
  let gained = 0;
  for (let i = 0; i < n; i++) {
    const r = slideLine(extractLine(cells, dir, i));
    gained += r.gained;
    writeBackLine(next, dir, i, r.line);
  }
  let moved = false;
  outer: for (let r = 0; r < n; r++) {
    for (let c = 0; c < next[r].length; c++) {
      if (next[r][c] !== cells[r][c]) {
        moved = true;
        break outer;
      }
    }
  }
  return { cells: next, gained, moved };
}

/**
 * 连续流单步：rng 须已快进到本步起点（即消费了 spawns*2 次之后）。
 * 有效步消费流两次（先值后位）；无效步不消费——与 applyMove 的逐步
 * 「重建流 + 快进 spawns*2」逐位一致，因此连续流 replay 与逐步 applyMove 等价。
 */
function advance(state: GameState, dir: Direction, rng: () => number): { state: GameState; moved: boolean } {
  const m = slideBoard(state.cells, dir);
  if (!m.moved) return { state, moved: false };
  spawnInto(m.cells, rng);
  return {
    state: {
      cells: m.cells,
      score: state.score + m.gained,
      spawns: state.spawns + 1,
      won: state.won || maxTileOf(m.cells) >= WIN_TILE,
      dead: isDead(m.cells),
    },
    moved: true,
  };
}

/** 初始局面：空盘 + 连续两次生成，spawns=2。 */
export function initialState(puzzleId: string): GameState {
  const cells = emptyBoard();
  const rng = createDailyRng(puzzleId);
  spawnInto(cells, rng);
  spawnInto(cells, rng);
  return { cells, score: 0, spawns: 2, won: false, dead: isDead(cells) };
}

/** 一条快进到 state 当前流位置（spawns*2 次消费后）的同题号 rng 流。 */
function fastForwardedRng(state: GameState, puzzleId: string): () => number {
  const rng = createDailyRng(puzzleId);
  for (let i = 0; i < state.spawns * 2; i++) rng();
  return rng;
}

/**
 * 走一步：内部用 createDailyRng(puzzleId) 重建流并快进 spawns*2 次后取生成
 * ——与 replay 同一条生成路径。无效步返回原 state（cells/score/spawns 均不变）。
 */
export function applyMove(
  state: GameState,
  dir: Direction,
  puzzleId: string,
): { state: GameState; moved: boolean } {
  return advance(state, dir, fastForwardedRng(state, puzzleId));
}

/**
 * 从 initialState 起按日志重放（忽略无效步）。
 * 内部走单条连续 rng 流：initialState 两次生成消费 4 次，此后每有效步消费 2 次
 * ——与逐步 applyMove 的「快进 spawns*2」逐位一致，同种子即同序列，语义等价。
 */
export function replay(puzzleId: string, moves: Direction[]): GameState {
  let state = initialState(puzzleId);
  const rng = fastForwardedRng(state, puzzleId);
  for (const dir of moves) {
    state = advance(state, dir, rng).state;
  }
  return state;
}

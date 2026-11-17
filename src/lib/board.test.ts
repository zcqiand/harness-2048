import { describe, expect, it } from "vitest";
import { GRID_SIZE, emptyBoard } from "./board";

describe("emptyBoard", () => {
  it("返回 4×4 网格", () => {
    const board = emptyBoard();
    expect(board).toHaveLength(GRID_SIZE);
    for (const row of board) expect(row).toHaveLength(GRID_SIZE);
  });

  it("空板全为 0", () => {
    for (const row of emptyBoard()) {
      for (const cell of row) expect(cell).toBe(0);
    }
  });
});

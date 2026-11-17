/** 棋盘纯逻辑模块——骨架层：尺寸常量与空板派生。滑动/合并规则随 ch7 灌入。 */

export const GRID_SIZE = 4;

/** 空棋盘：全 0 的 4×4 网格（0=空格）。 */
export function emptyBoard(): number[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => 0),
  );
}

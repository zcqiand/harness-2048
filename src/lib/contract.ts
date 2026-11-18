/** 规则契约——2048 游戏的常量与类型单源。引擎（game.ts）在此契约之上实现。 */

import { GRID_SIZE } from "./board";

/** 胜利目标方块值。 */
export const WIN_TILE = 2048;

/** 新方块生成值表：十项权重，九张 2 一张 4（抽取概率 2=90%，4=10%）。 */
export const SPAWN_VALUES: readonly (2 | 4)[] = [
  2, 2, 2, 2, 2, 2, 2, 2, 2, 4,
] as const;

/** 全部滑动方向。 */
export const DIRECTIONS = ["up", "down", "left", "right"] as const;

/** 滑动方向类型。 */
export type Direction = (typeof DIRECTIONS)[number];

/** 棋盘边长（re-export 自 board.ts，保持契约单源出口）。 */
export { GRID_SIZE };

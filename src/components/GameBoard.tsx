/** 棋盘组件：4×4 号外风网格。数字瓦片按值分档底色；滑动=整盘 120ms 微位移，合并/新生成=120ms 弹跳。 */
// @impl M05.F01.I02 — GameBoard 棋盘渲染（function-tree M05.F01）

import { useEffect, useRef } from "react";
import { GRID_SIZE } from "../lib/contract";
import type { Direction } from "../lib/contract";

/** 最近一次有效走子（seq=走子日志长度，作 animation 重触发 key）。 */
export interface BoardMove {
  dir: Direction;
  seq: number;
}

interface GameBoardProps {
  cells: number[][];
  lastMove: BoardMove | null;
}

export default function GameBoard({ cells, lastMove }: GameBoardProps) {
  // 上一帧局面：值发生变化的格位标记弹跳动画（首帧不弹，避免整盘齐跳）
  const prevRef = useRef<number[][] | null>(null);
  const prev = prevRef.current;
  const changed: boolean[] = [];
  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      changed[r * GRID_SIZE + c] = prev !== null && prev[r][c] !== cells[r][c];
    }
  }
  useEffect(() => {
    prevRef.current = cells;
  });

  const slideClass = lastMove === null ? "" : `board-slide-${lastMove.dir}`;
  // key 随步序变化重挂载网格，重触发整盘滑动动画
  const gridKey = lastMove === null ? "static" : String(lastMove.seq);

  return (
    <div className="board-frame" aria-label="board" role="grid">
      <div
        key={gridKey}
        className={`board-grid ${slideClass}`}
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
      >
        {cells.flatMap((row, r) =>
          row.map((v, c) => {
            if (v === 0) {
              return <div key={`${r}-${c}`} className="cell-empty" />;
            }
            return (
              <div
                key={`${r}-${c}`}
                data-v={v}
                className={`tile ${changed[r * GRID_SIZE + c] ? "tile-pop" : ""}`}
              >
                {v}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

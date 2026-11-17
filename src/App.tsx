import { GRID_SIZE, emptyBoard } from "./lib/board";

/** 页面壳：2048 棋盘骨架。滑动/合并逻辑随 ch7 章节灌入。 */
export default function App() {
  const board = emptyBoard();
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold mb-4">2048</h1>
      <p className="text-sm text-gray-500 mb-4">
        骨架壳：规则契约与滑动合并逻辑随章节灌入
      </p>
      <div
        aria-label="board"
        className="grid gap-2 bg-gray-300 p-2 rounded-lg border-4 border-gray-400"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 64px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 64px)`,
        }}
      >
        {board.flatMap((row, y) =>
          row.map((cell, x) => (
            <div
              key={`${x}-${y}`}
              className={
                cell === 0
                  ? "bg-gray-200 rounded"
                  : "bg-yellow-400 rounded font-bold flex items-center justify-center"
              }
            >
              {cell === 0 ? "" : cell}
            </div>
          )),
        )}
      </div>
    </main>
  );
}

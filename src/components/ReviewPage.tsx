/** 完赛回看页：标题「第 #YYYYMMDD 期 · 完赛」+ 最终盘面静态渲染 + 本局成绩 + 回放条步进。帧=replay 前缀派生（moves.slice(0, i) 重放），与逐步走子同一语义，不缓存不落盘。 */
// @impl M05.F02.I01 — ReviewPage 完赛回看页（function-tree M05.F02）

import { useState } from "react";
import GameBoard from "./GameBoard";
import ReplayBar from "./ReplayBar";
import { replay } from "../lib/game";
import type { RunRecord } from "../lib/history";

interface ReviewPageProps {
  puzzleId: string;
  record: RunRecord;
}

export default function ReviewPage({ puzzleId, record }: ReviewPageProps) {
  const [step, setStep] = useState(record.moves.length);
  // 帧取用直算：单条连续流重放前缀，千步量级毫秒级，无需缓存
  const frame = replay(puzzleId, record.moves.slice(0, step));

  return (
    <section className="review-page" aria-label="review-page">
      <h2 className="review-headline">第 #{puzzleId} 期 · 完赛</h2>
      <p className="review-meta">
        本局成绩 {record.score} 分 · 最大块 {record.maxTile} · 共 {record.moves.length} 步
      </p>
      <div className="board-wrap">
        <GameBoard cells={frame.cells} lastMove={null} />
      </div>
      <ReplayBar totalSteps={record.moves.length} step={step} onStep={setStep} />
      <p className="hint">拖滑条或逐步回看——同一道题怎么走的，就在这里</p>
    </section>
  );
}

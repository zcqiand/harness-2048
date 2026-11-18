/** 计分条：题号大字 + 当前分/个人最佳/连胜天数 + 悔棋按钮（局中可用）。 */

interface ScoreBarProps {
  puzzleId: string;
  score: number;
  best: number;
  streakDays: number;
  canUndo: boolean;
  onUndo: () => void;
}

export default function ScoreBar({ puzzleId, score, best, streakDays, canUndo, onUndo }: ScoreBarProps) {
  return (
    <section className="score-bar" aria-label="score-bar">
      <div className="puzzle-no" aria-label="puzzle-id">
        #{puzzleId}
      </div>
      <div className="score-box">
        <span className="score-label">当前分</span>
        <span className="score-value">{score}</span>
      </div>
      <div className="score-box">
        <span className="score-label">个人最佳</span>
        <span className="score-value">{best}</span>
      </div>
      <div className="score-box">
        <span className="score-label">连胜</span>
        <span className="score-value">{streakDays}</span>
      </div>
      <button type="button" className="undo-btn" onClick={onUndo} disabled={!canUndo}>
        悔棋
      </button>
    </section>
  );
}

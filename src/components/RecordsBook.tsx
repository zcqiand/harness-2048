/** 剪报成绩册：头部三指标（个人最佳/连胜/总局数）+ 历史完赛按题号倒序的剪报卡（题号/分数/最大块/步数）。 */

import { bestScore } from "../lib/history";
import type { RunRecord } from "../lib/history";

interface RecordsBookProps {
  records: RunRecord[];
  /** 连胜天数（App 侧按今日算好传入，与计分条同源）。 */
  streakDays: number;
}

export default function RecordsBook({ records, streakDays }: RecordsBookProps) {
  // 剪报按题号倒序贴册（puzzleId=YYYYMMDD 等长数字串，字典序即时间序）
  const clips = records.slice().sort((a, b) => b.puzzleId.localeCompare(a.puzzleId));

  return (
    <section className="records-book" aria-label="records-book">
      <h2 className="records-headline">剪报成绩册</h2>
      <div className="records-stats">
        <div className="score-box">
          <span className="score-label">个人最佳</span>
          <span className="score-value">{bestScore(records)}</span>
        </div>
        <div className="score-box">
          <span className="score-label">连胜</span>
          <span className="score-value">{streakDays}</span>
        </div>
        <div className="score-box">
          <span className="score-label">总局数</span>
          <span className="score-value">{records.length}</span>
        </div>
      </div>
      {clips.length === 0 ? (
        <p className="records-empty">册页空空——完赛一局即落剪报</p>
      ) : (
        <ul className="records-list">
          {clips.map((r) => (
            <li key={r.puzzleId} className="record-clip">
              <span className="clip-no">#{r.puzzleId}</span>
              <span className="clip-stat">{r.score} 分</span>
              <span className="clip-stat">最大块 {r.maxTile}</span>
              <span className="clip-stat">{r.moves.length} 步</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

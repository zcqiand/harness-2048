/** 回放条：滑条 0..N 步 + 上一步/下一步。只报步序，帧由父层按 replay 前缀派生——不写 localStorage、不碰进行中局面。 */

interface ReplayBarProps {
  /** 总步数（滑条上限=N）。 */
  totalSteps: number;
  /** 当前步序（0=初始盘面，N=终局）。 */
  step: number;
  /** 步进回调（父层负责夹取合法区间）。 */
  onStep: (step: number) => void;
}

export default function ReplayBar({ totalSteps, step, onStep }: ReplayBarProps) {
  return (
    <div className="replay-bar" aria-label="replay-bar">
      <button
        type="button"
        className="replay-btn"
        onClick={() => onStep(step - 1)}
        disabled={step <= 0}
        aria-label="replay-prev"
      >
        上一步
      </button>
      <input
        type="range"
        className="replay-slider"
        min={0}
        max={totalSteps}
        value={step}
        onChange={(e) => onStep(Number(e.target.value))}
        aria-label="replay-slider"
      />
      <button
        type="button"
        className="replay-btn"
        onClick={() => onStep(step + 1)}
        disabled={step >= totalSteps}
        aria-label="replay-next"
      >
        下一步
      </button>
      <span className="replay-step">
        {step} / {totalSteps}
      </span>
    </div>
  );
}

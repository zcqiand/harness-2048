/** 胜利横幅：合成 2048 首次达成弹一次的「号外」卡（弹次由 App 侧 winseen 保证）。合成非终态，关掉继续冲分。 */

interface WinBannerProps {
  puzzleId: string;
  onDismiss: () => void;
}

export default function WinBanner({ puzzleId, onDismiss }: WinBannerProps) {
  return (
    <div className="win-overlay" role="alertdialog" aria-label="victory-banner">
      <div className="win-card">
        <p className="win-extra">号外</p>
        <h2 className="win-headline">2048 达成！</h2>
        <p className="win-sub">
          第 #{puzzleId} 期 · 胜势已定，可继续冲分
        </p>
        <button type="button" className="win-btn" onClick={onDismiss}>
          继续冲分
        </button>
      </div>
    </div>
  );
}

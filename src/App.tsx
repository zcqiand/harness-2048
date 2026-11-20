/** 页面壳：对局状态机（进行中/完赛回看）——mount 恢复残局、键盘四向+触屏滑动走子、每步落续玩态、死局落册切回看（回放+剪报成绩册）。 */
// @impl M05.F01.I01 — App 对局状态机页面（function-tree M05.F01）

import { useCallback, useEffect, useRef, useState } from "react";
import GameBoard from "./components/GameBoard";
import type { BoardMove } from "./components/GameBoard";
import RecordsBook from "./components/RecordsBook";
import ReviewPage from "./components/ReviewPage";
import ScoreBar from "./components/ScoreBar";
import WinBanner from "./components/WinBanner";
import type { Direction } from "./lib/contract";
import { currentPuzzleId } from "./lib/daily";
import { applyMove, initialState, maxTile, replay } from "./lib/game";
import type { GameState } from "./lib/game";
import {
  bestScore,
  clearRun,
  loadRecords,
  loadRun,
  loadWinSeen,
  saveRecord,
  saveRun,
  saveWinSeen,
  streak,
} from "./lib/history";
import type { RunRecord } from "./lib/history";
import { sanitizeRecords } from "./records-guard";

type Phase = "playing" | "finished";

interface GameSnapshot {
  state: GameState;
  moves: Direction[];
}

interface Boot {
  phase: Phase;
  puzzleId: string;
  game: GameSnapshot;
  records: RunRecord[];
}

/**
 * 存储访问惰性化：存储被禁环境（隐私模式/企业策略/内嵌 webview）在模块求值期
 * 碰 window.localStorage 即抛 SecurityError 整页白屏——改首次使用时 try/catch，
 * 失败回内存假件（同 Storage 形状，会话内降级为不落盘，页面保持可用）。
 */
let memoryStorage: Storage | null = null;
function getStorage(): Storage {
  try {
    return window.localStorage;
  } catch {
    if (memoryStorage === null) {
      const map = new Map<string, string>();
      memoryStorage = {
        length: map.size,
        clear: () => map.clear(),
        getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
        key: (i: number) => [...map.keys()][i] ?? null,
        removeItem: (k: string) => void map.delete(k),
        setItem: (k: string, v: string) => void map.set(k, v),
      } as Storage;
    }
    return memoryStorage;
  }
}

/**
 * 读册 + 形状过滤：loadRecords 只验数组不验单条，缺 moves/score 或 moves 含
 * 非法方向元素的损坏记录会在渲染层抛 TypeError 白屏——守卫在此滤掉，
 * 所有消费点（回看页/成绩册/streak/best）只见良构记录。
 * 良构记录被滤后当日完赛记录理应存在；「成绩册加载异常」分支仅为将来
 * 写入路径异常的兜底，正常读册路径不可达。
 */
function loadSanitizedRecords(): RunRecord[] {
  return sanitizeRecords(loadRecords(getStorage()));
}

/**
 * mount 引导：有进行中残局（不论题号日，跨午夜残局继续）→replay 恢复；
 * 无残局→今日已完赛→完赛回看；否则新局。恢复出死局（上次关页前刚死）→立即落册收口。
 */
function bootstrap(): Boot {
  const records = loadSanitizedRecords();
  const run = loadRun(getStorage());
  if (run !== null) {
    const state = replay(run.puzzleId, run.moves);
    const game: GameSnapshot = { state, moves: run.moves };
    if (state.dead) {
      finalizeRun(run.puzzleId, state, run.moves);
      return {
        phase: "finished",
        puzzleId: run.puzzleId,
        game,
        records: loadSanitizedRecords(),
      };
    }
    return { phase: "playing", puzzleId: run.puzzleId, game, records };
  }
  const puzzleId = currentPuzzleId();
  if (records.some((r) => r.puzzleId === puzzleId)) {
    return {
      phase: "finished",
      puzzleId,
      game: { state: initialState(puzzleId), moves: [] },
      records,
    };
  }
  clearRun(getStorage()); // 新局前清残（含损坏态）
  return {
    phase: "playing",
    puzzleId,
    game: { state: initialState(puzzleId), moves: [] },
    records,
  };
}

/** 死局收口：成绩落册（按 puzzleId upsert）+ 清续玩态。 */
function finalizeRun(puzzleId: string, state: GameState, moves: Direction[]): void {
  saveRecord(getStorage(), {
    puzzleId,
    score: state.score,
    maxTile: maxTile(state),
    moves,
    finishedAt: Date.now(),
  });
  clearRun(getStorage());
}

const KEY_TO_DIR: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

/** 键盘四向 + 触屏滑动判向的最小位移（px）。 */
const SWIPE_THRESHOLD = 24;

export default function App() {
  const [boot] = useState(bootstrap);
  const [phase, setPhase] = useState<Phase>(boot.phase);
  const [puzzleId] = useState(boot.puzzleId);
  const [game, setGame] = useState<GameSnapshot>(boot.game);
  const [records, setRecords] = useState<RunRecord[]>(boot.records);
  const [lastMove, setLastMove] = useState<BoardMove | null>(null);
  const [showWin, setShowWin] = useState(false);

  // 走子处理读最新局面的镜像（handler 内同步计算，不在 updater 里做副作用）
  const gameRef = useRef(game);
  gameRef.current = game;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  /** 走一步：无效移动无副作用；有效步写续玩态；死局立即落册切完赛。 */
  const handleMove = useCallback(
    (dir: Direction) => {
      if (phaseRef.current !== "playing") return;
      const cur = gameRef.current;
      const { state: next, moved } = applyMove(cur.state, dir, puzzleId);
      if (!moved) return; // 无效移动不弹提示、不消耗生成
      const moves = [...cur.moves, dir];
      saveRun(getStorage(), { puzzleId, moves });
      setGame({ state: next, moves });
      setLastMove({ dir, seq: moves.length });
      if (next.dead) {
        finalizeRun(puzzleId, next, moves);
        setRecords(loadSanitizedRecords());
        setPhase("finished");
      }
    },
    [puzzleId],
  );

  /** 悔棋：走子日志弹末条 → replay 重放出完全相同的牌 → 续写续玩态。 */
  const handleUndo = useCallback(() => {
    if (phaseRef.current !== "playing") return;
    const cur = gameRef.current;
    if (cur.moves.length === 0) return;
    const moves = cur.moves.slice(0, -1);
    const state = replay(puzzleId, moves);
    saveRun(getStorage(), { puzzleId, moves });
    setGame({ state, moves });
    setLastMove(null);
  }, [puzzleId]);

  // 键盘四向（playing 才拦截；完赛回看页方向键让位浏览器滚页）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phaseRef.current !== "playing") return;
      const dir = KEY_TO_DIR[e.key];
      if (dir === undefined) return;
      e.preventDefault();
      handleMove(dir);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleMove]);

  // 触屏滑动（位移阈值 + 主轴判向；无效滑动不触发）
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }, []);
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (start === null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
      if (Math.abs(dx) > Math.abs(dy)) handleMove(dx > 0 ? "right" : "left");
      else handleMove(dy > 0 ? "down" : "up");
    },
    [handleMove],
  );

  // 胜利横幅：won 首次出现且当日未看过 → 弹一次；winseen 即刻落盘防刷新重弹
  useEffect(() => {
    if (phase !== "playing" || !game.state.won) return;
    if (loadWinSeen(getStorage()) === puzzleId) return;
    saveWinSeen(getStorage(), puzzleId);
    setShowWin(true);
  }, [phase, game.state.won, puzzleId]);

  const best = Math.max(
    bestScore(records),
    phase === "playing" ? game.state.score : 0,
  );
  const streakDays = streak(records, new Date());
  const playing = phase === "playing";
  // 完赛分支计分条与回看页同源：当日完赛成绩（落册记录），不是 initialState 快照的 0
  const finishedRecord = playing ? null : (records.find((r) => r.puzzleId === puzzleId) ?? null);

  return (
    <main className="page">
      <header>
        <p className="masthead-kicker">每日同题 · 种子局</p>
        <h1 className="masthead-title">2048 号外</h1>
      </header>

      <ScoreBar
        puzzleId={puzzleId}
        score={playing ? game.state.score : (finishedRecord?.score ?? 0)}
        best={best}
        streakDays={streakDays}
        canUndo={playing && game.moves.length > 0}
        onUndo={handleUndo}
      />

      {playing ? (
        <>
          <div
            className="board-wrap"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <GameBoard cells={game.state.cells} lastMove={lastMove} />
          </div>
          <p className="hint">方向键 / 触屏滑动走子 · 合成 2048 出号外可继续冲分</p>
        </>
      ) : finishedRecord !== null ? (
        <>
          <ReviewPage puzzleId={puzzleId} record={finishedRecord} />
          <RecordsBook records={records} streakDays={streakDays} />
        </>
      ) : (
        /* 纵深防御兜底：正常读册路径守卫滤畸形记录后本分支不可达——仅覆盖将来写入路径异常（写侧尚未净化）。 */
        <section className="finished-card">
          <h2 className="finished-headline">本日已完赛</h2>
          <p className="finished-sub">成绩册加载异常——请刷新页面</p>
        </section>
      )}

      {showWin && (
        <WinBanner puzzleId={puzzleId} onDismiss={() => setShowWin(false)} />
      )}
    </main>
  );
}

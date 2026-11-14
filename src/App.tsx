import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  Crosshair,
  Pause,
  Play,
  Shield,
  ShieldCheck,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CakeCanvas, CakeCanvasHandle } from './components/CakeCanvas';
import { GameOverlays } from './components/GameOverlays';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { INITIAL_CAKE_WIDTH, KAWAII_FLAVORS } from './constants/flavors';
import {
  GameRunSummary,
  GameStatus,
  LeaderboardEntry,
  LiveHudState,
  PowerUpType,
} from './types/game';
import {
  clearLeaderboard,
  getBestScore,
  getLeaderboard,
  getSavedNickname,
  saveLeaderboardEntry,
} from './utils/leaderboard';
import { bgmPlayer, soundFx } from './utils/sound';

const INITIAL_HUD: LiveHudState = {
  score: 0,
  floors: 0,
  combo: 0,
  maxCombo: 0,
  perfectCount: 0,
  currentWidth: INITIAL_CAKE_WIDTH,
  speedMultiplier: 1.0,
  currentFlavor: KAWAII_FLAVORS[0],
  nextFlavor: KAWAII_FLAVORS[1],
  powerUps: { autoAlign: 1, widen: 1, shield: 1 },
  shieldActive: false,
};

export default function App() {
  const canvasHandleRef = useRef<CakeCanvasHandle | null>(null);
  const [status, setStatus] = useState<GameStatus>('TITLE_MENU');
  const [runId, setRunId] = useState<number>(1);
  const [hud, setHud] = useState<LiveHudState>(INITIAL_HUD);
  const [lastSummary, setLastSummary] = useState<GameRunSummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() =>
    getLeaderboard()
  );
  const [bestScore, setBestScore] = useState<number>(() => getBestScore());
  const [savedNickname, setSavedNickname] = useState<string>(() =>
    getSavedNickname()
  );
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundFx.enabled = next;
      if (!next) {
        bgmPlayer.pause();
      } else if (status === 'PLAYING') {
        bgmPlayer.play(false);
      }
      return next;
    });
  };

  const handleStartGame = useCallback(() => {
    setShowLeaderboardModal(false);
    setLastSummary(null);
    setRunId((n) => n + 1);
    setStatus('PLAYING');
    if (soundEnabled) {
      bgmPlayer.play(true);
    }
  }, [soundEnabled]);

  const handleRestartGame = useCallback(() => {
    setShowLeaderboardModal(false);
    setLastSummary(null);
    setRunId((n) => n + 1);
    setStatus('PLAYING');
    if (soundEnabled) {
      bgmPlayer.play(true);
    }
  }, [soundEnabled]);

  const handleBackToTitle = useCallback(() => {
    setShowLeaderboardModal(false);
    setLastSummary(null);
    setRunId((n) => n + 1);
    setStatus('TITLE_MENU');
    bgmPlayer.stop();
  }, []);

  const handleGameOver = useCallback((summary: GameRunSummary) => {
    setLastSummary(summary);
    setStatus('GAME_OVER');
    bgmPlayer.stop();
  }, []);

  const handleSaveScore = useCallback(
    (nickname: string) => {
      if (!lastSummary) return;
      const updated = saveLeaderboardEntry({
        nickname,
        score: lastSummary.score,
        floors: lastSummary.floors,
        maxCombo: lastSummary.maxCombo,
      });
      setLeaderboard(updated);
      setBestScore(updated.length > 0 ? updated[0].score : 0);
      setSavedNickname(nickname.trim() || '甜點小廚師');
    },
    [lastSummary]
  );

  const handleClearLeaderboard = useCallback(() => {
    const empty = clearLeaderboard();
    setLeaderboard(empty);
    setBestScore(0);
  }, []);

  const triggerPowerUp = useCallback((type: PowerUpType) => {
    canvasHandleRef.current?.usePowerUp(type);
  }, []);

  // Sync background music with active game status (Playing / Paused / Ended)
  useEffect(() => {
    soundFx.enabled = soundEnabled;
    if (status === 'PLAYING' && soundEnabled) {
      bgmPlayer.play(false);
    } else if (status === 'PAUSED') {
      bgmPlayer.pause();
    } else if (status === 'TITLE_MENU' || status === 'GAME_OVER') {
      bgmPlayer.stop();
    }
  }, [status, soundEnabled]);

  useEffect(() => {
    return () => {
      bgmPlayer.stop();
    };
  }, []);

  // Keyboard pause shortcut (P / Escape)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (showLeaderboardModal) {
          setShowLeaderboardModal(false);
          return;
        }
        setStatus((prev) => {
          if (prev === 'PLAYING') return 'PAUSED';
          if (prev === 'PAUSED') return 'PLAYING';
          return prev;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showLeaderboardModal]);

  const widthPercent = Math.max(
    2,
    Math.round((hud.currentWidth / INITIAL_CAKE_WIDTH) * 100)
  );

  return (
    <div className="min-h-[100dvh] w-full bg-[#FFF9F5] text-[#4A353B] flex items-center justify-center lg:py-6 lg:px-6">
      <div className="w-full h-[100dvh] lg:h-auto lg:max-w-5xl grid grid-cols-1 lg:grid-cols-[auto_350px] lg:gap-8 items-center justify-center">
        {/* Game Stage Frame (aspect-protected so pixels never distort on any screen) */}
        <main className="relative w-[min(100vw,calc(100dvh*0.72),460px)] h-[100dvh] lg:h-[min(86dvh,700px)] lg:aspect-[380/640] lg:w-auto mx-auto overflow-hidden lg:rounded-3xl lg:border lg:border-[#F3DCE3] lg:shadow-xl bg-[#FFFBF7]">
          {/* Compact Top HUD */}
          <header className="absolute top-0 left-0 right-0 z-10 px-3.5 pt-3 pb-2 flex items-center justify-between gap-2 pointer-events-none">
            <div className="min-w-0 pointer-events-auto">
              {status === 'PLAYING' || status === 'PAUSED' ? (
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-[#4A353B] leading-none tabular-nums drop-shadow-[0_1px_0_rgba(255,255,255,0.9)]">
                    {hud.score.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-[#6B4C54] tabular-nums whitespace-nowrap">
                    {hud.floors} 層
                    {hud.combo > 0 && (
                      <>
                        <span aria-hidden="true" className="mx-1.5">·</span>
                        <span className="text-[#F43F7E] font-bold">
                          連擊 ×{hud.combo}
                        </span>
                      </>
                    )}
                  </span>
                </div>
              ) : (
                <span className="font-display text-sm font-bold text-[#6B4C54] whitespace-nowrap">
                  Kawaii Cake Stack
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
              <button
                type="button"
                onClick={toggleSound}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl bg-white/90 hover:bg-white text-[#6B4C54] border border-[#F3DCE3] backdrop-blur-sm shadow-xs transition-colors"
                aria-label={soundEnabled ? '關閉音樂與音效' : '開啟音樂與音效'}
                title={soundEnabled ? '關閉音樂與音效' : '開啟音樂與音效'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#F43F7E]" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>

              {status !== 'PLAYING' && status !== 'PAUSED' && (
                <button
                  type="button"
                  onClick={() => setShowLeaderboardModal(true)}
                  className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl bg-white/90 hover:bg-white text-[#6B4C54] border border-[#F3DCE3] backdrop-blur-sm shadow-xs transition-colors"
                  aria-label="開啟高分排行榜"
                >
                  <Trophy className="w-4 h-4 text-[#F59E0B]" />
                </button>
              )}

              {(status === 'PLAYING' || status === 'PAUSED') && (
                <button
                  type="button"
                  onClick={() =>
                    setStatus((prev) => (prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'))
                  }
                  className="min-h-[44px] px-3.5 flex items-center justify-center gap-1.5 rounded-2xl bg-white/95 hover:bg-white text-[#4A353B] border border-[#E8C5D0] backdrop-blur-sm shadow-sm text-xs font-bold transition-colors whitespace-nowrap shrink-0"
                  aria-label={status === 'PAUSED' ? '繼續遊戲' : '暫停遊戲'}
                >
                  {status === 'PAUSED' ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current text-[#F43F7E]" />
                      <span>繼續</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 text-[#F43F7E]" />
                      <span>暫停</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </header>

          {/* 2D Physics Canvas */}
          <CakeCanvas
            ref={canvasHandleRef}
            status={status}
            runId={runId}
            bestScore={bestScore}
            onHudChange={setHud}
            onGameOver={handleGameOver}
          />

          {/* First-drop subtle prompt */}
          {status === 'PLAYING' && hud.floors === 0 && (
            <div className="pointer-events-none absolute bottom-20 left-0 right-0 flex justify-center px-4">
              <p className="text-xs font-semibold text-[#6B4C54] bg-white/90 backdrop-blur-sm px-3.5 py-1.5 rounded-xl border border-[#F3DCE3] shadow-xs">
                點擊畫面任何空白處或按空白鍵放下蛋糕
              </p>
            </div>
          )}

          {/* Bottom Power-Up Bar (Thumb Zone) */}
          {status === 'PLAYING' && (
            <div className="absolute bottom-3 left-3 right-3 z-10 grid grid-cols-3 gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={() => triggerPowerUp('autoAlign')}
                disabled={hud.powerUps.autoAlign <= 0}
                className="min-h-[46px] px-2 py-1.5 rounded-2xl bg-white/92 hover:bg-white active:scale-[0.97] disabled:opacity-45 disabled:active:scale-100 border border-[#F3DCE3] shadow-sm backdrop-blur-sm flex items-center justify-center gap-1.5 text-xs font-bold text-[#4A353B] transition-all whitespace-nowrap"
                title="自動對齊並完美落下一層 (快捷鍵 1)"
              >
                <Crosshair className="w-4 h-4 text-[#D97706] shrink-0" />
                <span className="truncate">自動對齊</span>
                <span className="text-[11px] font-bold text-[#D97706] tabular-nums shrink-0">
                  ×{hud.powerUps.autoAlign}
                </span>
              </button>

              <button
                type="button"
                onClick={() => triggerPowerUp('widen')}
                disabled={hud.powerUps.widen <= 0}
                className="min-h-[46px] px-2 py-1.5 rounded-2xl bg-white/92 hover:bg-white active:scale-[0.97] disabled:opacity-45 disabled:active:scale-100 border border-[#F3DCE3] shadow-sm backdrop-blur-sm flex items-center justify-center gap-1.5 text-xs font-bold text-[#4A353B] transition-all whitespace-nowrap"
                title="增加目前蛋糕與頂層底座寬度 (快捷鍵 2)"
              >
                <ArrowLeftRight className="w-4 h-4 text-[#F43F7E] shrink-0" />
                <span className="truncate">加寬蛋糕</span>
                <span className="text-[11px] font-bold text-[#F43F7E] tabular-nums shrink-0">
                  ×{hud.powerUps.widen}
                </span>
              </button>

              <button
                type="button"
                onClick={() => triggerPowerUp('shield')}
                disabled={hud.powerUps.shield <= 0 || hud.shieldActive}
                className={`min-h-[46px] px-2 py-1.5 rounded-2xl border shadow-sm backdrop-blur-sm flex items-center justify-center gap-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                  hud.shieldActive
                    ? 'bg-[#E0F2FE] border-[#38BDF8] text-[#0369A1]'
                    : 'bg-white/92 hover:bg-white active:scale-[0.97] disabled:opacity-45 disabled:active:scale-100 border-[#F3DCE3] text-[#4A353B]'
                }`}
                title="開啟防護盾，失誤未疊到時可救援一次 (快捷鍵 3)"
              >
                {hud.shieldActive ? (
                  <ShieldCheck className="w-4 h-4 text-[#0284C7] shrink-0" />
                ) : (
                  <Shield className="w-4 h-4 text-[#0EA5E9] shrink-0" />
                )}
                <span className="truncate">
                  {hud.shieldActive ? '防護中' : '防護盾'}
                </span>
                {!hud.shieldActive && (
                  <span className="text-[11px] font-bold text-[#0EA5E9] tabular-nums shrink-0">
                    ×{hud.powerUps.shield}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Menu / Pause / Game Over / Mobile Leaderboard Modals */}
          <GameOverlays
            status={status}
            bestScore={bestScore}
            lastSummary={lastSummary}
            savedNickname={savedNickname}
            leaderboard={leaderboard}
            showLeaderboardModal={showLeaderboardModal}
            onStartGame={handleStartGame}
            onResumeGame={() => setStatus('PLAYING')}
            onRestartGame={handleRestartGame}
            onBackToTitle={handleBackToTitle}
            onOpenLeaderboard={() => setShowLeaderboardModal(true)}
            onCloseLeaderboard={() => setShowLeaderboardModal(false)}
            onSaveScore={handleSaveScore}
            onClearLeaderboard={handleClearLeaderboard}
          />
        </main>

        {/* Desktop Side Panel (Pastry Counter & Leaderboard) */}
        <aside className="hidden lg:flex flex-col justify-between bg-white rounded-3xl border border-[#F3DCE3] shadow-sm p-6 h-[min(86dvh,700px)] overflow-y-auto">
          <div className="space-y-6">
            {/* Live Run Status */}
            <section>
              <div className="flex items-center justify-between pb-3 border-b border-[#F3DCE3]">
                <h2 className="font-display text-base font-bold text-[#4A353B]">
                  目前烘焙狀態
                </h2>
                <span className="text-xs font-medium text-[#8E727A] tabular-nums">
                  速度 {hud.speedMultiplier.toFixed(1)}×
                </span>
              </div>

              <div className="mt-3.5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-5 h-5 rounded-md border border-[#6B4C54]/30 shrink-0"
                      style={{ backgroundColor: hud.currentFlavor.spongeColor }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-[#8E727A]">當前口味</p>
                      <p className="text-sm font-semibold text-[#4A353B] truncate">
                        {hud.currentFlavor.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-[#8E727A]">剩餘寬度</p>
                    <p className="text-sm font-bold text-[#F43F7E] tabular-nums">
                      {widthPercent}%
                    </p>
                  </div>
                </div>

                {/* Width gauge bar */}
                <div className="h-2 w-full rounded-full bg-[#FFF2F6] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#F43F7E] transition-all duration-200"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>

                <p className="text-xs text-[#8E727A] tabular-nums">
                  下一層口味：{hud.nextFlavor.name}
                  <span aria-hidden="true" className="mx-1.5">·</span>
                  最高紀錄 {bestScore.toLocaleString()} 分
                  {hud.shieldActive && (
                    <>
                      <span aria-hidden="true" className="mx-1.5">·</span>
                      <span className="text-[#0284C7] font-semibold">防護盾生效中</span>
                    </>
                  )}
                </p>
              </div>
            </section>

            {/* Top 10 High Score Leaderboard */}
            <section>
              <LeaderboardPanel
                entries={leaderboard}
                onClear={handleClearLeaderboard}
              />
            </section>
          </div>

          <footer className="pt-4 mt-4 border-t border-[#F7E8ED] text-xs text-[#8E727A] space-y-1">
            <p>操作：點擊舞台或 Space 投放 · P 暫停</p>
            <p>道具快捷鍵：1 自動對齊 · 2 加寬 · 3 防護盾</p>
          </footer>
        </aside>
      </div>
    </div>
  );
}


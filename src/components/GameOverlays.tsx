import React, { useEffect, useState } from 'react';
import { Play, RotateCcw, Trophy, X, Check } from 'lucide-react';
import { GameRunSummary, GameStatus, LeaderboardEntry } from '../types/game';
import { LeaderboardPanel } from './LeaderboardPanel';

interface GameOverlaysProps {
  status: GameStatus;
  bestScore: number;
  lastSummary: GameRunSummary | null;
  savedNickname: string;
  leaderboard: LeaderboardEntry[];
  showLeaderboardModal: boolean;
  onStartGame: () => void;
  onResumeGame: () => void;
  onRestartGame: () => void;
  onBackToTitle: () => void;
  onOpenLeaderboard: () => void;
  onCloseLeaderboard: () => void;
  onSaveScore: (nickname: string) => void;
  onClearLeaderboard: () => void;
}

export const GameOverlays: React.FC<GameOverlaysProps> = ({
  status,
  bestScore,
  lastSummary,
  savedNickname,
  leaderboard,
  showLeaderboardModal,
  onStartGame,
  onResumeGame,
  onRestartGame,
  onBackToTitle,
  onOpenLeaderboard,
  onCloseLeaderboard,
  onSaveScore,
  onClearLeaderboard,
}) => {
  const [nickname, setNickname] = useState(savedNickname || '甜點小廚師');
  const [scoreSaved, setScoreSaved] = useState(false);

  useEffect(() => {
    if (status === 'GAME_OVER') {
      setScoreSaved(false);
      setNickname(savedNickname || '甜點小廚師');
    }
  }, [status, savedNickname]);

  if (showLeaderboardModal) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#4A353B]/35 backdrop-blur-sm">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-[#F3DCE3] shadow-xl p-5 max-h-[82vh] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#8E727A]">
              前 10 名最高紀錄
            </span>
            <button
              type="button"
              onClick={onCloseLeaderboard}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#8E727A] hover:text-[#4A353B] hover:bg-[#FFF5F8] transition-colors"
              aria-label="關閉排行榜"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-y-auto pr-1">
            <LeaderboardPanel
              entries={leaderboard}
              onClear={onClearLeaderboard}
              compact
            />
          </div>
        </div>
      </div>
    );
  }

  if (status === 'TITLE_MENU') {
    return (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-7 px-5 bg-gradient-to-t from-[#FFF9F5]/95 via-[#FFF9F5]/65 to-transparent pointer-events-auto">
        <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl border border-[#F3DCE3] shadow-lg p-5">
          <div className="text-center">
            <p className="text-xs font-medium text-[#F43F7E] tracking-wide">
              日系可愛風 · 經典硬派模式
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-[#4A353B] leading-tight">
              軟綿蛋糕疊疊樂
            </h1>
            {bestScore > 0 && (
              <p className="mt-1.5 text-xs font-medium text-[#8E727A] tabular-nums">
                最高紀錄 {bestScore.toLocaleString()} 分
              </p>
            )}
          </div>

          <div className="mt-4 pt-3.5 border-t border-[#F7E8ED] space-y-2 text-xs text-[#6B4C54]">
            <p>1. 看準上方鐘擺晃動時機，點擊螢幕讓蛋糕落下。</p>
            <p>2. 沒對齊的多餘蛋糕會被切掉掉落，完全沒疊到即結束。</p>
            <p>3. 善用底部「自動對齊、加寬蛋糕、防護盾」三種道具突破高分，連續完美 3 次或每 8 層可補充道具。</p>
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onStartGame}
              className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-[#F43F7E] hover:bg-[#E11D63] active:scale-[0.98] text-white font-display text-base font-bold flex items-center justify-center gap-2 shadow-md shadow-[#F43F7E]/25 transition-all whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>開始遊戲</span>
            </button>

            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#FFF5F8] hover:bg-[#FFE8F0] text-[#4A353B] border border-[#F3DCE3] text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap lg:hidden"
            >
              <Trophy className="w-4 h-4 text-[#F59E0B]" />
              <span>查看排行榜</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'PAUSED') {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center p-5 bg-[#4A353B]/35 backdrop-blur-sm">
        <div className="w-full max-w-xs bg-white rounded-3xl border border-[#F3DCE3] shadow-xl p-6 text-center">
          <h2 className="font-display text-2xl font-bold text-[#4A353B]">
            暫停休息中
          </h2>
          <p className="mt-1 text-xs text-[#8E727A]">
            蛋糕正在等待你的下一步操作
          </p>

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onResumeGame}
              className="w-full min-h-[46px] px-5 py-2.5 rounded-2xl bg-[#F43F7E] hover:bg-[#E11D63] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>繼續遊戲</span>
            </button>

            <button
              type="button"
              onClick={onRestartGame}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#FFF5F8] hover:bg-[#FFE8F0] text-[#4A353B] border border-[#F3DCE3] font-semibold text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重新開始</span>
            </button>

            <button
              type="button"
              onClick={onBackToTitle}
              className="w-full min-h-[40px] px-4 py-2 text-xs font-medium text-[#8E727A] hover:text-[#4A353B] transition-colors whitespace-nowrap"
            >
              回到主畫面
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'GAME_OVER' && lastSummary) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-[#4A353B]/40 backdrop-blur-sm">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-[#F3DCE3] shadow-xl p-5">
          <div className="text-center">
            {lastSummary.isNewBest && (
              <p className="text-xs font-bold text-[#F59E0B] mb-1">
                刷新個人最高紀錄
              </p>
            )}
            <h2 className="font-display text-2xl font-bold text-[#4A353B]">
              蛋糕塔完成！
            </h2>
            <div className="mt-2">
              <span className="font-display text-4xl font-bold text-[#F43F7E] tabular-nums">
                {lastSummary.score.toLocaleString()}
              </span>
              <span className="ml-1.5 text-sm font-medium text-[#8E727A]">分</span>
            </div>
            <p className="mt-1.5 text-xs text-[#6B4C54] tabular-nums">
              共 {lastSummary.floors} 層
              <span aria-hidden="true" className="mx-1.5">·</span>
              最高連擊 ×{lastSummary.maxCombo}
              <span aria-hidden="true" className="mx-1.5">·</span>
              完美 {lastSummary.perfectCount} 次
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-[#F7E8ED]">
            {scoreSaved ? (
              <div className="flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-[#4D9B56]">
                <Check className="w-4 h-4" />
                <span>已登錄至高分排行榜</span>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSaveScore(nickname);
                  setScoreSaved(true);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={16}
                  placeholder="輸入暱稱登錄排行"
                  aria-label="玩家暱稱"
                  className="flex-1 min-w-0 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FFF9F5] border border-[#F3DCE3] text-sm text-[#4A353B] placeholder:text-[#B498A0] focus:outline-none focus:border-[#F43F7E]"
                />
                <button
                  type="submit"
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#4A353B] hover:bg-[#38272C] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  登錄成績
                </button>
              </form>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={onRestartGame}
              className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-[#F43F7E] hover:bg-[#E11D63] active:scale-[0.98] text-white font-display text-base font-bold flex items-center justify-center gap-2 shadow-md shadow-[#F43F7E]/25 transition-all whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>再玩一次</span>
            </button>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onOpenLeaderboard}
                className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-[#FFF5F8] hover:bg-[#FFE8F0] text-[#4A353B] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap lg:hidden"
              >
                <Trophy className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>排行榜</span>
              </button>
              <button
                type="button"
                onClick={onBackToTitle}
                className="flex-1 min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium text-[#8E727A] hover:text-[#4A353B] hover:bg-[#FFF9F5] transition-colors whitespace-nowrap"
              >
                回主畫面
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

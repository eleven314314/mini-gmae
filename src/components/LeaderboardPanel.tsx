import React, { useState } from 'react';
import { Trophy, Trash2 } from 'lucide-react';
import { LeaderboardEntry } from '../types/game';

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
  onClear: () => void;
  compact?: boolean;
}

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({
  entries,
  onClear,
  compact = false,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#F3DCE3]">
        <div className="flex items-center gap-2 min-w-0">
          <Trophy className="w-4 h-4 text-[#F59E0B] shrink-0" />
          <h2 className="font-display text-base font-bold text-[#4A353B] truncate">
            高分排行榜
          </h2>
        </div>

        {entries.length > 0 && (
          <div className="shrink-0">
            {confirmClear ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onClear();
                    setConfirmClear(false);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-[#F43F7E] rounded-lg hover:bg-[#E11D63] transition-colors whitespace-nowrap"
                >
                  確認清除
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1 text-xs font-medium text-[#8E727A] hover:text-[#4A353B] transition-colors whitespace-nowrap"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#8E727A] hover:text-[#F43F7E] transition-colors py-1 px-1.5 rounded-md whitespace-nowrap"
                title="清除排行榜紀錄"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清除</span>
              </button>
            )}
          </div>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-[#6B4C54]">
            目前尚未有高分紀錄
          </p>
          <p className="mt-1 text-xs text-[#8E727A]">
            完成一局蛋糕疊疊樂即可登錄你的戰績
          </p>
        </div>
      ) : (
        <ol className="divide-y divide-[#F7E8ED]">
          {entries.map((entry, idx) => {
            const rank = idx + 1;
            const rankColor =
              rank === 1
                ? 'text-[#D97706]'
                : rank === 2
                  ? 'text-[#64748B]'
                  : rank === 3
                    ? 'text-[#B45309]'
                    : 'text-[#8E727A]';

            return (
              <li
                key={entry.id}
                className={`flex items-center justify-between gap-3 ${
                  compact ? 'py-2.5' : 'py-3'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-5 text-sm font-bold tabular-nums shrink-0 ${rankColor}`}
                  >
                    #{rank}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#4A353B] truncate">
                      {entry.nickname}
                    </p>
                    <p className="text-xs text-[#8E727A] tabular-nums">
                      {entry.floors} 層
                      <span aria-hidden="true" className="mx-1.5">·</span>
                      最高連擊 ×{entry.maxCombo}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-display text-base font-bold text-[#F43F7E] tabular-nums">
                    {entry.score.toLocaleString()}
                  </span>
                  <span className="ml-1 text-[11px] text-[#8E727A]">分</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};

import { useState } from 'react';
import { Check, Link2, Trophy } from 'lucide-react';
import { submitScore } from '../../../shared/api/gameApi';
import { soundEngine } from '../../../shared/audio/soundEngine';
import { useGameStore } from '../store/useGameStore';

export function LeaderboardPanel({ onCopyChallenge, copied = false }) {
  const currentGame = useGameStore((s) => s.currentGame);
  const finalScore = useGameStore((s) => s.finalScore);
  const runDurationMs = useGameStore((s) => s.runDurationMs);
  const updateScores = useGameStore((s) => s.updateCurrentGameScores);

  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const scores = currentGame?.scores || [];
  const timeSec = Number((runDurationMs / 1000).toFixed(2));

  const handleClaim = async (e) => {
    e.preventDefault();
    const tag = name.trim();
    if (!tag || saving || !currentGame?.id) return;
    setSaving(true);
    try {
      const res = await submitScore(currentGame.id, {
        player_name: tag,
        score: finalScore,
        time_seconds: timeSec,
      });
      if (res?.scores) {
        updateScores(res.scores);
        if (res.scores[0]?.player_name === tag) soundEngine.playHighScoreFanfare();
      }
      setSubmitted(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 text-left">
      <div className="flex items-center justify-between text-xs font-medium text-[#6E6A61] dark:text-[#94A3B8] tabular-nums bg-[#EFECE4] dark:bg-[#182032] border border-[#E6E2D8] dark:border-[#232E42] rounded-xl px-3.5 py-2">
        <span>Time: {timeSec.toFixed(2)}s</span>
        <span className="text-[#181715] dark:text-[#F1F5F9]">Score: {finalScore}</span>
      </div>

      {!submitted ? (
        <form onSubmit={handleClaim} className="flex items-center gap-2">
          <input
            type="text"
            maxLength={16}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tag or nickname (e.g. ACE)"
            className="flex-1 rounded-xl bg-[#F6F4EF] dark:bg-[#0A0D14] border border-[#E6E2D8] dark:border-[#232E42] px-3 py-2 text-xs text-[#181715] dark:text-[#F1F5F9] placeholder:text-[#6E6A61]/70 dark:placeholder:text-[#94A3B8]/60 focus:outline-none focus:border-[#181715]/30 dark:focus:border-[#3B4D6B]"
          />
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="px-3.5 py-2 rounded-xl bg-[#181715] dark:bg-[#F1F5F9] text-[#F6F4EF] dark:text-[#0A0D14] text-xs font-medium hover:bg-[#2E2C28] dark:hover:bg-[#E2E8F0] disabled:opacity-40"
          >
            {saving ? '...' : 'Submit'}
          </button>
        </form>
      ) : (
        <p className="text-[11px] font-medium text-[#D96B27] text-center">Score saved to world leaderboard!</p>
      )}

      {scores.length > 0 && (
        <div className="rounded-xl bg-[#F6F4EF] dark:bg-[#0A0D14] border border-[#E6E2D8] dark:border-[#232E42] p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#6E6A61] dark:text-[#94A3B8]">
            <Trophy className="w-3 h-3 text-[#D96B27]" />
            <span>Top 5 Leaderboard</span>
          </div>
          {scores.slice(0, 5).map((entry, idx) => {
            const sec = entry.time_seconds ?? (entry.time_ms ? entry.time_ms / 1000 : 0);
            return (
              <div key={`${entry.player_name}-${idx}`} className="flex items-center justify-between text-xs tabular-nums">
                <span className="font-medium text-[#181715] dark:text-[#F1F5F9] truncate">
                  <span className="text-[#6E6A61] dark:text-[#94A3B8] mr-1.5">#{idx + 1}</span>
                  {entry.player_name}
                </span>
                <span className="text-[#6E6A61] dark:text-[#94A3B8]">
                  {entry.score} pts · {sec.toFixed(2)}s
                </span>
              </div>
            );
          })}
        </div>
      )}

      {onCopyChallenge && (
        <button
          type="button"
          onClick={onCopyChallenge}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EFECE4] dark:bg-[#182032] border border-[#E6E2D8] dark:border-[#232E42] text-xs font-medium text-[#181715] dark:text-[#F1F5F9] hover:border-[#D96B27]/50 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#D96B27]" /> : <Link2 className="w-3.5 h-3.5 text-[#D96B27]" />}
          <span>{copied ? 'Challenge Link Copied!' : 'Copy Challenge Link'}</span>
        </button>
      )}
    </div>
  );
}

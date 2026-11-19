import { Box, Play, Sparkles, Trophy, Users } from 'lucide-react';
import { detectGameGenre } from './lobbyHelpers';

export function GameCard({ game, onPlayGame, onRemixGame }) {
  const genre = detectGameGenre(game);
  const scores = game.scores || [];
  const topScore = scores.reduce((best, s) => Math.max(best, s.score || 0), 0);
  const playCount = game.plays_count ?? game.play_count ?? 0;

  return (
    <div className="group bg-[#FAF9F6] dark:bg-[#111622] border border-[#E6E2D8] dark:border-[#232E42] rounded-2xl p-4 shadow-[0_4px_20px_rgba(24,22,18,0.05)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.45)] hover:-translate-y-1 hover:shadow-lg transition-all duration-200 flex flex-col justify-between gap-4">
      <div className="relative aspect-video w-full bg-[#EFECE4] dark:bg-[#182032] border border-[#E6E2D8] dark:border-[#232E42] rounded-xl overflow-hidden">
        {game.thumbnail ? (
          <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#6E6A61]/50 dark:text-[#94A3B8]/40">
            <Box className="w-6 h-6" />
          </div>
        )}

        <span className="absolute top-2.5 left-2.5 text-[11px] font-semibold text-[#181715] dark:text-[#F1F5F9] bg-[#FFFFFF]/92 dark:bg-[#0A0D14]/85 backdrop-blur-sm border border-[#E6E2D8] dark:border-[#232E42] rounded-lg px-2.5 py-0.5">
          {genre}
        </span>

        {topScore > 0 && (
          <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#181715] dark:text-[#F1F5F9] bg-[#FFFFFF]/92 dark:bg-[#0A0D14]/85 backdrop-blur-sm border border-[#E6E2D8] dark:border-[#232E42] rounded-lg px-2 py-0.5 tabular-nums">
            <Trophy className="w-3 h-3 text-[#D96B27]" />
            {topScore}
          </span>
        )}

        <div className="absolute inset-0 bg-[#181715]/35 dark:bg-[#0A0D14]/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => onPlayGame(game)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#181715] dark:bg-[#F1F5F9] text-[#F6F4EF] dark:text-[#0A0D14] text-xs font-semibold shadow-md hover:scale-105 transition-transform"
          >
            <Play className="w-3.5 h-3.5 fill-current text-[#D96B27]" />
            <span>Play</span>
          </button>
          <button
            type="button"
            onClick={() => onRemixGame(game)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FFFFFF]/95 dark:bg-[#111622]/95 text-[#181715] dark:text-[#F1F5F9] border border-[#E6E2D8] dark:border-[#232E42] text-xs font-semibold shadow-md hover:scale-105 transition-transform"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D96B27]" />
            <span>Remix</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-3.5 flex-1 px-1">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold tracking-tight text-[#181715] dark:text-[#F1F5F9] truncate">{game.title}</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6E6A61] dark:text-[#94A3B8] tabular-nums shrink-0">
              <Users className="w-3 h-3" />{playCount}
            </span>
          </div>
          <p className="text-xs text-[#6E6A61] dark:text-[#94A3B8] line-clamp-2 leading-relaxed">{game.prompt}</p>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E6E2D8] dark:border-[#232E42]">
          <button
            type="button"
            onClick={() => onRemixGame(game)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EFECE4] dark:bg-[#182032] border border-[#E6E2D8] dark:border-[#232E42] text-[#181715] dark:text-[#F1F5F9] text-xs font-medium hover:opacity-85 transition-opacity"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D96B27]" />
            <span>Remix</span>
          </button>
          <button
            type="button"
            onClick={() => onPlayGame(game)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#181715] dark:bg-[#F1F5F9] text-[#F6F4EF] dark:text-[#0A0D14] text-xs font-medium hover:opacity-90 active:scale-95 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play</span>
          </button>
        </div>
      </div>
    </div>
  );
}

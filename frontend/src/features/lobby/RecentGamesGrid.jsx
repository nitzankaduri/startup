import { Layers } from 'lucide-react';
import { GameCard } from './GameCard';

export function RecentGamesGrid({ games, isFetching, onPlayGame, onRemixGame }) {
  if (isFetching) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[0, 1, 2].map((idx) => (
          <div key={idx} className="h-64 rounded-2xl bg-[#FFFFFF] dark:bg-[#111622] border border-[#E6E2D8] dark:border-[#232E42] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!games.length) {
    return (
      <div className="rounded-2xl bg-[#FAF9F6] dark:bg-[#111622] border border-[#E6E2D8] dark:border-[#232E42] p-10 text-center flex flex-col items-center gap-2">
        <Layers className="w-5 h-5 text-[#6E6A61] dark:text-[#94A3B8]" />
        <p className="text-sm text-[#181715] dark:text-[#F1F5F9] font-medium">No matching worlds</p>
        <p className="text-xs text-[#6E6A61] dark:text-[#94A3B8]">Try another genre filter or generate a new 3D world above.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {games.map((game) => (
        <GameCard key={game.id} game={game} onPlayGame={onPlayGame} onRemixGame={onRemixGame} />
      ))}
    </div>
  );
}

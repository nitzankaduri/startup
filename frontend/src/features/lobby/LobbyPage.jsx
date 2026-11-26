import { useMemo, useRef, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { useSettingsStore } from '../sandbox/store/useSettingsStore';
import { detectGameGenre, GENRE_FILTERS, matchesGenreFilter, PRESETS_2D, PRESETS_3D } from './lobbyHelpers';
import { LobbyHero } from './LobbyHero';
import { Navbar } from './Navbar';
import { RecentGamesGrid } from './RecentGamesGrid';
import { ShowcaseStrip } from './ShowcaseStrip';

export function LobbyPage({ theme, toggleTheme, games, isFetchingGames, isLoading, buildStage, error, onClearError, onGenerate, onPlayGame, onRemixGame }) {
  const [prompt, setPrompt] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const dimension = useSettingsStore((s) => s.preferredDimension || '3d');
  const setDimension = useSettingsStore((s) => s.setPreferredDimension);
  const promptInputRef = useRef(null);
  const worldsSectionRef = useRef(null);
  const activePresets = dimension === '2d' ? PRESETS_2D : PRESETS_3D;

  const filteredGames = useMemo(() => {
    const q = query.trim().toLowerCase();
    return games.filter((g) => {
      const genre = detectGameGenre(g);
      if (!matchesGenreFilter(genre, filter)) return false;
      if (!q) return true;
      return g.title?.toLowerCase().includes(q) || g.prompt?.toLowerCase().includes(q) || genre.toLowerCase().includes(q);
    });
  }, [games, filter, query]);

  const handleSelectChip = (chipPrompt) => {
    setPrompt(chipPrompt);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => promptInputRef.current?.focus(), 220);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#FAF9F6] dark:bg-[#0A0D14] text-[#1C1917] dark:text-[#F1F5F9] transition-colors duration-200">
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onFocusPrompt={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); promptInputRef.current?.focus(); }}
        onScrollWorlds={() => worldsSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
      />

      <main className="relative z-10 flex flex-col">
        <LobbyHero
          prompt={prompt}
          setPrompt={setPrompt}
          dimension={dimension}
          setDimension={setDimension}
          onGenerate={onGenerate}
          isLoading={isLoading}
          buildStage={buildStage}
          error={error}
          onClearError={onClearError}
          inputRef={promptInputRef}
        />

        <div ref={worldsSectionRef} className="px-6 pt-12 pb-20 flex flex-col gap-12 border-t border-[#E6E2D8]/70 dark:border-[#1E293B]">
          <div className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-center gap-2.5">
            {activePresets.map((chip) => (
              <button
                key={chip.label}
                type="button"
                disabled={isLoading}
                onClick={() => handleSelectChip(chip.prompt)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#FFFFFF] dark:bg-[#111622] border border-[#E6E2D8] dark:border-[#232E42] shadow-[0_2px_10px_rgba(28,25,23,0.03)] hover:-translate-y-0.5 hover:border-[#1C1917]/25 dark:hover:border-[#3B4D6B] active:scale-95 transition-all text-xs font-medium text-[#1C1917] dark:text-[#F1F5F9]"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D96B27]" />
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          <ShowcaseStrip onSelectPrompt={(p) => onGenerate(p, dimension)} />

          <section className="max-w-6xl w-full mx-auto flex flex-col gap-6 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {GENRE_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                      filter === f.id
                        ? 'bg-[#1C1917] dark:bg-[#F1F5F9] text-[#FAF9F6] dark:text-[#0A0D14] border-[#1C1917] dark:border-[#F1F5F9]'
                        : 'bg-[#FFFFFF] dark:bg-[#111622] text-[#6E6A61] dark:text-[#94A3B8] border-[#E6E2D8] dark:border-[#232E42] hover:text-[#1C1917] dark:hover:text-[#F1F5F9]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[#6E6A61] dark:text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search community worlds..."
                    className="w-full rounded-xl bg-[#FFFFFF] dark:bg-[#111622] border border-[#E6E2D8] dark:border-[#232E42] pl-8 pr-3 py-1.5 text-xs text-[#1C1917] dark:text-[#F1F5F9] placeholder:text-[#6E6A61]/70 dark:placeholder:text-[#94A3B8]/60 focus:outline-none focus:border-[#1C1917]/30 dark:focus:border-[#3B4D6B]"
                  />
                </div>
                <span className="text-xs font-medium text-[#6E6A61] dark:text-[#94A3B8] tabular-nums shrink-0">{filteredGames.length} worlds</span>
              </div>
            </div>

            <RecentGamesGrid games={filteredGames} isFetching={isFetchingGames} onPlayGame={onPlayGame} onRemixGame={onRemixGame} />
          </section>
        </div>
      </main>
    </div>
  );
}

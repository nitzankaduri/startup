import { Globe, Layers, Moon, Sun } from 'lucide-react';

export function Navbar({ theme, onToggleTheme, onFocusPrompt, onScrollWorlds }) {
  return (
    <nav className="w-full border-b border-[#E6E2D8]/45 dark:border-[#1E293B]/60 bg-[#FAF9F6]/75 dark:bg-[#0A0D14]/80 backdrop-blur-md sticky top-0 z-30 transition-colors duration-200 animate-fade-up">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <a href="/" className="group inline-flex items-center gap-2.5 text-[#181715] dark:text-[#F1F5F9]">
            <span className="w-7 h-7 rounded-full bg-[#D96B27] flex items-center justify-center text-[#FFFFFF] shadow-sm group-hover:scale-105 transition-transform">
              <Layers className="w-3.5 h-3.5" />
            </span>
            <span className="text-base font-semibold tracking-tight">Spawn.gg</span>
          </a>

          <div className="hidden md:flex items-center gap-6 text-xs font-medium text-[#6E6A61] dark:text-[#94A3B8]">
            <button type="button" onClick={onScrollWorlds} className="hover:text-[#181715] dark:hover:text-[#F1F5F9] transition-colors">
              Explore
            </button>
            <button type="button" onClick={onScrollWorlds} className="hover:text-[#181715] dark:hover:text-[#F1F5F9] transition-colors">
              Genres
            </button>
            <button type="button" onClick={onScrollWorlds} className="hover:text-[#181715] dark:hover:text-[#F1F5F9] transition-colors">
              Leaderboards
            </button>
            <span className="text-[#D96B27] font-medium">· AI Studio ·</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Beige Light Mode' : 'Switch to Midnight Dark Mode'}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-xl bg-[#EFECE4] dark:bg-[#111622] border border-[#E6E2D8] dark:border-[#232E42] text-[#181715] dark:text-[#F1F5F9] hover:scale-105 active:scale-95 flex items-center justify-center transition-all"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-[#E5B869]" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <span className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-full text-[#6E6A61] dark:text-[#94A3B8]">
            <Globe className="w-4 h-4" />
          </span>

          <button
            type="button"
            onClick={onFocusPrompt}
            className="px-4 py-2 rounded-xl bg-[#181715] dark:bg-[#F1F5F9] text-[#F6F4EF] dark:text-[#0A0D14] text-xs font-medium hover:opacity-90 active:scale-95 transition-all"
          >
            Start spawning
          </button>
        </div>
      </div>
    </nav>
  );
}

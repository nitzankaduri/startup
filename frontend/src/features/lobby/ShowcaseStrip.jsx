import { Flag, Layers, Mountain, Shield, Trophy } from 'lucide-react';

const PIN = 'absolute -top-[3px] w-1.5 h-1.5 bg-[#181715] dark:bg-[#94A3B8]';
const CARD_BASE = 'relative text-left shadow-sm hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 shrink-0';

export function ShowcaseStrip({ onSelectPrompt }) {
  return (
    <section className="w-full pt-2 pb-4 overflow-x-auto animate-fade-up" style={{ animationDelay: '300ms' }}>
      <div className="min-w-[980px] max-w-6xl mx-auto border-t border-[#E6E2D8] dark:border-[#1E293B] flex items-start justify-center gap-4 px-4">
        <button
          type="button"
          onClick={() => onSelectPrompt('Deep obsidian puzzle dash with crumbling bridges')}
          className={`${CARD_BASE} w-32 h-40 bg-[#181715] dark:bg-[#111622] border border-[#232E42] text-[#F1F5F9] p-3 flex flex-col justify-between`}
        >
          <span className={`${PIN} left-1.5`} /><span className={`${PIN} right-1.5`} />
          <span className="text-[10px] font-medium text-[#94A3B8]">Level 4</span>
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <span
                key={i}
                className={`w-3.5 h-3.5 rounded-full ${
                  i === 11 || i === 16 ? 'bg-[#D96B27] animate-pulse' : i > 14 ? 'bg-[#334155]' : 'bg-[#1E293B]'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] font-medium text-[#94A3B8]">Obsidian Grid</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectPrompt('Alpine canyon rally with speed pads and drift checkpoints')}
          className={`${CARD_BASE} w-64 h-40 bg-[#385247] text-[#F6F4EF] p-3.5 flex flex-col justify-between overflow-hidden`}
        >
          <span className={`${PIN} left-1.5`} /><span className={`${PIN} right-1.5`} />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#E5D3B3]">Alpine Rally · 242m</span>
            <Flag className="w-3.5 h-3.5 text-[#E5B869]" />
          </div>
          <div className="relative h-20 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full border border-dashed border-[#A7B8B0]/35 animate-spin-slow flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border border-[#E5B869]/55 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-[#FFF3E0] animate-pulse" />
              </div>
            </div>
            <div className="absolute right-0 bottom-0 bg-[#FFFFFF] text-[#181715] rounded-lg px-2.5 py-1 text-[10px] font-semibold tabular-nums shadow-sm">
              142 km/h
            </div>
          </div>
          <span className="text-xs font-semibold tracking-tight">Canyon Drift Course</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectPrompt('Desert Train Heist Runner')}
          className={`${CARD_BASE} group w-28 h-28 bg-[#D96B27] text-[#FFFFFF] p-3 flex items-center justify-center`}
        >
          <span className={`${PIN} left-1.5`} /><span className={`${PIN} right-1.5`} />
          <Layers className="w-10 h-10 opacity-90 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
        </button>

        <button
          type="button"
          onClick={() => onSelectPrompt('Sunlit Rooftop Parkour Chase')}
          className={`${CARD_BASE} w-60 h-40 bg-[#1B2436] text-[#F1F5F9] p-3.5 flex flex-col justify-between`}
        >
          <span className={`${PIN} left-1.5`} /><span className={`${PIN} right-1.5`} />
          <div className="flex items-center justify-between text-[10px] text-[#94A3B8]">
            <span>Rooftop Chase</span>
            <Mountain className="w-3.5 h-3.5 text-[#E5B869]" />
          </div>
          <div className="flex items-end gap-2 h-16 border-b border-[#334155]/60 pb-1">
            <div className="w-10 h-6 bg-[#334155] rounded-t animate-bar-breathe" />
            <div className="w-14 h-12 bg-[#253248] rounded-t animate-bar-breathe" style={{ animationDelay: '0.4s' }} />
            <div className="w-8 h-8 bg-[#475569] rounded-t animate-bar-breathe" style={{ animationDelay: '0.8s' }} />
            <div className="w-16 h-14 bg-[#334155] rounded-t animate-bar-breathe" style={{ animationDelay: '1.2s' }} />
          </div>
          <span className="text-xs font-semibold tracking-tight">Citadel Escape · 18 Props</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectPrompt('Space marine defending outpost against escalating enemy waves')}
          className={`${CARD_BASE} w-36 h-40 bg-[#FFFFFF] dark:bg-[#111622] border border-[#E6E2D8] dark:border-[#232E42] text-[#181715] dark:text-[#F1F5F9] p-3 flex flex-col justify-between`}
        >
          <span className={`${PIN} left-1.5`} /><span className={`${PIN} right-1.5`} />
          <div className="flex items-center justify-between text-[10px] font-semibold">
            <span>Leaderboard</span>
            <Trophy className="w-3 h-3 text-[#D96B27]" />
          </div>
          <div className="flex flex-col gap-1 text-[10px] tabular-nums">
            <div className="flex justify-between"><span>#1 ACE</span><span className="text-[#6E6A61] dark:text-[#94A3B8]">12.4s</span></div>
            <div className="flex justify-between"><span>#2 KAI</span><span className="text-[#6E6A61] dark:text-[#94A3B8]">14.1s</span></div>
            <div className="flex justify-between"><span>#3 ZOE</span><span className="text-[#6E6A61] dark:text-[#94A3B8]">15.8s</span></div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#D96B27]">
            <Shield className="w-3 h-3" /> Wave 4 Clear
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectPrompt('Alpine Snowboard Canyon Run')}
          className={`${CARD_BASE} w-56 h-40 bg-[#EFECE4] dark:bg-[#182032] border border-[#E6E2D8] dark:border-[#232E42] text-[#181715] dark:text-[#F1F5F9] p-3.5 flex flex-col justify-between`}
        >
          <span className={`${PIN} left-1.5`} /><span className={`${PIN} right-1.5`} />
          <span className="text-[10px] font-medium text-[#6E6A61] dark:text-[#94A3B8]">Voxel Canyon · x5</span>
          <div className="grid grid-cols-6 gap-1 h-16 items-end">
            {[4, 8, 5, 11, 7, 9].map((h, i) => (
              <span
                key={i}
                style={{ height: `${h * 5}px`, animationDelay: `${i * 0.22}s` }}
                className={`rounded-[2px] animate-bar-breathe ${i % 2 === 0 ? 'bg-[#7A6747] dark:bg-[#475569]' : 'bg-[#D96B27]/85'}`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold tracking-tight">Snowboard Run</span>
        </button>
      </div>
    </section>
  );
}

import { HeroMeshBackground } from './HeroMeshBackground';
import { PromptBar } from './PromptBar';

export function LobbyHero({ prompt, setPrompt, onGenerate, isLoading, error, onClearError, inputRef }) {
  return (
    <section className="relative w-full min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden px-6 pb-16">
      <HeroMeshBackground />

      <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center gap-7 -mt-6">
        <header className="flex flex-col items-center text-center gap-2.5 animate-fade-up" style={{ animationDelay: '60ms' }}>
          <h1 className="text-4xl sm:text-5xl md:text-[54px] font-semibold tracking-tight leading-[1.06] text-[#1C1917] dark:text-[#F1F5F9]">
            Build something playable
          </h1>
          <p className="text-sm sm:text-base text-[#57534E] dark:text-[#94A3B8] max-w-lg leading-relaxed">
            Spawn any 3D world from plain words — drive, fly, build, or fight in seconds.
          </p>
        </header>

        <PromptBar
          prompt={prompt}
          setPrompt={setPrompt}
          onGenerate={onGenerate}
          isLoading={isLoading}
          error={error}
          onClearError={onClearError}
          inputRef={inputRef}
        />
      </div>
    </section>
  );
}

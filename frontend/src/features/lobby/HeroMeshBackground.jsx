export function HeroMeshBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      <div className="absolute inset-0 bg-[#FAF9F6] dark:bg-[#0A0D14]" />

      {/* Left & right arched muted coastal sky-blue shoulders framing the cream center */}
      <div
        className="animate-mesh-a absolute top-[18%] -left-[12%] w-[62%] h-[68%] rounded-full opacity-65 dark:opacity-28 blur-[86px]"
        style={{ background: 'radial-gradient(ellipse at center, #7FA8C9 0%, rgba(127,168,201,0) 70%)' }}
      />
      <div
        className="animate-mesh-b absolute top-[18%] -right-[12%] w-[62%] h-[68%] rounded-full opacity-65 dark:opacity-28 blur-[86px]"
        style={{ background: 'radial-gradient(ellipse at center, #7FA8C9 0%, rgba(127,168,201,0) 70%)' }}
      />

      {/* Lower sweeping coral-terracotta & sunset apricot horizon band */}
      <div
        className="animate-mesh-c absolute -bottom-[18%] left-[12%] w-[76%] h-[62%] rounded-full opacity-60 dark:opacity-24 blur-[92px]"
        style={{ background: 'radial-gradient(ellipse at center, #E76F51 0%, #F4A261 48%, rgba(244,162,97,0) 76%)' }}
      />
      <div
        className="animate-mesh-a absolute -bottom-[22%] -left-[6%] w-[52%] h-[54%] rounded-full opacity-55 dark:opacity-20 blur-[84px]"
        style={{ background: 'radial-gradient(circle, #F4A261 0%, rgba(244,162,97,0) 72%)' }}
      />
      <div
        className="animate-mesh-b absolute -bottom-[22%] -right-[6%] w-[52%] h-[54%] rounded-full opacity-55 dark:opacity-20 blur-[84px]"
        style={{ background: 'radial-gradient(circle, #E76F51 0%, rgba(231,111,81,0) 72%)' }}
      />

      {/* Upper-center warm cream negative space */}
      <div
        className="absolute -top-[8%] left-1/2 -translate-x-1/2 w-[56%] h-[56%] rounded-full opacity-95 dark:opacity-0 blur-[70px]"
        style={{ background: 'radial-gradient(ellipse at center, #FAF9F6 35%, rgba(250,249,246,0) 78%)' }}
      />

      {/* Seamless top & bottom edge fades into #FAF9F6 / #0A0D14 */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#FAF9F6] via-[#FAF9F6]/70 to-transparent dark:from-[#0A0D14] dark:via-[#0A0D14]/70" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#FAF9F6] to-transparent dark:from-[#0A0D14]" />
    </div>
  );
}

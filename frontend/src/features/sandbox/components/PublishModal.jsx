import { useMemo, useState } from 'react';
import { Check, Code2, Copy, Download, ExternalLink, Link2, Share2, X } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { useSceneEditorStore } from '../store/useSceneEditorStore';
import { buildEmbedSnippet, buildQrCells, buildShareUrl, buildStandaloneHtml, downloadTextFile } from './publishHelpers';

const TABS = [
  { id: 'share', label: 'Share Link', icon: Link2 },
  { id: 'embed', label: 'Website Embed', icon: Code2 },
  { id: 'download', label: 'Playable Build', icon: Download },
];

export function PublishModal() {
  const currentGame = useGameStore((s) => s.currentGame);
  const isPublishOpen = useSceneEditorStore((s) => s.isPublishOpen);
  const setPublishOpen = useSceneEditorStore((s) => s.setPublishOpen);
  const [tab, setTab] = useState('share');
  const [copiedKey, setCopiedKey] = useState('');
  const [responsive, setResponsive] = useState(true);
  const [width, setWidth] = useState('960');
  const [height, setHeight] = useState('600');
  const [hideWatermark, setHideWatermark] = useState(false);

  const shareUrl = useMemo(() => buildShareUrl(currentGame?.id), [currentGame?.id]);
  const embedCode = useMemo(() => buildEmbedSnippet({ url: shareUrl, width, height, responsive, hideWatermark }), [shareUrl, width, height, responsive, hideWatermark]);
  const qrCells = useMemo(() => buildQrCells(shareUrl), [shareUrl]);

  if (!isPublishOpen || !currentGame) return null;

  const copyText = async (key, text) => {
    await navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1800);
  };

  const handleDownload = () => {
    const slug = (currentGame.title || 'spawn-world').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'spawn-world';
    downloadTextFile(`${slug}-playable.html`, buildStandaloneHtml(currentGame));
    setCopiedKey('downloaded');
    setTimeout(() => setCopiedKey(''), 2200);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#181715]/45 dark:bg-[#0A0D14]/65 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#FFFFFF] dark:bg-[#111622] border border-[#E6E2D8] dark:border-[#232E42] text-[#181715] dark:text-[#F1F5F9] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E6E2D8] dark:border-[#232E42]">
          <div className="flex items-center gap-2"><Share2 className="w-4 h-4 text-[#D96B27]" /><h2 className="text-sm font-semibold">Publish &amp; Export World</h2></div>
          <button type="button" onClick={() => setPublishOpen(false)} className="p-1.5 rounded-lg text-[#6E6A61] dark:text-[#94A3B8] hover:bg-[#EFECE4] dark:hover:bg-[#182032]"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex gap-1 px-5 pt-3 border-b border-[#E6E2D8] dark:border-[#232E42]">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition ${active ? 'border-[#D96B27] text-[#D96B27]' : 'border-transparent text-[#6E6A61] dark:text-[#94A3B8] hover:text-[#181715] dark:hover:text-[#F1F5F9]'}`}>
                <Icon className="w-3.5 h-3.5" /><span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-5 flex flex-col gap-4">
          {tab === 'share' && (
            <>
              <div className="flex items-center gap-2">
                <input readOnly value={shareUrl} className="flex-1 px-3 py-2 rounded-xl text-xs bg-[#F6F4EF] dark:bg-[#0A0D14] border border-[#E6E2D8] dark:border-[#232E42] select-all" />
                <button type="button" onClick={() => copyText('url', shareUrl)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D96B27] hover:bg-[#C25C1B] text-white text-xs font-semibold">
                  {copiedKey === 'url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}<span>{copiedKey === 'url' ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#F6F4EF] dark:bg-[#0A0D14] border border-[#E6E2D8] dark:border-[#232E42]">
                <svg viewBox="0 0 21 21" className="w-20 h-20 p-1.5 rounded-xl bg-[#FFFFFF] border border-[#E6E2D8] shrink-0">
                  {qrCells.map((row, y) => row.map((on, x) => on && <rect key={`${x}-${y}`} x={x} y={y} width={0.95} height={0.95} fill="#181715" />))}
                </svg>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D96B27]">Social Card &amp; QR</span>
                  <span className="text-sm font-semibold truncate">{currentGame.title}</span>
                  <span className="text-[11px] text-[#6E6A61] dark:text-[#94A3B8]">{(currentGame.game_config?.game_mode || '3d world').replaceAll('_', ' ')} • Playable on desktop &amp; mobile</span>
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-[#D96B27] hover:underline mt-0.5"><ExternalLink className="w-3 h-3" /><span>Open Public Link</span></a>
                </div>
              </div>
            </>
          )}

          {tab === 'embed' && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={responsive} onChange={(e) => setResponsive(e.target.checked)} className="accent-[#D96B27]" />
                  <span>Responsive 16:9</span>
                </label>
                {!responsive && (
                  <div className="flex items-center gap-1.5">
                    <input type="number" value={width} onChange={(e) => setWidth(e.target.value)} className="w-16 px-2 py-1 rounded-lg bg-[#F6F4EF] dark:bg-[#0A0D14] border border-[#E6E2D8] dark:border-[#232E42]" />
                    <span>&times;</span>
                    <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-16 px-2 py-1 rounded-lg bg-[#F6F4EF] dark:bg-[#0A0D14] border border-[#E6E2D8] dark:border-[#232E42]" />
                  </div>
                )}
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hideWatermark} onChange={(e) => setHideWatermark(e.target.checked)} className="accent-[#D96B27]" />
                  <span>Hide Spawn.gg Watermark (Pro)</span>
                </label>
              </div>
              <textarea readOnly rows={4} value={embedCode} className="w-full p-3 rounded-xl font-mono text-[11px] bg-[#F6F4EF] dark:bg-[#0A0D14] border border-[#E6E2D8] dark:border-[#232E42]" />
              <button type="button" onClick={() => copyText('embed', embedCode)} className="self-end flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D96B27] hover:bg-[#C25C1B] text-white text-xs font-semibold">
                {copiedKey === 'embed' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}<span>{copiedKey === 'embed' ? 'Snippet Copied' : 'Copy <iframe> Code'}</span>
              </button>
            </>
          )}

          {tab === 'download' && (
            <div className="flex flex-col gap-3">
              <div className="p-3.5 rounded-2xl bg-[#F6F4EF] dark:bg-[#0A0D14] border border-[#E6E2D8] dark:border-[#232E42] flex flex-col gap-1 text-xs">
                <span className="font-semibold">{currentGame.title} (.html bundle)</span>
                <span className="text-[#6E6A61] dark:text-[#94A3B8]">Self-contained HTML5 WebGL playable with serialized level config (`window.__SPAWN_GAME_BUNDLE__`), HUD &amp; Three.js runtime loader — host on Vercel, itch.io, S3, or any static site.</span>
              </div>
              <button type="button" onClick={handleDownload} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#D96B27] hover:bg-[#C25C1B] text-white text-xs font-semibold">
                {copiedKey === 'downloaded' ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                <span>{copiedKey === 'downloaded' ? 'Downloaded Playable .html' : 'Download Playable Build (.html)'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

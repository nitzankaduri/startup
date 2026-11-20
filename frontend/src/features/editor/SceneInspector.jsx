import { Check, Copy, MousePointerClick, Play, RotateCw, Trash2 } from 'lucide-react';
import { useSceneEditorStore } from '../sandbox/store/useSceneEditorStore';
import { SWATCH_PALETTE } from './sceneEditUtils';

export function SceneInspector() {
  const isEditMode = useSceneEditorStore((s) => s.isEditMode);
  const meta = useSceneEditorStore((s) => s.selectedMeta);
  const setEditMode = useSceneEditorStore((s) => s.setEditMode);
  const updateSelectedScale = useSceneEditorStore((s) => s.updateSelectedScale);
  const updateSelectedRotationDeg = useSceneEditorStore((s) => s.updateSelectedRotationDeg);
  const updateSelectedStats = useSceneEditorStore((s) => s.updateSelectedStats);
  const applySelectedColor = useSceneEditorStore((s) => s.applySelectedColor);
  const duplicateSelected = useSceneEditorStore((s) => s.duplicateSelected);
  const deleteSelected = useSceneEditorStore((s) => s.deleteSelected);

  if (!isEditMode) return null;

  return (
    <aside className="fixed top-20 right-4 z-30 w-72 bg-[#FFFFFF]/95 dark:bg-[#111622]/95 backdrop-blur-md border border-[#E6E2D8] dark:border-[#232E42] rounded-2xl p-4 shadow-[0_8px_28px_rgba(24,22,18,0.12)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.55)] flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#D96B27] shrink-0" />
          <h3 className="text-xs font-semibold text-[#181715] dark:text-[#F1F5F9] truncate">
            {meta ? meta.label : 'Scene Inspector'}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setEditMode(false)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#D96B27] hover:bg-[#C25C1B] text-white text-[11px] font-semibold transition shrink-0"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Play</span>
        </button>
      </div>

      {!meta ? (
        <div className="py-6 px-3 rounded-xl bg-[#F6F4EF] dark:bg-[#0A0D14] border border-dashed border-[#E6E2D8] dark:border-[#232E42] text-center flex flex-col items-center gap-2">
          <MousePointerClick className="w-5 h-5 text-[#D96B27]" />
          <p className="text-xs font-medium text-[#181715] dark:text-[#F1F5F9]">Click any 3D object</p>
          <p className="text-[11px] text-[#6E6A61] dark:text-[#94A3B8]">Drag to orbit camera. Click props or characters to scale, rotate, tint, or clone.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          <label className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#6E6A61] dark:text-[#94A3B8]">Scale</span>
              <span className="font-semibold text-[#181715] dark:text-[#F1F5F9] tabular-nums">{meta.scale}x</span>
            </div>
            <input
              type="range" min={0.3} max={3.5} step={0.05} value={meta.scale}
              onChange={(e) => updateSelectedScale(e.target.value)}
              className="w-full accent-[#D96B27] cursor-pointer"
            />
          </label>

          <label className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px]">
              <span className="flex items-center gap-1 text-[#6E6A61] dark:text-[#94A3B8]"><RotateCw className="w-3 h-3" /> Rotation Y</span>
              <span className="font-semibold text-[#181715] dark:text-[#F1F5F9] tabular-nums">{meta.rotationDeg}°</span>
            </div>
            <input
              type="range" min={-180} max={180} step={5} value={meta.rotationDeg}
              onChange={(e) => updateSelectedRotationDeg(e.target.value)}
              className="w-full accent-[#D96B27] cursor-pointer"
            />
          </label>

          {meta.hasEntityStats && (
            <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-[#E6E2D8] dark:border-[#232E42]">
              <label className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#6E6A61] dark:text-[#94A3B8]">Speed</span>
                  <span className="font-semibold text-[#181715] dark:text-[#F1F5F9] tabular-nums">{meta.speed}</span>
                </div>
                <input
                  type="range" min={2} max={24} step={0.5} value={meta.speed}
                  onChange={(e) => updateSelectedStats({ speed: e.target.value })}
                  className="w-full accent-[#D96B27] cursor-pointer"
                />
              </label>
              <label className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#6E6A61] dark:text-[#94A3B8]">HP</span>
                  <span className="font-semibold text-[#181715] dark:text-[#F1F5F9] tabular-nums">{meta.hp}</span>
                </div>
                <input
                  type="range" min={20} max={400} step={10} value={meta.hp}
                  onChange={(e) => updateSelectedStats({ hp: e.target.value })}
                  className="w-full accent-[#D96B27] cursor-pointer"
                />
              </label>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] text-[#6E6A61] dark:text-[#94A3B8]">Material Tint</span>
            <div className="grid grid-cols-8 gap-1.5">
              {SWATCH_PALETTE.map((sw) => (
                <button
                  key={sw.hex}
                  type="button"
                  title={sw.name}
                  onClick={() => applySelectedColor(sw.hex)}
                  style={{ backgroundColor: sw.hex }}
                  className={`w-6 h-6 rounded-full border transition flex items-center justify-center ${
                    meta.color === sw.hex ? 'border-[#181715] dark:border-[#F1F5F9] scale-110' : 'border-[#E6E2D8] dark:border-[#232E42] hover:scale-105'
                  }`}
                >
                  {meta.color === sw.hex && <Check className="w-3 h-3 text-[#181715] mix-blend-difference" />}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E6E2D8] dark:border-[#232E42]">
            <button
              type="button"
              onClick={duplicateSelected}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#EFECE4] dark:bg-[#182032] border border-[#E6E2D8] dark:border-[#232E42] text-xs font-medium text-[#181715] dark:text-[#F1F5F9] hover:border-[#D96B27] transition"
            >
              <Copy className="w-3.5 h-3.5" /><span>Duplicate</span>
            </button>
            <button
              type="button"
              onClick={deleteSelected}
              className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#FEF2F2] dark:bg-[#2A1618] border border-[#FECACA] dark:border-[#5C2428] text-xs font-medium text-[#B91C1C] dark:text-[#FCA5A5] hover:opacity-85 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /><span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

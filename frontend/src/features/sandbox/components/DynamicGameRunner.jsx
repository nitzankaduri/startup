import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fixCode } from '../../../shared/api/gameApi';
import { compileGameCode } from '../sdk/compileGameCode';
import { StudioBackdrop } from '../sdk/MeshBuilder';
import { useGameStore } from '../store/useGameStore';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';

export function DynamicGameRunner({ gameConfig, prompt = '', onFatalError }) {
  const code = gameConfig?.code || gameConfig?.generated_code || '';
  const attemptsRef = useRef(0);
  const [healing, setHealing] = useState(false);

  const registerHud = useGameStore((s) => s.registerHud);
  const setTelemetry = useGameStore((s) => s.setTelemetry);
  const triggerWin = useGameStore((s) => s.triggerWin);
  const triggerGameOver = useGameStore((s) => s.triggerGameOver);
  const setGeneratedCode = useGameStore((s) => s.setGeneratedCode);

  useEffect(() => {
    attemptsRef.current = 0;
  }, [prompt]);

  const healCode = useCallback(async (errOrMsg) => {
    const errorMsg = errOrMsg?.message || String(errOrMsg || 'Dynamic scene runtime error');
    setTelemetry({ synthesisError: errorMsg });
    if (!code || healing || attemptsRef.current >= 2) {
      onFatalError?.(errOrMsg instanceof Error ? errOrMsg : new Error(errorMsg));
      return;
    }
    attemptsRef.current += 1;
    setHealing(true);
    try {
      const res = await fixCode({ code, error: errorMsg, prompt });
      if (res?.code) { setTelemetry({ synthesisError: '' }); setGeneratedCode(res.code); }
      else onFatalError?.(new Error(errorMsg));
    } catch (fixErr) {
      const detail = fixErr?.message || errorMsg;
      setTelemetry({ synthesisError: detail });
      onFatalError?.(new Error(detail));
    } finally {
      setHealing(false);
    }
  }, [code, healing, prompt, setGeneratedCode, setTelemetry, onFatalError]);

  const onScore = useCallback((pts) => setTelemetry({ runnerScore: pts, score: pts }), [setTelemetry]);

  const compiled = useMemo(() => {
    if (!code) return { Comp: null, err: null };
    try {
      return {
        Comp: compileGameCode(code, { registerHud, onScore, onWin: triggerWin, onGameOver: triggerGameOver, onTelemetry: setTelemetry }),
        err: null,
      };
    } catch (err) {
      return { Comp: null, err };
    }
  }, [code, registerHud, onScore, triggerWin, triggerGameOver, setTelemetry]);

  useEffect(() => {
    if (compiled.err) healCode(compiled.err);
  }, [compiled.err, healCode]);

  const env = gameConfig?.environment || {};
  return (
    <>
      <StudioBackdrop skyHorizon={env.sky_color || '#E8DFD5'} skyTop="#9CC7EC" sunIntensity={env.ambient_intensity ? env.ambient_intensity * 2 : 2.0} />
      {compiled.Comp && (
        <CanvasErrorBoundary inline resetKey={code} onError={(err) => healCode(err)}>
          <compiled.Comp
            registerHud={registerHud}
            onScore={onScore}
            onWin={triggerWin}
            onGameOver={triggerGameOver}
            onTelemetry={setTelemetry}
          />
        </CanvasErrorBoundary>
      )}
    </>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from '../../../../shared/audio/soundEngine';

/** State manager for gold/energy/wood economy, passive income ticks, tier multipliers, and +income popups. */
export function useEconomy({ initial = { gold: 150, energy: 50, wood: 100 }, tickMs = 2000 } = {}) {
  const [resources, setResources] = useState(initial);
  const [popups, setPopups] = useState([]);
  const gensRef = useRef(new Map());

  const canAfford = useCallback((cost = {}) => (
    Object.entries(cost).every(([k, v]) => (resources[k] || 0) >= v)
  ), [resources]);

  const spend = useCallback((cost = {}) => {
    let ok = false;
    setResources((prev) => {
      if (!Object.entries(cost).every(([k, v]) => (prev[k] || 0) >= v)) return prev;
      ok = true;
      const next = { ...prev };
      Object.entries(cost).forEach(([k, v]) => { next[k] = (next[k] || 0) - v; });
      return next;
    });
    return ok;
  }, []);

  const earn = useCallback((delta = {}, position) => {
    setResources((prev) => {
      const next = { ...prev };
      Object.entries(delta).forEach(([k, v]) => { next[k] = (next[k] || 0) + v; });
      return next;
    });
    if (position) {
      const label = Object.entries(delta).map(([k, v]) => `+${v} ${k}`).join(' ');
      const id = `${Date.now()}-${Math.random()}`;
      setPopups((p) => [...p.slice(-10), { id, text: label, position, at: performance.now() }]);
    }
  }, []);

  const registerGenerator = useCallback((id, config) => {
    gensRef.current.set(id, { tier: 1, yields: { gold: 25 }, ...config });
  }, []);

  const unregisterGenerator = useCallback((id) => {
    gensRef.current.delete(id);
  }, []);

  const upgradeGenerator = useCallback((id, cost = { gold: 50 }) => {
    const gen = gensRef.current.get(id);
    if (!gen || !canAfford(cost)) return false;
    spend(cost);
    gen.tier = (gen.tier || 1) + 1;
    soundEngine.playKeyUnlock();
    return true;
  }, [canAfford, spend]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = performance.now();
      setPopups((prev) => prev.filter((p) => now - p.at < 1200));
      if (!gensRef.current.size) return;
      const batch = {};
      const newPopups = [];
      gensRef.current.forEach((g, key) => {
        const mult = 1 + ((g.tier || 1) - 1) * 0.6;
        const parts = [];
        Object.entries(g.yields || {}).forEach(([res, amt]) => {
          const val = Math.round(amt * mult);
          batch[res] = (batch[res] || 0) + val;
          parts.push(`+${val}`);
        });
        if (g.position && parts.length) {
          newPopups.push({ id: `${key}-${now}`, text: parts.join(' '), position: g.position, at: now });
        }
      });
      if (Object.keys(batch).length) {
        setResources((prev) => {
          const next = { ...prev };
          Object.entries(batch).forEach(([k, v]) => { next[k] = (next[k] || 0) + v; });
          return next;
        });
      }
      if (newPopups.length) setPopups((prev) => [...prev.slice(-8), ...newPopups]);
    }, tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  return {
    resources, canAfford, spend, earn, popups,
    registerGenerator, unregisterGenerator, upgradeGenerator,
  };
}

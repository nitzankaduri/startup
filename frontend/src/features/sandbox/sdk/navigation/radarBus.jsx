export const radarBus = {
  blips: new Map(),
  pointers: new Map(),
};

/** Registers or updates a live radar blip ('enemy' | 'collectible' | 'objective'). Returns cleanup fn. */
export function registerRadarBlip(id, { type = 'objective', position = [0, 0, 0], label = '' } = {}) {
  if (!id) return () => {};
  radarBus.blips.set(id, { id, type, position: [...position], label });
  return () => {
    radarBus.blips.delete(id);
  };
}

export function unregisterRadarBlip(id) {
  radarBus.blips.delete(id);
  radarBus.pointers.delete(id);
}

export function resetRadarBus() {
  radarBus.blips.clear();
  radarBus.pointers.clear();
}

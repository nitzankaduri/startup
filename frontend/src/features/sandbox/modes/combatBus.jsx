export const combatBus = {
  playerPos: { x: 0, y: 2, z: 0 },
  playerFacing: { x: 0, z: -1 },
  enemies: new Map(),
};

export function resetCombatBus() {
  combatBus.playerPos = { x: 0, y: 2, z: 0 };
  combatBus.playerFacing = { x: 0, z: -1 };
  combatBus.enemies.clear();
}

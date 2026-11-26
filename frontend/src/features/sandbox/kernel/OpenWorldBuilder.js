export const CITY_HALF = 88;
export const STREET_LINES = [-60, -20, 20, 60];
const BLOCK_CENTERS = [-40, 0, 40];

const BUILDING_PALETTE = ['#CBD5E1', '#E2E8F0', '#FDE68A', '#93C5FD', '#FCA5A5', '#D6D3D1', '#A7F3D0'];
const PROP_KINDS = ['hydrant', 'crate', 'barrier'];

/**
 * Generates deterministic 180x180 open-world city layout:
 * - Intersecting wide avenues at [-60, -20, 20, 60]
 * - Open Central Plaza at (0, 0) for spawn
 * - 24 varied landmark buildings with AABB collision boxes
 * - 28 destructible street props (hydrants, crates, barriers)
 */
export function buildOpenWorldData() {
  const buildings = [];
  let seq = 1;
  for (let bx = 0; bx < BLOCK_CENTERS.length; bx += 1) {
    for (let bz = 0; bz < BLOCK_CENTERS.length; bz += 1) {
      const cx = BLOCK_CENTERS[bx];
      const cz = BLOCK_CENTERS[bz];
      if (cx === 0 && cz === 0) continue; // Keep Central Plaza open around spawn
      const offsets = [[-6.5, -6.5], [6.5, -6.5], [-6.5, 6.5], [6.5, 6.5]];
      for (let k = 0; k < offsets.length; k += 1) {
        if ((bx + bz + k) % 4 === 3) continue; // Leave mini-plaza corners
        seq += 1;
        const w = 7.5 + (seq % 3) * 1.4;
        const d = 7.5 + ((seq + 1) % 3) * 1.4;
        const h = 8 + (seq % 5) * 4.5;
        buildings.push({
          x: cx + offsets[k][0],
          z: cz + offsets[k][1],
          halfX: w * 0.5,
          halfZ: d * 0.5,
          width: w,
          depth: d,
          height: h,
          color: BUILDING_PALETTE[seq % BUILDING_PALETTE.length],
        });
      }
    }
  }

  const props = [];
  for (let i = 0; i < 28; i += 1) {
    const onX = i % 2 === 0;
    const road = STREET_LINES[i % STREET_LINES.length];
    const side = i % 4 < 2 ? -7.8 : 7.8;
    const along = -76 + ((i * 23) % 152);
    props.push({
      alive: true,
      kind: PROP_KINDS[i % PROP_KINDS.length],
      x: onX ? road + side : along,
      y: 0.55,
      z: onX ? along : road + side,
    });
  }

  const beacons = [
    [60, -60], [-60, -20], [20, 60], [-60, 60], [60, 20], [-20, -60],
  ];

  return { buildings, props, beacons };
}

/** Smooth AABB wall collision sliding for both on-foot players, vehicles & enforcers. */
export function resolveBuildingCollisions(entity, radius, buildings, speedKey = null) {
  let hitWall = false;
  if (entity.x > CITY_HALF) { entity.x = CITY_HALF; hitWall = true; }
  if (entity.x < -CITY_HALF) { entity.x = -CITY_HALF; hitWall = true; }
  if (entity.z > CITY_HALF) { entity.z = CITY_HALF; hitWall = true; }
  if (entity.z < -CITY_HALF) { entity.z = -CITY_HALF; hitWall = true; }
  if (!buildings?.length) return hitWall;

  for (let i = 0; i < buildings.length; i += 1) {
    const b = buildings[i];
    const ox = b.halfX + radius - Math.abs(entity.x - b.x);
    const oz = b.halfZ + radius - Math.abs(entity.z - b.z);
    if (ox > 0 && oz > 0) {
      hitWall = true;
      if (ox < oz) {
        entity.x += entity.x >= b.x ? ox : -ox;
        if (entity.vx) entity.vx = 0;
      } else {
        entity.z += entity.z >= b.z ? oz : -oz;
        if (entity.vz) entity.vz = 0;
      }
      if (speedKey && entity[speedKey]) entity[speedKey] *= 0.65;
    }
  }
  return hitWall;
}

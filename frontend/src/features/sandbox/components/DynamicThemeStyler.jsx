/**
 * Resolves dynamic prompt-driven themeConfig and entitySkins for environments, obstacles, and player attachments.
 */
export function resolveWorldThemePalette(world) {
  const tc = world?.themeConfig || {};
  const skins = world?.entitySkins || {};
  return {
    theme: world?.theme || 'sunny_city',
    obstacleColor: skins.obstacleColor || tc.accentColor || '#D96B27',
    coinColor: skins.coinColor || '#FBBF24',
    propColor: tc.groundColor || '#10B981',
    projectileColor: skins.projectileColor || tc.accentColor || '#F59E0B',
    playerAttachment: skins.playerAttachment || null,
  };
}

/** Stylized prompt-driven player attachment (pirate_hat, jetpack, wings, wizard_staff). */
export function PlayerSkinAttachment({ attachment, color = '#D96B27' }) {
  if (!attachment) return null;
  if (attachment === 'pirate_hat') {
    return (
      <group position={[0, 0.86, 0]}>
        <mesh><cylinderGeometry args={[0.38, 0.42, 0.14, 10]} /><meshToonMaterial color="#1E1B4B" /></mesh>
        <mesh position={[0, 0.14, 0]}><coneGeometry args={[0.26, 0.28, 6]} /><meshToonMaterial color="#D96B27" /></mesh>
      </group>
    );
  }
  if (attachment === 'wings') {
    return (
      <group position={[0, 0.15, -0.22]}>
        {[-0.42, 0.42].map((x) => (
          <mesh key={x} position={[x, 0.08, 0]} rotation={[0, 0, x < 0 ? 0.35 : -0.35]}>
            <boxGeometry args={[0.62, 0.28, 0.08]} /><meshToonMaterial color={color} />
          </mesh>
        ))}
      </group>
    );
  }
  if (attachment === 'wizard_staff') {
    return (
      <group position={[0.46, 0.1, 0.12]}>
        <mesh><cylinderGeometry args={[0.04, 0.04, 1.4, 8]} /><meshToonMaterial color="#78350F" /></mesh>
        <mesh position={[0, 0.76, 0]}><octahedronGeometry args={[0.14, 0]} /><meshToonMaterial color={color} /></mesh>
      </group>
    );
  }
  return (
    <group position={[0, 0.05, -0.24]}>
      {[-0.14, 0.14].map((x) => (
        <mesh key={x} position={[x, 0, 0]}><cylinderGeometry args={[0.09, 0.09, 0.55, 8]} /><meshToonMaterial color={color} /></mesh>
      ))}
    </group>
  );
}

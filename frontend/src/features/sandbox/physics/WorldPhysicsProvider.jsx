import { Component, Suspense, createContext, useContext } from 'react';
import { Physics, RigidBody } from '@react-three/rapier';

const PhysicsWorldContext = createContext(false);

class PhysicsBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? (this.props.fallback ?? null) : this.props.children; }
}

export function useIsInsidePhysics() {
  return useContext(PhysicsWorldContext);
}

/**
 * Wraps the entire 3D world in Rapier <Physics gravity={[0, -22, 0]}> with a
 * crash-safe boundary and context signal for automatic static fixed colliders.
 */
export function WorldPhysicsProvider({
  runId = 0,
  paused = false,
  gravity = [0, -22, 0],
  children,
}) {
  return (
    <PhysicsWorldContext.Provider value={true}>
      <PhysicsBoundary fallback={children}>
        <Suspense fallback={null}>
          <Physics key={runId} paused={paused} gravity={gravity}>
            {children}
          </Physics>
        </Suspense>
      </PhysicsBoundary>
    </PhysicsWorldContext.Provider>
  );
}

/**
 * Automatic static RigidBody type="fixed" collider wrapper for roads, terrain,
 * and buildings. Safely degrades to a plain group if rendered outside <Physics>.
 */
export function StaticPhysicsBody({
  colliders = 'cuboid',
  friction = 0.86,
  restitution = 0.05,
  position,
  rotation,
  children,
}) {
  const inPhysics = useIsInsidePhysics();
  if (!inPhysics) {
    return (
      <group position={position} rotation={rotation}>
        {children}
      </group>
    );
  }
  return (
    <RigidBody
      type="fixed"
      colliders={colliders}
      friction={friction}
      restitution={restitution}
      position={position}
      rotation={rotation}
    >
      {children}
    </RigidBody>
  );
}

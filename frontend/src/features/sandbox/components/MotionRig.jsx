import { RealisticPhysicsRig } from '../sdk/RealisticPhysicsRig';

export function MotionRig({ children, isVehicle = false }) {
  return <RealisticPhysicsRig isVehicle={isVehicle}>{children}</RealisticPhysicsRig>;
}

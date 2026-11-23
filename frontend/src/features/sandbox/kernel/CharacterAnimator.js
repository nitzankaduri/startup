/**
 * Multi-joint procedural character animator (zero per-frame allocations):
 * stride cycle proportional to forward speed, sprint lean, jump tuck, slide crouch & waving cape.
 */
export function animateCharacterJoints(group, { t = 0, speed = 12, grounded = true, sliding = false, boosting = false }) {
  const j = group?.userData?.joints;
  if (!j) return;

  const freq = Math.max(6, speed * 0.85);
  const swing = grounded && !sliding ? Math.sin(t * freq) * 0.78 : 0;

  if (sliding && grounded) {
    group.position.y = -0.35;
    if (j.torso) j.torso.rotation.x = 0.75;
    if (j.lLeg) j.lLeg.rotation.x = -0.9;
    if (j.rLeg) j.rLeg.rotation.x = -0.5;
    if (j.lArm) j.lArm.rotation.x = 0.5;
    if (j.rArm) j.rArm.rotation.x = 0.5;
  } else if (!grounded) {
    group.position.y = 0;
    if (j.torso) j.torso.rotation.x = -0.15;
    if (j.lLeg) j.lLeg.rotation.x = 0.85;
    if (j.rLeg) j.rLeg.rotation.x = -0.35;
    if (j.lArm) j.lArm.rotation.x = -0.95;
    if (j.rArm) j.rArm.rotation.x = 0.55;
  } else {
    group.position.y = Math.abs(Math.cos(t * freq)) * 0.08;
    if (j.torso) j.torso.rotation.x = boosting ? -0.34 : -0.18;
    if (j.lLeg) j.lLeg.rotation.x = swing;
    if (j.rLeg) j.rLeg.rotation.x = -swing;
    if (j.lArm) j.lArm.rotation.x = -swing * 0.9;
    if (j.rArm) j.rArm.rotation.x = swing * 0.9;
  }

  if (j.cape) {
    j.cape.rotation.x = (boosting ? 0.95 : 0.45) + Math.sin(t * 14) * 0.24;
  }
}

/**
 * Post-processing pass cleanly bypassed to keep direct WebGL2 ACESFilmicToneMapping active
 * and prevent Three.js r187 / EffectComposer FBO version-mismatch black screens.
 */
export function PostFX() {
  return null;
}

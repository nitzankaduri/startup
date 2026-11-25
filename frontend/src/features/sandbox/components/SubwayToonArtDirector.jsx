import { StudioVisualRig } from '../kernel/StudioVisualRig';

/** Global stylized cartoon lighting, FogExp2 depth & multi-stop gradient sky dome. */
export function SubwayToonArtDirector({ theme = 'sunny_city', mode = 'endless_runner', lighting = true, children }) {
  return <StudioVisualRig theme={theme} mode={mode} lighting={lighting}>{children}</StudioVisualRig>;
}

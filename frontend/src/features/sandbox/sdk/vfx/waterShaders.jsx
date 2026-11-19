export const WATER_VERT = `
  uniform float uTime;
  uniform float uWaveScale;
  uniform float uSpeed;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vCrest;

  float waveH(vec2 p, float t) {
    float w1 = sin(p.x * 0.24 + t * 1.35) * cos(p.y * 0.19 + t * 0.9);
    float w2 = sin((p.x * 0.45 - p.y * 0.35) + t * 1.9) * 0.45;
    float w3 = cos((p.x * 0.8 + p.y * 0.72) - t * 2.4) * 0.2;
    return (w1 + w2 + w3) * uWaveScale;
  }

  void main() {
    vec3 pos = position;
    vec4 wp = modelMatrix * vec4(pos, 1.0);
    float t = uTime * uSpeed;
    float h = waveH(wp.xz, t);
    float hx = waveH(wp.xz + vec2(0.35, 0.0), t);
    float hz = waveH(wp.xz + vec2(0.0, 0.35), t);
    pos.z += h;
    vNormal = normalize(vec3((h - hx) / 0.35, 1.0, (h - hz) / 0.35));
    vCrest = clamp((h / max(0.05, uWaveScale)) * 0.5 + 0.5, 0.0, 1.0);
    vec4 finalWorld = modelMatrix * vec4(pos, 1.0);
    vWorldPos = finalWorld.xyz;
    gl_Position = projectionMatrix * viewMatrix * finalWorld;
  }
`;

export const WATER_FRAG = `
  uniform float uTime;
  uniform float uMode;
  uniform vec3 uDeepColor;
  uniform vec3 uShallowColor;
  uniform vec3 uFoamColor;
  uniform vec3 uSkyColor;
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  varying float vCrest;

  void main() {
    vec2 uv = vWorldPos.xz * 0.12 + vec2(uTime * 0.06, -uTime * 0.04);
    float r1 = sin(uv.x * 9.0 + sin(uv.y * 7.0 + uTime)) * cos(uv.y * 8.0 - uTime * 0.8);
    float r2 = cos(uv.x * 16.0 - uv.y * 13.0 + uTime * 1.4) * 0.5;
    float ripple = r1 + r2;
    vec3 N = normalize(vNormal + vec3(r1 * 0.09, 0.0, r2 * 0.09));
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 L = normalize(vec3(0.48, 0.62, 0.42));

    if (uMode > 1.5) {
      float veins = smoothstep(0.45, 0.88, abs(ripple) * 0.45 + vCrest * 0.55);
      vec3 magma = mix(uDeepColor, uFoamColor, veins);
      gl_FragColor = vec4(magma * (1.0 + veins * 0.9), 1.0);
      return;
    }

    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2);
    vec3 waterBody = mix(uDeepColor, uShallowColor, clamp(vCrest * 0.72, 0.0, 1.0));
    vec3 reflectedSky = mix(uShallowColor, uSkyColor, 0.65);
    vec3 baseCol = mix(waterBody, reflectedSky, clamp(fresnel * 0.82, 0.0, 0.88));

    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 72.0) * 1.25;
    float shoreDist = length(vWorldPos.xz);
    float shoreFoam = smoothstep(14.0, 18.5, shoreDist) * (1.0 - smoothstep(18.5, 22.0, shoreDist));
    float foam = smoothstep(0.76, 0.94, vCrest + ripple * 0.1 + shoreFoam * 0.55);
    vec3 col = mix(baseCol, uFoamColor, foam * 0.68) + vec3(1.0, 0.95, 0.86) * spec;
    gl_FragColor = vec4(col, uMode > 1.2 ? 0.95 : 0.9);
  }
`;

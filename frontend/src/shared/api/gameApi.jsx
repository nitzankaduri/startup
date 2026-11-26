const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

async function parseErrorDetail(res) {
  const raw = await res.text().catch(() => '');
  let message = raw?.trim() || res.statusText || `Request failed (${res.status})`;
  try {
    const parsed = JSON.parse(raw);
    const detail = parsed?.response?.data?.detail || parsed?.detail || parsed?.message;
    if (detail) message = typeof detail === 'string' ? detail : JSON.stringify(detail);
  } catch {
    // Keep plain text error
  }
  return message;
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  } catch {
    throw new Error(`Cannot reach Spawn.gg backend (${API_BASE}). Make sure FastAPI is running on port 8000.`);
  }
  if (!res.ok) throw new Error(await parseErrorDetail(res));
  return res.json();
}

export function generateGame(prompt, dimension = '3d') {
  return request('/api/games/generate', { method: 'POST', body: JSON.stringify({ prompt, dimension }) });
}

/** Streams real-time 1/3 -> 2/3 -> 3/3 synthesis progress via SSE, falling back to /api/games/generate. */
export async function generateGameStream(prompt, onProgress, dimension = '3d') {
  onProgress?.({ step: 1, total: 3, label: `1/3 Designing ${dimension === '2d' ? '2D arcade' : '3D world'} rules...` });
  let res;
  try {
    res = await fetch(`${API_BASE}/api/generate-stream`, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, dimension }),
    });
  } catch {
    throw new Error(`Cannot reach Spawn.gg backend (${API_BASE}). Make sure FastAPI is running on port 8000.`);
  }
  if (!res.ok) {
    if (res.status === 404) return generateGame(prompt, dimension);
    throw new Error(await parseErrorDetail(res));
  }
  const ctype = res.headers.get('content-type') || '';
  if (!ctype.includes('text/event-stream') || !res.body) return res.json();

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let finalResult = null;
  const dispatchBlock = (block) => {
    let ev = 'message'; let dataStr = '';
    block.split('\n').forEach((line) => {
      if (line.startsWith('event:')) ev = line.slice(6).trim();
      else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
    });
    if (!dataStr) return;
    const data = JSON.parse(dataStr);
    if (ev === 'progress') onProgress?.(data);
    else if (ev === 'result') finalResult = data;
    else if (ev === 'error') throw new Error(data.detail || 'Failed to generate world.');
  };
  while (true) {
    const { value, done } = await reader.read();
    if (value) buf += decoder.decode(value, { stream: true });
    let idx = buf.indexOf('\n\n');
    while (idx !== -1) {
      dispatchBlock(buf.slice(0, idx));
      buf = buf.slice(idx + 2);
      idx = buf.indexOf('\n\n');
    }
    if (done) break;
  }
  if (buf.trim()) dispatchBlock(buf.trim());
  if (!finalResult) throw new Error('Stream ended before world synthesis completed.');
  return finalResult;
}

export function remixGame(gameId, instruction, generatedCode = null) {
  return request('/api/remix', {
    method: 'POST',
    body: JSON.stringify({ game_id: gameId, instruction, ...(generatedCode ? { generated_code: generatedCode } : {}) }),
  });
}

export function refineGame({ currentSpec = null, instruction = null, current_world_json = null, current_code = null, refinement_prompt = null, game_title = 'Untitled 3D World', game_id = null }) {
  return request('/api/games/refine', {
    method: 'POST',
    body: JSON.stringify({
      ...(currentSpec ? { currentSpec } : {}),
      ...(instruction ? { instruction } : {}),
      ...(current_world_json ? { current_world_json } : {}),
      ...(current_code ? { current_code } : {}),
      ...(refinement_prompt ? { refinement_prompt } : {}),
      game_title,
      ...(game_id ? { game_id } : {}),
    }),
  });
}

export function fixCode({ code, error, prompt = '' }) {
  return request('/api/fix-code', { method: 'POST', body: JSON.stringify({ code, error, prompt }) });
}
export function fetchGames() { return request('/api/games'); }
export function fetchGameById(id) { return request(`/api/games/${encodeURIComponent(id)}`); }
export function uploadThumbnail(id, thumbnail) { return request(`/api/games/${encodeURIComponent(id)}/thumbnail`, { method: 'POST', body: JSON.stringify({ thumbnail }) }); }
export function recordGamePlay(id) { return request(`/api/games/${encodeURIComponent(id)}/play`, { method: 'POST' }); }
export function submitScore(id, payload) { return request(`/api/games/${encodeURIComponent(id)}/score`, { method: 'POST', body: JSON.stringify(payload) }); }

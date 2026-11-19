const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

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

  if (!res.ok) {
    const raw = await res.text().catch(() => '');
    let message = raw || `Request failed (${res.status})`;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.detail) message = typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail);
    } catch {
      // Keep plain text error
    }
    throw new Error(message);
  }

  return res.json();
}

export function generateGame(prompt) {
  return request('/api/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
}

export function remixGame(gameId, instruction, generatedCode = null) {
  return request('/api/remix', {
    method: 'POST',
    body: JSON.stringify({
      game_id: gameId,
      instruction,
      ...(generatedCode ? { generated_code: generatedCode } : {}),
    }),
  });
}

export function fixCode({ code, error, prompt = '' }) {
  return request('/api/fix-code', {
    method: 'POST',
    body: JSON.stringify({ code, error, prompt }),
  });
}

export function fetchGames() {
  return request('/api/games');
}

export function fetchGameById(id) {
  return request(`/api/games/${encodeURIComponent(id)}`);
}

export function uploadThumbnail(id, thumbnail) {
  return request(`/api/games/${encodeURIComponent(id)}/thumbnail`, {
    method: 'POST',
    body: JSON.stringify({ thumbnail }),
  });
}

export function recordGamePlay(id) {
  return request(`/api/games/${encodeURIComponent(id)}/play`, { method: 'POST' });
}

export function submitScore(id, payload) {
  return request(`/api/games/${encodeURIComponent(id)}/score`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

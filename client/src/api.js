export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  let request = { credentials: 'include', ...options, headers };

  if (options.body && typeof options.body !== 'string') {
    headers['content-type'] = 'application/json';
    request = { ...request, body: JSON.stringify(options.body) };
  }

  const response = await fetch(path, request);
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = { error: `Unexpected response (${response.status})` };
  }
  return { ok: response.ok, status: response.status, data };
}

export function formatTime(value) {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return value;
  }
}

export function formatMoney(value) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

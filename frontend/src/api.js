const BASE = 'http://127.0.0.1:8000';

export const api = {
  get: (path) => fetch(`${BASE}${path}`).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),
  post: (path, body) => fetch(`${BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => { if (!r.ok) return r.json().then(e => { throw new Error(e.detail || 'Error') }); return r.json(); }),
  del: (path) => fetch(`${BASE}${path}`, { method: 'DELETE' }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),
};

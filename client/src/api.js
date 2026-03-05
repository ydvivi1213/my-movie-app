const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const createRoom = (hostName) =>
  request('/rooms', { method: 'POST', body: JSON.stringify({ hostName }) });

export const joinRoom = (code, name) =>
  request(`/rooms/${code}/join`, { method: 'POST', body: JSON.stringify({ name }) });

export const getRoom = (code) =>
  request(`/rooms/${code}`);

export const submitPreferences = (code, participantId, text) =>
  request(`/rooms/${code}/preferences`, {
    method: 'POST',
    body: JSON.stringify({ participantId, text }),
  });

export const advancePhase = (code, hostId) =>
  request(`/rooms/${code}/advance`, {
    method: 'POST',
    body: JSON.stringify({ hostId }),
  });

export const submitVote = (code, participantId, movieId, vote) =>
  request(`/rooms/${code}/vote`, {
    method: 'POST',
    body: JSON.stringify({ participantId, movieId, vote }),
  });

export const setWinner = (code, hostId, movieId) =>
  request(`/rooms/${code}/winner`, {
    method: 'POST',
    body: JSON.stringify({ hostId, movieId }),
  });

export const getResults = (code) =>
  request(`/rooms/${code}/results`);

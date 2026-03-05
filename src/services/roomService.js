import { randomUUID } from 'crypto';

const rooms = new Map(); // code -> room

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I)

function generateCode() {
  let code;
  do {
    code = Array.from({ length: 6 }, () =>
      CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
    ).join('');
  } while (rooms.has(code));
  return code;
}

export function createRoom(hostName) {
  const code = generateCode();
  const hostId = randomUUID();
  const room = {
    code,
    hostId,
    state: 'lobby', // lobby | preferences | voting | results
    participants: [{ id: hostId, name: hostName, joinedAt: Date.now() }],
    preferences: {},       // { participantId: text }
    recommendations: [],   // set when advancing preferences -> voting
    votes: {},             // { participantId: { movieId: 'up' | 'down' } }
    winnerId: null,
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return { room, hostId };
}

export function joinRoom(code, name) {
  const room = rooms.get(code.toUpperCase());
  if (!room) throw new Error('Room not found');
  if (room.state !== 'lobby') throw new Error('This room has already started');

  const participantId = randomUUID();
  room.participants.push({ id: participantId, name, joinedAt: Date.now() });
  return { room, participantId };
}

export function getRoom(code) {
  return rooms.get(code.toUpperCase()) || null;
}

export function submitPreferences(code, participantId, text) {
  const room = getRoom(code);
  if (!room) throw new Error('Room not found');
  if (room.state !== 'preferences') throw new Error('Not in preferences phase');
  if (!room.participants.find(p => p.id === participantId)) throw new Error('Participant not found');

  room.preferences[participantId] = text;
  return room;
}

export function setRecommendations(code, movies) {
  const room = getRoom(code);
  if (!room) throw new Error('Room not found');
  room.recommendations = movies.map((m, i) => ({ ...m, id: String(i) }));
  return room;
}

export function submitVote(code, participantId, movieId, vote) {
  const room = getRoom(code);
  if (!room) throw new Error('Room not found');
  if (room.state !== 'voting') throw new Error('Not in voting phase');
  if (!room.participants.find(p => p.id === participantId)) throw new Error('Participant not found');
  if (!['up', 'down'].includes(vote)) throw new Error('Vote must be "up" or "down"');

  if (!room.votes[participantId]) room.votes[participantId] = {};
  room.votes[participantId][movieId] = vote;
  return room;
}

export function advancePhase(code, hostId) {
  const room = getRoom(code);
  if (!room) throw new Error('Room not found');
  if (room.hostId !== hostId) throw new Error('Only the host can advance the phase');

  const transitions = { lobby: 'preferences', preferences: 'voting', voting: 'results' };
  const next = transitions[room.state];
  if (!next) throw new Error(`Cannot advance from "${room.state}"`);

  room.state = next;
  return room;
}

export function setWinner(code, hostId, movieId) {
  const room = getRoom(code);
  if (!room) throw new Error('Room not found');
  if (room.state !== 'results') throw new Error('Not in results phase');
  if (room.hostId !== hostId) throw new Error('Only the host can pick the winner');

  room.winnerId = movieId;
  return room;
}

// Movies with no thumbs down, ranked by thumbs up count
export function computeResults(room) {
  return room.recommendations
    .map(movie => {
      let thumbsUp = 0;
      let thumbsDown = 0;
      for (const votes of Object.values(room.votes)) {
        const v = votes[movie.id];
        if (v === 'up') thumbsUp++;
        if (v === 'down') thumbsDown++;
      }
      return { ...movie, thumbsUp, thumbsDown };
    })
    .filter(m => m.thumbsDown === 0)
    .sort((a, b) => b.thumbsUp - a.thumbsUp);
}

// Public room shape — don't expose raw preferences or hostId
export function sanitize(room) {
  return {
    code: room.code,
    state: room.state,
    participants: room.participants.map(p => ({ id: p.id, name: p.name })),
    recommendations: room.recommendations,
    votes: room.votes,
    winnerId: room.winnerId,
    preferenceSubmitted: Object.keys(room.preferences), // who has submitted (not what)
  };
}

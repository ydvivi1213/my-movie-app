import { Router } from 'express';
import * as roomService from '../services/roomService.js';
import { getRecommendations } from '../services/recommendationService.js';

const router = Router();

// POST /api/rooms — create a room, returns code + participantId (which is also the hostId)
router.post('/', (req, res) => {
  const { hostName } = req.body;
  if (!hostName?.trim()) return res.status(400).json({ error: 'hostName is required' });

  try {
    const { room, hostId } = roomService.createRoom(hostName.trim());
    res.json({ code: room.code, participantId: hostId, room: roomService.sanitize(room) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms/:code/join
router.post('/:code/join', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

  try {
    const { room, participantId } = roomService.joinRoom(req.params.code, name.trim());
    res.json({ participantId, room: roomService.sanitize(room) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/rooms/:code — poll for room state
router.get('/:code', (req, res) => {
  const room = roomService.getRoom(req.params.code);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({ room: roomService.sanitize(room) });
});

// POST /api/rooms/:code/preferences — submit this participant's preferences
router.post('/:code/preferences', (req, res) => {
  const { participantId, text } = req.body;
  if (!participantId || !text?.trim()) {
    return res.status(400).json({ error: 'participantId and text are required' });
  }

  try {
    const room = roomService.submitPreferences(req.params.code, participantId, text.trim());
    res.json({ room: roomService.sanitize(room) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/rooms/:code/advance — host advances to the next phase
// When advancing preferences -> voting, this fetches recommendations first (may take a few seconds)
router.post('/:code/advance', async (req, res) => {
  const { hostId } = req.body;
  if (!hostId) return res.status(400).json({ error: 'hostId is required' });

  try {
    const room = roomService.getRoom(req.params.code);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    if (room.state === 'preferences') {
      const participants = room.participants
        .map(p => ({ name: p.name, preferences: room.preferences[p.id] || '' }))
        .filter(p => p.preferences);

      if (participants.length === 0) {
        return res.status(400).json({ error: 'No preferences have been submitted yet' });
      }

      const recommendations = await getRecommendations(participants);
      roomService.setRecommendations(req.params.code, recommendations);
    }

    const updated = roomService.advancePhase(req.params.code, hostId);
    res.json({ room: roomService.sanitize(updated) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/rooms/:code/vote — submit a thumbs up/down for one movie
router.post('/:code/vote', (req, res) => {
  const { participantId, movieId, vote } = req.body;
  if (!participantId || !movieId || !['up', 'down'].includes(vote)) {
    return res.status(400).json({ error: 'participantId, movieId, and vote ("up"|"down") are required' });
  }

  try {
    const room = roomService.submitVote(req.params.code, participantId, movieId, vote);
    res.json({ room: roomService.sanitize(room) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/rooms/:code/winner — host picks the winning movie
router.post('/:code/winner', (req, res) => {
  const { hostId, movieId } = req.body;
  if (!hostId || !movieId) return res.status(400).json({ error: 'hostId and movieId are required' });

  try {
    const room = roomService.setWinner(req.params.code, hostId, movieId);
    res.json({ room: roomService.sanitize(room) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/rooms/:code/results — ranked movies (no thumbs down, sorted by thumbs up)
router.get('/:code/results', (req, res) => {
  const room = roomService.getRoom(req.params.code);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const results = roomService.computeResults(room);
  res.json({ results, winnerId: room.winnerId });
});

export default router;

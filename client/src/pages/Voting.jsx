import { useState } from 'react';
import { submitVote, advancePhase } from '../api';

const s = {
  page: { minHeight: '100vh', padding: '2rem 1rem', display: 'flex', justifyContent: 'center' },
  container: { width: '100%', maxWidth: '560px' },
  movieCard: {
    background: '#18181f', border: '1px solid #2a2a35', borderRadius: '12px',
    padding: '1.25rem 1.5rem', marginBottom: '0.75rem',
    display: 'flex', alignItems: 'flex-start', gap: '1rem',
    transition: 'border-color 0.15s',
  },
  movieInfo: { flex: 1 },
  movieTitle: { fontSize: '1rem', fontWeight: 700, color: '#fff' },
  movieYear: { color: '#666', fontSize: '0.85rem', marginLeft: '0.4rem' },
  movieReason: { color: '#aaa', fontSize: '0.85rem', marginTop: '0.3rem', lineHeight: 1.5 },
  genreTags: { display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.6rem' },
  genreTag: { background: '#22222c', border: '1px solid #2e2e3c', borderRadius: '20px', color: '#888', fontSize: '0.75rem', padding: '0.2rem 0.6rem' },
  voteButtons: { display: 'flex', gap: '0.5rem', marginTop: '0.75rem' },
  voteBtn: (active, type) => ({
    padding: '0.45rem 1rem', border: '1px solid', borderRadius: '8px', fontSize: '0.875rem',
    fontWeight: 600, cursor: 'pointer',
    background: active ? (type === 'up' ? '#1a3a28' : '#2a1515') : '#0f0f13',
    borderColor: active ? (type === 'up' ? '#4caf7d' : '#e05c5c') : '#2a2a35',
    color: active ? (type === 'up' ? '#4caf7d' : '#e05c5c') : '#555',
    transition: 'all 0.12s',
  }),
  scoreBadge: (score) => ({
    minWidth: 40, height: 40, borderRadius: '8px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0,
    background: score >= 8 ? '#4caf7d' : score >= 5 ? '#e0a050' : '#888', color: '#fff',
  }),
  advanceBtn: {
    width: '100%', padding: '0.85rem', border: 'none', borderRadius: '8px',
    background: '#e05c5c', color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
    marginTop: '1rem',
  },
  progress: { color: '#888', fontSize: '0.875rem', marginBottom: '1.5rem' },
  error: { background: '#2a1515', border: '1px solid #5c2020', borderRadius: '8px', color: '#e05c5c', fontSize: '0.875rem', padding: '0.75rem', marginTop: '0.75rem' },
};

export default function Voting({ room, session }) {
  const [localVotes, setLocalVotes] = useState(() => {
    // Pre-populate from server state if participant already voted
    return room.votes[session.participantId] || {};
  });
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleVote(movieId, vote) {
    const newVotes = { ...localVotes, [movieId]: vote };
    setLocalVotes(newVotes);
    try {
      await submitVote(room.code, session.participantId, movieId, vote);
    } catch (err) {
      // Revert on failure
      setLocalVotes(localVotes);
      setError(err.message);
    }
  }

  async function handleAdvance() {
    setAdvanceLoading(true);
    setError('');
    try {
      await advancePhase(room.code, session.participantId);
    } catch (err) {
      setError(err.message);
      setAdvanceLoading(false);
    }
  }

  const votersWhoVoted = Object.keys(room.votes);
  const myVoteCount = Object.keys(localVotes).length;
  const totalMovies = room.recommendations.length;

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>Rate the picks</h1>
          <p style={s.progress}>
            {votersWhoVoted.length} of {room.participants.length} people voting · You've rated {myVoteCount}/{totalMovies}
          </p>
        </div>

        {room.recommendations.map(movie => {
          const myVote = localVotes[movie.id];
          return (
            <div key={movie.id} style={{
              ...s.movieCard,
              borderColor: myVote === 'up' ? '#2e4a3a' : myVote === 'down' ? '#3a2020' : '#2a2a35',
            }}>
              <div style={s.scoreBadge(movie.matchScore)}>{movie.matchScore}</div>
              <div style={s.movieInfo}>
                <div>
                  <span style={s.movieTitle}>{movie.title}</span>
                  <span style={s.movieYear}>{movie.year}</span>
                </div>
                <div style={s.movieReason}>{movie.reason}</div>
                <div style={s.genreTags}>
                  {movie.genres.map(g => <span key={g} style={s.genreTag}>{g}</span>)}
                </div>
                <div style={s.voteButtons}>
                  <button style={s.voteBtn(myVote === 'up', 'up')} onClick={() => handleVote(movie.id, 'up')}>
                    👍 In
                  </button>
                  <button style={s.voteBtn(myVote === 'down', 'down')} onClick={() => handleVote(movie.id, 'down')}>
                    👎 Out
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {session.isHost && (
          <>
            <button
              style={{ ...s.advanceBtn, opacity: advanceLoading ? 0.5 : 1 }}
              onClick={handleAdvance}
              disabled={advanceLoading}
            >
              {advanceLoading ? 'Loading…' : 'See results'}
            </button>
            {error && <div style={s.error}>{error}</div>}
          </>
        )}

        {!session.isHost && (
          <div style={{ color: '#888', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
            Waiting for the host to reveal results…
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { setWinner, getResults } from '../api';

const s = {
  page: { minHeight: '100vh', padding: '2rem 1rem', display: 'flex', justifyContent: 'center' },
  container: { width: '100%', maxWidth: '560px' },
  winnerBanner: {
    background: 'linear-gradient(135deg, #1a3a28, #0f2a1c)', border: '1px solid #4caf7d',
    borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center',
  },
  winnerLabel: { fontSize: '0.75rem', color: '#4caf7d', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' },
  winnerTitle: { fontSize: '1.6rem', fontWeight: 800, color: '#fff' },
  winnerYear: { color: '#888', fontSize: '0.9rem', marginLeft: '0.4rem' },
  winnerReason: { color: '#aaa', fontSize: '0.875rem', marginTop: '0.5rem', lineHeight: 1.5 },
  movieCard: (isWinner, isEliminated) => ({
    background: '#18181f',
    border: `1px solid ${isWinner ? '#4caf7d' : isEliminated ? '#2a2a35' : '#2a2a35'}`,
    borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '0.75rem',
    display: 'flex', alignItems: 'flex-start', gap: '1rem',
    opacity: isEliminated ? 0.4 : 1,
    cursor: 'pointer',
    transition: 'border-color 0.15s, opacity 0.15s',
  }),
  movieInfo: { flex: 1 },
  movieTitle: { fontSize: '1rem', fontWeight: 700, color: '#fff' },
  movieYear: { color: '#666', fontSize: '0.85rem', marginLeft: '0.4rem' },
  movieReason: { color: '#aaa', fontSize: '0.85rem', marginTop: '0.3rem', lineHeight: 1.5 },
  voteBar: { display: 'flex', gap: '0.75rem', marginTop: '0.6rem', fontSize: '0.875rem' },
  upVote: { color: '#4caf7d' },
  noVote: { color: '#555', fontStyle: 'italic', fontSize: '0.8rem' },
  genreTags: { display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.6rem' },
  genreTag: { background: '#22222c', border: '1px solid #2e2e3c', borderRadius: '20px', color: '#888', fontSize: '0.75rem', padding: '0.2rem 0.6rem' },
  rank: (n) => ({
    minWidth: 40, height: 40, borderRadius: '8px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 800, fontSize: '1rem', flexShrink: 0,
    background: n === 1 ? '#e05c5c' : '#22222c', color: '#fff',
  }),
  sectionLabel: { fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem', marginTop: '1.5rem' },
  emptyState: { color: '#888', fontSize: '0.9rem', padding: '1.5rem', textAlign: 'center', background: '#18181f', borderRadius: '12px', border: '1px solid #2a2a35' },
  pickHint: { color: '#888', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.5rem' },
  error: { background: '#2a1515', border: '1px solid #5c2020', borderRadius: '8px', color: '#e05c5c', fontSize: '0.875rem', padding: '0.75rem', marginTop: '0.75rem' },
};

export default function Results({ room, session }) {
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getResults(room.code)
      .then(data => setResults(data.results))
      .catch(err => setError(err.message));
  }, [room.code]);

  async function handlePickWinner(movieId) {
    if (!session.isHost) return;
    setError('');
    try {
      await setWinner(room.code, session.participantId, movieId);
    } catch (err) {
      setError(err.message);
    }
  }

  const winner = room.winnerId && results
    ? results.find(m => m.id === room.winnerId)
    : null;

  const eliminated = room.recommendations.filter(
    m => !results?.find(r => r.id === m.id)
  );

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
            {room.winnerId ? 'Tonight\'s pick' : 'Results are in'}
          </h1>
          {!room.winnerId && session.isHost && (
            <p style={{ color: '#888', fontSize: '0.875rem', marginTop: '0.3rem' }}>Tap a movie to pick it as tonight's winner</p>
          )}
        </div>

        {winner && (
          <div style={s.winnerBanner}>
            <div style={s.winnerLabel}>Tonight's pick</div>
            <div>
              <span style={s.winnerTitle}>{winner.title}</span>
              <span style={s.winnerYear}>{winner.year}</span>
            </div>
            <div style={s.winnerReason}>{winner.reason}</div>
          </div>
        )}

        {error && <div style={s.error}>{error}</div>}

        {results === null ? (
          <div style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>Loading results…</div>
        ) : results.length === 0 ? (
          <div style={s.emptyState}>No movies survived — everyone vetoed something different. Try again?</div>
        ) : (
          <>
            <div style={s.sectionLabel}>Everyone agrees on ({results.length})</div>
            {results.map((movie, i) => (
              <div
                key={movie.id}
                style={s.movieCard(movie.id === room.winnerId, false)}
                onClick={() => !room.winnerId && handlePickWinner(movie.id)}
              >
                <div style={s.rank(i + 1)}>#{i + 1}</div>
                <div style={s.movieInfo}>
                  <div>
                    <span style={s.movieTitle}>{movie.title}</span>
                    <span style={s.movieYear}>{movie.year}</span>
                  </div>
                  <div style={s.movieReason}>{movie.reason}</div>
                  <div style={s.voteBar}>
                    <span style={s.upVote}>👍 {movie.thumbsUp}</span>
                  </div>
                  <div style={s.genreTags}>
                    {movie.genres.map(g => <span key={g} style={s.genreTag}>{g}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {!session.isHost && !room.winnerId && (
          <div style={{ color: '#888', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
            Waiting for the host to pick the winner…
          </div>
        )}

        {eliminated.length > 0 && (
          <>
            <div style={s.sectionLabel}>Vetoed ({eliminated.length})</div>
            {eliminated.map(movie => (
              <div key={movie.id} style={s.movieCard(false, true)}>
                <div style={{ ...s.rank(0), background: '#2a1515' }}>✕</div>
                <div style={s.movieInfo}>
                  <div>
                    <span style={s.movieTitle}>{movie.title}</span>
                    <span style={s.movieYear}>{movie.year}</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

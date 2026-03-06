import { useState } from 'react';
import { submitVote, advancePhase } from '../api';

// Deterministic gradient fallback when no poster is available
function posterGradient(title) {
  const palettes = [
    ['#0f2027', '#203a43', '#2c5364'],
    ['#1a1a2e', '#16213e', '#0f3460'],
    ['#2d1b69', '#11998e', '#38ef7d'],
    ['#1f0036', '#6b0f1a', '#b91372'],
    ['#0d0d0d', '#1a1a2e', '#4a00e0'],
    ['#16222a', '#3a6073', '#16222a'],
    ['#0f0c29', '#302b63', '#24243e'],
  ];
  const idx = (title.charCodeAt(0) + title.length) % palettes.length;
  const [a, b, c] = palettes[idx];
  return `linear-gradient(135deg, ${a}, ${b}, ${c})`;
}

function PosterCard({ movie, myVote, onVote }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
        height: 220,
        border: myVote === 'up' ? '2px solid #4caf7d'
              : myVote === 'down' ? '2px solid #e05c5c'
              : '2px solid transparent',
        transform: hovered ? 'scale(1.01)' : 'scale(1)',
        transition: 'transform 0.15s, border-color 0.15s',
        cursor: 'default',
      }}
    >
      {/* Poster or gradient */}
      {movie.posterUrl
        ? <img src={movie.posterUrl} alt={movie.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <div style={{ width: '100%', height: '100%', background: posterGradient(movie.title) }} />
      }

      {/* Dark overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.15) 100%)',
      }} />

      {/* Match score badge */}
      <div style={{
        position: 'absolute', top: 12, left: 12,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        borderRadius: 8, padding: '0.25rem 0.6rem',
        fontSize: '0.75rem', fontWeight: 700, color: '#fff',
      }}>
        {movie.matchScore}/10
      </div>

      {/* Vote status badge */}
      {myVote && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: myVote === 'up' ? '#4caf7d' : '#e05c5c',
          borderRadius: 8, padding: '0.25rem 0.6rem',
          fontSize: '0.8rem', fontWeight: 700, color: '#fff',
        }}>
          {myVote === 'up' ? '👍 In' : '👎 Out'}
        </div>
      )}

      {/* Bottom content */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem' }}>
        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', marginBottom: 2 }}>
          {movie.title}
          <span style={{ fontWeight: 400, fontSize: '0.85rem', color: '#aaa', marginLeft: 8 }}>{movie.year}</span>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: 10, lineHeight: 1.4 }}>
          {movie.reason}
        </div>

        {/* Vote buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onVote(movie.id, 'up')}
            style={{
              flex: 1, padding: '0.6rem', border: 'none', borderRadius: 10,
              background: myVote === 'up' ? '#4caf7d' : 'rgba(255,255,255,0.12)',
              color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
              backdropFilter: 'blur(4px)',
              transition: 'background 0.15s',
            }}
          >
            👍 In
          </button>
          <button
            onClick={() => onVote(movie.id, 'down')}
            style={{
              flex: 1, padding: '0.6rem', border: 'none', borderRadius: 10,
              background: myVote === 'down' ? '#e05c5c' : 'rgba(255,255,255,0.12)',
              color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
              backdropFilter: 'blur(4px)',
              transition: 'background 0.15s',
            }}
          >
            👎 Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Voting({ room, session }) {
  const [localVotes, setLocalVotes] = useState(room.votes[session.participantId] || {});
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleVote(movieId, vote) {
    const prev = localVotes;
    setLocalVotes({ ...localVotes, [movieId]: vote });
    try {
      await submitVote(room.code, session.participantId, movieId, vote);
    } catch (err) {
      setLocalVotes(prev);
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

  const votersCount = Object.keys(room.votes).length;
  const ratedCount = Object.keys(localVotes).length;
  const total = room.recommendations.length;

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f13', padding: '1.5rem 1rem' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        <div style={{ marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Rate the picks</h1>
          <p style={{ color: '#888', fontSize: '0.85rem', marginTop: 4 }}>
            {votersCount} of {room.participants.length} voting · You rated {ratedCount}/{total}
          </p>
        </div>

        {room.recommendations.map(movie => (
          <PosterCard
            key={movie.id}
            movie={movie}
            myVote={localVotes[movie.id]}
            onVote={handleVote}
          />
        ))}

        {error && (
          <div style={{ background: '#2a1515', border: '1px solid #5c2020', borderRadius: 10, color: '#e05c5c', fontSize: '0.875rem', padding: '0.75rem', marginTop: 8 }}>
            {error}
          </div>
        )}

        {session.isHost ? (
          <button
            onClick={handleAdvance}
            disabled={advanceLoading}
            style={{
              width: '100%', marginTop: 8, padding: '0.9rem', border: 'none', borderRadius: 12,
              background: '#e05c5c', color: '#fff', fontSize: '1rem', fontWeight: 700,
              cursor: advanceLoading ? 'not-allowed' : 'pointer', opacity: advanceLoading ? 0.6 : 1,
            }}
          >
            {advanceLoading ? 'Loading…' : 'See results →'}
          </button>
        ) : (
          <p style={{ color: '#555', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
            Waiting for the host to reveal results…
          </p>
        )}
      </div>
    </div>
  );
}

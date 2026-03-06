import { useState, useEffect } from 'react';
import { setWinner, getResults } from '../api';

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

function WinnerCard({ movie }) {
  return (
    <div style={{
      position: 'relative', borderRadius: 20, overflow: 'hidden',
      height: 340, marginBottom: 24,
      boxShadow: '0 8px 40px rgba(76,175,125,0.35)',
      border: '2px solid #4caf7d',
    }}>
      {movie.posterUrl
        ? <img src={movie.posterUrl} alt={movie.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <div style={{ width: '100%', height: '100%', background: posterGradient(movie.title) }} />
      }
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0.1) 100%)',
      }} />

      {/* Tonight's pick badge */}
      <div style={{
        position: 'absolute', top: 16, left: 16,
        background: '#4caf7d', borderRadius: 10,
        padding: '0.35rem 0.85rem', fontSize: '0.75rem', fontWeight: 800,
        color: '#fff', letterSpacing: '0.05em', textTransform: 'uppercase',
      }}>
        ✓ Tonight's Pick
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem' }}>
        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
          {movie.title}
        </div>
        <div style={{ color: '#aaa', fontSize: '0.9rem', marginTop: 4 }}>{movie.year}</div>
        <div style={{ color: '#ccc', fontSize: '0.85rem', marginTop: 8, lineHeight: 1.5 }}>
          {movie.reason}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {movie.genres.map(g => (
            <span key={g} style={{
              background: 'rgba(255,255,255,0.15)', borderRadius: 20,
              padding: '0.2rem 0.6rem', fontSize: '0.75rem', color: '#ddd',
            }}>{g}</span>
          ))}
        </div>
        <div style={{ color: '#4caf7d', fontWeight: 700, marginTop: 10, fontSize: '0.9rem' }}>
          👍 {movie.thumbsUp} everyone agreed
        </div>
      </div>
    </div>
  );
}

function SurvivorCard({ movie, rank, canPick, onPick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={canPick ? onPick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', borderRadius: 16, overflow: 'hidden',
        height: 200, marginBottom: 10,
        border: `2px solid ${hovered && canPick ? '#e05c5c' : '#2a2a35'}`,
        transform: hovered && canPick ? 'scale(1.01)' : 'scale(1)',
        transition: 'transform 0.15s, border-color 0.15s',
        cursor: canPick ? 'pointer' : 'default',
      }}
    >
      {movie.posterUrl
        ? <img src={movie.posterUrl} alt={movie.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <div style={{ width: '100%', height: '100%', background: posterGradient(movie.title) }} />
      }
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0.1) 100%)',
      }} />

      <div style={{
        position: 'absolute', top: 12, left: 12,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        borderRadius: 8, padding: '0.25rem 0.6rem',
        fontSize: '0.75rem', fontWeight: 700, color: '#fff',
      }}>
        #{rank}
      </div>

      {canPick && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(224,92,92,0.85)', backdropFilter: 'blur(4px)',
          borderRadius: 8, padding: '0.25rem 0.6rem',
          fontSize: '0.72rem', fontWeight: 700, color: '#fff',
          opacity: hovered ? 1 : 0, transition: 'opacity 0.15s',
        }}>
          Tap to pick
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem' }}>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>
          {movie.title}
          <span style={{ fontWeight: 400, fontSize: '0.8rem', color: '#aaa', marginLeft: 8 }}>{movie.year}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <span style={{ color: '#4caf7d', fontSize: '0.85rem', fontWeight: 600 }}>👍 {movie.thumbsUp}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {movie.genres.map(g => (
              <span key={g} style={{
                background: 'rgba(255,255,255,0.12)', borderRadius: 20,
                padding: '0.15rem 0.5rem', fontSize: '0.7rem', color: '#ccc',
              }}>{g}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EliminatedCard({ movie }) {
  return (
    <div style={{
      position: 'relative', borderRadius: 12, overflow: 'hidden',
      height: 80, marginBottom: 8, opacity: 0.4,
      border: '1px solid #2a2a35',
    }}>
      {movie.posterUrl
        ? <img src={movie.posterUrl} alt={movie.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'grayscale(100%)' }} />
        : <div style={{ width: '100%', height: '100%', background: posterGradient(movie.title), filter: 'grayscale(100%)' }} />
      }
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 1rem', gap: 10 }}>
        <span style={{ color: '#e05c5c', fontSize: '1rem' }}>✕</span>
        <span style={{ color: '#888', fontWeight: 600, fontSize: '0.9rem' }}>{movie.title}</span>
        <span style={{ color: '#555', fontSize: '0.8rem' }}>{movie.year}</span>
      </div>
    </div>
  );
}

export default function Results({ room, session }) {
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getResults(room.code)
      .then(data => setResults(data.results))
      .catch(err => setError(err.message));
  }, [room.code, room.winnerId]);

  async function handlePickWinner(movieId) {
    if (!session.isHost || room.winnerId) return;
    try {
      await setWinner(room.code, session.participantId, movieId);
    } catch (err) {
      setError(err.message);
    }
  }

  const winner = room.winnerId && results?.find(m => m.id === room.winnerId);
  const survivors = results?.filter(m => m.id !== room.winnerId) ?? [];
  const eliminated = room.recommendations.filter(m => !results?.find(r => r.id === m.id));

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f13', padding: '1.5rem 1rem' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        <div style={{ marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            {room.winnerId ? 'Enjoy the movie 🎬' : 'Results are in'}
          </h1>
          {!room.winnerId && session.isHost && (
            <p style={{ color: '#888', fontSize: '0.85rem', marginTop: 4 }}>
              Tap a movie to pick tonight's winner
            </p>
          )}
          {!room.winnerId && !session.isHost && (
            <p style={{ color: '#888', fontSize: '0.85rem', marginTop: 4 }}>
              Waiting for the host to pick…
            </p>
          )}
        </div>

        {error && (
          <div style={{ background: '#2a1515', border: '1px solid #5c2020', borderRadius: 10, color: '#e05c5c', fontSize: '0.875rem', padding: '0.75rem', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {results === null && (
          <div style={{ color: '#888', textAlign: 'center', padding: '3rem 0' }}>Loading…</div>
        )}

        {results?.length === 0 && (
          <div style={{ background: '#18181f', border: '1px solid #2a2a35', borderRadius: 12, padding: '2rem', textAlign: 'center', color: '#888' }}>
            No movies survived — everyone vetoed something different.
          </div>
        )}

        {/* Winner hero card */}
        {winner && <WinnerCard movie={winner} />}

        {/* Remaining survivors — host can pick */}
        {results && results.length > 0 && !room.winnerId && (
          results.map((movie, i) => (
            <SurvivorCard
              key={movie.id}
              movie={movie}
              rank={i + 1}
              canPick={session.isHost}
              onPick={() => handlePickWinner(movie.id)}
            />
          ))
        )}

        {survivors.length > 0 && room.winnerId && (
          <>
            <div style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '8px 0 10px' }}>
              Also survived
            </div>
            {survivors.map((movie, i) => (
              <SurvivorCard key={movie.id} movie={movie} rank={i + 2} canPick={false} />
            ))}
          </>
        )}

        {/* Eliminated */}
        {eliminated.length > 0 && (
          <>
            <div style={{ fontSize: '0.75rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '16px 0 10px' }}>
              Vetoed ({eliminated.length})
            </div>
            {eliminated.map(movie => <EliminatedCard key={movie.id} movie={movie} />)}
          </>
        )}

      </div>
    </div>
  );
}

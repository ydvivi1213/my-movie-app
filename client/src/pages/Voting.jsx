import { useState, useRef, useEffect } from 'react';
import { submitVote, advancePhase } from '../api';

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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

// ─── Mobile swipe stack ───────────────────────────────────────────────────────

function SwipeStack({ movies, localVotes, onVote }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exiting, setExiting] = useState(null); // 'left' | 'right'
  const startXRef = useRef(null);
  const THRESHOLD = 80;

  const done = currentIdx >= movies.length;

  function commitVote(vote) {
    onVote(movies[currentIdx].id, vote);
    setExiting(vote === 'up' ? 'right' : 'left');
    setTimeout(() => {
      setCurrentIdx(i => i + 1);
      setExiting(null);
      setDragX(0);
    }, 280);
  }

  function handleTouchStart(e) {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  }

  function handleTouchMove(e) {
    if (startXRef.current === null) return;
    setDragX(e.touches[0].clientX - startXRef.current);
  }

  function handleTouchEnd() {
    setIsDragging(false);
    startXRef.current = null;
    if (dragX > THRESHOLD) commitVote('up');
    else if (dragX < -THRESHOLD) commitVote('down');
    else setDragX(0);
  }

  // Summary screen after all cards swiped
  if (done) {
    return (
      <div>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem' }}>🎬</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: 8 }}>All done!</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 4 }}>
            Tap any vote to change it
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {movies.map(m => {
            const vote = localVotes[m.id];
            return (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: 12, padding: '0.65rem 0.85rem',
              }}>
                {m.posterUrl
                  ? <img src={m.posterUrl} alt={m.title} style={{ width: 38, height: 54, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                  : <div style={{ width: 38, height: 54, borderRadius: 6, background: posterGradient(m.title), flexShrink: 0 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.title}
                  </div>
                  <div style={{ color: 'var(--subtle)', fontSize: '0.75rem' }}>{m.year}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => onVote(m.id, 'up')}
                    style={{
                      width: 36, height: 36, borderRadius: '50%', border: 'none', fontSize: '1rem',
                      background: vote === 'up' ? '#4caf7d' : 'rgba(255,255,255,0.08)',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                  >👍</button>
                  <button
                    onClick={() => onVote(m.id, 'down')}
                    style={{
                      width: 36, height: 36, borderRadius: '50%', border: 'none', fontSize: '1rem',
                      background: vote === 'down' ? '#e05c5c' : 'rgba(255,255,255,0.08)',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                  >👎</button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setCurrentIdx(0)}
          style={{
            width: '100%', background: 'none', border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: 10, color: 'var(--muted)', padding: '0.6rem', fontSize: '0.85rem', cursor: 'pointer',
          }}
        >
          Re-swipe from start
        </button>
      </div>
    );
  }

  const movie = movies[currentIdx];
  const nextMovie = currentIdx + 1 < movies.length ? movies[currentIdx + 1] : null;

  // Card transform
  let cardTranslateX = isDragging || exiting === null ? dragX : (exiting === 'right' ? 600 : -600);
  const cardRotate = dragX * 0.04;
  const swipeProgress = Math.min(Math.abs(dragX) / THRESHOLD, 1);
  const overlayOpacity = swipeProgress * 0.72;
  const isSwipingRight = dragX >= 0;

  // Next card grows as current card moves away
  const nextScale = 0.93 + swipeProgress * 0.07;
  const nextTranslateY = 18 - swipeProgress * 18;

  return (
    <div>
      {/* Progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: '0.6rem' }}>
        {movies.map((m, i) => {
          const v = localVotes[m.id];
          const isActive = i === currentIdx;
          const isPast = i < currentIdx;
          return (
            <div key={i} style={{
              height: 6,
              width: isActive ? 22 : 6,
              borderRadius: 3,
              background: isActive ? '#a78bfa'
                : isPast ? (v === 'up' ? '#4caf7d' : v === 'down' ? '#e05c5c' : 'rgba(255,255,255,0.3)')
                : 'rgba(255,255,255,0.15)',
              transition: 'all 0.2s',
            }} />
          );
        })}
      </div>

      <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.78rem', marginBottom: '0.75rem' }}>
        {currentIdx + 1} of {movies.length}
      </div>

      {/* Card stack */}
      <div style={{ position: 'relative', height: 'calc(100vh - 340px)', minHeight: 300, maxHeight: 480, marginBottom: '1rem' }}>

        {/* Next card behind */}
        {nextMovie && (
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: 20, overflow: 'hidden',
            transform: `scale(${nextScale}) translateY(${nextTranslateY}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s',
            zIndex: 1,
          }}>
            {nextMovie.posterUrl
              ? <img src={nextMovie.posterUrl} alt={nextMovie.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <div style={{ width: '100%', height: '100%', background: posterGradient(nextMovie.title) }} />
            }
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
          </div>
        )}

        {/* Current card */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'absolute', inset: 0,
            borderRadius: 20, overflow: 'hidden',
            transform: `translateX(${cardTranslateX}px) rotate(${cardRotate}deg)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            zIndex: 2,
            touchAction: 'none',
            userSelect: 'none',
            border: `2px solid ${
              localVotes[movie.id] === 'up' ? 'rgba(76,175,125,0.7)'
              : localVotes[movie.id] === 'down' ? 'rgba(224,92,92,0.7)'
              : 'transparent'
            }`,
          }}
        >
          {/* Background */}
          {movie.posterUrl
            ? <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%', background: posterGradient(movie.title) }} />
          }

          {/* Dark gradient */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0.05) 100%)',
          }} />

          {/* Swipe color overlay */}
          {overlayOpacity > 0.03 && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 3,
              background: isSwipingRight ? `rgba(76,175,125,${overlayOpacity})` : `rgba(224,92,92,${overlayOpacity})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                fontSize: '4.5rem',
                opacity: swipeProgress,
                transform: `scale(${0.4 + swipeProgress * 0.6})`,
                transition: 'transform 0.05s',
                filter: 'drop-shadow(0 0 12px rgba(0,0,0,0.5))',
              }}>
                {isSwipingRight ? '👍' : '👎'}
              </div>
            </div>
          )}

          {/* Match score badge */}
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 4,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
            borderRadius: 8, padding: '0.25rem 0.6rem',
            fontSize: '0.75rem', fontWeight: 700, color: '#fff',
          }}>
            {movie.matchScore}/10
          </div>

          {/* Existing vote badge (shown when not dragging) */}
          {localVotes[movie.id] && overlayOpacity < 0.05 && (
            <div style={{
              position: 'absolute', top: 12, right: 12, zIndex: 4,
              background: localVotes[movie.id] === 'up' ? '#4caf7d' : '#e05c5c',
              borderRadius: 8, padding: '0.25rem 0.55rem',
              fontSize: '0.75rem', fontWeight: 700, color: '#fff',
            }}>
              {localVotes[movie.id] === 'up' ? '👍 In' : '👎 Out'}
            </div>
          )}

          {/* Bottom info */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.1rem', zIndex: 4 }}>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', lineHeight: 1.2 }}>
              {movie.title}
              <span style={{ fontWeight: 400, fontSize: '0.85rem', color: '#aaa', marginLeft: 8 }}>{movie.year}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#ccc', marginTop: 5, lineHeight: 1.4 }}>
              {movie.reason}
            </div>
            {movie.genres?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                {movie.genres.slice(0, 3).map(g => (
                  <span key={g} style={{
                    background: 'rgba(255,255,255,0.1)', borderRadius: 20,
                    padding: '2px 8px', fontSize: '0.7rem', color: '#ddd',
                  }}>{g}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => currentIdx > 0 && setCurrentIdx(i => i - 1)}
          disabled={currentIdx === 0}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.05)',
            color: currentIdx === 0 ? 'var(--subtle)' : '#fff',
            fontSize: '1.1rem', cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="Go back"
        >↩</button>

        <button
          onClick={() => commitVote('down')}
          style={{
            flex: 1, padding: '0.85rem', border: '1px solid rgba(224,92,92,0.35)',
            borderRadius: 14, background: 'rgba(224,92,92,0.12)',
            color: '#f87171', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
          }}
        >👎 Nope</button>

        <button
          onClick={() => commitVote('up')}
          style={{
            flex: 1, padding: '0.85rem', border: '1px solid rgba(76,175,125,0.35)',
            borderRadius: 14, background: 'rgba(76,175,125,0.12)',
            color: '#4ade80', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
          }}
        >👍 Yeah</button>
      </div>

      {Object.keys(localVotes).length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--subtle)', fontSize: '0.75rem', marginTop: 10 }}>
          Swipe right to like · left to pass
        </div>
      )}
    </div>
  );
}

// ─── Desktop poster card ──────────────────────────────────────────────────────

function PosterCard({ movie, myVote, onVote }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', borderRadius: 16, overflow: 'hidden',
        marginBottom: 12, height: 220,
        border: myVote === 'up' ? '2px solid #4caf7d'
              : myVote === 'down' ? '2px solid #e05c5c'
              : '2px solid transparent',
        transform: hovered ? 'scale(1.01)' : 'scale(1)',
        transition: 'transform 0.15s, border-color 0.15s',
      }}
    >
      {movie.posterUrl
        ? <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <div style={{ width: '100%', height: '100%', background: posterGradient(movie.title) }} />
      }
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.15) 100%)',
      }} />
      <div style={{
        position: 'absolute', top: 12, left: 12,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        borderRadius: 8, padding: '0.25rem 0.6rem',
        fontSize: '0.75rem', fontWeight: 700, color: '#fff',
      }}>
        {movie.matchScore}/10
      </div>
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
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem' }}>
        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', marginBottom: 2 }}>
          {movie.title}
          <span style={{ fontWeight: 400, fontSize: '0.85rem', color: '#aaa', marginLeft: 8 }}>{movie.year}</span>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: 10, lineHeight: 1.4 }}>
          {movie.reason}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onVote(movie.id, 'up')}
            style={{
              flex: 1, padding: '0.6rem', border: 'none', borderRadius: 10,
              background: myVote === 'up' ? '#4caf7d' : 'rgba(255,255,255,0.12)',
              color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
              backdropFilter: 'blur(4px)', transition: 'background 0.15s',
            }}
          >👍 In</button>
          <button
            onClick={() => onVote(movie.id, 'down')}
            style={{
              flex: 1, padding: '0.6rem', border: 'none', borderRadius: 10,
              background: myVote === 'down' ? '#e05c5c' : 'rgba(255,255,255,0.12)',
              color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
              backdropFilter: 'blur(4px)', transition: 'background 0.15s',
            }}
          >👎 Out</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Voting screen ───────────────────────────────────────────────────────

export default function Voting({ room, session }) {
  const isMobile = useIsMobile();
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

  // Merge local votes with server votes for accurate "all done" check
  const effectiveVotes = { ...room.votes, [session.participantId]: localVotes };
  const allPartiesVoted = room.participants.every(p => {
    const pv = effectiveVotes[p.id] || {};
    return room.recommendations.every(m => pv[m.id]);
  });
  const doneCount = room.participants.filter(p => {
    const pv = effectiveVotes[p.id] || {};
    return room.recommendations.every(m => pv[m.id]);
  }).length;

  const myVotedCount = Object.keys(localVotes).length;
  const total = room.recommendations.length;

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', padding: '1.5rem 1rem' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        <div style={{ marginBottom: '1.1rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Rate the picks</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: 4 }}>
            {doneCount} of {room.participants.length} done · you rated {myVotedCount}/{total}
          </p>
        </div>

        {isMobile ? (
          <SwipeStack
            movies={room.recommendations}
            localVotes={localVotes}
            onVote={handleVote}
          />
        ) : (
          room.recommendations.map(movie => (
            <PosterCard
              key={movie.id}
              movie={movie}
              myVote={localVotes[movie.id]}
              onVote={handleVote}
            />
          ))
        )}

        {error && (
          <div style={{
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: 10, color: '#f87171', fontSize: '0.875rem', padding: '0.75rem', marginTop: 12,
          }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          {allPartiesVoted ? (
            session.isHost ? (
              <button
                onClick={handleAdvance}
                disabled={advanceLoading}
                style={{
                  width: '100%', padding: '0.9rem', border: 'none', borderRadius: 12,
                  background: 'linear-gradient(135deg, #7c3aed, #9f67fa)',
                  boxShadow: '0 4px 20px rgba(124,58,237,0.45)',
                  color: '#fff', fontSize: '1rem', fontWeight: 700,
                  cursor: advanceLoading ? 'not-allowed' : 'pointer',
                  opacity: advanceLoading ? 0.6 : 1,
                }}
              >
                {advanceLoading ? 'Loading…' : 'See results →'}
              </button>
            ) : (
              <p style={{ color: 'var(--subtle)', fontSize: '0.875rem', textAlign: 'center', padding: '0.5rem 0' }}>
                Waiting for host to reveal results…
              </p>
            )
          ) : (
            <p style={{ color: 'var(--subtle)', fontSize: '0.8rem', textAlign: 'center', padding: '0.5rem 0' }}>
              Results unlock when everyone has voted ({doneCount}/{room.participants.length} done)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

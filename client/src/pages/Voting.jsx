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

// ─── Trailer modal ────────────────────────────────────────────────────────────

function TrailerModal({ movie, onClose }) {
  // Close on backdrop click or Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const embedSrc = movie.trailerVideoId
    ? `https://www.youtube.com/embed/${movie.trailerVideoId}?autoplay=1&rel=0`
    : null;

  const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + ' ' + movie.year + ' official trailer')}`;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', width: '100%', maxWidth: 860,
          borderRadius: 16, overflow: 'hidden', background: '#000',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: -40, right: 0,
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
            fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1,
          }}
        >✕</button>

        {embedSrc ? (
          <div style={{ position: 'relative', paddingTop: '56.25%' }}>
            <iframe
              src={embedSrc}
              title={`${movie.title} trailer`}
              allow="autoplay; fullscreen"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#ccc', marginBottom: '1rem' }}>No trailer found — search on YouTube?</p>
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block', padding: '0.65rem 1.5rem',
                background: '#ff0000', borderRadius: 8, color: '#fff',
                fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem',
              }}
            >
              ▶ Search on YouTube
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared card poster section ───────────────────────────────────────────────

function CardPoster({ movie, posterHeight = 320, onTrailer }) {
  return (
    <div style={{ position: 'relative', height: posterHeight, overflow: 'hidden', flexShrink: 0 }}>
      {movie.posterUrl
        ? <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <div style={{ width: '100%', height: '100%', background: posterGradient(movie.title) }} />
      }
      {/* Watch Trailer button — bottom-left of poster */}
      <button
        onClick={onTrailer}
        style={{
          position: 'absolute', bottom: 20, left: 20,
          display: 'flex', alignItems: 'center', gap: 6,
          height: 35, padding: '0 12px',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          background: 'rgba(135,135,135,0.15)',
          border: '0.5px solid rgba(255,255,255,0.15)',
          borderRadius: 10, cursor: 'pointer',
          color: '#fff', fontSize: '0.75rem', fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}
      >
        <span style={{ fontSize: '0.6rem' }}>▶</span>
        Watch Trailer
      </button>
    </div>
  );
}

// ─── Desktop card ─────────────────────────────────────────────────────────────

function PosterCard({ movie, myVote, onVote, onTrailer }) {
  return (
    <div style={{
      border: `2px solid ${myVote === 'up' ? '#4caf7d' : myVote === 'down' ? '#af4c4c' : '#2e2e2e'}`,
      borderRadius: 20, overflow: 'hidden',
      marginBottom: 16, background: 'rgba(255,255,255,0)',
      display: 'flex', flexDirection: 'column',
      transition: 'border-color 0.2s',
    }}>
      <CardPoster movie={movie} posterHeight={300} onTrailer={onTrailer} />

      {/* Info section */}
      <div style={{ padding: '20px 24px', position: 'relative', display: 'flex', flexDirection: 'column', gap: 6 }}>

        {/* Year + genres */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <span style={{ color: '#aaa', fontSize: '0.75rem', paddingRight: 10 }}>{movie.year}</span>
          <div style={{ borderLeft: '1px solid #4a4a4a', paddingLeft: 10, display: 'flex', gap: 10 }}>
            {movie.genres?.slice(0, 3).map(g => (
              <span key={g} style={{ color: '#aaa', fontSize: '0.65rem', fontWeight: 500 }}>{g}</span>
            ))}
          </div>
        </div>

        {/* Title */}
        <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#fff', lineHeight: 1.2, paddingRight: 80 }}>
          {movie.title}
        </div>

        {/* Description */}
        <div style={{ color: '#ccc', fontSize: '0.82rem', lineHeight: 1.5, marginTop: 6 }}>
          {movie.reason}
        </div>

        {/* Vote buttons — absolute top-right of info section */}
        <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 10 }}>
          <button
            onClick={() => onVote(movie.id, myVote === 'up' ? null : 'up')}
            style={{
              width: 40, height: 40,
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              background: myVote === 'up' ? 'rgba(76,175,125,0.3)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${myVote === 'up' ? '#4caf7d' : '#4caf7d'}`,
              borderRadius: 10, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', transition: 'background 0.15s',
            }}
          >👍</button>
          <button
            onClick={() => onVote(movie.id, myVote === 'down' ? null : 'down')}
            style={{
              width: 40, height: 40,
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              background: myVote === 'down' ? 'rgba(175,76,76,0.3)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${myVote === 'down' ? '#af4c4c' : '#af4c4c'}`,
              borderRadius: 10, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', transition: 'background 0.15s',
            }}
          >👎</button>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile swipe stack ───────────────────────────────────────────────────────

function SwipeStack({ movies, localVotes, onVote, onTrailer }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exiting, setExiting] = useState(null);
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

  if (done) {
    return (
      <div>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem' }}>🎬</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: 8 }}>All done!</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 4 }}>Tap any vote to change it</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {movies.map(m => {
            const vote = localVotes[m.id];
            return (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                border: '2px solid #2e2e2e', borderRadius: 14, overflow: 'hidden',
              }}>
                {m.posterUrl
                  ? <img src={m.posterUrl} alt={m.title} style={{ width: 48, height: 64, objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 48, height: 64, background: posterGradient(m.title), flexShrink: 0 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                  <div style={{ color: 'var(--subtle)', fontSize: '0.72rem' }}>{m.year}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, paddingRight: 12 }}>
                  <button onClick={() => onVote(m.id, vote === 'up' ? null : 'up')} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #4caf7d', background: vote === 'up' ? 'rgba(76,175,125,0.25)' : 'rgba(255,255,255,0.05)', cursor: 'pointer', fontSize: '0.9rem' }}>👍</button>
                  <button onClick={() => onVote(m.id, vote === 'down' ? null : 'down')} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #af4c4c', background: vote === 'down' ? 'rgba(175,76,76,0.25)' : 'rgba(255,255,255,0.05)', cursor: 'pointer', fontSize: '0.9rem' }}>👎</button>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={() => setCurrentIdx(0)} style={{ width: '100%', background: 'none', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, color: 'var(--muted)', padding: '0.6rem', fontSize: '0.85rem', cursor: 'pointer' }}>
          Re-swipe from start
        </button>
      </div>
    );
  }

  const movie = movies[currentIdx];
  const nextMovie = currentIdx + 1 < movies.length ? movies[currentIdx + 1] : null;

  let cardTranslateX = isDragging || exiting === null ? dragX : (exiting === 'right' ? 600 : -600);
  const cardRotate = dragX * 0.04;
  const swipeProgress = Math.min(Math.abs(dragX) / THRESHOLD, 1);
  const overlayOpacity = swipeProgress * 0.72;
  const isSwipingRight = dragX >= 0;
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
              height: 6, width: isActive ? 22 : 6, borderRadius: 3,
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
      <div style={{ position: 'relative', height: 'calc(100vh - 320px)', minHeight: 340, maxHeight: 540, marginBottom: '1rem' }}>

        {/* Next card */}
        {nextMovie && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 20, overflow: 'hidden',
            border: '2px solid #2e2e2e',
            transform: `scale(${nextScale}) translateY(${nextTranslateY}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s',
            zIndex: 1,
          }}>
            {nextMovie.posterUrl
              ? <img src={nextMovie.posterUrl} alt={nextMovie.title} style={{ width: '100%', height: '62%', objectFit: 'cover', display: 'block' }} />
              : <div style={{ width: '100%', height: '62%', background: posterGradient(nextMovie.title) }} />
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
            border: `2px solid ${localVotes[movie.id] === 'up' ? '#4caf7d' : localVotes[movie.id] === 'down' ? '#af4c4c' : '#2e2e2e'}`,
            transform: `translateX(${cardTranslateX}px) rotate(${cardRotate}deg)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            zIndex: 2, touchAction: 'none', userSelect: 'none',
            display: 'flex', flexDirection: 'column', background: '#0f0f13',
          }}
        >
          {/* Poster area */}
          <div style={{ position: 'relative', height: '62%', overflow: 'hidden', flexShrink: 0 }}>
            {movie.posterUrl
              ? <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <div style={{ width: '100%', height: '100%', background: posterGradient(movie.title) }} />
            }

            {/* Swipe color overlay */}
            {overlayOpacity > 0.03 && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 3,
                background: isSwipingRight ? `rgba(76,175,125,${overlayOpacity})` : `rgba(175,76,76,${overlayOpacity})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: '4rem', opacity: swipeProgress, transform: `scale(${0.4 + swipeProgress * 0.6})` }}>
                  {isSwipingRight ? '👍' : '👎'}
                </div>
              </div>
            )}

            {/* Watch Trailer button */}
            <button
              onClick={() => onTrailer(movie)}
              style={{
                position: 'absolute', bottom: 14, left: 14, zIndex: 4,
                display: 'flex', alignItems: 'center', gap: 6,
                height: 32, padding: '0 12px',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                background: 'rgba(135,135,135,0.15)',
                border: '0.5px solid rgba(255,255,255,0.15)',
                borderRadius: 10, cursor: 'pointer',
                color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}
            >
              <span style={{ fontSize: '0.55rem' }}>▶</span>
              Watch Trailer
            </button>

            {/* Current vote badge */}
            {localVotes[movie.id] && overlayOpacity < 0.05 && (
              <div style={{
                position: 'absolute', top: 12, right: 12, zIndex: 4,
                background: localVotes[movie.id] === 'up' ? '#4caf7d' : '#af4c4c',
                borderRadius: 8, padding: '0.2rem 0.55rem',
                fontSize: '0.72rem', fontWeight: 700, color: '#fff',
              }}>
                {localVotes[movie.id] === 'up' ? '👍 In' : '👎 Out'}
              </div>
            )}
          </div>

          {/* Info section */}
          <div style={{ padding: '14px 16px', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#aaa', fontSize: '0.72rem', paddingRight: 8 }}>{movie.year}</span>
              <div style={{ borderLeft: '1px solid #4a4a4a', paddingLeft: 8, display: 'flex', gap: 8 }}>
                {movie.genres?.slice(0, 3).map(g => (
                  <span key={g} style={{ color: '#aaa', fontSize: '0.62rem', fontWeight: 500 }}>{g}</span>
                ))}
              </div>
            </div>
            <div style={{ fontWeight: 900, fontSize: '1.15rem', color: '#fff', lineHeight: 1.2 }}>{movie.title}</div>
            <div style={{ color: '#ccc', fontSize: '0.76rem', lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {movie.reason}
            </div>
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
        >↩</button>
        <button
          onClick={() => commitVote('down')}
          style={{ flex: 1, padding: '0.85rem', border: '1px solid rgba(175,76,76,0.4)', borderRadius: 14, background: 'rgba(175,76,76,0.1)', color: '#f87171', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}
        >👎 Nope</button>
        <button
          onClick={() => commitVote('up')}
          style={{ flex: 1, padding: '0.85rem', border: '1px solid rgba(76,175,125,0.4)', borderRadius: 14, background: 'rgba(76,175,125,0.1)', color: '#4ade80', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}
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

// ─── Main Voting screen ───────────────────────────────────────────────────────

export default function Voting({ room, session }) {
  const isMobile = useIsMobile();
  const [localVotes, setLocalVotes] = useState(room.votes[session.participantId] || {});
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [error, setError] = useState('');
  const [trailerMovie, setTrailerMovie] = useState(null);

  async function handleVote(movieId, vote) {
    const prev = localVotes;
    const next = vote === null ? (() => { const v = { ...localVotes }; delete v[movieId]; return v; })() : { ...localVotes, [movieId]: vote };
    setLocalVotes(next);
    try {
      if (vote !== null) {
        await submitVote(room.code, session.participantId, movieId, vote);
      }
    } catch (err) {
      setLocalVotes(prev);
      setError(err.message);
    }
  }

  async function handleAdvance() {
    setAdvanceLoading(true); setError('');
    try { await advancePhase(room.code, session.participantId); }
    catch (err) { setError(err.message); setAdvanceLoading(false); }
  }

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
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Pick your movie</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: 4 }}>
            {doneCount} of {room.participants.length} done · you rated {myVotedCount}/{total}
          </p>
        </div>

        {isMobile ? (
          <SwipeStack
            movies={room.recommendations}
            localVotes={localVotes}
            onVote={handleVote}
            onTrailer={setTrailerMovie}
          />
        ) : (
          room.recommendations.map(movie => (
            <PosterCard
              key={movie.id}
              movie={movie}
              myVote={localVotes[movie.id]}
              onVote={handleVote}
              onTrailer={() => setTrailerMovie(movie)}
            />
          ))
        )}

        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, color: '#f87171', fontSize: '0.875rem', padding: '0.75rem', marginTop: 12 }}>
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
                  cursor: advanceLoading ? 'not-allowed' : 'pointer', opacity: advanceLoading ? 0.6 : 1,
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

      {/* Trailer modal */}
      {trailerMovie && <TrailerModal movie={trailerMovie} onClose={() => setTrailerMovie(null)} />}
    </div>
  );
}

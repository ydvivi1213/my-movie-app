import { useState } from 'react';
import { advancePhase } from '../api';

const glass = {
  background: 'rgba(139, 92, 246, 0.06)',
  border: '1px solid rgba(139, 92, 246, 0.2)',
  borderRadius: 16,
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
};

const glassActive = {
  ...glass,
  border: '1px solid rgba(139, 92, 246, 0.55)',
  boxShadow: '0 0 40px rgba(139,92,246,0.2), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
};

const primaryBtn = {
  width: '100%', padding: '0.9rem', border: 'none', borderRadius: 12,
  background: 'linear-gradient(135deg, #7c3aed, #9f67fa)',
  boxShadow: '0 4px 20px rgba(124,58,237,0.45)',
  color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
  marginTop: '0.5rem', transition: 'opacity 0.15s',
};

export default function Lobby({ room, session }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleStart() {
    setLoading(true); setError('');
    try { await advancePhase(room.code, session.participantId); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  function copyCode() {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '3rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Waiting for everyone</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.3rem', fontSize: '0.9rem' }}>Share the code — friends join from any device</p>
        </div>

        {/* Code card with glow */}
        <div style={{ ...glassActive, padding: '2rem', marginBottom: '1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Room code</div>
          <div style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '0.3em', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
            {room.code}
          </div>
          <button
            onClick={copyCode}
            style={{
              marginTop: '1rem', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: 8, color: copied ? '#a78bfa' : 'var(--muted)', fontSize: '0.8rem',
              padding: '0.4rem 1rem', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {copied ? '✓ Copied' : 'Copy code'}
          </button>
        </div>

        {/* Participants */}
        <div style={{ ...glass, padding: '1.25rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            In the room ({room.participants.length})
          </div>
          {room.participants.map((p, i) => {
            const isYou = p.id === session.participantId;
            const isHost = i === 0;
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.5rem 0', borderBottom: i < room.participants.length - 1 ? '1px solid rgba(139,92,246,0.1)' : 'none',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: isHost ? '#a78bfa' : 'var(--success)',
                  boxShadow: isHost ? '0 0 8px rgba(167,139,250,0.8)' : '0 0 8px rgba(74,222,128,0.8)',
                }} />
                <span style={{ color: isYou ? '#fff' : 'var(--muted)', fontSize: '0.9rem', fontWeight: isYou ? 600 : 400 }}>
                  {p.name}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--subtle)' }}>
                  {isYou && 'you'}{isHost ? (isYou ? ' · host' : 'host') : ''}
                </span>
              </div>
            );
          })}
        </div>

        {session.isHost ? (
          <>
            <button style={{ ...primaryBtn, opacity: loading ? 0.6 : 1 }} onClick={handleStart} disabled={loading}>
              {loading ? 'Starting…' : 'Start — enter preferences'}
            </button>
            {error && <div style={{ marginTop: '0.75rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, color: '#f87171', fontSize: '0.875rem', padding: '0.7rem 0.9rem' }}>{error}</div>}
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.875rem', padding: '1rem 0' }}>
            Waiting for the host to start…
          </div>
        )}
      </div>
    </div>
  );
}

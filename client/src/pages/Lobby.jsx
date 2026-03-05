import { useState } from 'react';
import { advancePhase } from '../api';

const s = {
  page: { minHeight: '100vh', padding: '3rem 1rem', display: 'flex', justifyContent: 'center' },
  container: { width: '100%', maxWidth: '480px' },
  label: { fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' },
  codeBox: {
    background: '#18181f', border: '1px solid #2a2a35', borderRadius: '12px',
    padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center',
  },
  code: { fontSize: '2.5rem', fontWeight: 800, letterSpacing: '0.2em', color: '#fff', fontVariantNumeric: 'tabular-nums' },
  copyBtn: {
    marginTop: '0.75rem', background: 'none', border: '1px solid #2a2a35', borderRadius: '6px',
    color: '#888', fontSize: '0.8rem', padding: '0.35rem 0.85rem', cursor: 'pointer',
  },
  card: { background: '#18181f', border: '1px solid #2a2a35', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' },
  participantList: { listStyle: 'none', padding: 0, margin: '0.75rem 0 0' },
  participantItem: (isYou) => ({
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.5rem 0', borderBottom: '1px solid #1e1e28',
    color: isYou ? '#e8e8f0' : '#aaa', fontSize: '0.9rem',
  }),
  dot: (isHost) => ({
    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
    background: isHost ? '#e05c5c' : '#4caf7d',
  }),
  badge: { fontSize: '0.7rem', color: '#888', marginLeft: 'auto' },
  startBtn: {
    width: '100%', padding: '0.85rem', border: 'none', borderRadius: '8px',
    background: '#e05c5c', color: '#fff', fontSize: '1rem', fontWeight: 700,
    cursor: 'pointer', marginTop: '0.5rem',
  },
  waiting: { color: '#888', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' },
  error: { background: '#2a1515', border: '1px solid #5c2020', borderRadius: '8px', color: '#e05c5c', fontSize: '0.875rem', padding: '0.75rem', marginTop: '0.75rem' },
};

export default function Lobby({ room, session }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleStart() {
    setLoading(true);
    setError('');
    try {
      await advancePhase(room.code, session.participantId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const hostParticipant = room.participants.find(p => p.id === room.participants[0]?.id);

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>Waiting for everyone</h1>
          <p style={{ color: '#888', marginTop: '0.3rem', fontSize: '0.9rem' }}>Share the code so friends can join</p>
        </div>

        <div style={s.codeBox}>
          <div style={s.label}>Room code</div>
          <div style={s.code}>{room.code}</div>
          <button style={s.copyBtn} onClick={copyCode}>{copied ? 'Copied!' : 'Copy code'}</button>
        </div>

        <div style={s.card}>
          <div style={s.label}>Participants ({room.participants.length})</div>
          <ul style={s.participantList}>
            {room.participants.map((p, i) => {
              const isYou = p.id === session.participantId;
              const isRoomHost = i === 0;
              return (
                <li key={p.id} style={s.participantItem(isYou)}>
                  <span style={s.dot(isRoomHost)} />
                  {p.name}
                  <span style={s.badge}>
                    {isYou && 'you'}{isRoomHost ? (isYou ? ' · host' : 'host') : ''}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {session.isHost ? (
          <>
            <button
              style={{ ...s.startBtn, opacity: loading ? 0.5 : 1 }}
              onClick={handleStart}
              disabled={loading}
            >
              {loading ? 'Starting…' : 'Start — enter preferences'}
            </button>
            {error && <div style={s.error}>{error}</div>}
          </>
        ) : (
          <div style={s.waiting}>Waiting for the host to start…</div>
        )}
      </div>
    </div>
  );
}

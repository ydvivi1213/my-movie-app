import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../api';

const glass = {
  background: 'rgba(139, 92, 246, 0.06)',
  border: '1px solid rgba(139, 92, 246, 0.2)',
  borderRadius: 20,
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
};

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(139, 92, 246, 0.2)',
  borderRadius: 12,
  color: '#f0eeff',
  fontSize: '0.95rem',
  padding: '0.75rem 1rem',
  outline: 'none',
  marginBottom: '1rem',
  display: 'block',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
};

const primaryBtn = {
  width: '100%',
  padding: '0.85rem',
  border: 'none',
  borderRadius: 12,
  background: 'linear-gradient(135deg, #7c3aed, #9f67fa)',
  boxShadow: '0 4px 20px rgba(124, 58, 237, 0.45)',
  color: '#fff',
  fontSize: '0.95rem',
  fontWeight: 700,
  cursor: 'pointer',
  marginTop: '0.25rem',
  transition: 'opacity 0.15s, box-shadow 0.15s',
};

export default function Home() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Enter your name');
    setLoading(true); setError('');
    try {
      const data = await createRoom(name.trim());
      sessionStorage.setItem('session', JSON.stringify({ roomCode: data.code, participantId: data.participantId, isHost: true }));
      navigate(`/room/${data.code}`);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>
            Movie<span style={{ color: '#a78bfa' }}>Time</span>
          </div>
          <div style={{ color: 'var(--muted)', marginTop: '0.4rem', fontSize: '0.9rem' }}>
            Stop debating. Start watching.
          </div>
        </div>

        {/* Card */}
        <div style={{ ...glass, padding: '1.75rem' }}>
          <form onSubmit={handleCreate}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Your name</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alex" autoFocus />
            <button style={{ ...primaryBtn, opacity: loading ? 0.6 : 1 }} disabled={loading}>
              {loading ? 'Creating room…' : 'Create room'}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: '0.75rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, color: '#f87171', fontSize: '0.875rem', padding: '0.7rem 0.9rem' }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--subtle)' }}>
            Got a link? Just open it — no code needed.
          </div>
        </div>
      </div>
    </div>
  );
}

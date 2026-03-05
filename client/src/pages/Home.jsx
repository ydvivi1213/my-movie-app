import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, joinRoom } from '../api';

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' },
  container: { width: '100%', maxWidth: '420px' },
  header: { textAlign: 'center', marginBottom: '2.5rem' },
  h1: { fontSize: '2rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' },
  accent: { color: '#e05c5c' },
  subtitle: { color: '#888', marginTop: '0.4rem', fontSize: '0.95rem' },
  tabs: { display: 'flex', gap: '0', marginBottom: '1.5rem', borderRadius: '10px', overflow: 'hidden', border: '1px solid #2a2a35' },
  tab: (active) => ({
    flex: 1, padding: '0.7rem', border: 'none', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
    background: active ? '#e05c5c' : '#18181f', color: active ? '#fff' : '#888',
    transition: 'background 0.15s, color 0.15s',
  }),
  card: { background: '#18181f', border: '1px solid #2a2a35', borderRadius: '12px', padding: '1.5rem' },
  label: { display: 'block', fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' },
  input: {
    width: '100%', background: '#0f0f13', border: '1px solid #2a2a35', borderRadius: '8px',
    color: '#e8e8f0', fontSize: '0.95rem', padding: '0.65rem 0.85rem', outline: 'none',
    marginBottom: '1rem', display: 'block',
  },
  btn: {
    width: '100%', padding: '0.75rem', border: 'none', borderRadius: '8px',
    background: '#e05c5c', color: '#fff', fontSize: '0.95rem', fontWeight: 600,
    cursor: 'pointer', marginTop: '0.5rem',
  },
  btnDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  error: { background: '#2a1515', border: '1px solid #5c2020', borderRadius: '8px', color: '#e05c5c', fontSize: '0.875rem', padding: '0.75rem', marginTop: '0.75rem' },
};

export default function Home() {
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Enter your name');
    setLoading(true);
    setError('');
    try {
      const data = await createRoom(name.trim());
      sessionStorage.setItem('session', JSON.stringify({
        roomCode: data.code,
        participantId: data.participantId,
        isHost: true,
      }));
      navigate(`/room/${data.code}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Enter your name');
    if (!code.trim()) return setError('Enter a room code');
    setLoading(true);
    setError('');
    try {
      const data = await joinRoom(code.trim().toUpperCase(), name.trim());
      sessionStorage.setItem('session', JSON.stringify({
        roomCode: data.room.code,
        participantId: data.participantId,
        isHost: false,
      }));
      navigate(`/room/${data.room.code}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.header}>
          <h1 style={s.h1}>Movie<span style={s.accent}>Time</span></h1>
          <p style={s.subtitle}>Stop debating. Start watching.</p>
        </div>

        <div style={s.tabs}>
          <button style={s.tab(tab === 'create')} onClick={() => { setTab('create'); setError(''); }}>Create room</button>
          <button style={s.tab(tab === 'join')} onClick={() => { setTab('join'); setError(''); }}>Join room</button>
        </div>

        <div style={s.card}>
          {tab === 'create' ? (
            <form onSubmit={handleCreate}>
              <label style={s.label}>Your name</label>
              <input style={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alex" autoFocus />
              <button style={{ ...s.btn, ...(loading ? s.btnDisabled : {}) }} disabled={loading}>
                {loading ? 'Creating…' : 'Create room'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin}>
              <label style={s.label}>Room code</label>
              <input style={s.input} value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. ABC123" autoFocus />
              <label style={s.label}>Your name</label>
              <input style={s.input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jordan" />
              <button style={{ ...s.btn, ...(loading ? s.btnDisabled : {}) }} disabled={loading}>
                {loading ? 'Joining…' : 'Join room'}
              </button>
            </form>
          )}

          {error && <div style={s.error}>{error}</div>}
        </div>
      </div>
    </div>
  );
}

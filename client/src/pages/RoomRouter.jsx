import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { joinRoom } from '../api';
import Lobby from './Lobby';
import Preferences from './Preferences';
import Voting from './Voting';
import Results from './Results';

const glass = {
  background: 'rgba(139, 92, 246, 0.06)',
  border: '1px solid rgba(139, 92, 246, 0.2)',
  borderRadius: 20,
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
};

function JoinPrompt({ code, onJoined }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleJoin(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Enter your name');
    setLoading(true); setError('');
    try {
      const data = await joinRoom(code, name.trim());
      const session = { roomCode: data.room.code, participantId: data.participantId, isHost: false };
      sessionStorage.setItem('session', JSON.stringify(session));
      onJoined(session);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>
            Movie<span style={{ color: '#a78bfa' }}>Time</span>
          </div>
          <div style={{ color: 'var(--muted)', marginTop: '0.4rem', fontSize: '0.9rem' }}>
            You've been invited to a room
          </div>
        </div>
        <div style={{ ...glass, padding: '1.75rem' }}>
          <form onSubmit={handleJoin}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Your name</label>
            <input
              autoFocus
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, color: '#f0eeff', fontSize: '0.95rem', padding: '0.75rem 1rem', outline: 'none', marginBottom: '1rem', display: 'block', boxSizing: 'border-box' }}
              value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jordan"
            />
            <button
              style={{ width: '100%', padding: '0.85rem', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #9f67fa)', boxShadow: '0 4px 20px rgba(124,58,237,0.45)', color: '#fff', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
              disabled={loading}
            >
              {loading ? 'Joining…' : 'Join room'}
            </button>
          </form>
          {error && (
            <div style={{ marginTop: '0.75rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, color: '#f87171', fontSize: '0.875rem', padding: '0.7rem 0.9rem' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RoomRouter() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(() => {
    const rawSession = sessionStorage.getItem('session');
    const urlParams = new URLSearchParams(window.location.search);
    if (rawSession) {
      const s = JSON.parse(rawSession);
      return s.roomCode === code ? s : null;
    }
    if (urlParams.get('participantId')) {
      return { roomCode: code, participantId: urlParams.get('participantId'), isHost: urlParams.get('isHost') === 'true' };
    }
    return null;
  });

  const { room, error } = useRoom(code);

  if (!session) {
    return <JoinPrompt code={code} onJoined={setSession} />;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#e05c5c' }}>
        {error} — <button onClick={() => navigate('/')} style={{ color: '#e05c5c', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>go home</button>
      </div>
    );
  }

  if (!room) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Connecting…</div>;
  }

  const props = { room, session };

  switch (room.state) {
    case 'lobby':       return <Lobby {...props} />;
    case 'preferences': return <Preferences {...props} />;
    case 'voting':      return <Voting {...props} />;
    case 'results':     return <Results {...props} />;
    default:            return <div style={{ padding: '2rem', color: '#888' }}>Unknown room state: {room.state}</div>;
  }
}

import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import Lobby from './Lobby';
import Preferences from './Preferences';
import Voting from './Voting';
import Results from './Results';

export default function RoomRouter() {
  const { code } = useParams();
  const { room, error } = useRoom(code);
  const navigate = useNavigate();

  const rawSession = sessionStorage.getItem('session');
  const session = rawSession ? JSON.parse(rawSession) : null;

  // If no session or session is for a different room, redirect home
  if (!session || session.roomCode !== code) {
    navigate('/');
    return null;
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

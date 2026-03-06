import { useState } from 'react';
import { submitPreferences, advancePhase } from '../api';

const glass = {
  background: 'rgba(139, 92, 246, 0.06)',
  border: '1px solid rgba(139, 92, 246, 0.2)',
  borderRadius: 16,
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
};

const primaryBtn = {
  padding: '0.7rem 1.5rem', border: 'none', borderRadius: 12,
  background: 'linear-gradient(135deg, #7c3aed, #9f67fa)',
  boxShadow: '0 4px 20px rgba(124,58,237,0.45)',
  color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
  marginTop: '1rem', transition: 'opacity 0.15s',
};

export default function Preferences({ room, session }) {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(room.preferenceSubmitted.includes(session.participantId));
  const [submitLoading, setSubmitLoading] = useState(false);
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [error, setError] = useState('');

  const allSubmitted = room.participants.every(p => room.preferenceSubmitted.includes(p.id));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return setError('Enter at least a few words');
    setSubmitLoading(true); setError('');
    try {
      await submitPreferences(room.code, session.participantId, text.trim());
      setSubmitted(true);
    } catch (err) { setError(err.message); }
    finally { setSubmitLoading(false); }
  }

  async function handleAdvance() {
    setAdvanceLoading(true); setError('');
    try { await advancePhase(room.code, session.participantId); }
    catch (err) { setError(err.message); setAdvanceLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '3rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>What do you want to watch?</h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.4rem', fontSize: '0.875rem' }}>
            Enter independently — no one sees yours until after.
          </p>
        </div>

        {/* Input or locked state */}
        {!submitted ? (
          <div style={{ ...glass, padding: '1.5rem', marginBottom: '1rem' }}>
            <form onSubmit={handleSubmit}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Your must-haves
              </label>
              <textarea
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12,
                  color: '#f0eeff', fontSize: '0.95rem', padding: '0.85rem',
                  outline: 'none', resize: 'vertical', minHeight: 100,
                  marginTop: '0.25rem',
                }}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="e.g. something funny, a bit tense, love sci-fi but no gore…"
                autoFocus
              />
              <button style={{ ...primaryBtn, opacity: submitLoading ? 0.6 : 1 }} disabled={submitLoading}>
                {submitLoading ? 'Saving…' : 'Lock in my pick'}
              </button>
              {error && <div style={{ marginTop: '0.75rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, color: '#f87171', fontSize: '0.875rem', padding: '0.7rem 0.9rem' }}>{error}</div>}
            </form>
          </div>
        ) : (
          <div style={{ ...glass, padding: '1.25rem', marginBottom: '1rem', borderColor: 'rgba(74,222,128,0.3)', boxShadow: '0 0 24px rgba(74,222,128,0.1), 0 8px 32px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ color: 'var(--success)', fontSize: '1.1rem' }}>✓</span>
              <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>Your preferences are locked in</span>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>Waiting for everyone else…</div>
          </div>
        )}

        {/* Who's submitted */}
        <div style={{ ...glass, padding: '1.25rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            Who's submitted
          </div>
          {room.participants.map(p => {
            const done = room.preferenceSubmitted.includes(p.id);
            const isYou = p.id === session.participantId;
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0' }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: done ? 'var(--success)' : 'var(--subtle)',
                  boxShadow: done ? '0 0 6px rgba(74,222,128,0.8)' : 'none',
                  transition: 'all 0.3s',
                }} />
                <span style={{ color: done ? '#fff' : 'var(--muted)', fontSize: '0.875rem', fontWeight: done ? 500 : 400 }}>
                  {p.name}
                  {isYou && <span style={{ color: 'var(--subtle)', fontSize: '0.78rem', marginLeft: 6 }}>(you)</span>}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: done ? 'var(--success)' : 'var(--subtle)' }}>
                  {done ? 'ready' : 'thinking…'}
                </span>
              </div>
            );
          })}
        </div>

        {session.isHost && submitted && (
          <>
            <button
              style={{ width: '100%', ...primaryBtn, opacity: advanceLoading ? 0.6 : 1, marginTop: 0 }}
              onClick={handleAdvance}
              disabled={advanceLoading}
            >
              {advanceLoading
                ? 'Finding movies… (~10s)'
                : allSubmitted ? 'Find matching movies' : 'Find movies anyway'}
            </button>
            {error && <div style={{ marginTop: '0.75rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, color: '#f87171', fontSize: '0.875rem', padding: '0.7rem 0.9rem' }}>{error}</div>}
          </>
        )}

        {!session.isHost && submitted && (
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
            Waiting for the host to generate movies…
          </div>
        )}
      </div>
    </div>
  );
}

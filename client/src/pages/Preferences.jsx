import { useState } from 'react';
import { submitPreferences, advancePhase } from '../api';

const s = {
  page: { minHeight: '100vh', padding: '3rem 1rem', display: 'flex', justifyContent: 'center' },
  container: { width: '100%', maxWidth: '520px' },
  label: { fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' },
  card: { background: '#18181f', border: '1px solid #2a2a35', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem' },
  textarea: {
    width: '100%', background: '#0f0f13', border: '1px solid #2a2a35', borderRadius: '8px',
    color: '#e8e8f0', fontSize: '0.95rem', padding: '0.75rem', outline: 'none',
    resize: 'vertical', minHeight: '90px', marginTop: '0.5rem',
  },
  submitBtn: {
    marginTop: '1rem', padding: '0.7rem 1.5rem', border: 'none', borderRadius: '8px',
    background: '#e05c5c', color: '#fff', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
  },
  advanceBtn: {
    width: '100%', padding: '0.85rem', border: 'none', borderRadius: '8px',
    background: '#e05c5c', color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
  },
  submitted: { color: '#4caf7d', fontSize: '0.875rem', marginTop: '0.75rem' },
  waiting: { color: '#888', fontSize: '0.875rem', marginTop: '0.4rem' },
  progressCard: { background: '#18181f', border: '1px solid #2a2a35', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' },
  participantRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0', fontSize: '0.875rem', color: '#aaa' },
  check: { color: '#4caf7d', fontWeight: 700 },
  pending: { color: '#555' },
  error: { background: '#2a1515', border: '1px solid #5c2020', borderRadius: '8px', color: '#e05c5c', fontSize: '0.875rem', padding: '0.75rem', marginTop: '0.75rem' },
};

export default function Preferences({ room, session }) {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(
    room.preferenceSubmitted.includes(session.participantId)
  );
  const [submitLoading, setSubmitLoading] = useState(false);
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [error, setError] = useState('');

  const allSubmitted = room.participants.every(p => room.preferenceSubmitted.includes(p.id));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return setError('Enter at least a few words');
    setSubmitLoading(true);
    setError('');
    try {
      await submitPreferences(room.code, session.participantId, text.trim());
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
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

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>What do you want to watch?</h1>
          <p style={{ color: '#888', marginTop: '0.4rem', fontSize: '0.9rem' }}>
            Enter independently — no one sees yours until after. Genres, moods, titles, vibes…
          </p>
        </div>

        {!submitted ? (
          <div style={s.card}>
            <form onSubmit={handleSubmit}>
              <label style={s.label}>Your must-haves</label>
              <textarea
                style={s.textarea}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="e.g. something funny, a bit tense, love sci-fi but no gore, open to a classic"
                autoFocus
              />
              <button style={{ ...s.submitBtn, opacity: submitLoading ? 0.5 : 1 }} disabled={submitLoading}>
                {submitLoading ? 'Saving…' : 'Submit'}
              </button>
              {error && <div style={s.error}>{error}</div>}
            </form>
          </div>
        ) : (
          <div style={{ ...s.card, borderColor: '#2e4a3a' }}>
            <div style={s.submitted}>Your preferences are locked in.</div>
            <div style={s.waiting}>Waiting for everyone else…</div>
          </div>
        )}

        <div style={s.progressCard}>
          <div style={s.label}>Who's submitted</div>
          {room.participants.map(p => {
            const done = room.preferenceSubmitted.includes(p.id);
            return (
              <div key={p.id} style={s.participantRow}>
                <span style={done ? s.check : s.pending}>{done ? '✓' : '○'}</span>
                {p.name}
                {p.id === session.participantId && <span style={{ color: '#555', fontSize: '0.8rem' }}>(you)</span>}
              </div>
            );
          })}
        </div>

        {session.isHost && submitted && (
          <>
            <button
              style={{ ...s.advanceBtn, opacity: advanceLoading ? 0.5 : 1 }}
              onClick={handleAdvance}
              disabled={advanceLoading}
            >
              {advanceLoading
                ? 'Finding movies… (this takes ~10s)'
                : allSubmitted
                  ? 'Find matching movies'
                  : 'Find movies anyway (not everyone submitted)'}
            </button>
            {error && <div style={s.error}>{error}</div>}
          </>
        )}

        {!session.isHost && submitted && (
          <div style={{ ...s.waiting, textAlign: 'center', padding: '1rem 0' }}>
            Waiting for the host to generate movies…
          </div>
        )}
      </div>
    </div>
  );
}

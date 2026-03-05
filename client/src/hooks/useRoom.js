import { useState, useEffect, useRef } from 'react';
import { getRoom } from '../api';

const POLL_INTERVAL = 2500;

export function useRoom(code) {
  const [room, setRoom] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!code) return;

    const poll = async () => {
      try {
        const data = await getRoom(code);
        setRoom(data.room);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [code]);

  return { room, error };
}

import { useEffect, useState } from 'react';

/** Current time as state, refreshed periodically so "AGORA" / upcoming splits stay current. */
export function useNow(intervalMs = 60 * 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

import { useEffect, useState } from "react";

/** Re-renders on an interval; for countdowns and live ETAs. */
export function useTicker(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

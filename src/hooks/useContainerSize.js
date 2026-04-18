import { useState, useEffect, useRef } from 'react';

/**
 * Returns { ref, ready } where ready becomes true once the container
 * has a width and height greater than zero (i.e. the browser has laid
 * it out). Attach `ref` to the wrapper div and gate the Recharts
 * <ResponsiveContainer> behind `ready` to eliminate the width(-1) / height(-1) warnings.
 */
export function useContainerSize() {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setReady(true);
          observer.disconnect();
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, ready };
}

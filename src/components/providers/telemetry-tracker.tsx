'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function TelemetryTracker() {
  const pathname = usePathname();
  const sessionIdRef = useRef<string>('');
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Generate a random session ID per browser tab if not already present
    if (!sessionIdRef.current) {
      sessionIdRef.current = `sess_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
    }

    startTimeRef.current = Date.now();
    const currentSessionId = sessionIdRef.current;

    // Send initial page view
    try {
      fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: pathname,
          referrer: document.referrer || '',
          sessionId: currentSessionId,
          durationSeconds: 0,
          isHeartbeat: false,
        }),
      }).catch(() => {});
    } catch {
      // Ignore
    }

    // Heartbeat every 15 seconds to update duration
    const interval = setInterval(() => {
      const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      try {
        fetch('/api/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: pathname,
            sessionId: currentSessionId,
            durationSeconds,
            isHeartbeat: true,
          }),
        }).catch(() => {});
      } catch {
        // Ignore
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      // Send final duration on unmount / route change
      const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (finalDuration > 1) {
        try {
          fetch('/api/telemetry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: pathname,
              sessionId: currentSessionId,
              durationSeconds: finalDuration,
              isHeartbeat: true,
            }),
            keepalive: true,
          }).catch(() => {});
        } catch {
          // Ignore
        }
      }
    };
  }, [pathname]);

  return null;
}

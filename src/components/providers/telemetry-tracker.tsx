'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function TelemetryTracker() {
  const pathname = usePathname();
  const sessionIdRef = useRef<string>('');
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // Never track SuperAdmin internal operations
    if (pathname.startsWith('/superadmin')) {
      return;
    }

    // Generate a random session ID per browser tab if not already present
    if (!sessionIdRef.current) {
      sessionIdRef.current = `sess_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
    }

    startTimeRef.current = Date.now();
    const currentSessionId = sessionIdRef.current;

    // Send initial page view deferred to idle time (prevents blocking LCP/FCP)
    const sendInitial = () => {
      try {
        const screenResolution =
          typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : undefined;
        const language = typeof navigator !== 'undefined' ? navigator.language : undefined;

        fetch('/api/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: pathname,
            referrer: document.referrer || '',
            sessionId: currentSessionId,
            screenResolution,
            language,
            durationSeconds: 0,
            isHeartbeat: false,
          }),
        }).catch(() => {});
      } catch {}
    };

    let idleId: any;
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = (window as any).requestIdleCallback(sendInitial, { timeout: 2000 });
    } else {
      idleId = setTimeout(sendInitial, 1000);
    }

    // Heartbeat every 30 seconds to update duration (reduced frequency for performance)
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
      } catch {}
    }, 30000);

    return () => {
      if (typeof window !== 'undefined' && 'cancelIdleCallback' in window && typeof idleId === 'number') {
        (window as any).cancelIdleCallback(idleId);
      } else {
        clearTimeout(idleId);
      }
      clearInterval(interval);

      // Send final duration on unmount / route change using sendBeacon if available
      const finalDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (finalDuration > 1) {
        const payload = JSON.stringify({
          path: pathname,
          sessionId: currentSessionId,
          durationSeconds: finalDuration,
          isHeartbeat: true,
        });

        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon('/api/telemetry', new Blob([payload], { type: 'application/json' }));
        } else {
          try {
            fetch('/api/telemetry', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: payload,
              keepalive: true,
            }).catch(() => {});
          } catch {}
        }
      }
    };
  }, [pathname]);

  return null;
}

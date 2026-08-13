import { useEffect, useRef } from 'react';
import { apiBaseUrl } from '../utils/apiBaseUrl';

/**
 * Keeps the table slot alive while the customer is on any ordering screen,
 * and releases it the moment the customer leaves.
 *
 * Rules:
 * - Heartbeats run ONLY while the tab is visible. Switching apps / locking
 *   the phone / closing the browser stops them, so the backend can tell the
 *   customer is gone (its TTL reclaim frees the slot ~2 min later).
 * - When the tab is hidden for `releaseDelayMs` (default 60s) a "free the
 *   slot" request is fired — unless `releaseGuard` says an unpaid order is
 *   still open (bill not paid => the table legitimately stays occupied).
 * - `pagehide` (tab actually closed / navigated away) releases immediately
 *   with a keepalive fetch.
 */
export const useSlotHeartbeat = (
  tableNumber,
  slotNumber,
  { releaseGuard, releaseDelayMs = 60000, intervalMs = 20000 } = {}
) => {
  const guardRef = useRef(releaseGuard);
  const tableRef = useRef(tableNumber);
  const slotRef = useRef(slotNumber);

  useEffect(() => {
    guardRef.current = releaseGuard;
  }, [releaseGuard]);

  useEffect(() => {
    tableRef.current = tableNumber;
    slotRef.current = slotNumber;
  }, [tableNumber, slotNumber]);

  useEffect(() => {
    if (!tableNumber || !slotNumber) return;

    let heartbeatTimer = null;
    let releaseTimer = null;

    const sessionHeaders = () => {
      const qrToken = localStorage.getItem('customerQrToken');
      const hotelName = localStorage.getItem('customerSelectedDatabase') || localStorage.getItem('selectedDatabase');
      const sessionId = localStorage.getItem('tabbleSessionId');
      return {
        'Content-Type': 'application/json',
        ...(sessionId ? { 'x-session-id': sessionId } : {}),
        ...(qrToken ? { 'x-qr-token': qrToken } : {}),
        ...(hotelName ? { 'x-hotel-name': hotelName } : {}),
      };
    };

    const beat = () => {
      const t = tableRef.current;
      const s = slotRef.current;
      if (!t || !s) return;
      try {
        fetch(`${apiBaseUrl}/tables/number/${parseInt(t)}/heartbeat?slot_number=${parseInt(s)}`, {
          method: 'PUT',
          keepalive: true,
          headers: sessionHeaders(),
        }).catch(() => {});
      } catch {
        // network hiccups are fine — the next beat will retry
      }
    };

    // Only free when no unpaid order keeps the slot legitimately occupied.
    const releaseIfSafe = (keepalive = false) => {
      if (guardRef.current && guardRef.current()) return;
      const t = tableRef.current;
      const s = slotRef.current;
      if (!t || !s) return;
      try {
        fetch(`${apiBaseUrl}/tables/number/${parseInt(t)}/free?slot_number=${parseInt(s)}`, {
          method: 'PUT',
          keepalive,
          headers: sessionHeaders(),
        }).catch(() => {});
      } catch {
        // Beacon failure is fine — the backend stale-slot reclaim handles it
      }
    };

    const stopHeartbeat = () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    };

    const startHeartbeat = () => {
      stopHeartbeat();
      beat();
      heartbeatTimer = setInterval(beat, intervalMs);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(releaseTimer);
        startHeartbeat();
      } else {
        // Tab backgrounded / phone locked: stop heartbeats so the backend's
        // TTL starts counting, and free the slot if the customer stays away.
        stopHeartbeat();
        releaseTimer = setTimeout(() => releaseIfSafe(false), releaseDelayMs);
      }
    };

    const onPageHide = () => {
      // Tab actually closed — release immediately, keepalive so the request
      // survives the page being torn down.
      releaseIfSafe(true);
    };

    startHeartbeat();
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      clearTimeout(releaseTimer);
      stopHeartbeat();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [tableNumber, slotNumber, intervalMs, releaseDelayMs]);
};

export default useSlotHeartbeat;

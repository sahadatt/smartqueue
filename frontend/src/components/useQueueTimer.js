import { useState, useEffect, useRef } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || `http://${window.location.hostname}:5000`;

export const useQueueTimer = ({
  myToken,
  safeLiveToken,
  patientsAhead,
  expectedStartTime,
  timePerPatient,
  realStatus,
  isMyTurn,
  isTurnCompleted,
  lang
}) => {
  // 🚀 SMART CACHE INITIALIZATION
  const stateRef = useRef({
    targetEtaMs: parseInt(localStorage.getItem('q_target_eta')) || null,
    lastExpectedStr: localStorage.getItem('q_last_expected_str') || '',
    lastLiveToken: parseInt(localStorage.getItem('q_last_live_token')) || -1,
    lastPatientsAhead: parseInt(localStorage.getItem('q_last_patients_ahead')) || -1,
    myToken: localStorage.getItem('q_my_token') || null
  });

  const [targetEtaMs, setTargetEtaMs] = useState(stateRef.current.targetEtaMs);
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const [displayStatus, setDisplayStatus] = useState('loading');

  const displayStatusRef = useRef(displayStatus);
  const realStatusRef = useRef(realStatus);
  const autoNextRef = useRef(false);

  useEffect(() => { displayStatusRef.current = displayStatus; }, [displayStatus]);
  useEffect(() => { realStatusRef.current = realStatus; }, [realStatus]);
  useEffect(() => { autoNextRef.current = false; }, [safeLiveToken]);

  // ⏱️ ADMIN TIME DELAY HELPER
  const getAdminDelayMs = (str, anchorTime) => {
    if (!str) return 0;
    const lower = str.toLowerCase();
    if (lower.includes('shortly')) return 10 * 60000;
    if (lower.includes('delay')) return 30 * 60000;
    if (str.includes(':')) {
      let [hours, rest] = str.split(':');
      let hrs = parseInt(hours, 10);
      let mins = parseInt(rest, 10);
      if (lower.includes('pm') && hrs < 12) hrs += 12;
      if (lower.includes('am') && hrs === 12) hrs = 0;
      const expectedDate = new Date(anchorTime);
      expectedDate.setHours(hrs, mins, 0, 0);
      return Math.max(0, expectedDate.getTime() - anchorTime);
    }
    return 0;
  };

  // 🚀 MATH ENGINE EFFECT
  useEffect(() => {
    if (realStatus === 'loading' || !myToken || isMyTurn || isTurnCompleted) return;

    const now = Date.now();
    const s = stateRef.current;
    const timePerPatMs = (timePerPatient || 5) * 60000;
    const safeExpected = expectedStartTime || '';

    // Condition: Fresh Start / Queue Reset
    if (!s.targetEtaMs || safeLiveToken < s.lastLiveToken || String(myToken) !== String(s.myToken)) {
        let adminDelay = getAdminDelayMs(safeExpected, now);
        s.targetEtaMs = now + adminDelay + (patientsAhead * timePerPatMs);
    } 
    else {
        // Condition: Admin changed/cleared 'Shortly' time
        if (safeExpected !== s.lastExpectedStr) {
            let oldDelay = getAdminDelayMs(s.lastExpectedStr, now);
            let newDelay = getAdminDelayMs(safeExpected, now);
            if (!safeExpected) {
                s.targetEtaMs -= oldDelay; 
            } else {
                s.targetEtaMs = (s.targetEtaMs - oldDelay) + newDelay;
            }
        }

        // Condition: Admin pressed 'Next' early! 
        if (patientsAhead < s.lastPatientsAhead) {
            let diff = s.lastPatientsAhead - patientsAhead;
            s.targetEtaMs -= (diff * timePerPatMs); 
        } 
        else if (patientsAhead > s.lastPatientsAhead && s.lastPatientsAhead !== -1) {
            let diff = patientsAhead - s.lastPatientsAhead;
            s.targetEtaMs += (diff * timePerPatMs);
        }
    }

    s.lastExpectedStr = safeExpected;
    s.lastLiveToken = safeLiveToken;
    s.lastPatientsAhead = patientsAhead;
    s.myToken = myToken;
    
    setTargetEtaMs(s.targetEtaMs);

    // Save to Cache
    if (s.targetEtaMs) localStorage.setItem('q_target_eta', s.targetEtaMs);
    localStorage.setItem('q_last_expected_str', s.lastExpectedStr);
    localStorage.setItem('q_last_live_token', s.lastLiveToken);
    localStorage.setItem('q_last_patients_ahead', s.lastPatientsAhead);
    localStorage.setItem('q_my_token', s.myToken);

  }, [patientsAhead, expectedStartTime, myToken, safeLiveToken, timePerPatient, realStatus, isMyTurn, isTurnCompleted]);

  // 🚀 TICK ENGINE (Condition: Pause Logic & Auto-Expire Fix)
  useEffect(() => {
    const timerId = setInterval(() => {
        const s = stateRef.current;
        if (!s.targetEtaMs || !myToken || isMyTurn || isTurnCompleted) {
            setTimeLeftMs(0);
            return;
        }

        const now = Date.now();
        const real = realStatusRef.current;
        const currentUI = displayStatusRef.current;

        // Condition: IF PAUSED (Lunch/Meeting) -> Push Target Time Forward!
        if (['lunch', 'meeting', 'busy'].includes(real)) {
            s.targetEtaMs += 1000; 
            setTargetEtaMs(s.targetEtaMs);
            localStorage.setItem('q_target_eta', s.targetEtaMs); 
        }

        const remaining = Math.max(0, s.targetEtaMs - now);
        setTimeLeftMs(remaining);

        // Auto Next Trigger
        if (remaining === 0 && s.lastPatientsAhead === 1 && real === 'active' && !autoNextRef.current) {
            autoNextRef.current = true;
            fetch(`${BACKEND_URL}/api/auth/auto-next`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentLive: s.lastLiveToken })
            }).catch(() => {});
        }

        // 🔥 FIXED UI STATUS LOGIC (Auto-Expire Bug Fix) 🔥
        const delayActive = getAdminDelayMs(s.lastExpectedStr, now) > 0;
        const hasTimeSet = s.lastExpectedStr.trim() !== '';

        if (['lunch', 'meeting', 'busy'].includes(real)) {
            if (currentUI !== real) setDisplayStatus(real);
        } else if (real === 'not-started') {
            if (hasTimeSet && !delayActive) {
                // Time expired! Auto-start the queue UI
                if (currentUI !== 'active') setDisplayStatus('active');
            } else {
                if (currentUI !== 'not-started') setDisplayStatus('not-started');
            }
        } else {
            // Real is 'active'
            if (delayActive) {
                if (currentUI !== 'not-started') setDisplayStatus('not-started');
            } else {
                if (currentUI !== 'active') setDisplayStatus('active');
            }
        }
    }, 1000);
    return () => clearInterval(timerId);
  }, [myToken, isMyTurn, isTurnCompleted]);

  // Format Helpers
  const formatLiveCountdown = (ms) => {
    if (ms <= 0) return "00:00:00";
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const arrivalTimeFormatted = targetEtaMs ? new Date(targetEtaMs).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : (lang === 'hi' ? 'आपकी बारी आ गई है!' : 'Your Turn Now!');

  const clearTimerCache = () => {
    localStorage.removeItem('q_target_eta');
    localStorage.removeItem('q_last_expected_str');
    localStorage.removeItem('q_last_live_token');
    localStorage.removeItem('q_last_patients_ahead');
    localStorage.removeItem('q_my_token');
  };

  return {
    targetEtaMs,
    timeLeftMs,
    displayStatus,
    formattedCountdown: formatLiveCountdown(timeLeftMs),
    arrivalTimeFormatted,
    clearTimerCache
  };
};
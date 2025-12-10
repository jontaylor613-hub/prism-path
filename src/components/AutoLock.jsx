import React, { useEffect, useState, useRef } from 'react';
import { Lock } from 'lucide-react';
import { getTheme } from '../utils';

/**
 * Auto-Lock Screen Component
 * Monitors inactivity and locks screen after 15 minutes
 */
export default function AutoLock({ isDark, onUnlock, isLocked, setIsLocked }) {
  const [showLock, setShowLock] = useState(false);
  const inactivityTimer = useRef(null);
  const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
  const theme = getTheme(isDark);

  useEffect(() => {
    if (isLocked) {
      setShowLock(true);
      return;
    }

    // Reset timer on user activity
    const resetTimer = () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }

      inactivityTimer.current = setTimeout(() => {
        setIsLocked(true);
        setShowLock(true);
      }, INACTIVITY_TIMEOUT);
    };

    // Monitor activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    // Start the timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [isLocked, setIsLocked]);

  const handleUnlock = () => {
    setShowLock(false);
    setIsLocked(false);
    if (onUnlock) {
      onUnlock();
    }
  };

  if (!showLock) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-lg p-8 max-w-md w-full text-center`}>
        <Lock className="mx-auto mb-4 text-cyan-400" size={48} />
        <h2 className={`text-2xl font-bold ${theme.text} mb-2`}>Session Paused</h2>
        <p className={`${theme.textMuted} mb-6`}>
          Your session has been paused due to inactivity for security purposes.
        </p>
        <button
          onClick={handleUnlock}
          className="px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors"
        >
          Resume Session
        </button>
      </div>
    </div>
  );
}



import React, { useState, useEffect, useRef } from 'react';
import { LifeBuoy, X, Phone, FileText, Clock } from 'lucide-react';
import { saveBehaviorLog } from '../studentData';
import { showToast } from '../utils/toast';

/**
 * CrisisMode Component
 * Emergency behavioral de-escalation tool with timer and quick actions
 */
export default function CrisisMode({ 
  activeStudent, 
  user,
  officePhone = '555-0100' // Default, should be configurable
}) {
  const [isActive, setIsActive] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLogging, setIsLogging] = useState(false);
  const intervalRef = useRef(null);

  // Timer logic
  useEffect(() => {
    if (isActive && startTime) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, startTime]);

  const handleActivate = () => {
    setIsActive(true);
    setStartTime(Date.now());
    setElapsedSeconds(0);
  };

  const handleEndCrisis = () => {
    setIsActive(false);
    setStartTime(null);
    setElapsedSeconds(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogIncident = async () => {
    if (!activeStudent?.id || !user?.uid) {
      showToast('No student selected', 'error');
      return;
    }

    setIsLogging(true);
    try {
      const incidentTime = new Date().toISOString();
      const duration = formatTime(elapsedSeconds);
      
      const logEntry = {
        type: 'crisis',
        incidentTime: incidentTime,
        duration: duration,
        durationSeconds: elapsedSeconds,
        behavior: 'Crisis incident - De-escalation required',
        antecedent: 'Crisis mode activated',
        consequence: 'De-escalation protocols followed',
        notes: `Crisis mode activated. Duration: ${duration}. De-escalation scripts used.`
      };

      await saveBehaviorLog(activeStudent.id, logEntry, user.uid);
      showToast('Incident logged successfully', 'success');
      
      // Optionally end crisis after logging
      handleEndCrisis();
    } catch (error) {
      console.error('Error logging incident:', error);
      showToast('Failed to log incident. Please try again.', 'error');
    } finally {
      setIsLogging(false);
    }
  };

  const handleCallOffice = () => {
    window.location.href = `tel:${officePhone}`;
  };

  const deEscalationScripts = [
    "I see you are upset. I am here to help.",
    "I am going to give you space.",
    "Let's breathe together."
  ];

  return (
    <>
      {/* Floating Action Button */}
      {!isActive && (
        <button
          onClick={handleActivate}
          className="fixed bottom-6 right-6 z-[9998] w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 animate-pulse"
          aria-label="Activate Crisis Mode"
          title="Crisis Mode - Emergency De-escalation"
        >
          <LifeBuoy size={28} />
        </button>
      )}

      {/* Full-Screen Overlay */}
      {isActive && (
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6">
          {/* Close Button */}
          <button
            onClick={handleEndCrisis}
            className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors"
            aria-label="End Crisis Mode"
          >
            <X size={32} />
          </button>

          {/* Main Content */}
          <div className="max-w-4xl w-full text-center space-y-12">
            {/* Timer */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 text-white/60">
                <Clock size={32} />
                <span className="text-2xl font-semibold">Duration</span>
              </div>
              <div className="text-8xl md:text-9xl font-bold text-white font-mono">
                {formatTime(elapsedSeconds)}
              </div>
            </div>

            {/* De-escalation Scripts */}
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
                De-escalation Scripts
              </h2>
              <div className="space-y-4">
                {deEscalationScripts.map((script, index) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 md:p-8"
                  >
                    <p className="text-2xl md:text-3xl font-medium text-white leading-relaxed">
                      {script}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
              {/* Log Incident */}
              <button
                onClick={handleLogIncident}
                disabled={isLogging}
                className={`
                  flex flex-col items-center justify-center gap-3 p-6 md:p-8
                  bg-blue-600 hover:bg-blue-700 text-white rounded-2xl
                  font-bold text-xl md:text-2xl
                  transition-all transform hover:scale-105 active:scale-95
                  shadow-2xl
                  ${isLogging ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <FileText size={32} />
                <span>{isLogging ? 'Logging...' : 'Log Incident'}</span>
              </button>

              {/* Call Office */}
              <button
                onClick={handleCallOffice}
                className="
                  flex flex-col items-center justify-center gap-3 p-6 md:p-8
                  bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl
                  font-bold text-xl md:text-2xl
                  transition-all transform hover:scale-105 active:scale-95
                  shadow-2xl
                "
              >
                <Phone size={32} />
                <span>Call Office</span>
              </button>

              {/* End Crisis */}
              <button
                onClick={handleEndCrisis}
                className="
                  flex flex-col items-center justify-center gap-3 p-6 md:p-8
                  bg-slate-700 hover:bg-slate-600 text-white rounded-2xl
                  font-bold text-xl md:text-2xl
                  transition-all transform hover:scale-105 active:scale-95
                  shadow-2xl
                "
              >
                <X size={32} />
                <span>End Crisis</span>
              </button>
            </div>

            {/* Student Info */}
            {activeStudent && (
              <div className="pt-8">
                <p className="text-xl md:text-2xl text-white/80">
                  Tracking for: <span className="font-bold text-white">{activeStudent.name}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}


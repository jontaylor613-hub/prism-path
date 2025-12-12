import React, { useState, useEffect } from 'react';
import { AlertCircle, X, Wind } from 'lucide-react';

// --- 4-7-8 BREATHING ANIMATION ---
const BreathingBox = ({ onClose }) => {
  const [phase, setPhase] = useState('Inhale');
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    let timeoutId;
    const breathingCycle = () => {
      // 4 seconds: Inhale
      setPhase('Inhale');
      timeoutId = setTimeout(() => {
        // 7 seconds: Hold
        setPhase('Hold');
        timeoutId = setTimeout(() => {
          // 8 seconds: Exhale
          setPhase('Exhale');
          timeoutId = setTimeout(() => {
            // Brief pause before next cycle
            setPhase('Ready');
            setCycle(prev => prev + 1);
            timeoutId = setTimeout(() => {
              breathingCycle();
            }, 1000);
          }, 8000);
        }, 7000);
      }, 4000);
    };
    
    breathingCycle();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const getPhaseText = () => {
    switch(phase) {
      case 'Inhale': return 'Breathe In';
      case 'Hold': return 'Hold';
      case 'Exhale': return 'Breathe Out';
      default: return 'Ready';
    }
  };

  const getScale = () => {
    switch(phase) {
      case 'Inhale': return 1.5;
      case 'Hold': return 1.5;
      case 'Exhale': return 1;
      default: return 1;
    }
  };

  const getOpacity = () => {
    switch(phase) {
      case 'Inhale': return 1;
      case 'Hold': return 1;
      case 'Exhale': return 0.7;
      default: return 0.5;
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors p-3 hover:bg-white/10 rounded-full z-10"
        >
          <X size={28} />
        </button>

        {/* Breathing Circle */}
        <div className="relative flex items-center justify-center mb-16">
          <div 
            className="w-64 h-64 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_80px_rgba(6,182,212,0.6)] flex items-center justify-center transition-all duration-[4000ms] ease-in-out"
            style={{ 
              transform: `scale(${getScale()})`,
              opacity: getOpacity()
            }}
          >
            <Wind size={64} className="text-white/90" />
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center">
          <h2 className="text-5xl font-bold text-white mb-6 tracking-widest uppercase">
            {getPhaseText()}
          </h2>
          <p className="text-white/80 text-xl mb-2">
            {phase === 'Inhale' && 'Count to 4 slowly'}
            {phase === 'Hold' && 'Count to 7 slowly'}
            {phase === 'Exhale' && 'Count to 8 slowly'}
            {phase === 'Ready' && 'Get ready for the next breath'}
          </p>
          <p className="text-white/50 text-sm mt-4">
            Cycle {cycle + 1} • 4-7-8 Breathing
          </p>
        </div>
      </div>
    </div>
  );
};

// --- MAIN EJECT BUTTON COMPONENT ---
export default function EjectButton() {
  const [showBreathing, setShowBreathing] = useState(false);

  return (
    <>
      {/* Floating Red Button */}
      <button
        onClick={() => setShowBreathing(true)}
        className="fixed bottom-6 right-6 z-[250] w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-[0_0_30px_rgba(239,68,68,0.6)] flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        aria-label="Emergency breathing exercise"
      >
        <AlertCircle size={28} fill="white" />
      </button>

      {/* Breathing Overlay */}
      {showBreathing && (
        <BreathingBox onClose={() => setShowBreathing(false)} />
      )}
    </>
  );
}


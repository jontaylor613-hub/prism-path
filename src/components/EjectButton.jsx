import React, { useState, useEffect } from 'react';
import { AlertCircle, X, Wind } from 'lucide-react';

// --- 4-7-8 BREATHING ANIMATION ---
const BreathingBox = ({ onClose }) => {
  const [phase, setPhase] = useState('Inhale');
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const breathingCycle = () => {
      // 4 seconds: Inhale
      setPhase('Inhale');
      setTimeout(() => {
        // 7 seconds: Hold
        setPhase('Hold');
        setTimeout(() => {
          // 8 seconds: Exhale
          setPhase('Exhale');
          setTimeout(() => {
            // Brief pause before next cycle
            setPhase('Ready');
            setCycle(prev => prev + 1);
            setTimeout(() => {
              breathingCycle();
            }, 1000);
          }, 8000);
        }, 7000);
      }, 4000);
    };
    
    breathingCycle();
  }, []);

  const getPhaseColor = () => {
    switch(phase) {
      case 'Inhale': return 'from-cyan-400 to-blue-500';
      case 'Hold': return 'from-blue-500 to-indigo-500';
      case 'Exhale': return 'from-indigo-500 to-purple-500';
      default: return 'from-slate-400 to-slate-500';
    }
  };

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
      case 'Inhale': return 'scale-150';
      case 'Hold': return 'scale-150';
      case 'Exhale': return 'scale-100';
      default: return 'scale-100';
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

        {/* Breathing Box */}
        <div className="relative flex items-center justify-center">
          <div className={`w-64 h-64 rounded-2xl bg-gradient-to-br ${getPhaseColor()} transition-all duration-1000 ease-in-out ${getScale()} shadow-[0_0_100px_rgba(6,182,212,0.5)] flex items-center justify-center`}>
            <Wind size={64} className="text-white/90" />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-4 tracking-widest uppercase">
            {getPhaseText()}
          </h2>
          <p className="text-white/70 text-lg">
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


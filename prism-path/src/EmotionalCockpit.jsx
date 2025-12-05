import React, { useState, useEffect, useRef } from 'react';
import { 
  Wind, Mic, Activity, ArrowLeft, Frown, 
  Meh, Smile, X, Volume2, Volume1, VolumeX 
} from 'lucide-react';

// --- SUB-COMPONENT: BUBBLE WRAP FIDGET ---
const BubbleWrap = () => {
  const [bubbles, setBubbles] = useState(Array(20).fill(false));

  const pop = (index) => {
    // Vibrate device if supported (haptic feedback)
    if (navigator.vibrate) navigator.vibrate(50);
    
    const newBubbles = [...bubbles];
    newBubbles[index] = !newBubbles[index];
    setBubbles(newBubbles);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in duration-300">
      <h2 className="text-2xl font-bold text-cyan-300 mb-8">Pop the bubbles</h2>
      <div className="grid grid-cols-4 gap-4 p-4 bg-slate-800 rounded-2xl shadow-inner border border-slate-700">
        {bubbles.map((popped, i) => (
          <button
            key={i}
            onClick={() => pop(i)}
            className={`w-16 h-16 rounded-full transition-all duration-200 transform scale-100 active:scale-90 shadow-lg flex items-center justify-center border-4 ${
              popped 
                ? 'bg-slate-900 border-slate-800 shadow-inner' 
                : 'bg-gradient-to-br from-cyan-400 to-blue-500 border-cyan-300'
            }`}
          >
            {popped && <span className="text-slate-700 font-black text-xl">POP</span>}
          </button>
        ))}
      </div>
      <button 
        onClick={() => setBubbles(Array(20).fill(false))} 
        className="mt-8 text-slate-400 hover:text-white underline"
      >
        Reset Bubbles
      </button>
    </div>
  );
};

// --- SUB-COMPONENT: BREATHING ORB ---
const BreathingOrb = () => {
  const [phase, setPhase] = useState('Inhale'); // Inhale, Hold, Exhale

  useEffect(() => {
    const cycle = () => {
      setPhase('Inhale');
      setTimeout(() => {
        setPhase('Hold');
        setTimeout(() => {
          setPhase('Exhale');
        }, 4000); // Hold for 4s
      }, 4000); // Inhale for 4s
    };

    cycle();
    const interval = setInterval(cycle, 12000); // Total cycle 12s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full relative overflow-hidden">
      <div className={`text-4xl font-bold mb-12 transition-all duration-1000 ${
        phase === 'Inhale' ? 'text-cyan-400' : 
        phase === 'Hold' ? 'text-white' : 'text-fuchsia-400'
      }`}>
        {phase}
      </div>

      {/* The Breathing Orb */}
      <div className="relative flex items-center justify-center">
        {/* Outer Glow */}
        <div 
            className="absolute bg-cyan-500/30 rounded-full blur-3xl transition-all duration-[4000ms] ease-in-out"
            style={{ 
                width: phase === 'Inhale' || phase === 'Hold' ? '350px' : '150px',
                height: phase === 'Inhale' || phase === 'Hold' ? '350px' : '150px',
            }}
        />
        {/* Core Sphere */}
        <div 
            className={`rounded-full shadow-[0_0_50px_rgba(255,255,255,0.5)] transition-all duration-[4000ms] ease-in-out flex items-center justify-center text-slate-900 font-bold text-lg ${
                phase === 'Hold' ? 'bg-white' : 'bg-gradient-to-br from-cyan-300 to-fuchsia-300'
            }`}
            style={{ 
                width: phase === 'Inhale' || phase === 'Hold' ? '250px' : '100px',
                height: phase === 'Inhale' || phase === 'Hold' ? '250px' : '100px',
            }}
        >
            <Wind size={phase === 'Inhale' ? 64 : 32} className="opacity-50" />
        </div>
      </div>
      
      <p className="mt-12 text-slate-400 max-w-xs text-center">
        Follow the circle. Breathe in as it grows. Hold. Breathe out as it shrinks.
      </p>
    </div>
  );
};

// --- SUB-COMPONENT: NOISE METER ---
const NoiseMeter = () => {
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateVolume = () => {
          analyserRef.current.getByteFrequencyData(dataArray);
          // Calculate average volume
          let sum = 0;
          for(let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          setVolume(average); // 0 to ~150 typically
          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };

        updateVolume();
      } catch (err) {
        setError("Could not access microphone. Please allow permissions.");
        console.error(err);
      }
    };

    startAudio();

    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Normalize volume for UI (0-100 range)
  const displayVol = Math.min(100, Math.max(0, (volume - 10) * 1.5));
  let statusColor = "bg-green-500";
  let statusText = "Quiet & Calm";
  
  if (displayVol > 40) { statusColor = "bg-yellow-400"; statusText = "Getting Loud"; }
  if (displayVol > 70) { statusColor = "bg-red-500"; statusText = "Too Loud!"; }

  if (error) return <div className="text-center text-red-400 mt-20">{error}</div>;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-white mb-2">Noise Monitor</h2>
        <p className="text-slate-400 mb-10">Watch your volume level</p>

        <div className="w-24 h-64 bg-slate-800 rounded-full p-2 relative overflow-hidden border border-slate-600 shadow-2xl">
            <div 
                className={`absolute bottom-0 left-0 w-full transition-all duration-100 ease-out rounded-b-full ${statusColor}`}
                style={{ height: `${displayVol}%` }}
            />
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between py-4 opacity-30">
                <div className="w-full h-px bg-white"></div>
                <div className="w-full h-px bg-white"></div>
                <div className="w-full h-px bg-white"></div>
                <div className="w-full h-px bg-white"></div>
            </div>
        </div>

        <div className={`mt-8 text-xl font-bold px-6 py-2 rounded-full ${statusColor} text-slate-900 shadow-lg transition-colors`}>
            {statusText}
        </div>
    </div>
  );
};

// --- SUB-COMPONENT: ENGINE CHECK ---
const EngineCheck = ({ onLog }) => {
    const [selected, setSelected] = useState(null);

    return (
        <div className="flex flex-col items-center justify-center h-full animate-in slide-in-from-bottom duration-500">
            <h2 className="text-3xl font-bold text-white mb-2">How is your engine running?</h2>
            <p className="text-slate-400 mb-12">Check in with yourself.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl px-4">
                <button 
                    onClick={() => setSelected('fast')}
                    className={`p-8 rounded-2xl border-4 transition-all transform hover:scale-105 ${selected === 'fast' ? 'bg-red-500/20 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'bg-slate-800 border-slate-700 hover:border-red-400'}`}
                >
                    <div className="text-6xl mb-4">🐰</div>
                    <h3 className="text-2xl font-bold text-red-400">Too Fast</h3>
                    <p className="text-slate-400 mt-2">Jittery, Angry, Loud</p>
                </button>

                <button 
                    onClick={() => setSelected('right')}
                    className={`p-8 rounded-2xl border-4 transition-all transform hover:scale-105 ${selected === 'right' ? 'bg-green-500/20 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]' : 'bg-slate-800 border-slate-700 hover:border-green-400'}`}
                >
                    <div className="text-6xl mb-4">😎</div>
                    <h3 className="text-2xl font-bold text-green-400">Just Right</h3>
                    <p className="text-slate-400 mt-2">Focused, Calm, Ready</p>
                </button>

                <button 
                    onClick={() => setSelected('slow')}
                    className={`p-8 rounded-2xl border-4 transition-all transform hover:scale-105 ${selected === 'slow' ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.4)]' : 'bg-slate-800 border-slate-700 hover:border-blue-400'}`}
                >
                    <div className="text-6xl mb-4">🐢</div>
                    <h3 className="text-2xl font-bold text-blue-400">Too Slow</h3>
                    <p className="text-slate-400 mt-2">Tired, Sad, Bored</p>
                </button>
            </div>

            {selected && (
                <div className="mt-12 animate-in fade-in duration-500">
                    <p className="text-xl text-white mb-4">Good check-in.</p>
                    {selected === 'fast' && <p className="text-red-300">Try the Breathing Orb or Bubble Wrap to slow down.</p>}
                    {selected === 'slow' && <p className="text-blue-300">Try some jumping jacks or the Noise Meter to wake up.</p>}
                    {selected === 'right' && <p className="text-green-300">You are ready to learn!</p>}
                </div>
            )}
        </div>
    );
};

// --- MAIN CONTROLLER ---
export default function EmotionalCockpit({ onBack }) {
  const [tool, setTool] = useState('menu'); // menu, breathe, fidget, noise, engine

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col">
      
      {/* Header */}
      <div className="p-6 flex justify-between items-center border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
        {tool === 'menu' ? (
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white font-bold transition-colors">
                <ArrowLeft /> Exit Cool Down
            </button>
        ) : (
            <button onClick={() => setTool('menu')} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
                <ArrowLeft /> Back to Tools
            </button>
        )}
        <div className="flex items-center gap-2 text-fuchsia-400 font-bold tracking-widest uppercase text-sm">
            <Activity size={18}/> Emotional Cockpit
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* MENU */}
        {tool === 'menu' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 h-full max-w-4xl mx-auto items-center justify-center content-center">
                <button onClick={() => setTool('breathe')} className="group h-48 bg-slate-900 border border-slate-700 rounded-3xl flex flex-col items-center justify-center hover:bg-slate-800 hover:border-cyan-500 transition-all hover:scale-[1.02]">
                    <Wind size={48} className="text-cyan-400 mb-3 group-hover:scale-110 transition-transform"/>
                    <h3 className="text-2xl font-bold text-white">Breathing Orb</h3>
                    <p className="text-slate-500">Calm down & Focus</p>
                </button>

                <button onClick={() => setTool('fidget')} className="group h-48 bg-slate-900 border border-slate-700 rounded-3xl flex flex-col items-center justify-center hover:bg-slate-800 hover:border-fuchsia-500 transition-all hover:scale-[1.02]">
                    <div className="grid grid-cols-2 gap-1 mb-3 opacity-80 group-hover:scale-110 transition-transform">
                        <div className="w-3 h-3 rounded-full bg-fuchsia-500"></div><div className="w-3 h-3 rounded-full bg-fuchsia-500"></div>
                        <div className="w-3 h-3 rounded-full bg-fuchsia-500"></div><div className="w-3 h-3 rounded-full bg-fuchsia-500"></div>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Bubble Pop</h3>
                    <p className="text-slate-500">Digital Fidget</p>
                </button>

                <button onClick={() => setTool('noise')} className="group h-48 bg-slate-900 border border-slate-700 rounded-3xl flex flex-col items-center justify-center hover:bg-slate-800 hover:border-yellow-500 transition-all hover:scale-[1.02]">
                    <Volume2 size={48} className="text-yellow-400 mb-3 group-hover:scale-110 transition-transform"/>
                    <h3 className="text-2xl font-bold text-white">Noise Meter</h3>
                    <p className="text-slate-500">Check volume levels</p>
                </button>

                <button onClick={() => setTool('engine')} className="group h-48 bg-slate-900 border border-slate-700 rounded-3xl flex flex-col items-center justify-center hover:bg-slate-800 hover:border-green-500 transition-all hover:scale-[1.02]">
                    <Activity size={48} className="text-green-400 mb-3 group-hover:scale-110 transition-transform"/>
                    <h3 className="text-2xl font-bold text-white">Engine Check</h3>
                    <p className="text-slate-500">How do you feel?</p>
                </button>
            </div>
        )}

        {/* TOOL VIEWS */}
        {tool === 'breathe' && <BreathingOrb />}
        {tool === 'fidget' && <BubbleWrap />}
        {tool === 'noise' && <NoiseMeter />}
        {tool === 'engine' && <EngineCheck />}

      </div>
    </div>
  );
}


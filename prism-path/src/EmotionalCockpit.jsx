import React, { useState, useEffect, useRef } from 'react';
import { 
  Wind, Activity, ArrowLeft, X, Volume2, VolumeX, 
  Trash2, Eye, Hand, Ear, Sparkles, CloudRain, Trees, Coffee,
  Timer, RotateCcw, CheckCircle2, Move
} from 'lucide-react';

// --- INTERNAL AUDIO SYNTHESIZER ---
// (Generates sounds mathematically so no assets are needed)
const CockpitAudio = {
    ctx: null,
    oscillators: [],
    
    init: () => {
        if (!CockpitAudio.ctx) CockpitAudio.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (CockpitAudio.ctx.state === 'suspended') CockpitAudio.ctx.resume();
    },

    playPop: () => {
        CockpitAudio.init();
        const t = CockpitAudio.ctx.currentTime;
        const osc = CockpitAudio.ctx.createOscillator();
        const gain = CockpitAudio.ctx.createGain();
        const filter = CockpitAudio.ctx.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(CockpitAudio.ctx.destination);

        // "Pop" Physics: Short burst, pitch drop, high filter
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, t);

        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

        osc.start(t);
        osc.stop(t + 0.1);
    },

    // Soundscape Generator (Rain, Brown Noise, etc.)
    noiseNode: null,
    playAmbience: (type) => {
        CockpitAudio.init();
        if (CockpitAudio.noiseNode) { 
            CockpitAudio.noiseNode.stop(); 
            CockpitAudio.noiseNode.disconnect(); 
        }
        if (!type) return;

        const bufferSize = CockpitAudio.ctx.sampleRate * 2;
        const buffer = CockpitAudio.ctx.createBuffer(1, bufferSize, CockpitAudio.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            // Simple Brown Noise Filter
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5; 
        }

        const noise = CockpitAudio.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        
        const gain = CockpitAudio.ctx.createGain();
        // Adjust volume based on type
        gain.gain.value = type === 'rain' ? 0.15 : 0.25; 
        
        noise.connect(gain);
        gain.connect(CockpitAudio.ctx.destination);
        noise.start();
        CockpitAudio.noiseNode = noise;
    }
};
let lastOut = 0;

// --- SUB-COMPONENT: WORRY SHREDDER ---
const WorryShredder = () => {
    const [worry, setWorry] = useState('');
    const [isShredding, setIsShredding] = useState(false);
    const [shredded, setShredded] = useState(false);

    const handleShred = () => {
        if (!worry) return;
        setIsShredding(true);
        setTimeout(() => {
            setWorry('');
            setIsShredding(false);
            setShredded(true);
            setTimeout(() => setShredded(false), 2000);
        }, 1500);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto px-4">
            <h2 className="text-3xl font-bold text-white mb-2">Worry Shredder</h2>
            <p className="text-slate-400 mb-8 text-center">Type what's bothering you. Then let it go.</p>
            
            <div className="relative w-full">
                <textarea 
                    value={worry}
                    onChange={(e) => setWorry(e.target.value)}
                    placeholder="I am worried about..."
                    className={`w-full h-40 bg-slate-100 text-slate-900 p-4 rounded-t-xl transition-all duration-1000 ${isShredding ? 'translate-y-[100%] opacity-0 scale-y-0' : ''}`}
                    disabled={isShredding}
                />
                
                {/* The Shredder Machine Visual */}
                <div className="absolute -bottom-12 left-0 w-full h-16 bg-slate-800 border-t-4 border-slate-950 flex items-center justify-center rounded-b-xl z-10 shadow-2xl">
                    <div className="w-3/4 h-2 bg-black rounded-full"></div>
                </div>
            </div>

            <div className="mt-20">
                {shredded ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-bold animate-in zoom-in">
                        <CheckCircle2 /> Gone!
                    </div>
                ) : (
                    <button 
                        onClick={handleShred}
                        disabled={!worry || isShredding}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                        {isShredding ? "Shredding..." : "Shred It"}
                    </button>
                )}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: 5-4-3-2-1 GROUNDING ---
const GroundingTool = () => {
    const [step, setStep] = useState(5); // 5 to 1
    const [count, setCount] = useState(0); // Clicks per step

    const steps = {
        5: { icon: Eye, label: "Things you SEE", color: "text-cyan-400", bg: "bg-cyan-500/20" },
        4: { icon: Hand, label: "Things you TOUCH", color: "text-emerald-400", bg: "bg-emerald-500/20" },
        3: { icon: Ear, label: "Things you HEAR", color: "text-fuchsia-400", bg: "bg-fuchsia-500/20" },
        2: { icon: Wind, label: "Things you SMELL", color: "text-amber-400", bg: "bg-amber-500/20" },
        1: { icon: Coffee, label: "Thing you TASTE", color: "text-rose-400", bg: "bg-rose-500/20" }
    };

    const handleClick = () => {
        if (count + 1 >= step) {
            if (step === 1) {
                // Done
                setStep(0);
            } else {
                setStep(step - 1);
                setCount(0);
            }
        } else {
            setCount(count + 1);
        }
    };

    if (step === 0) return (
        <div className="flex flex-col items-center justify-center h-full animate-in zoom-in">
            <Sparkles size={64} className="text-yellow-400 mb-4 animate-spin-slow"/>
            <h2 className="text-3xl font-bold text-white">You are Grounded.</h2>
            <button onClick={() => {setStep(5); setCount(0);}} className="mt-8 text-slate-400 hover:text-white underline">Start Over</button>
        </div>
    );

    const CurrentIcon = steps[step].icon;

    return (
        <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto">
            <h2 className="text-xl font-bold text-slate-400 mb-8 uppercase tracking-widest">Grounding Exercise</h2>
            
            <div onClick={handleClick} className={`w-64 h-64 rounded-full ${steps[step].bg} flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-all active:scale-95 shadow-[0_0_30px_rgba(0,0,0,0.3)]`}>
                <CurrentIcon size={64} className={`${steps[step].color} mb-4`}/>
                <div className="text-6xl font-black text-white mb-2">{step - count}</div>
                <div className={`text-sm font-bold uppercase ${steps[step].color}`}>More {steps[step].label}</div>
            </div>

            <p className="mt-8 text-slate-500 text-center animate-pulse">Look around. Find {step - count} more.</p>
            <p className="text-slate-600 text-xs mt-2">(Click the circle when you find one)</p>
        </div>
    );
};

// --- SUB-COMPONENT: SOUNDSCAPES ---
const Soundscapes = () => {
    const [active, setActive] = useState(null);

    const toggle = (type) => {
        if (active === type) {
            setActive(null);
            CockpitAudio.playAmbience(null); // Stop
        } else {
            setActive(type);
            CockpitAudio.playAmbience(type); // Play
        }
    };

    // Cleanup on unmount
    useEffect(() => () => CockpitAudio.playAmbience(null), []);

    return (
        <div className="h-full flex flex-col relative overflow-hidden rounded-3xl">
            {/* Lofi Visual Layer */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`}>
                {active === 'rain' && <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-blue-900/40"><div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/diagonal-striped-brick.png')]"></div></div>}
                {active === 'brown' && <div className="absolute inset-0 bg-gradient-to-b from-amber-950/50 to-slate-900"><div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div></div>}
                {active === 'forest' && <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/50 to-slate-900"><div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/leaf.png')]"></div></div>}
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
                <h2 className="text-3xl font-bold text-white mb-8 drop-shadow-md">Sonic Sanctuary</h2>
                <div className="grid grid-cols-1 gap-6 w-full max-w-sm">
                    <button onClick={() => toggle('rain')} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${active === 'rain' ? 'bg-blue-500/20 border-blue-400 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'}`}>
                        <CloudRain size={24} /> 
                        <span className="font-bold flex-1 text-left">Rainy Window</span>
                        {active === 'rain' && <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>}
                    </button>

                    <button onClick={() => toggle('brown')} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${active === 'brown' ? 'bg-amber-500/20 border-amber-400 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'}`}>
                        <Coffee size={24} /> 
                        <span className="font-bold flex-1 text-left">Cozy Library (Brown Noise)</span>
                        {active === 'brown' && <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>}
                    </button>

                    <button onClick={() => toggle('forest')} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${active === 'forest' ? 'bg-emerald-500/20 border-emerald-400 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white'}`}>
                        <Trees size={24} /> 
                        <span className="font-bold flex-1 text-left">Deep Forest</span>
                        {active === 'forest' && <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: BUBBLE WRAP FIDGET (TIMED) ---
const BubbleWrap = () => {
  const [bubbles, setBubbles] = useState(Array(20).fill(false));
  const [timeLeft, setTimeLeft] = useState(120); // 2 Minutes
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
      if (!isActive || timeLeft <= 0) return;
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  const pop = (index) => {
    if (!isActive || timeLeft <= 0) return;
    
    // Play Math-generated Pop Sound
    CockpitAudio.playPop(); 
    
    // Haptic
    if (navigator.vibrate) navigator.vibrate(50);
    
    const newBubbles = [...bubbles];
    newBubbles[index] = !newBubbles[index];
    setBubbles(newBubbles);
  };

  const formatTime = (s) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center w-full max-w-sm mb-6">
          <h2 className="text-xl font-bold text-cyan-300">Pop the bubbles</h2>
          <div className={`font-mono text-xl font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
              {formatTime(timeLeft)}
          </div>
      </div>

      <div className="grid grid-cols-4 gap-4 p-4 bg-slate-800 rounded-2xl shadow-inner border border-slate-700">
        {bubbles.map((popped, i) => (
          <button
            key={i}
            onClick={() => pop(i)}
            disabled={timeLeft <= 0}
            className={`w-16 h-16 rounded-full transition-all duration-100 transform scale-100 active:scale-95 shadow-lg flex items-center justify-center border-4 ${
              popped 
                ? 'bg-slate-900 border-slate-800 shadow-inner' 
                : 'bg-gradient-to-br from-cyan-400 to-blue-500 border-cyan-300'
            }`}
          >
            {popped && <div className="w-2 h-2 bg-white/20 rounded-full"></div>}
          </button>
        ))}
      </div>

      {timeLeft <= 0 ? (
          <div className="mt-8 text-center">
              <p className="text-white font-bold mb-2">Session Complete</p>
              <button onClick={() => {setTimeLeft(120); setBubbles(Array(20).fill(false));}} className="px-4 py-2 bg-slate-700 rounded-full text-white hover:bg-slate-600">Restart Timer</button>
          </div>
      ) : (
          <button 
            onClick={() => setBubbles(Array(20).fill(false))} 
            className="mt-8 text-slate-400 hover:text-white underline text-sm"
          >
            Reset Board
          </button>
      )}
    </div>
  );
};

// --- SUB-COMPONENT: BOX BREATHING (CLEANER) ---
const BreathingOrb = () => {
  const [phase, setPhase] = useState('Inhale'); // Inhale, Hold, Exhale, Hold
  const [seconds, setSeconds] = useState(4);

  useEffect(() => {
    let s = 4;
    const tick = setInterval(() => {
        setSeconds(prev => {
            if (prev === 1) return 4;
            return prev - 1;
        });
    }, 1000);

    const cycle = () => {
      setPhase('Inhale');
      setTimeout(() => {
        setPhase('Hold');
        setTimeout(() => {
          setPhase('Exhale');
          setTimeout(() => {
              setPhase('Hold '); // Space added to diff from first hold
          }, 4000);
        }, 4000);
      }, 4000);
    };

    cycle();
    const interval = setInterval(cycle, 16000); // 4-4-4-4 = 16s cycle
    return () => { clearInterval(interval); clearInterval(tick); };
  }, []);

  const getInstructions = () => {
      if (phase === 'Inhale') return "Breathe In...";
      if (phase === 'Exhale') return "Breathe Out...";
      return "Hold...";
  };

  return (
    <div className="flex flex-col items-center justify-center h-full relative overflow-hidden">
      <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-white mb-2">{getInstructions()}</h2>
          <div className="text-slate-500 font-mono text-xl">{seconds}</div>
      </div>

      <div className="relative flex items-center justify-center">
        {/* Guiding Ring */}
        <div className="absolute w-[300px] h-[300px] border-2 border-slate-800 rounded-full"></div>
        
        {/* The Orb */}
        <div 
            className={`rounded-full blur-xl transition-all duration-[4000ms] ease-in-out ${
                phase === 'Inhale' ? 'bg-cyan-500 w-[300px] h-[300px] opacity-80' : 
                phase.includes('Hold') ? 'bg-white w-[300px] h-[300px] opacity-40' :
                'bg-fuchsia-500 w-[100px] h-[100px] opacity-60'
            }`}
        />
        <div className="absolute z-10">
            <Wind size={48} className="text-white opacity-80" />
        </div>
      </div>
      
      <p className="mt-12 text-slate-500 text-xs tracking-widest uppercase">Box Breathing Technique</p>
    </div>
  );
};

// --- SUB-COMPONENT: NOISE METER (Unchanged but included) ---
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
          let sum = 0;
          for(let i = 0; i < bufferLength; i++) sum += dataArray[i];
          setVolume(sum / bufferLength);
          animationFrameRef.current = requestAnimationFrame(updateVolume);
        };
        updateVolume();
      } catch (err) { setError("Microphone access needed."); }
    };
    startAudio();
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const displayVol = Math.min(100, Math.max(0, (volume - 10) * 1.5));
  let color = "bg-emerald-500";
  if (displayVol > 40) color = "bg-yellow-400";
  if (displayVol > 70) color = "bg-red-500";

  if (error) return <div className="text-center text-slate-500 mt-20">{error}</div>;

  return (
    <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold text-white mb-8">Noise Monitor</h2>
        <div className="w-24 h-64 bg-slate-800 rounded-full p-2 relative overflow-hidden border border-slate-600">
            <div className={`absolute bottom-0 left-0 w-full transition-all duration-100 ease-out rounded-b-full ${color}`} style={{ height: `${displayVol}%` }} />
        </div>
    </div>
  );
};

// --- MAIN CONTROLLER ---
export default function EmotionalCockpit({ onBack }) {
  const [tool, setTool] = useState('menu'); 

  // Stop any lingering audio when switching tools or exiting
  useEffect(() => {
      return () => CockpitAudio.playAmbience(null);
  }, [tool]);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="p-6 flex justify-between items-center border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
        {tool === 'menu' ? (
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white font-bold transition-colors"><ArrowLeft /> Exit Cool Down</button>
        ) : (
            <button onClick={() => setTool('menu')} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-bold transition-colors"><ArrowLeft /> Back to Tools</button>
        )}
        <div className="flex items-center gap-2 text-fuchsia-400 font-bold tracking-widest uppercase text-sm"><Activity size={18}/> Emotional Cockpit</div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {tool === 'menu' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 h-full max-w-5xl mx-auto items-center justify-center content-center">
                <button onClick={() => setTool('breathe')} className="group h-40 bg-slate-900 border border-slate-700 rounded-2xl flex flex-col items-center justify-center hover:bg-slate-800 hover:border-cyan-500 transition-all"><Wind size={32} className="text-cyan-400 mb-2"/><h3 className="font-bold text-white">Breathing Orb</h3></button>
                <button onClick={() => setTool('grounding')} className="group h-40 bg-slate-900 border border-slate-700 rounded-2xl flex flex-col items-center justify-center hover:bg-slate-800 hover:border-emerald-500 transition-all"><Eye size={32} className="text-emerald-400 mb-2"/><h3 className="font-bold text-white">5-4-3-2-1 Grounding</h3></button>
                <button onClick={() => setTool('shredder')} className="group h-40 bg-slate-900 border border-slate-700 rounded-2xl flex flex-col items-center justify-center hover:bg-slate-800 hover:border-red-500 transition-all"><Trash2 size={32} className="text-red-400 mb-2"/><h3 className="font-bold text-white">Worry Shredder</h3></button>
                <button onClick={() => setTool('sound')} className="group h-40 bg-slate-900 border border-slate-700 rounded-2xl flex flex-col items-center justify-center hover:bg-slate-800 hover:border-blue-500 transition-all"><CloudRain size={32} className="text-blue-400 mb-2"/><h3 className="font-bold text-white">Sonic Sanctuary</h3></button>
                <button onClick={() => setTool('fidget')} className="group h-40 bg-slate-900 border border-slate-700 rounded-2xl flex flex-col items-center justify-center hover:bg-slate-800 hover:border-fuchsia-500 transition-all"><Move size={32} className="text-fuchsia-400 mb-2"/><h3 className="font-bold text-white">Bubble Pop</h3></button>
                <button onClick={() => setTool('noise')} className="group h-40 bg-slate-900 border border-slate-700 rounded-2xl flex flex-col items-center justify-center hover:bg-slate-800 hover:border-yellow-500 transition-all"><Volume2 size={32} className="text-yellow-400 mb-2"/><h3 className="font-bold text-white">Noise Meter</h3></button>
            </div>
        )}

        {tool === 'breathe' && <BreathingOrb />}
        {tool === 'fidget' && <BubbleWrap />}
        {tool === 'noise' && <NoiseMeter />}
        {tool === 'shredder' && <WorryShredder />}
        {tool === 'grounding' && <GroundingTool />}
        {tool === 'sound' && <Soundscapes />}
      </div>
    </div>
  );
}

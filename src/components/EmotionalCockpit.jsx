import React, { useState, useEffect, useRef } from 'react';
import { 
  Wind, Activity, ArrowLeft, Volume2, VolumeX, 
  Trash2, Eye, Hand, Ear, CloudRain, Trees, Coffee,
  Move, Music, Zap, Sparkles 
} from 'lucide-react';

// FIX: Importing services from the correctly exported utility file
import { getTheme } from '../utils'; 

// --- INTERNAL AUDIO SYNTHESIZER ---
const CockpitAudio = {
    ctx: null,
    ambienceNodes: [], 
    musicNodes: [],    
    musicInterval: null,

    init: () => {
        if (!CockpitAudio.ctx) CockpitAudio.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (CockpitAudio.ctx.state === 'suspended') CockpitAudio.ctx.resume();
    },

    playPop: () => {
        CockpitAudio.init();
        const t = CockpitAudio.ctx.currentTime;
        const osc = CockpitAudio.ctx.createOscillator();
        const gain = CockpitAudio.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(CockpitAudio.ctx.destination);

        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
        
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

        osc.start(t);
        osc.stop(t + 0.15);
    },

    stopAll: () => {
        if (CockpitAudio.musicInterval) {
            clearInterval(CockpitAudio.musicInterval);
            CockpitAudio.musicInterval = null;
        }
        CockpitAudio.ambienceNodes.forEach(node => { try { node.stop(); node.disconnect(); } catch(e){} });
        CockpitAudio.ambienceNodes = [];
        CockpitAudio.musicNodes.forEach(node => { try { node.stop(); node.disconnect(); } catch(e){} });
        CockpitAudio.musicNodes = [];
    },

    playAmbience: (type) => {
        CockpitAudio.stopAll(); 
        CockpitAudio.init();
        if (!type) return;

        const bufferSize = CockpitAudio.ctx.sampleRate * 2;
        const buffer = CockpitAudio.ctx.createBuffer(1, bufferSize, CockpitAudio.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;

        if (['rain', 'brown', 'forest'].includes(type)) {
             // Noise generation logic
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02; 
                lastOut = data[i];
                data[i] *= 3.5; 
            }

            const noise = CockpitAudio.ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;
            const gain = CockpitAudio.ctx.createGain();
            
            // Noise specific filter chain
            if (type === 'forest') {
                 const lowPass = CockpitAudio.ctx.createBiquadFilter();
                 lowPass.type = 'lowpass';
                 lowPass.frequency.value = 800;
                 const highPass = CockpitAudio.ctx.createBiquadFilter();
                 highPass.type = 'highpass';
                 highPass.frequency.value = 300;
                 
                 noise.connect(highPass);
                 highPass.connect(lowPass);
                 lowPass.connect(gain);
                 gain.gain.value = 0.2; 
            } else {
                 gain.gain.value = type === 'rain' ? 0.15 : 0.35;
                 noise.connect(gain);
            }
            
            gain.connect(CockpitAudio.ctx.destination);
            noise.start();
            CockpitAudio.ambienceNodes.push(noise);
        }

        if (type === 'lofi') {
            const playChord = (notes, time) => {
                notes.forEach(freq => {
                    const osc = CockpitAudio.ctx.createOscillator();
                    const gain = CockpitAudio.ctx.createGain();
                    osc.type = 'triangle'; 
                    osc.frequency.value = freq;
                    osc.detune.setValueAtTime(0, time);
                    osc.detune.linearRampToValueAtTime(10, time + 2); 
                    osc.connect(gain);
                    gain.connect(CockpitAudio.ctx.destination);
                    gain.gain.setValueAtTime(0, time);
                    gain.gain.linearRampToValueAtTime(0.08, time + 1);
                    gain.gain.exponentialRampToValueAtTime(0.001, time + 6);
                    osc.start(time);
                    osc.stop(time + 6);
                    CockpitAudio.musicNodes.push(osc);
                });
            };
            const loopChords = () => {
                const t = CockpitAudio.ctx.currentTime;
                playChord([261.63, 329.63, 392.00, 493.88], t);
                setTimeout(() => {
                    if (CockpitAudio.musicInterval) playChord([174.61, 220.00, 261.63, 329.63], CockpitAudio.ctx.currentTime);
                }, 4000);
            };
            loopChords();
            CockpitAudio.musicInterval = setInterval(loopChords, 8000);
        }
    }
};

// --- SUB-COMPONENT: WORRY SHREDDER ---
const WorryShredder = ({ theme, onExerciseComplete }) => {
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
            setTimeout(() => {
                setShredded(false);
                if (onExerciseComplete) {
                    setTimeout(() => onExerciseComplete(), 500);
                }
            }, 2000);
        }, 1500);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto px-4">
            <h2 className={`text-3xl font-bold ${theme.text} mb-2`}>Worry Shredder</h2>
            <p className={`${theme.textMuted} mb-8 text-center`}>Type what's bothering you. Then let it go.</p>
            <div className="relative w-full">
                <textarea 
                    value={worry}
                    onChange={(e) => setWorry(e.target.value)}
                    placeholder="I am worried about..."
                    className={`w-full h-40 ${theme.inputBg} ${theme.text} border ${theme.inputBorder} p-4 rounded-t-xl transition-all duration-1000 ${isShredding ? 'translate-y-[100%] opacity-0 scale-y-0' : ''}`}
                    disabled={isShredding}
                />
                <div className={`absolute -bottom-12 left-0 w-full h-16 ${theme.cardBg} border-t-4 ${theme.cardBorder} flex items-center justify-center rounded-b-xl z-10 shadow-2xl`}>
                    <div className="w-3/4 h-2 bg-black/20 rounded-full"></div>
                </div>
            </div>
            <div className="mt-20">
                {shredded ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-bold animate-in zoom-in"><Zap /> Gone!</div>
                ) : (
                    <button onClick={handleShred} disabled={!worry || isShredding} className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95">
                        {isShredding ? "Shredding..." : "Shred It"}
                    </button>
                )}
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: GROUNDING ---
const GroundingTool = ({ theme, onExerciseComplete }) => {
    const [step, setStep] = useState(5); 
    const [count, setCount] = useState(0); 

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
                setStep(0);
                if (onExerciseComplete) {
                    setTimeout(() => onExerciseComplete(), 1000);
                }
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
            <h2 className={`text-3xl font-bold ${theme.text}`}>You are Grounded.</h2>
            <button onClick={() => {setStep(5); setCount(0);}} className={`mt-8 ${theme.textMuted} hover:${theme.text} underline`}>Start Over</button>
        </div>
    );

    const CurrentIcon = steps[step].icon;

    return (
        <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto">
            <h2 className={`text-xl font-bold ${theme.textMuted} mb-8 uppercase tracking-widest`}>Grounding Exercise</h2>
            <div onClick={handleClick} className={`w-64 h-64 rounded-full ${steps[step].bg} flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-all active:scale-95 shadow-xl`}>
                <CurrentIcon size={64} className={`${steps[step].color} mb-4`}/>
                <div className={`text-6xl font-black ${theme.text} mb-2`}>{step - count}</div>
                <div className={`text-sm font-bold uppercase ${steps[step].color}`}>More {steps[step].label}</div>
            </div>
            <p className={`mt-8 ${theme.textMuted} text-center animate-pulse`}>Look around. Find {step - count} more.</p>
        </div>
    );
};

// --- SUB-COMPONENT: SOUNDSCAPES ---
const Soundscapes = ({ theme }) => {
    const [active, setActive] = useState(null);

    const toggle = (type) => {
        if (active === type) {
            setActive(null);
            CockpitAudio.stopAll();
        } else {
            setActive(type);
            CockpitAudio.playAmbience(type);
        }
    };

    useEffect(() => { return () => CockpitAudio.stopAll(); }, []);

    return (
        <div className={`h-full flex flex-col relative overflow-hidden rounded-3xl ${theme.cardBg}`}>
            <div className={`absolute inset-0 transition-opacity duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`}>
                {active === 'rain' && (
                    <div className="absolute inset-0 bg-slate-800/80 backdrop-blur-sm overflow-hidden">
                        <div className="absolute inset-0 rain-animation opacity-30"></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-700/50 to-blue-900/30"></div>
                    </div>
                )}
                {active === 'brown' && <div className="absolute inset-0 bg-gradient-to-b from-amber-900/40 to-slate-900"></div>}
                {active === 'forest' && (
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/30 to-cyan-900/40 backdrop-blur-sm">
                        <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-cyan-500/10 to-transparent"></div>
                    </div>
                )}
                {active === 'lofi' && <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-slate-900"><div className="absolute inset-0 flex items-center justify-center opacity-10"><Music size={300} /></div></div>}
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
                <h2 className={`text-3xl font-bold ${theme.text} mb-8 drop-shadow-md`}>Sonic Sanctuary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                    <button onClick={() => toggle('rain')} className={`flex items-center gap-4 p-6 rounded-xl border-2 transition-all ${active === 'rain' ? 'bg-blue-500/20 border-blue-400 text-white' : `${theme.inputBg} ${theme.cardBorder} ${theme.textMuted} hover:${theme.text}`}`}>
                        <CloudRain size={24} /> <span className="font-bold">Rainy Window</span>
                    </button>
                    <button onClick={() => toggle('brown')} className={`flex items-center gap-4 p-6 rounded-xl border-2 transition-all ${active === 'brown' ? 'bg-amber-500/20 border-amber-400 text-white' : `${theme.inputBg} ${theme.cardBorder} ${theme.textMuted} hover:${theme.text}`}`}>
                        <Coffee size={24} /> <span className="font-bold">Cozy Library</span>
                    </button>
                    <button onClick={() => toggle('forest')} className={`flex items-center gap-4 p-6 rounded-xl border-2 transition-all ${active === 'forest' ? 'bg-emerald-500/20 border-emerald-400 text-white' : `${theme.inputBg} ${theme.cardBorder} ${theme.textMuted} hover:${theme.text}`}`}>
                        <Trees size={24} /> <span className="font-bold">Waterfall & Nature</span>
                    </button>
                    <button onClick={() => toggle('lofi')} className={`flex items-center gap-4 p-6 rounded-xl border-2 transition-all ${active === 'lofi' ? 'bg-indigo-500/20 border-indigo-400 text-white' : `${theme.inputBg} ${theme.cardBorder} ${theme.textMuted} hover:${theme.text}`}`}>
                        <Music size={24} /> <span className="font-bold">Lofi Lounge</span>
                    </button>
                </div>
                {active && <button onClick={() => toggle(active)} className={`mt-8 px-6 py-2 ${theme.inputBg} rounded-full border ${theme.inputBorder} ${theme.textMuted} text-sm hover:${theme.text}`}>Stop Audio</button>}
            </div>
            
            <style>{`
                .rain-animation {
                    background-image: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.5));
                    background-size: 2px 20px;
                    width: 100%;
                    height: 100%;
                    animation: raining 0.5s linear infinite;
                }
                @keyframes raining {
                    0% { background-position: 0 0; }
                    100% { background-position: 5px 20px; }
                }
            `}</style>
        </div>
    );
};

// --- SUB-COMPONENT: BUBBLE WRAP ---
const BubbleWrap = ({ theme, onExerciseComplete }) => {
  const [bubbles, setBubbles] = useState(Array(20).fill(false));
  const [timeLeft, setTimeLeft] = useState(120); 
  const [isActive, setIsActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
      if (!isActive || timeLeft <= 0) {
          if (timeLeft <= 0 && !hasCompleted && onExerciseComplete) {
              setHasCompleted(true);
              setTimeout(() => onExerciseComplete(), 1000);
          }
          return;
      }
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
  }, [isActive, timeLeft, hasCompleted, onExerciseComplete]);

  const pop = (index) => {
    if (!isActive || timeLeft <= 0) return;
    if (!isMuted) CockpitAudio.playPop(); 
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
    <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in duration-300 relative">
      <div className="flex justify-between items-center w-full max-w-sm mb-6">
          <h2 className={`text-xl font-bold ${theme.text}`}>Pop the bubbles</h2>
          <div className="flex items-center gap-4">
              <button onClick={() => setIsMuted(!isMuted)} className={`${theme.textMuted} hover:${theme.text} transition-colors`}>
                  {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
              </button>
              <div className={`font-mono text-xl font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : theme.textMuted}`}>
                  {formatTime(timeLeft)}
              </div>
          </div>
      </div>
      <div className={`grid grid-cols-4 gap-4 p-4 ${theme.inputBg} rounded-2xl shadow-inner border ${theme.inputBorder}`}>
        {bubbles.map((popped, i) => (
          <button key={i} onClick={() => pop(i)} disabled={timeLeft <= 0} className={`w-16 h-16 rounded-full transition-all duration-100 transform scale-100 active:scale-95 shadow-lg flex items-center justify-center border-4 ${popped ? `${theme.bg} border-slate-700 shadow-inner` : 'bg-gradient-to-br from-cyan-400 to-blue-500 border-cyan-300'}`}>
            {popped && <div className="w-2 h-2 bg-white/20 rounded-full"></div>}
          </button>
        ))}
      </div>
      {timeLeft <= 0 ? (
          <div className="mt-8 text-center">
              <p className={`${theme.text} font-bold mb-2`}>Session Complete</p>
              <button onClick={() => {setTimeLeft(120); setBubbles(Array(20).fill(false));}} className={`px-4 py-2 ${theme.cardBg} rounded-full border ${theme.cardBorder} ${theme.text}`}>Restart Timer</button>
          </div>
      ) : (
          <button onClick={() => setBubbles(Array(20).fill(false))} className={`mt-8 ${theme.textMuted} hover:${theme.text} underline text-sm`}>Reset Board</button>
      )}
    </div>
  );
};

// --- SUB-COMPONENT: PULSE CHECK (Emoji Slider) ---
const PulseCheck = ({ theme, onComplete, label = "How are you feeling?" }) => {
  const [score, setScore] = useState(3); // Default to middle (3)
  
  const emojis = ['😠', '😕', '😐', '🙂', '😊'];
  const labels = ['Angry', 'Frustrated', 'Okay', 'Good', 'Happy'];
  
  const handleSubmit = () => {
    if (onComplete) {
      onComplete(score);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto px-4">
      <h2 className={`text-3xl font-bold ${theme.text} mb-8 text-center`}>{label}</h2>
      
      {/* Emoji Slider */}
      <div className="w-full mb-8">
        <div className="flex justify-between items-center mb-4">
          {emojis.map((emoji, index) => (
            <button
              key={index}
              onClick={() => setScore(index + 1)}
              className={`text-5xl transition-all transform ${
                score === index + 1 
                  ? 'scale-125 filter drop-shadow-lg' 
                  : 'scale-100 opacity-60 hover:opacity-80 hover:scale-110'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
        
        {/* Labels */}
        <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
          <span className={theme.textMuted}>{labels[0]}</span>
          <span className={theme.textMuted}>{labels[4]}</span>
        </div>
        
        {/* Selected Score Display */}
        <div className="mt-6 text-center">
          <div className={`text-2xl font-bold ${theme.text} mb-2`}>
            {labels[score - 1]}
          </div>
          <div className={`text-sm ${theme.textMuted}`}>
            Score: {score} / 5
          </div>
        </div>
      </div>
      
      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
      >
        Continue
      </button>
    </div>
  );
};

// --- SUB-COMPONENT: BOX BREATHING ---
const BreathingOrb = ({ theme, onExerciseComplete }) => {
  const [phase, setPhase] = useState('Inhale'); 

  useEffect(() => {
    const cycle = () => {
      setPhase('Inhale');
      setTimeout(() => {
        setPhase('Hold');
        setTimeout(() => {
          setPhase('Exhale');
          setTimeout(() => {
              setPhase('Hold'); 
          }, 4000);
        }, 4000);
      }, 4000);
    };
    cycle();
    const interval = setInterval(cycle, 16000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full relative overflow-hidden">
      <div className="absolute top-[15%] z-20 text-center">
          <h2 className={`text-4xl font-bold ${theme.text} mb-2 tracking-widest uppercase transition-all duration-500`}>
              {phase === 'Inhale' ? 'Breathe In' : phase === 'Exhale' ? 'Breathe Out' : 'Hold'}
          </h2>
      </div>
      <div className="relative flex items-center justify-center h-[400px] w-[400px]">
        <div className={`absolute w-[300px] h-[300px] border-2 ${theme.cardBorder} rounded-full`}></div>
        <div className="breathing-orb bg-cyan-500 rounded-full shadow-[0_0_50px_rgba(6,182,212,0.5)]"></div>
        <div className="absolute z-10 pointer-events-none"><Wind size={48} className="text-white/80" /></div>
      </div>
      <p className={`mt-12 ${theme.textMuted} text-xs tracking-widest uppercase`}>Box Breathing (4-4-4-4)</p>
      <style>{`
        .breathing-orb { width: 100px; height: 100px; animation: breathe 16s infinite ease-in-out; }
        @keyframes breathe {
            0% { transform: scale(1); opacity: 0.5; }
            25% { transform: scale(3); opacity: 1; }
            50% { transform: scale(3); opacity: 1; }
            75% { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(1); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

// --- SUB-COMPONENT: NOISE METER ---
const NoiseMeter = ({ theme }) => {
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

  if (error) return <div className={`text-center ${theme.textMuted} mt-20`}>{error}</div>;

  return (
    <div className="flex flex-col items-center justify-center h-full">
        <h2 className={`text-2xl font-bold ${theme.text} mb-8`}>Noise Monitor</h2>
        <div className={`w-24 h-64 ${theme.inputBg} rounded-full p-2 relative overflow-hidden border ${theme.inputBorder}`}>
            <div className={`absolute bottom-0 left-0 w-full transition-all duration-100 ease-out rounded-b-full ${color}`} style={{ height: `${displayVol}%` }} />
        </div>
    </div>
  );
};

// --- MAIN CONTROLLER ---
export default function EmotionalCockpit({ onBack, isLowStim }) {
  const [tool, setTool] = useState('menu');
  const [showPulseBefore, setShowPulseBefore] = useState(false);
  const [showPulseAfter, setShowPulseAfter] = useState(false);
  const [pendingTool, setPendingTool] = useState(null);
  const [beforeScore, setBeforeScore] = useState(null);
  const [afterScore, setAfterScore] = useState(null);
  const theme = getTheme(!isLowStim);

  useEffect(() => {
      return () => {
          CockpitAudio.stopAll();
      };
  }, [tool]);

  // Log pulse check results to localStorage
  const logPulseCheck = (toolName, before, after) => {
    try {
      const logs = JSON.parse(localStorage.getItem('cockpit_pulse_logs') || '[]');
      logs.push({
        tool: toolName,
        before,
        after,
        timestamp: new Date().toISOString(),
        effectiveness: after - before
      });
      // Keep only last 50 logs
      const recentLogs = logs.slice(-50);
      localStorage.setItem('cockpit_pulse_logs', JSON.stringify(recentLogs));
    } catch (e) {
      console.error('Failed to log pulse check:', e);
    }
  };

  const handleToolSelect = (toolName) => {
    setPendingTool(toolName);
    setShowPulseBefore(true);
  };

  const handleBeforeComplete = (score) => {
    setBeforeScore(score);
    setShowPulseBefore(false);
    if (pendingTool) {
      setTool(pendingTool);
      setPendingTool(null);
    }
  };

  const handleExerciseComplete = () => {
    setShowPulseAfter(true);
  };

  const handleAfterComplete = (score) => {
    setAfterScore(score);
    setShowPulseAfter(false);
    
    // Log the results
    if (beforeScore !== null && tool) {
      logPulseCheck(tool, beforeScore, score);
    }
    
    // Reset for next time
    setBeforeScore(null);
    setAfterScore(null);
    setTool('menu');
  };

  return (
    <div className={`fixed inset-0 z-[100] ${theme.bg} ${theme.text} flex flex-col`}>
      <div className={`p-6 flex justify-between items-center border-b ${theme.cardBorder} ${theme.navBg} backdrop-blur-md`}>
        {tool === 'menu' ? (
            <button onClick={onBack} className={`flex items-center gap-2 ${theme.textMuted} hover:${theme.text} font-bold transition-colors`}><ArrowLeft /> Exit Cool Down</button>
        ) : (
            <button onClick={() => setTool('menu')} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-bold transition-colors"><ArrowLeft /> Back to Tools</button>
        )}
        <div className="flex items-center gap-2 text-fuchsia-400 font-bold tracking-widest uppercase text-sm"><Activity size={18}/> Emotional Cockpit</div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {/* Pulse Check Before */}
        {showPulseBefore && (
          <PulseCheck 
            theme={theme} 
            onComplete={handleBeforeComplete}
            label="How are you feeling right now?"
          />
        )}
        
        {/* Pulse Check After */}
        {showPulseAfter && (
          <PulseCheck 
            theme={theme} 
            onComplete={handleAfterComplete}
            label="How are you feeling now?"
          />
        )}
        
        {tool === 'menu' && !showPulseBefore && !showPulseAfter && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 h-full max-w-5xl mx-auto items-center justify-center content-center">
                <button onClick={() => handleToolSelect('breathe')} className={`group h-40 ${theme.cardBg} border ${theme.cardBorder} rounded-2xl flex flex-col items-center justify-center hover:border-cyan-500 transition-all`}><Wind size={32} className="text-cyan-400 mb-2"/><h3 className={`font-bold ${theme.text}`}>Breathing Orb</h3></button>
                <button onClick={() => handleToolSelect('grounding')} className={`group h-40 ${theme.cardBg} border ${theme.cardBorder} rounded-2xl flex flex-col items-center justify-center hover:border-emerald-500 transition-all`}><Eye size={32} className="text-emerald-400 mb-2"/><h3 className={`font-bold ${theme.text}`}>5-4-3-2-1 Grounding</h3></button>
                <button onClick={() => handleToolSelect('shredder')} className={`group h-40 ${theme.cardBg} border ${theme.cardBorder} rounded-2xl flex flex-col items-center justify-center hover:border-red-500 transition-all`}><Trash2 size={32} className="text-red-400 mb-2"/><h3 className={`font-bold ${theme.text}`}>Worry Shredder</h3></button>
                <button onClick={() => handleToolSelect('sound')} className={`group h-40 ${theme.cardBg} border ${theme.cardBorder} rounded-2xl flex flex-col items-center justify-center hover:border-blue-500 transition-all`}><CloudRain size={32} className="text-blue-400 mb-2"/><h3 className={`font-bold ${theme.text}`}>Sonic Sanctuary</h3></button>
                <button onClick={() => handleToolSelect('fidget')} className={`group h-40 ${theme.cardBg} border ${theme.cardBorder} rounded-2xl flex flex-col items-center justify-center hover:border-fuchsia-500 transition-all`}><Move size={32} className="text-fuchsia-400 mb-2"/><h3 className={`font-bold ${theme.text}`}>Bubble Pop</h3></button>
                <button onClick={() => handleToolSelect('noise')} className={`group h-40 ${theme.cardBg} border ${theme.cardBorder} rounded-2xl flex flex-col items-center justify-center hover:border-yellow-500 transition-all`}><Volume2 size={32} className="text-yellow-400 mb-2"/><h3 className={`font-bold ${theme.text}`}>Noise Meter</h3></button>
            </div>
        )}

        {tool === 'breathe' && !showPulseBefore && !showPulseAfter && (
          <div className="relative h-full">
            <BreathingOrb theme={theme} onExerciseComplete={handleExerciseComplete} />
            <button
              onClick={handleExerciseComplete}
              className={`absolute bottom-6 right-6 px-6 py-3 ${theme.cardBg} border ${theme.cardBorder} rounded-full font-bold ${theme.text} hover:border-cyan-400 transition-all`}
            >
              I'm Done
            </button>
          </div>
        )}
        {tool === 'fidget' && !showPulseBefore && !showPulseAfter && <BubbleWrap theme={theme} onExerciseComplete={handleExerciseComplete} />}
        {tool === 'noise' && !showPulseBefore && !showPulseAfter && (
          <div className="relative h-full">
            <NoiseMeter theme={theme} />
            <button
              onClick={handleExerciseComplete}
              className={`absolute bottom-6 right-6 px-6 py-3 ${theme.cardBg} border ${theme.cardBorder} rounded-full font-bold ${theme.text} hover:border-cyan-400 transition-all`}
            >
              I'm Done
            </button>
          </div>
        )}
        {tool === 'shredder' && !showPulseBefore && !showPulseAfter && <WorryShredder theme={theme} onExerciseComplete={handleExerciseComplete} />}
        {tool === 'grounding' && !showPulseBefore && !showPulseAfter && <GroundingTool theme={theme} onExerciseComplete={handleExerciseComplete} />}
        {tool === 'sound' && !showPulseBefore && !showPulseAfter && (
          <div className="relative h-full">
            <Soundscapes theme={theme} />
            <button
              onClick={handleExerciseComplete}
              className={`absolute bottom-6 right-6 px-6 py-3 ${theme.cardBg} border ${theme.cardBorder} rounded-full font-bold ${theme.text} hover:border-cyan-400 transition-all`}
            >
              I'm Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, CheckCircle, Clock, RotateCcw, Zap, 
  CloudRain, Trees, Coffee, Music, VolumeX, 
  Play, Pause, Plus, Trash2, ArrowLeft, Star, Settings, Layout, Pointer
} from 'lucide-react';
import { getTheme, GeminiService } from './utils';

// --- INTERNAL AUDIO ENGINE ---
const DriverAudio = {
    ctx: null,
    ambienceNodes: [], 
    musicNodes: [],
    musicInterval: null,
    
    init: () => {
        if (!DriverAudio.ctx) DriverAudio.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (DriverAudio.ctx.state === 'suspended') DriverAudio.ctx.resume();
    },

    stopAll: () => {
        if (DriverAudio.musicInterval) {
            clearInterval(DriverAudio.musicInterval);
            DriverAudio.musicInterval = null;
        }
        DriverAudio.ambienceNodes.forEach(node => { try { node.stop(); node.disconnect(); } catch(e){} });
        DriverAudio.ambienceNodes = [];
        DriverAudio.musicNodes.forEach(node => { try { node.stop(); node.disconnect(); } catch(e){} });
        DriverAudio.musicNodes = [];
    },

    playAlarm: () => {
        DriverAudio.init();
        const t = DriverAudio.ctx.currentTime;
        const osc = DriverAudio.ctx.createOscillator();
        const gain = DriverAudio.ctx.createGain();
        osc.connect(gain);
        gain.connect(DriverAudio.ctx.destination);
        osc.type = 'triangle'; // Softer alarm
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.linearRampToValueAtTime(880, t + 0.1);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 1.5); // Long fade out
        osc.start(t);
        osc.stop(t + 1.5);
    },

    playVictory: () => {
        DriverAudio.init();
        const t = DriverAudio.ctx.currentTime;
        // Clean Sine Wave Arpeggio (Mario-style coin sound vibe but slower)
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = DriverAudio.ctx.createOscillator();
            const gain = DriverAudio.ctx.createGain();
            osc.connect(gain);
            gain.connect(DriverAudio.ctx.destination);
            osc.frequency.value = freq;
            osc.type = 'sine'; // CLEANEST SOUND
            
            // Envelope
            gain.gain.setValueAtTime(0, t + i*0.1);
            gain.gain.linearRampToValueAtTime(0.1, t + i*0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i*0.1 + 0.8);
            
            osc.start(t + i*0.1);
            osc.stop(t + i*0.1 + 0.9);
        });
    },

    playSound: (type) => {
        DriverAudio.stopAll(); 
        DriverAudio.init();
        if (!type) return;

        const bufferSize = DriverAudio.ctx.sampleRate * 2;
        const buffer = DriverAudio.ctx.createBuffer(1, bufferSize, DriverAudio.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        if (['rain', 'brown', 'forest'].includes(type)) {
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02; 
                lastOut = data[i];
                data[i] *= 3.5; 
            }
            const noise = DriverAudio.ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;
            const gain = DriverAudio.ctx.createGain();

            if (type === 'forest') {
                 const lowPass = DriverAudio.ctx.createBiquadFilter();
                 lowPass.type = 'lowpass';
                 lowPass.frequency.value = 800;
                 const highPass = DriverAudio.ctx.createBiquadFilter();
                 highPass.type = 'highpass';
                 highPass.frequency.value = 300;
                 noise.connect(highPass);
                 highPass.connect(lowPass);
                 lowPass.connect(gain);
                 gain.gain.value = 0.2; 
            } else if (type === 'rain') {
                 gain.gain.value = 0.15; 
                 noise.connect(gain);
            } else {
                 gain.gain.value = 0.35; 
                 noise.connect(gain);
            }
            gain.connect(DriverAudio.ctx.destination);
            noise.start();
            DriverAudio.ambienceNodes.push(noise);
        }

        // --- FIXED LOFI: CHORDS ARE BACK ---
        if (type === 'lofi') {
            const playChord = (notes, time) => {
                notes.forEach(freq => {
                    const osc = DriverAudio.ctx.createOscillator();
                    const gain = DriverAudio.ctx.createGain();
                    osc.type = 'triangle'; 
                    osc.frequency.value = freq;
                    // Detune for lofi vibe
                    osc.detune.setValueAtTime(0, time);
                    osc.detune.linearRampToValueAtTime(15, time + 4); 
                    
                    osc.connect(gain);
                    gain.connect(DriverAudio.ctx.destination);
                    
                    // Soft envelope
                    gain.gain.setValueAtTime(0, time);
                    gain.gain.linearRampToValueAtTime(0.05, time + 0.5); // Quieter
                    gain.gain.exponentialRampToValueAtTime(0.001, time + 6);
                    
                    osc.start(time);
                    osc.stop(time + 6);
                    DriverAudio.musicNodes.push(osc);
                });
            };
            const loopChords = () => {
                const t = DriverAudio.ctx.currentTime;
                // C Maj7 -> F Maj7 (Simple, happy loop)
                playChord([261.63, 329.63, 392.00, 493.88], t);
                setTimeout(() => {
                    if (DriverAudio.musicInterval) playChord([174.61, 220.00, 261.63, 329.63], DriverAudio.ctx.currentTime);
                }, 4000);
            };
            loopChords();
            DriverAudio.musicInterval = setInterval(loopChords, 8000);
        }
    }
};

const NeuroDriver = ({ onBack, isDark }) => { 
  const theme = getTheme(isDark);
  
  // App State
  const [task, setTask] = useState('');
  const [steps, setSteps] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSound, setActiveSound] = useState(null);
  const [showVictory, setShowVictory] = useState(false);
  const [highlightedStep, setHighlightedStep] = useState(null); // For Indecisive Mode
  
  // Timer State
  const [totalTime, setTotalTime] = useState(25 * 60); 
  const [timeLeft, setTimeLeft] = useState(25 * 60);   
  const [timerActive, setTimerActive] = useState(false);
  const [timerView, setTimerView] = useState('bar'); 
  const [inputTime, setInputTime] = useState(25);
  const [showFinishTime, setShowFinishTime] = useState(false); // Toggle "Time Until"

  // Audio Toggle
  const toggleSound = (soundType) => {
      if (activeSound === soundType) {
          setActiveSound(null);
          DriverAudio.stopAll();
      } else {
          setActiveSound(soundType);
          DriverAudio.playSound(soundType);
      }
  };

  useEffect(() => { return () => DriverAudio.stopAll(); }, []);

  // Timer Logic
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      DriverAudio.playAlarm();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const handleTimeInput = (e) => {
      const val = parseInt(e.target.value) || 0;
      setInputTime(val);
      setTotalTime(val * 60);
      setTimeLeft(val * 60);
      setTimerActive(false);
  };

  const addFiveMinutes = () => {
      setTotalTime(prev => prev + 300);
      setTimeLeft(prev => prev + 300);
      setInputTime(prev => prev + 5);
  };

  // Check for Victory
  useEffect(() => {
      if (steps.length > 0 && steps.every(s => s.done)) {
          if (!showVictory) {
              setShowVictory(true);
              DriverAudio.playVictory();
              setTimeout(() => setShowVictory(false), 4000);
          }
      }
  }, [steps]);

  // "Pick for Me" Logic
  const pickFirstStep = () => {
      const firstIncomplete = steps.findIndex(s => !s.done);
      if (firstIncomplete !== -1) {
          setHighlightedStep(firstIncomplete);
          setTimeout(() => setHighlightedStep(null), 2000); // Highlight for 2s
      }
  };

  // Calculations
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getFinishTime = () => {
      const date = new Date();
      date.setSeconds(date.getSeconds() + timeLeft);
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const progressPct = (timeLeft / totalTime) * 100;
  const barColor = progressPct > 50 ? 'bg-cyan-500' : 'bg-fuchsia-500';

  const handleSlice = async () => {
    if (!task.trim()) return;
    setIsProcessing(true);
    try {
        const result = await GeminiService.generate({ task }, 'slicer');
        const lines = result.split('\n').filter(line => line.match(/^(\d+\.|-|\*)/));
        const cleanSteps = lines.map(line => ({ 
            text: line.replace(/^(\d+\.|-|\*)\s*/, ''), 
            done: false 
        }));
        setSteps(cleanSteps.length > 0 ? cleanSteps : [{ text: "Could not parse steps. Try simpler task.", done: false }]);
    } catch (error) {
        setSteps([{ text: "Connection error. Please try again.", done: false }]);
    }
    setIsProcessing(false);
  };

  const toggleStep = (index) => {
    const newSteps = [...steps];
    newSteps[index].done = !newSteps[index].done;
    setSteps(newSteps);
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-4 md:p-8 flex flex-col items-center transition-colors duration-500`}>
      
      {/* VICTORY MODAL */}
      {showVictory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
              <div className={`${theme.cardBg} p-8 rounded-3xl shadow-2xl flex flex-col items-center animate-in zoom-in spin-in-3`}>
                  <Star size={120} className="text-yellow-400 fill-yellow-400 mb-4 animate-bounce" />
                  <h2 className="text-4xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">You did it!</h2>
                  <p className={`mt-2 ${theme.text} text-xl font-bold`}>Gold Star for you.</p>
              </div>
          </div>
      )}

      <div className="w-full max-w-3xl animate-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
            <button onClick={onBack} className={`flex items-center gap-2 ${theme.textMuted} hover:${theme.text} transition-colors`}>
                <ArrowLeft /> Back
            </button>
            <div className="flex items-center gap-2">
                <Brain className="text-amber-500" />
                <span className="font-bold text-xl tracking-tight">Neuro Driver</span>
            </div>
        </div>

        {/* --- TIMER SECTION --- */}
        <div className={`${theme.cardBg} border ${theme.cardBorder} p-6 md:p-8 rounded-3xl shadow-xl mb-8 transition-all`}>
            
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                     <h2 className={`font-bold text-lg ${theme.textMuted}`}>Focus Timer</h2>
                     {/* TOGGLE: Time Remaining vs Finish Time */}
                     <button 
                        onClick={() => setShowFinishTime(!showFinishTime)}
                        className={`text-xs px-2 py-1 rounded bg-slate-500/10 hover:bg-slate-500/20 ${theme.text} transition-colors`}
                     >
                        {showFinishTime ? "Show Countdown" : "Show Finish Time"}
                     </button>
                </div>
                <button onClick={() => setTimerView(timerView === 'bar' ? 'circle' : 'bar')} className={`p-2 rounded-lg ${theme.inputBg} hover:bg-slate-500/10 transition-colors`} title="Toggle View">
                    <Layout size={20} className={theme.text}/>
                </button>
            </div>

            {/* VISUAL DISPLAY */}
            <div className="flex flex-col items-center justify-center mb-8">
                {showFinishTime ? (
                    <div className="text-center animate-in fade-in">
                        <span className={`text-sm uppercase tracking-widest ${theme.textMuted}`}>Finish By</span>
                        <div className={`text-6xl font-mono font-bold ${theme.text} mt-2`}>
                            {getFinishTime()}
                        </div>
                    </div>
                ) : (
                    <>
                        {timerView === 'circle' ? (
                             <div className="relative w-64 h-64 flex items-center justify-center">
                                <svg className="absolute w-full h-full transform -rotate-90">
                                    <circle cx="128" cy="128" r="110" stroke={isDark ? "#1e293b" : "#e2e8f0"} strokeWidth="12" fill="transparent" />
                                    <circle 
                                        cx="128" cy="128" r="110" 
                                        stroke={progressPct > 50 ? '#06b6d4' : '#d946ef'} 
                                        strokeWidth="12" 
                                        fill="transparent" 
                                        strokeDasharray={2 * Math.PI * 110}
                                        strokeDashoffset={(2 * Math.PI * 110) * (1 - (timeLeft / totalTime))}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-linear"
                                    />
                                </svg>
                                <div className={`text-6xl font-mono font-bold ${timerActive ? 'text-amber-500' : theme.text} z-10`}>
                                    {formatTime(timeLeft)}
                                </div>
                             </div>
                        ) : (
                            <div className="w-full">
                                <div className={`text-8xl font-mono font-bold text-center mb-6 ${timerActive ? 'text-amber-500' : theme.text}`}>
                                    {formatTime(timeLeft)}
                                </div>
                                <div className={`w-full h-6 ${theme.inputBg} rounded-full overflow-hidden`}>
                                    <div className={`h-full ${barColor} transition-all duration-1000 ease-linear`} style={{ width: `${progressPct}%` }}></div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* CONTROLS */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-center bg-slate-500/5 p-4 rounded-xl">
                 <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${theme.textMuted}`}>Set Minutes:</span>
                    <input 
                        type="number" 
                        min="1" max="120" 
                        value={inputTime} 
                        onChange={handleTimeInput}
                        className={`w-20 p-2 text-center font-bold rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.text} outline-none focus:border-cyan-500`}
                    />
                 </div>

                 <div className="flex items-center gap-3">
                    <button onClick={() => { setTimerActive(false); setTimeLeft(inputTime * 60); setTotalTime(inputTime * 60); }} className={`p-3 rounded-full ${theme.inputBg} text-slate-400 hover:text-slate-600 border ${theme.inputBorder}`} title="Reset">
                        <RotateCcw size={20} />
                    </button>
                    
                    <button onClick={() => setTimerActive(!timerActive)} className={`px-8 py-3 rounded-full shadow-lg font-bold text-white transition-transform active:scale-95 flex items-center gap-2 ${timerActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gradient-to-r from-cyan-500 to-fuchsia-500'}`}>
                        {timerActive ? <><Pause fill="white"/> Pause</> : <><Play fill="white"/> Start</>}
                    </button>

                    <button onClick={addFiveMinutes} className={`px-4 py-3 rounded-full border ${theme.inputBorder} ${theme.inputBg} ${theme.text} hover:border-fuchsia-500 font-bold transition-all`}>
                        +5m
                    </button>
                 </div>
            </div>
        </div>

        {/* --- SOUND ENGINE --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
             {['rain', 'brown', 'forest', 'lofi'].map((sound) => (
                 <button 
                    key={sound}
                    onClick={() => toggleSound(sound)}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                        activeSound === sound 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg scale-105' 
                        : `${theme.cardBg} ${theme.cardBorder} ${theme.textMuted} hover:${theme.text} hover:border-indigo-400`
                    }`}
                 >
                    {sound === 'rain' && <CloudRain size={24} />}
                    {sound === 'brown' && <Coffee size={24} />}
                    {sound === 'forest' && <Trees size={24} />}
                    {sound === 'lofi' && <Music size={24} />}
                    <span className="uppercase text-xs font-bold tracking-wider">{sound}</span>
                    {activeSound === sound && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse mt-1"/>}
                 </button>
             ))}
        </div>

        {/* --- TASK SLICER --- */}
        <div className="relative mb-6">
            <input 
                type="text" 
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="What task is overwhelming you?"
                className={`w-full p-5 pr-36 rounded-2xl border-2 ${theme.inputBorder} ${theme.inputBg} ${theme.text} focus:border-cyan-500 outline-none shadow-xl text-lg transition-colors placeholder:text-slate-400`}
                onKeyDown={(e) => e.key === 'Enter' && handleSlice()}
            />
            <button 
                onClick={handleSlice}
                disabled={isProcessing || !task.trim()}
                className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
                {isProcessing ? <Clock className="animate-spin"/> : <Zap fill="white" />}
                Slice It
            </button>
        </div>

        {/* STEPS LIST */}
        <div className="space-y-3 relative">
            
            {/* Indecisive Button (Only shows if steps exist and not all done) */}
            {steps.length > 0 && !steps.every(s => s.done) && (
                <div className="flex justify-end mb-2">
                     <button onClick={pickFirstStep} className="text-xs font-bold text-fuchsia-500 hover:text-fuchsia-400 flex items-center gap-1 animate-pulse">
                        <Pointer size={14}/> Where do I start?
                     </button>
                </div>
            )}

            {steps.map((step, index) => (
                <div 
                    key={index}
                    onClick={() => toggleStep(index)}
                    className={`group flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-300 select-none ${
                        step.done 
                        ? `${theme.inputBg} border-emerald-500/20 opacity-60` 
                        : highlightedStep === index 
                            ? 'bg-yellow-500/20 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-105'
                            : `${theme.cardBg} ${theme.cardBorder} hover:border-cyan-400 shadow-sm hover:shadow-md hover:scale-[1.01]`
                    }`}
                >
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 transition-colors shrink-0 ${
                        step.done ? 'bg-emerald-500 border-emerald-500' : `border-slate-300 group-hover:border-cyan-400`
                    }`}>
                        {step.done && <CheckCircle size={18} className="text-white" />}
                    </div>
                    <span className={`text-lg font-medium transition-all ${step.done ? 'line-through text-slate-500' : theme.text}`}>
                        {step.text}
                    </span>
                </div>
            ))}
            
            {steps.length > 0 && (
                <button onClick={() => {setSteps([]); setTask('');}} className={`mt-6 w-full py-3 ${theme.inputBg} border ${theme.inputBorder} ${theme.textMuted} hover:text-red-400 hover:border-red-400 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors`}>
                    <Trash2 size={16} /> Clear List
                </button>
            )}
        </div>

      </div>
    </div>
  );
};

export default NeuroDriver;

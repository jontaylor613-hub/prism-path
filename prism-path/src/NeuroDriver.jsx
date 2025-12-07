import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, CheckCircle, Clock, RotateCcw, Zap, 
  CloudRain, Trees, Coffee, Music, VolumeX, 
  Play, Pause, Plus, Trash2, ArrowLeft, Hourglass, Settings
} from 'lucide-react';
import { getTheme, GeminiService } from './utils';

// --- INTERNAL AUDIO ENGINE (Local to NeuroDriver) ---
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

        if (type === 'lofi') {
            const playChord = (notes, time) => {
                notes.forEach(freq => {
                    const osc = DriverAudio.ctx.createOscillator();
                    const gain = DriverAudio.ctx.createGain();
                    osc.type = 'triangle'; 
                    osc.frequency.value = freq;
                    osc.detune.setValueAtTime(0, time);
                    osc.detune.linearRampToValueAtTime(10, time + 2); 
                    osc.connect(gain);
                    gain.connect(DriverAudio.ctx.destination);
                    gain.gain.setValueAtTime(0, time);
                    gain.gain.linearRampToValueAtTime(0.08, time + 1);
                    gain.gain.exponentialRampToValueAtTime(0.001, time + 6);
                    osc.start(time);
                    osc.stop(time + 6);
                    DriverAudio.musicNodes.push(osc);
                });
            };
            const loopChords = () => {
                const t = DriverAudio.ctx.currentTime;
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
  
  // Timer State
  const [totalTime, setTotalTime] = useState(25 * 60); // Total duration for circle math
  const [timeLeft, setTimeLeft] = useState(25 * 60);   // Current remaining
  const [timerActive, setTimerActive] = useState(false);
  const [finishMode, setFinishMode] = useState(false); // Toggle "Time Until" mode

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

  // Timer Tick
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      // Optional: Add beep here
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // Handle Slider Change
  const handleSliderChange = (e) => {
      const minutes = parseInt(e.target.value);
      const seconds = minutes * 60;
      setTotalTime(seconds);
      setTimeLeft(seconds);
      setTimerActive(false); // Pause when adjusting
  };

  const addFiveMinutes = () => {
      setTotalTime(prev => prev + 300);
      setTimeLeft(prev => prev + 300);
  };

  // Calculations for Circle & Time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getFinishTime = () => {
      const date = new Date();
      date.setSeconds(date.getSeconds() + timeLeft);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // SVG Circle Logic
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / totalTime;
  const dashOffset = circumference * (1 - progress);
  
  // Color Logic: Start Cyan, Fade to Pink halfway
  const isHalfway = progress < 0.5;
  const strokeColor = isHalfway ? '#e879f9' : '#22d3ee'; // Fuchsia vs Cyan (Tailwind colors)

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
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-4 md:p-8 flex flex-col items-center`}>
      <div className="w-full max-w-2xl animate-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
            <button onClick={onBack} className={`flex items-center gap-2 ${theme.textMuted} hover:${theme.text} transition-colors`}>
                <ArrowLeft /> Back
            </button>
            <div className="flex items-center gap-2">
                <Brain className="text-amber-500" />
                <span className="font-bold text-xl tracking-tight">Neuro Driver</span>
            </div>
        </div>

        {/* MAIN CONTROLS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* TIMER CARD */}
            <div className={`${theme.cardBg} border ${theme.cardBorder} p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center relative`}>
                
                {/* CIRCULAR TIMER */}
                <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                    {/* Background Circle */}
                    <svg className="absolute w-full h-full transform -rotate-90">
                        <circle cx="96" cy="96" r={radius} stroke={isDark ? "#334155" : "#e2e8f0"} strokeWidth="8" fill="transparent" />
                        <circle 
                            cx="96" cy="96" r={radius} 
                            stroke={strokeColor} 
                            strokeWidth="8" 
                            fill="transparent" 
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-linear"
                        />
                    </svg>
                    
                    {/* Time Display */}
                    <div className="text-center z-10">
                        <button onClick={() => setFinishMode(!finishMode)} className="flex flex-col items-center">
                            {finishMode ? (
                                <>
                                    <span className={`text-xs uppercase tracking-widest ${theme.textMuted} mb-1`}>Finish At</span>
                                    <span className={`text-4xl font-mono font-bold ${timerActive ? 'text-amber-500' : theme.text}`}>{getFinishTime()}</span>
                                </>
                            ) : (
                                <span className={`text-5xl font-mono font-bold ${timerActive ? 'text-amber-500' : theme.text}`}>{formatTime(timeLeft)}</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* SLIDER & CONTROLS */}
                <div className="w-full space-y-4">
                     <input 
                        type="range" 
                        min="1" max="90" 
                        value={Math.ceil(totalTime / 60)} 
                        onChange={handleSliderChange}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    
                    <div className="flex justify-between items-center w-full px-2">
                        <button onClick={() => { setTimerActive(false); setTimeLeft(25*60); setTotalTime(25*60); }} className={`${theme.inputBg} p-2 rounded-full border ${theme.inputBorder} ${theme.textMuted} hover:${theme.text}`}><RotateCcw size={18} /></button>
                        
                        <button onClick={() => setTimerActive(!timerActive)} className={`p-4 rounded-full shadow-lg transition-transform active:scale-95 ${timerActive ? 'bg-amber-500/20 text-amber-500' : 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white'}`}>
                            {timerActive ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
                        </button>

                        <button onClick={addFiveMinutes} className={`${theme.inputBg} p-2 rounded-full border ${theme.inputBorder} ${theme.text} hover:border-fuchsia-500 text-xs font-bold`}>+5m</button>
                    </div>
                </div>
            </div>

            {/* SOUND ENGINE CARD */}
            <div className={`${theme.cardBg} border ${theme.cardBorder} p-6 rounded-2xl shadow-lg flex flex-col justify-center`}>
                <h3 className={`text-sm font-bold uppercase tracking-widest ${theme.textMuted} mb-4 flex items-center gap-2`}>
                    <Music size={16}/> Focus Audio
                </h3>
                <div className="grid grid-cols-2 gap-3 h-full content-start">
                    <button onClick={() => toggleSound('rain')} className={`p-4 rounded-xl flex items-center justify-between border transition-all ${activeSound === 'rain' ? 'bg-blue-500 border-blue-400 text-white' : `${theme.inputBg} ${theme.inputBorder} ${theme.textMuted} hover:${theme.text}`}`}>
                        <div className="flex items-center gap-2"><CloudRain size={20} /> <span className="font-bold text-sm">Rain</span></div>
                        {activeSound === 'rain' && <div className="w-2 h-2 bg-white rounded-full animate-pulse"/>}
                    </button>
                    <button onClick={() => toggleSound('brown')} className={`p-4 rounded-xl flex items-center justify-between border transition-all ${activeSound === 'brown' ? 'bg-amber-600 border-amber-500 text-white' : `${theme.inputBg} ${theme.inputBorder} ${theme.textMuted} hover:${theme.text}`}`}>
                        <div className="flex items-center gap-2"><Coffee size={20} /> <span className="font-bold text-sm">Cozy</span></div>
                        {activeSound === 'brown' && <div className="w-2 h-2 bg-white rounded-full animate-pulse"/>}
                    </button>
                    <button onClick={() => toggleSound('forest')} className={`p-4 rounded-xl flex items-center justify-between border transition-all ${activeSound === 'forest' ? 'bg-emerald-600 border-emerald-500 text-white' : `${theme.inputBg} ${theme.inputBorder} ${theme.textMuted} hover:${theme.text}`}`}>
                        <div className="flex items-center gap-2"><Trees size={20} /> <span className="font-bold text-sm">Nature</span></div>
                        {activeSound === 'forest' && <div className="w-2 h-2 bg-white rounded-full animate-pulse"/>}
                    </button>
                    <button onClick={() => toggleSound('lofi')} className={`p-4 rounded-xl flex items-center justify-between border transition-all ${activeSound === 'lofi' ? 'bg-indigo-500 border-indigo-400 text-white' : `${theme.inputBg} ${theme.inputBorder} ${theme.textMuted} hover:${theme.text}`}`}>
                        <div className="flex items-center gap-2"><Music size={20} /> <span className="font-bold text-sm">Lofi</span></div>
                        {activeSound === 'lofi' && <div className="w-2 h-2 bg-white rounded-full animate-pulse"/>}
                    </button>
                </div>
                {activeSound && (
                    <button onClick={() => { setActiveSound(null); DriverAudio.stopAll(); }} className="mt-4 w-full py-2 text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors">
                        Stop Audio
                    </button>
                )}
            </div>
        </div>

        {/* TASK SLICER (AI) */}
        <div className="relative mb-8">
            <input 
                type="text" 
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="What overwhelming task do you need to do?"
                className={`w-full p-4 pr-32 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.text} focus:border-amber-500 outline-none shadow-xl`}
                onKeyDown={(e) => e.key === 'Enter' && handleSlice()}
            />
            <button 
                onClick={handleSlice}
                disabled={isProcessing || !task.trim()}
                className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 rounded-lg font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
                {isProcessing ? <Clock className="animate-spin"/> : <Zap fill="white" />}
                Slice
            </button>
        </div>

        {/* STEPS LIST */}
        <div className="space-y-3">
            {steps.map((step, index) => (
                <div 
                    key={index}
                    onClick={() => toggleStep(index)}
                    className={`group flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                        step.done 
                        ? `${theme.inputBg} border-emerald-500/30 opacity-50` 
                        : `${theme.cardBg} ${theme.cardBorder} hover:border-amber-500/50 shadow-sm hover:shadow-md`
                    }`}
                >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 transition-colors ${
                        step.done ? 'bg-emerald-500 border-emerald-500' : `border-slate-400 group-hover:border-amber-500`
                    }`}>
                        {step.done && <CheckCircle size={14} className="text-white" />}
                    </div>
                    <span className={`text-lg font-medium transition-all ${step.done ? 'line-through text-slate-500' : theme.text}`}>
                        {step.text}
                    </span>
                </div>
            ))}
            
            {steps.length > 0 && (
                <button onClick={() => {setSteps([]); setTask('');}} className={`mt-4 w-full py-2 ${theme.textMuted} hover:text-red-400 flex items-center justify-center gap-2 text-sm`}>
                    <Trash2 size={16} /> Clear List
                </button>
            )}
        </div>

      </div>
    </div>
  );
};

export default NeuroDriver;

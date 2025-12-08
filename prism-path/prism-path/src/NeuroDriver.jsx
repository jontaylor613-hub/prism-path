import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, CheckCircle, Clock, RotateCcw, Zap, 
  CloudRain, Trees, Coffee, Music, VolumeX, 
  Play, Pause, Plus, Trash2, ArrowLeft, Star, Layout, Pointer, Target
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
        osc.type = 'sine'; 
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.setValueAtTime(880, t + 0.2);
        osc.frequency.setValueAtTime(440, t + 0.4);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0, t + 1.5);
        osc.start(t);
        osc.stop(t + 1.5);
    },

    playVictory: () => {
        DriverAudio.init();
        const t = DriverAudio.ctx.currentTime;
        // Clean Sine Wave Arpeggio (Major Scale)
        [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, i) => {
            const osc = DriverAudio.ctx.createOscillator();
            const gain = DriverAudio.ctx.createGain();
            osc.connect(gain);
            gain.connect(DriverAudio.ctx.destination);
            osc.frequency.value = freq;
            osc.type = 'sine'; 
            
            gain.gain.setValueAtTime(0, t + i*0.12);
            gain.gain.linearRampToValueAtTime(0.15, t + i*0.12 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i*0.12 + 1.0);
            
            osc.start(t + i*0.12);
            osc.stop(t + i*0.12 + 1.2);
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

        if (type === 'lofi') {
            const playChord = (notes, time) => {
                notes.forEach(freq => {
                    const osc = DriverAudio.ctx.createOscillator();
                    const gain = DriverAudio.ctx.createGain();
                    osc.type = 'triangle'; 
                    osc.frequency.value = freq;
                    osc.detune.setValueAtTime(0, time);
                    osc.detune.linearRampToValueAtTime(15, time + 4); 
                    osc.connect(gain);
                    gain.connect(DriverAudio.ctx.destination);
                    gain.gain.setValueAtTime(0, time);
                    gain.gain.linearRampToValueAtTime(0.05, time + 0.5);
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
  
  // Specific Text Color Logic (White in Dark, Black in Light)
  const numberColor = isDark ? "text-white" : "text-slate-900";
  
  // App State
  const [task, setTask] = useState('');
  const [steps, setSteps] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSound, setActiveSound] = useState(null);
  const [showVictory, setShowVictory] = useState(false);
  const [highlightedStep, setHighlightedStep] = useState(null); 
  
  // Timer State
  const [timerMode, setTimerMode] = useState('duration'); // 'duration' or 'until'
  const [timerView, setTimerView] = useState('bar');      // 'circle' or 'bar'
  const [timerActive, setTimerActive] = useState(false);
  
  // Duration Mode Data
  const [durationInput, setDurationInput] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);

  // Until Mode Data
  const [targetTimeStr, setTargetTimeStr] = useState('');
  
  // --- AUDIO TOGGLE ---
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

  // --- TIMER LOGIC ---
  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        if (timerMode === 'duration') {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setTimerActive(false);
                    DriverAudio.playAlarm();
                    return 0;
                }
                return prev - 1;
            });
        } else {
            // Until Mode Logic
            const now = new Date();
            const [hours, minutes] = targetTimeStr.split(':').map(Number);
            const target = new Date();
            target.setHours(hours, minutes, 0, 0);
            if (target < now) target.setDate(target.getDate() + 1); // Handle next day
            
            const diffSeconds = Math.floor((target - now) / 1000);
            if (diffSeconds <= 0) {
                setTimerActive(false);
                setTimeLeft(0);
                DriverAudio.playAlarm();
            } else {
                setTimeLeft(diffSeconds);
            }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerMode, targetTimeStr]);

  // Handlers
  const handleDurationChange = (e) => {
      const val = parseInt(e.target.value) || 0;
      setDurationInput(val);
      setTotalTime(val * 60);
      setTimeLeft(val * 60);
      setTimerActive(false);
  };

  const handleUntilChange = (e) => {
      setTargetTimeStr(e.target.value);
      setTimerActive(false);
      if (e.target.value) {
          const now = new Date();
          const [hours, minutes] = e.target.value.split(':').map(Number);
          const target = new Date();
          target.setHours(hours, minutes, 0, 0);
          if (target < now) target.setDate(target.getDate() + 1);
          const diff = Math.floor((target - now) / 1000);
          setTimeLeft(diff);
          setTotalTime(diff); // Reset progress reference
      }
  };

  const addFiveMinutes = () => {
      if (timerMode === 'duration') {
          setTimeLeft(prev => prev + 300);
          setTotalTime(prev => prev + 300);
          setDurationInput(prev => prev + 5);
      }
  };

  // Check Victory
  useEffect(() => {
      if (steps.length > 0 && steps.every(s => s.done)) {
          if (!showVictory) {
              setShowVictory(true);
              DriverAudio.playVictory();
          }
      }
  }, [steps]);

  // "Where to start?"
  const pickFirstStep = () => {
      const firstIncomplete = steps.findIndex(s => !s.done);
      if (firstIncomplete !== -1) {
          setHighlightedStep(firstIncomplete);
          setTimeout(() => setHighlightedStep(null), 3000);
      }
  };

  // Visuals
  const formatTime = (seconds) => {
    const s = Math.max(0, seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    // Format: "1:05:09" or "25:00"
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const progressPct = Math.min(100, Math.max(0, (timeLeft / totalTime) * 100));
  // Color Logic: NO YELLOW. Cyan -> Blue -> Purple/Pink
  const visualColor = progressPct > 50 ? 'text-cyan-500 stroke-cyan-500 bg-cyan-500' : 'text-fuchsia-500 stroke-fuchsia-500 bg-fuchsia-500';

  // Task Progress Bar Logic
  const completedTasks = steps.filter(s => s.done).length;
  const taskProgress = steps.length > 0 ? (completedTasks / steps.length) * 100 : 0;

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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in">
              <div className={`${theme.cardBg} border ${theme.cardBorder} p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full animate-in zoom-in spin-in-3`}>
                  {/* GOLD STAR - The ONLY yellow allowed */}
                  <Star size={140} className="text-yellow-400 fill-yellow-400 mb-6 drop-shadow-lg animate-bounce" strokeWidth={1.5} />
                  
                  <h2 className={`text-4xl font-black mb-2 ${theme.text}`}>Excellent!</h2>
                  <p className={`text-xl ${theme.textMuted} mb-8`}>I am proud of you.</p>
                  
                  <button 
                    onClick={() => setShowVictory(false)}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg transform transition-all active:scale-95 text-lg"
                  >
                    Next Task
                  </button>
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
                <Brain className="text-yellow-500" /> {/* Brain Logo allowed Yellow */}
                <span className="font-bold text-xl tracking-tight">Neuro Driver</span>
            </div>
        </div>

        {/* --- TIMER SECTION --- */}
        <div className={`${theme.cardBg} border ${theme.cardBorder} p-6 md:p-8 rounded-3xl shadow-xl mb-8 transition-all`}>
            
            {/* Top Bar: Mode Switcher & View Toggle */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex bg-slate-500/10 p-1 rounded-xl">
                    <button 
                        onClick={() => { setTimerMode('duration'); setTimerActive(false); }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timerMode === 'duration' ? `${theme.inputBg} ${theme.text} shadow-sm` : theme.textMuted}`}
                    >
                        Duration
                    </button>
                    <button 
                        onClick={() => { setTimerMode('until'); setTimerActive(false); }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timerMode === 'until' ? `${theme.inputBg} ${theme.text} shadow-sm` : theme.textMuted}`}
                    >
                        Finish At
                    </button>
                </div>
                
                <button onClick={() => setTimerView(timerView === 'bar' ? 'circle' : 'bar')} className={`p-2 rounded-lg ${theme.inputBg} hover:bg-slate-500/10 transition-colors`} title="Toggle Visual">
                    <Layout size={20} className={theme.text}/>
                </button>
            </div>

            {/* VISUAL DISPLAY */}
            <div className="flex flex-col items-center justify-center mb-8 w-full">
                {timerView === 'circle' ? (
                     <div className="relative w-72 h-72 flex items-center justify-center">
                        <svg className="absolute w-full h-full transform -rotate-90">
                            <circle cx="144" cy="144" r="128" stroke={isDark ? "#1e293b" : "#e2e8f0"} strokeWidth="16" fill="transparent" />
                            <circle 
                                cx="144" cy="144" r="128" 
                                className={`${visualColor.split(' ')[1]} transition-all duration-1000 ease-linear`}
                                strokeWidth="16" 
                                fill="transparent" 
                                strokeDasharray={2 * Math.PI * 128}
                                strokeDashoffset={(2 * Math.PI * 128) * (1 - (progressPct / 100))}
                                strokeLinecap="round"
                            />
                        </svg>
                        {/* FIXED: Clean Sans Font + Strict Color (No Blue/Yellow) */}
                        <div className={`text-6xl font-sans tabular-nums tracking-wider font-bold ${numberColor} z-10`}>
                            {formatTime(timeLeft)}
                        </div>
                     </div>
                ) : (
                    // RECTANGULAR BAR MODE
                    <div className="w-full">
                        {/* FIXED: Clean Sans Font + Strict Color */}
                        <div className={`text-9xl font-sans tabular-nums tracking-wider font-bold text-center mb-6 ${numberColor}`}>
                            {formatTime(timeLeft)}
                        </div>
                        <div className={`w-full h-8 ${theme.inputBg} rounded-full overflow-hidden border ${theme.inputBorder}`}>
                            <div className={`h-full ${visualColor.split(' ')[2]} transition-all duration-1000 ease-linear`} style={{ width: `${progressPct}%` }}></div>
                        </div>
                    </div>
                )}
            </div>

            {/* INPUTS & CONTROLS */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-center bg-slate-500/5 p-6 rounded-2xl border border-slate-500/10">
                 
                 {/* Input Area */}
                 <div className="flex items-center gap-3">
                    {timerMode === 'duration' ? (
                        <>
                            <span className={`text-sm font-bold ${theme.textMuted}`}>Minutes:</span>
                            <input 
                                type="number" 
                                min="1" max="180" 
                                value={durationInput} 
                                onChange={handleDurationChange}
                                className={`w-24 p-3 text-center text-xl font-bold rounded-xl border-2 ${theme.inputBorder} ${theme.inputBg} ${theme.text} outline-none focus:border-cyan-500`}
                            />
                        </>
                    ) : (
                        <>
                            <span className={`text-sm font-bold ${theme.textMuted}`}>End Time:</span>
                            <input 
                                type="time" 
                                value={targetTimeStr}
                                onChange={handleUntilChange}
                                className={`p-3 text-xl font-bold rounded-xl border-2 ${theme.inputBorder} ${theme.inputBg} ${theme.text} outline-none focus:border-cyan-500`}
                            />
                        </>
                    )}
                 </div>

                 {/* Action Buttons */}
                 <div className="flex items-center gap-3">
                    <button onClick={() => { setTimerActive(false); setTimeLeft(timerMode === 'duration' ? durationInput * 60 : 0); }} className={`p-4 rounded-xl ${theme.inputBg} text-slate-400 hover:text-slate-600 border ${theme.inputBorder} transition-colors`} title="Reset">
                        <RotateCcw size={20} />
                    </button>
                    
                    <button onClick={() => setTimerActive(!timerActive)} className={`px-10 py-4 rounded-xl shadow-lg font-bold text-white text-lg transition-transform active:scale-95 flex items-center gap-2 ${timerActive ? 'bg-fuchsia-500 hover:bg-fuchsia-600' : 'bg-cyan-500 hover:bg-cyan-600'}`}>
                        {timerActive ? <><Pause fill="white"/> Pause</> : <><Play fill="white"/> Start</>}
                    </button>

                    {timerMode === 'duration' && (
                        <button onClick={addFiveMinutes} className={`px-5 py-4 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.text} hover:border-cyan-500 font-bold transition-all`}>
                            +5m
                        </button>
                    )}
                 </div>
            </div>
        </div>

        {/* --- SOUND ENGINE --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
             {['rain', 'brown', 'forest', 'lofi'].map((sound) => (
                 <button 
                    key={sound}
                    onClick={() => toggleSound(sound)}
                    className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
                        activeSound === sound 
                        ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg scale-105' 
                        : `${theme.cardBg} ${theme.cardBorder} ${theme.textMuted} hover:${theme.text} hover:border-cyan-400`
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

        {/* --- TASK PROGRESS BAR --- */}
        {steps.length > 0 && (
            <div className="mb-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2 px-1">
                    <span className={theme.textMuted}>Task Progress</span>
                    <span className="text-cyan-500">{Math.round(taskProgress)}%</span>
                </div>
                <div className={`w-full h-3 ${theme.inputBg} rounded-full overflow-hidden border ${theme.inputBorder}`}>
                    <div 
                        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700 ease-out" 
                        style={{ width: `${taskProgress}%` }}
                    />
                </div>
            </div>
        )}

        {/* --- TASK SLICER --- */}
        <div className="relative mb-6">
            <input 
                type="text" 
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="What task do you need help breaking down?"
                className={`w-full p-5 pr-36 rounded-2xl border-2 ${theme.inputBorder} ${theme.inputBg} ${theme.text} focus:border-cyan-500 outline-none shadow-xl text-lg transition-colors placeholder:text-slate-400`}
                onKeyDown={(e) => e.key === 'Enter' && handleSlice()}
            />
            <button 
                onClick={handleSlice}
                disabled={isProcessing || !task.trim()}
                className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
                {isProcessing ? <Clock className="animate-spin"/> : <Zap fill="white" />}
                Slice
            </button>
        </div>

        {/* STEPS LIST */}
        <div className="space-y-3 relative">
            
            {/* Indecisive Button (Yellow Highlight Allowed) */}
            {steps.length > 0 && !steps.every(s => s.done) && (
                <div className="flex justify-end mb-2">
                     <button onClick={pickFirstStep} className="text-xs font-bold text-yellow-500 hover:text-yellow-400 flex items-center gap-1 animate-pulse bg-yellow-500/10 px-3 py-1 rounded-full">
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
                            ? 'bg-yellow-500/10 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)] scale-[1.02]'
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

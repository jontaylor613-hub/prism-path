import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, CheckCircle, Clock, RotateCcw, Zap, 
  CloudRain, Trees, Coffee, Music, VolumeX, 
  Play, Pause, Plus, Trash2, ArrowLeft
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

        // --- NOISE GENERATORS ---
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
                 // Bandpass filter for "Rushing Water" effect
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
                 // Pink-ish noise via simpler filter
                 gain.gain.value = 0.15; 
                 noise.connect(gain);
            } else {
                 // Brown noise (Deep)
                 gain.gain.value = 0.35; 
                 noise.connect(gain);
            }
            
            gain.connect(DriverAudio.ctx.destination);
            noise.start();
            DriverAudio.ambienceNodes.push(noise);
        }

        // --- LOFI GENERATOR ---
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
  
  // State
  const [task, setTask] = useState('');
  const [steps, setSteps] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSound, setActiveSound] = useState(null); // 'rain', 'brown', 'forest', 'lofi'
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 min default
  const [timerActive, setTimerActive] = useState(false);

  // --- AUDIO HANDLER ---
  const toggleSound = (soundType) => {
      if (activeSound === soundType) {
          setActiveSound(null);
          DriverAudio.stopAll();
      } else {
          setActiveSound(soundType);
          DriverAudio.playSound(soundType);
      }
  };

  // Cleanup audio on unmount
  useEffect(() => {
      return () => DriverAudio.stopAll();
  }, []);

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
      // Play a simple beep locally if needed, or just stop
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSlice = async () => {
    if (!task.trim()) return;
    setIsProcessing(true);
    try {
        const result = await GeminiService.generate({ task }, 'slicer');
        // Parse list items (looking for numbers or bullets)
        const lines = result.split('\n').filter(line => line.match(/^(\d+\.|-|\*)/));
        const cleanSteps = lines.map(line => ({ 
            text: line.replace(/^(\d+\.|-|\*)\s*/, ''), 
            done: false 
        }));
        
        if (cleanSteps.length > 0) setSteps(cleanSteps);
        else setSteps([{ text: "Could not parse steps. Try a simpler task name.", done: false }]);
        
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
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6 flex flex-col items-center`}>
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

        {/* CONTROLS CONTAINER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* TIMER CARD */}
            <div className={`${theme.cardBg} border ${theme.cardBorder} p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center relative overflow-hidden`}>
                <div className={`text-6xl font-mono font-bold mb-4 ${timerActive ? 'text-amber-500' : theme.textMuted}`}>
                    {formatTime(timeLeft)}
                </div>
                <div className="flex gap-4 z-10">
                    <button onClick={() => setTimerActive(!timerActive)} className={`p-3 rounded-full ${timerActive ? 'bg-amber-500/20 text-amber-500' : `${theme.inputBg} ${theme.text}`}`}>
                        {timerActive ? <Pause /> : <Play />}
                    </button>
                    <button onClick={() => { setTimerActive(false); setTimeLeft(25*60); }} className={`p-3 rounded-full ${theme.inputBg} ${theme.textMuted} hover:${theme.text}`}>
                        <RotateCcw />
                    </button>
                </div>
                {/* Visual Progress Bar Background */}
                <div className="absolute bottom-0 left-0 h-1 bg-amber-500 transition-all duration-1000" style={{ width: `${(timeLeft / 1500) * 100}%` }}></div>
            </div>

            {/* SOUNDSCAPES CARD */}
            <div className={`${theme.cardBg} border ${theme.cardBorder} p-6 rounded-2xl shadow-lg flex flex-col justify-center`}>
                <h3 className={`text-sm font-bold uppercase tracking-widest ${theme.textMuted} mb-4 flex items-center gap-2`}>
                    <Music size={16}/> Focus Audio
                </h3>
                <div className="grid grid-cols-4 gap-2">
                    <button onClick={() => toggleSound('rain')} className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${activeSound === 'rain' ? 'bg-blue-500 text-white shadow-lg scale-105' : `${theme.inputBg} ${theme.textMuted} hover:${theme.text}`}`}>
                        <CloudRain size={20} />
                        <span className="text-[10px] font-bold">Rain</span>
                    </button>
                    <button onClick={() => toggleSound('brown')} className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${activeSound === 'brown' ? 'bg-amber-600 text-white shadow-lg scale-105' : `${theme.inputBg} ${theme.textMuted} hover:${theme.text}`}`}>
                        <Coffee size={20} />
                        <span className="text-[10px] font-bold">Cozy</span>
                    </button>
                    <button onClick={() => toggleSound('forest')} className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${activeSound === 'forest' ? 'bg-emerald-600 text-white shadow-lg scale-105' : `${theme.inputBg} ${theme.textMuted} hover:${theme.text}`}`}>
                        <Trees size={20} />
                        <span className="text-[10px] font-bold">Nature</span>
                    </button>
                    <button onClick={() => toggleSound('lofi')} className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${activeSound === 'lofi' ? 'bg-indigo-500 text-white shadow-lg scale-105' : `${theme.inputBg} ${theme.textMuted} hover:${theme.text}`}`}>
                        <Music size={20} />
                        <span className="text-[10px] font-bold">Lofi</span>
                    </button>
                </div>
                {activeSound && (
                    <button onClick={() => toggleSound(activeSound)} className="mt-4 text-xs text-center text-red-400 hover:text-red-300 flex items-center justify-center gap-1">
                        <VolumeX size={12}/> Stop Audio
                    </button>
                )}
            </div>
        </div>

        {/* TASK SLICER INPUT */}
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

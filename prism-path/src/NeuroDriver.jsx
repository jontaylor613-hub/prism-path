// src/NeuroDriver.jsx
import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, ArrowRight, Volume2, VolumeX, Star, Loader2, Zap, Shuffle, 
  CheckCircle2, Pause, Play, RotateCcw
} from 'lucide-react';
import { getTheme, GeminiService, AudioEngine } from './utils';

const NeuroDriver = ({ onBack, isDark }) => {
    const theme = getTheme(isDark);
    const [mode, setMode] = useState('slicer'); 
    const [parkingLot, setParkingLot] = useState('');
    const [isNoiseOn, setIsNoiseOn] = useState(false);

    // SLICER LOGIC
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [steps, setSteps] = useState([]);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [pickedTaskIndex, setPickedTaskIndex] = useState(null);

    const handleSlice = async () => {
        if (!input.trim()) return;
        setIsProcessing(true);
        setSteps([]); setCompletedSteps([]); setPickedTaskIndex(null);
        const result = await GeminiService.generate({ task: input }, 'slicer');
        // Clean result
        const newSteps = result.split('\n').map(s => s.replace(/^\d+\.\s*|-\s*|^\*\s*/, '').trim()).filter(s => s.length > 0);
        setSteps(newSteps);
        setIsProcessing(false);
    };

    const toggleStep = (idx) => {
        const isComplete = !completedSteps.includes(idx);
        const newCompleted = isComplete ? [...completedSteps, idx] : completedSteps.filter(i => i !== idx);
        setCompletedSteps(newCompleted);
        if (newCompleted.length === steps.length && steps.length > 0) {
            AudioEngine.playVictory();
        }
    };
    
    const pickForMe = () => {
        const available = steps.map((_, i) => i).filter(i => !completedSteps.includes(i));
        if (available.length > 0) setPickedTaskIndex(available[Math.floor(Math.random() * available.length)]);
    };

    const handleSpeak = () => {
        const text = steps.map((s, i) => `Step ${i + 1}. ${s}`).join('. ');
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    };

    const progress = steps.length > 0 ? (completedSteps.length / steps.length) * 100 : 0;
    const isAllDone = steps.length > 0 && completedSteps.length === steps.length;

    // TIMER LOGIC
    const [timerType, setTimerType] = useState('duration');
    const [totalTime, setTotalTime] = useState(15);
    const [timeLeft, setTimeLeft] = useState(15 * 60);
    const [targetTimeStr, setTargetTimeStr] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [viewType, setViewType] = useState('pie');

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        else if (timeLeft <= 0 && isActive) { setIsActive(false); AudioEngine.playChime(); }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const handleSetTimeUntil = (e) => {
        const val = e.target.value;
        setTargetTimeStr(val);
        if(!val) return;
        const now = new Date();
        const [hours, minutes] = val.split(':').map(Number);
        let target = new Date();
        target.setHours(hours, minutes, 0, 0);
        if (target < now) target.setDate(target.getDate() + 1);
        const diffMins = Math.floor((target - now) / 1000 / 60);
        if (diffMins > 0) { setTotalTime(diffMins); setTimeLeft(diffMins * 60); setIsActive(false); }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const percentage = Math.max(0, Math.min(1, timeLeft / (totalTime * 60)));
    const getColor = () => percentage > 0.5 ? "#22d3ee" : percentage > 0.2 ? "#c084fc" : "#e879f9";

    const toggleNoise = () => { setIsNoiseOn(!isNoiseOn); AudioEngine.toggleBrownNoise(!isNoiseOn); };

    return (
        <div className={`min-h-screen p-4 pt-24 font-sans ${theme.bg} ${theme.text} transition-colors duration-500`}>
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* PARKING LOT */}
                <div className="lg:col-span-1 hidden lg:flex flex-col gap-4">
                    <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-4 h-full flex flex-col`}>
                          <div className={`flex items-center gap-2 mb-3 ${theme.secondaryText} font-bold uppercase text-xs tracking-wider`}>
                             <MessageSquare size={14}/> Brain Dump
                          </div>
                          <textarea 
                            className={`flex-1 ${theme.inputBg} border ${theme.inputBorder} rounded-xl p-3 text-sm resize-none outline-none focus:border-fuchsia-500/50 transition-colors ${theme.text}`}
                            placeholder="Distracting thought? Park it here."
                            value={parkingLot}
                            onChange={(e) => setParkingLot(e.target.value)}
                          />
                    </div>
                </div>

                {/* MAIN APP */}
                <div className="lg:col-span-3">
                    <div className="text-center mb-6 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button onClick={onBack} className={`text-xs font-bold uppercase tracking-widest hover:opacity-100 transition-opacity flex items-center gap-1 opacity-70 ${theme.text}`}><ArrowRight className="rotate-180" size={14}/> Exit</button>
                        </div>
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-yellow-400">NEURO DRIVER</h1>
                        <button onClick={toggleNoise} className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${isNoiseOn ? 'text-cyan-400 animate-pulse' : `opacity-70 ${theme.text}`}`}>
                            {isNoiseOn ? <Volume2 size={16}/> : <VolumeX size={16}/>}
                            {isNoiseOn ? "Focus On" : "Focus Off"}
                        </button>
                    </div>

                    <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-3xl p-6 shadow-2xl relative overflow-hidden min-h-[500px]`}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                        
                        <div className={`flex gap-4 mb-8 border-b ${theme.cardBorder} pb-2`}>
                            <button onClick={() => setMode('slicer')} className={`flex-1 pb-2 text-center font-bold text-sm transition-all ${mode === 'slicer' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'opacity-50 hover:opacity-100'}`}>Task Slicer</button>
                            <button onClick={() => setMode('timer')} className={`flex-1 pb-2 text-center font-bold text-sm transition-all ${mode === 'timer' ? 'text-fuchsia-400 border-b-2 border-fuchsia-400' : 'opacity-50 hover:opacity-100'}`}>Visual Timer</button>
                        </div>

                        {mode === 'slicer' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 relative">
                                {isAllDone && (
                                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm rounded-2xl animate-in zoom-in duration-500">
                                        <Star size={120} className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_50px_rgba(250,204,21,0.6)] animate-bounce" />
                                        <h3 className="text-2xl font-black text-white mt-6 uppercase tracking-widest">Great Job!</h3>
                                        <p className="text-yellow-200/80 mt-2 font-medium">We're Proud of You!</p>
                                        <button onClick={() => { setSteps([]); setCompletedSteps([]); setInput(''); }} className="mt-8 px-6 py-2 bg-slate-800 border border-slate-600 rounded-full hover:bg-slate-700 transition-colors text-sm text-slate-200">Start New Task</button>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <input 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSlice()}
                                        placeholder="What would you like to break down? (e.g. Clean Room, Write Essay)"
                                        className={`flex-1 ${theme.inputBg} border ${theme.inputBorder} rounded-xl p-4 ${theme.text} outline-none focus:border-cyan-400 transition-colors`}
                                    />
                                    <button onClick={handleSlice} disabled={isProcessing} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white px-6 rounded-xl font-bold shadow-lg hover:brightness-110 transition-all disabled:opacity-50">
                                        {isProcessing ? <Loader2 className="animate-spin"/> : <Zap/>}
                                    </button>
                                </div>

                                {steps.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-4 items-center">
                                                <div className="text-xs font-bold uppercase tracking-widest text-cyan-400">Progress: {Math.round(progress)}%</div>
                                                <button onClick={pickForMe} className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border transition-colors ${theme.inputBg} ${theme.inputBorder} ${theme.text} hover:border-fuchsia-400`}>
                                                    <Shuffle size={12}/> Pick For Me
                                                </button>
                                                <button onClick={handleSpeak} className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border transition-colors ${theme.inputBg} ${theme.inputBorder} ${theme.text} hover:border-cyan-400`}>
                                                    <Volume2 size={12}/> Read Tasks
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="h-3 bg-slate-800/50 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                        </div>

                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {steps.map((step, idx) => {
                                                const isPicked = pickedTaskIndex === idx;
                                                const isHidden = pickedTaskIndex !== null && !isPicked;
                                                
                                                if (isHidden && !completedSteps.includes(idx)) return null;

                                                return (
                                                    <div key={idx} onClick={() => toggleStep(idx)} className={`p-4 rounded-xl border-2 flex items-center gap-4 cursor-pointer transition-all ${isPicked ? 'border-fuchsia-500 bg-fuchsia-500/10 scale-105 shadow-xl' : completedSteps.includes(idx) ? 'border-emerald-500/30 bg-emerald-500/10 opacity-60' : `${theme.inputBorder} ${theme.inputBg} hover:border-cyan-500/30`}`}>
                                                        <div className={`w-8 h-8 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors aspect-square ${completedSteps.includes(idx) ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-400'}`}>
                                                            {completedSteps.includes(idx) && <CheckCircle2 size={16} />}
                                                        </div>
                                                        <span className={`font-medium ${completedSteps.includes(idx) ? 'text-emerald-500 line-through' : theme.text}`}>{step}</span>
                                                        {isPicked && <span className="ml-auto text-[10px] bg-fuchsia-500 text-white px-2 py-1 rounded-full font-bold uppercase">Focus</span>}
                                                    </div>
                                                );
                                            })}
                                            {pickedTaskIndex !== null && (
                                                <button onClick={() => setPickedTaskIndex(null)} className="w-full py-2 text-xs text-slate-500 hover:text-cyan-500 border border-dashed border-slate-500/30 rounded-lg">Show All Tasks</button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {mode === 'timer' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 flex flex-col items-center">
                                {viewType === 'pie' ? (
                                    <div className="relative">
                                        <svg width="240" height="240" className="transform -rotate-90">
                                            <circle cx="120" cy="120" r="100" stroke={isDark ? "#1e293b" : "#e2e8f0"} strokeWidth="12" fill="none" />
                                            <circle cx="120" cy="120" r="100" stroke={getColor()} strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray={2 * Math.PI * 100} strokeDashoffset={2 * Math.PI * 100 * (1 - percentage)} className="transition-all duration-1000 ease-linear"/>
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className={`text-5xl font-mono font-bold tracking-tighter ${theme.text}`}>{formatTime(timeLeft)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`w-full h-16 ${theme.inputBg} rounded-xl border ${theme.inputBorder} relative overflow-hidden`}>
                                        <div className="h-full transition-all duration-1000 ease-linear" style={{ width: `${percentage * 100}%`, backgroundColor: getColor() }}></div>
                                        <div className={`absolute inset-0 flex items-center justify-center font-mono text-2xl font-bold drop-shadow-md ${isDark ? 'text-white' : 'text-slate-800'}`}>{formatTime(timeLeft)}</div>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button onClick={() => setIsActive(!isActive)} className={`p-4 rounded-full border-2 transition-all ${isActive ? 'border-yellow-500 text-yellow-500' : 'border-emerald-500 text-emerald-500 hover:bg-emerald-500/10'}`}>
                                        {isActive ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
                                    </button>
                                    <button onClick={() => { setIsActive(false); setTimeLeft(totalTime * 60); }} className={`p-4 rounded-full border-2 ${theme.inputBorder} text-slate-400 hover:text-cyan-500 transition-all`}>
                                        <RotateCcw />
                                    </button>
                                </div>

                                <div className={`w-full ${theme.inputBg} p-4 rounded-xl border ${theme.inputBorder}`}>
                                    <div className="flex gap-4 mb-4 text-xs font-bold uppercase text-slate-500 justify-center">
                                        <button onClick={() => setTimerType('duration')} className={`px-4 py-1 rounded-full ${timerType === 'duration' ? 'bg-cyan-500 text-white' : 'hover:opacity-70'}`}>Duration</button>
                                        <button onClick={() => setTimerType('until')} className={`px-4 py-1 rounded-full ${timerType === 'until' ? 'bg-fuchsia-500 text-white' : 'hover:opacity-70'}`}>Time Until</button>
                                    </div>

                                    {timerType === 'duration' ? (
                                        <div className="flex flex-col items-center gap-4">
                                             <div className="flex items-center gap-2 w-full max-w-xs">
                                                 <input type="number" value={totalTime} onChange={(e) => { const val = Number(e.target.value); setTotalTime(val); setTimeLeft(val * 60); setIsActive(false); }} className={`w-20 p-2 rounded-lg border ${theme.inputBorder} ${theme.inputBg} ${theme.text} text-center font-bold outline-none focus:border-cyan-500`}/>
                                                 <span className={theme.textMuted}>min</span>
                                                 <button onClick={() => { setTotalTime(t=>t+5); setTimeLeft((totalTime+5)*60); }} className="px-3 py-2 bg-slate-800 text-white text-xs rounded-lg hover:bg-slate-700 ml-auto">+5 Min</button>
                                             </div>
                                             <input type="range" min="1" max="180" value={totalTime} onChange={(e) => { const val = Number(e.target.value); setTotalTime(val); setTimeLeft(val * 60); setIsActive(false); }} className="w-full accent-cyan-500 opacity-50 hover:opacity-100 transition-opacity" />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <label className="text-xs text-slate-500 mb-2">Count down until:</label>
                                            <input type="time" value={targetTimeStr} onChange={handleSetTimeUntil} className={`${theme.inputBg} border ${theme.inputBorder} rounded p-2 ${theme.text} text-center outline-none focus:border-fuchsia-500`}/>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex gap-2">
                                    <button onClick={() => setViewType('pie')} className={`px-4 py-1 rounded text-xs font-bold uppercase ${viewType === 'pie' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}>Pie</button>
                                    <button onClick={() => setViewType('bar')} className={`px-4 py-1 rounded text-xs font-bold uppercase ${viewType === 'bar' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}>Bar</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NeuroDriver;

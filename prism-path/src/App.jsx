import ResumeBuilder from './ResumeBuilder';
import SocialMap from './SocialMap';
import EmotionalCockpit from './EmotionalCockpit';
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, Brain, Heart, Calendar, ExternalLink, Menu, X, Zap, 
  ShieldCheck, Clock, MessageSquare, Loader2, Info, CheckCircle2, 
  Eye, EyeOff, MapPin, FileText, ChevronDown, Activity, GraduationCap,
  LineChart, Target, BookOpen, Plus, Save, Trash2, CheckCircle,
  ClipboardList, ArrowRight, LogOut, Calculator, Search, User, 
  Wand2, Copy, Edit2, FileDown, AlertTriangle, Mail, UploadCloud, 
  BarChart3, ShieldAlert, Star, Smile, Settings, Users, ToggleLeft, 
  ToggleRight, FileCheck, Minus, Lock, Printer, SmilePlus, Play, Pause, 
  RotateCcw, Timer, Volume2, VolumeX, Shuffle, stickyNote
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

// --- AUDIO UTILS (Brown Noise & Chime) ---
const AudioEngine = {
    ctx: null,
    noiseNode: null,
    gainNode: null,
    
    init: () => {
        if (!AudioEngine.ctx) {
            AudioEngine.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (AudioEngine.ctx.state === 'suspended') {
            AudioEngine.ctx.resume();
        }
    },

    toggleBrownNoise: (play) => {
        AudioEngine.init();
        if (play) {
            if (AudioEngine.noiseNode) return; 
            const bufferSize = AudioEngine.ctx.sampleRate * 2; // 2 seconds buffer
            const buffer = AudioEngine.ctx.createBuffer(1, bufferSize, AudioEngine.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5; // Gain compensation
            }
            
            AudioEngine.noiseNode = AudioEngine.ctx.createBufferSource();
            AudioEngine.noiseNode.buffer = buffer;
            AudioEngine.noiseNode.loop = true;
            AudioEngine.gainNode = AudioEngine.ctx.createGain();
            AudioEngine.gainNode.gain.value = 0.15; // Low volume
            
            AudioEngine.noiseNode.connect(AudioEngine.gainNode);
            AudioEngine.gainNode.connect(AudioEngine.ctx.destination);
            AudioEngine.noiseNode.start(0);
        } else {
            if (AudioEngine.noiseNode) {
                AudioEngine.noiseNode.stop();
                AudioEngine.noiseNode.disconnect();
                AudioEngine.noiseNode = null;
            }
        }
    },

    playChime: () => {
        AudioEngine.init();
        const osc = AudioEngine.ctx.createOscillator();
        const gain = AudioEngine.ctx.createGain();
        osc.connect(gain);
        gain.connect(AudioEngine.ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, AudioEngine.ctx.currentTime); // A4
        osc.frequency.exponentialRampToValueAtTime(880, AudioEngine.ctx.currentTime + 0.1); // Octave jump
        
        gain.gain.setValueAtTime(0.1, AudioEngine.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, AudioEngine.ctx.currentTime + 1.5);
        
        osc.start();
        osc.stop(AudioEngine.ctx.currentTime + 1.5);
    }
};

// --- NEURO DRIVER COMPONENT ---

const NeuroDriver = ({ onBack }) => {
    const [mode, setMode] = useState('slicer'); // 'slicer' or 'timer'
    const [parkingLot, setParkingLot] = useState('');
    const [isNoiseOn, setIsNoiseOn] = useState(false);

    // --- TASK SLICER LOGIC ---
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [steps, setSteps] = useState([]);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [pickedTaskIndex, setPickedTaskIndex] = useState(null);

    const handleSlice = async () => {
        if (!input.trim()) return;
        setIsProcessing(true);
        setSteps([]); 
        setCompletedSteps([]);
        setPickedTaskIndex(null);

        // AI Generation with Safeguards
        const result = await GeminiService.generate({ task: input }, 'slicer');
        
        // Parse list from AI response
        const newSteps = result.split('\n')
            .map(s => s.replace(/^\d+\.\s*|-\s*/, '').trim()) // Remove numbers/bullets
            .filter(s => s.length > 0);

        setSteps(newSteps);
        setIsProcessing(false);
    };

    const toggleStep = (idx) => {
        setCompletedSteps(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
    };

    const pickForMe = () => {
        const available = steps.map((_, i) => i).filter(i => !completedSteps.includes(i));
        if (available.length === 0) return;
        const random = available[Math.floor(Math.random() * available.length)];
        setPickedTaskIndex(random);
    };

    const progress = steps.length > 0 ? (completedSteps.length / steps.length) * 100 : 0;
    const isAllDone = steps.length > 0 && completedSteps.length === steps.length;

    // --- VISUAL TIMER LOGIC ---
    const [timerType, setTimerType] = useState('duration');
    const [totalTime, setTotalTime] = useState(15);
    const [timeLeft, setTimeLeft] = useState(15 * 60);
    const [targetTimeStr, setTargetTimeStr] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [viewType, setViewType] = useState('pie');

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft <= 0 && isActive) {
            setIsActive(false);
            AudioEngine.playChime(); // Gentle audio cue
        }
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
        
        if (target < now) target.setDate(target.getDate() + 1); // Assume tomorrow if time passed
        
        const diffMins = Math.floor((target - now) / 1000 / 60);
        if (diffMins > 0) {
            setTotalTime(diffMins);
            setTimeLeft(diffMins * 60);
            setIsActive(false); // Let user start it manually or auto-start
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const percentage = Math.max(0, Math.min(1, timeLeft / (totalTime * 60)));
    const getColor = () => percentage > 0.5 ? "#22d3ee" : percentage > 0.2 ? "#c084fc" : "#e879f9";

    const toggleNoise = () => {
        const newState = !isNoiseOn;
        setIsNoiseOn(newState);
        AudioEngine.toggleBrownNoise(newState);
    };

    return (
        <div className="min-h-screen bg-slate-950 p-4 pt-24 font-sans text-slate-200">
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* LEFT: PARKING LOT */}
                <div className="lg:col-span-1 hidden lg:flex flex-col gap-4">
                    <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-4 h-full flex flex-col">
                         <div className="flex items-center gap-2 mb-3 text-fuchsia-400 font-bold uppercase text-xs tracking-wider">
                             <MessageSquare size={14}/> Brain Dump
                         </div>
                         <textarea 
                            className="flex-1 bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 resize-none outline-none focus:border-fuchsia-500/50 transition-colors"
                            placeholder="Distracting thought? Park it here."
                            value={parkingLot}
                            onChange={(e) => setParkingLot(e.target.value)}
                         />
                    </div>
                </div>

                {/* CENTER: MAIN APP */}
                <div className="lg:col-span-3">
                    <div className="text-center mb-6 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <button onClick={onBack} className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors flex items-center gap-1"><ArrowRight className="rotate-180" size={14}/> Exit</button>
                        </div>
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-yellow-400">NEURO DRIVER</h1>
                        <button onClick={toggleNoise} className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${isNoiseOn ? 'text-cyan-400 animate-pulse' : 'text-slate-500 hover:text-white'}`}>
                            {isNoiseOn ? <Volume2 size={16}/> : <VolumeX size={16}/>}
                            {isNoiseOn ? "Focus On" : "Focus Off"}
                        </button>
                    </div>

                    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden min-h-[500px]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                        
                        {/* Tabs */}
                        <div className="flex gap-4 mb-8 border-b border-slate-700/50 pb-2">
                            <button onClick={() => setMode('slicer')} className={`flex-1 pb-2 text-center font-bold text-sm transition-all ${mode === 'slicer' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-white'}`}>Task Slicer</button>
                            <button onClick={() => setMode('timer')} className={`flex-1 pb-2 text-center font-bold text-sm transition-all ${mode === 'timer' ? 'text-fuchsia-400 border-b-2 border-fuchsia-400' : 'text-slate-500 hover:text-white'}`}>Visual Timer</button>
                        </div>

                        {/* CONTENT: SLICER */}
                        {mode === 'slicer' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 relative">
                                {/* GOLD STAR REWARD OVERLAY */}
                                {isAllDone && (
                                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-sm rounded-2xl animate-in zoom-in duration-500">
                                        <Star size={120} className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_50px_rgba(250,204,21,0.6)] animate-bounce" />
                                        <h3 className="text-2xl font-black text-white mt-6 uppercase tracking-widest">Task Complete!</h3>
                                        <p className="text-yellow-200/80 mt-2 font-medium">Dopamine Hit Delivered.</p>
                                        <button onClick={() => { setSteps([]); setCompletedSteps([]); setInput(''); }} className="mt-8 px-6 py-2 bg-slate-800 border border-slate-600 rounded-full hover:bg-slate-700 transition-colors text-sm text-slate-200">Start New Task</button>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <input 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSlice()}
                                        placeholder="What is the big scary task? (e.g. Write Essay)"
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-cyan-400 transition-colors"
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
                                                <button onClick={pickForMe} className="flex items-center gap-1 text-xs bg-slate-800 px-3 py-1 rounded-full hover:bg-fuchsia-900/50 hover:text-fuchsia-300 transition-colors border border-slate-700">
                                                    <Shuffle size={12}/> Pick For Me
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                        </div>

                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                            {steps.map((step, idx) => {
                                                const isPicked = pickedTaskIndex === idx;
                                                const isHidden = pickedTaskIndex !== null && !isPicked;
                                                
                                                if (isHidden && !completedSteps.includes(idx)) return null; // Hide others in focus mode

                                                return (
                                                    <div key={idx} onClick={() => toggleStep(idx)} className={`p-4 rounded-xl border-2 flex items-center gap-4 cursor-pointer transition-all ${isPicked ? 'border-fuchsia-500 bg-fuchsia-500/10 scale-105 shadow-xl' : completedSteps.includes(idx) ? 'border-emerald-500/30 bg-emerald-500/10 opacity-60' : 'border-slate-800 bg-slate-800/30 hover:border-cyan-500/30'}`}>
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${completedSteps.includes(idx) ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-600'}`}>
                                                            {completedSteps.includes(idx) && <CheckCircle2 size={14} />}
                                                        </div>
                                                        <span className={`font-medium ${completedSteps.includes(idx) ? 'text-emerald-400 line-through' : 'text-slate-200'}`}>{step}</span>
                                                        {isPicked && <span className="ml-auto text-[10px] bg-fuchsia-500 text-white px-2 py-1 rounded-full font-bold uppercase">Focus</span>}
                                                    </div>
                                                );
                                            })}
                                            {pickedTaskIndex !== null && (
                                                <button onClick={() => setPickedTaskIndex(null)} className="w-full py-2 text-xs text-slate-500 hover:text-white border border-dashed border-slate-700 rounded-lg">Show All Tasks</button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CONTENT: TIMER */}
                        {mode === 'timer' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 flex flex-col items-center">
                                {viewType === 'pie' ? (
                                    <div className="relative">
                                        <svg width="240" height="240" className="transform -rotate-90">
                                            <circle cx="120" cy="120" r="100" stroke="#1e293b" strokeWidth="12" fill="none" />
                                            <circle cx="120" cy="120" r="100" stroke={getColor()} strokeWidth="12" fill="none" strokeLinecap="round" 
                                                strokeDasharray={2 * Math.PI * 100} 
                                                strokeDashoffset={2 * Math.PI * 100 * (1 - percentage)} 
                                                className="transition-all duration-1000 ease-linear"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-5xl font-mono font-bold text-white tracking-tighter">{formatTime(timeLeft)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-16 bg-slate-950 rounded-xl border border-slate-700 relative overflow-hidden">
                                        <div className="h-full transition-all duration-1000 ease-linear" style={{ width: `${percentage * 100}%`, backgroundColor: getColor() }}></div>
                                        <div className="absolute inset-0 flex items-center justify-center font-mono text-2xl font-bold text-white drop-shadow-md">{formatTime(timeLeft)}</div>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button onClick={() => setIsActive(!isActive)} className={`p-4 rounded-full border-2 transition-all ${isActive ? 'border-yellow-500 text-yellow-500' : 'border-emerald-500 text-emerald-500 hover:bg-emerald-500/10'}`}>
                                        {isActive ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
                                    </button>
                                    <button onClick={() => { setIsActive(false); setTimeLeft(totalTime * 60); }} className="p-4 rounded-full border-2 border-slate-600 text-slate-400 hover:text-white hover:border-white transition-all">
                                        <RotateCcw />
                                    </button>
                                </div>

                                <div className="w-full bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                                    <div className="flex gap-4 mb-4 text-xs font-bold uppercase text-slate-500 justify-center">
                                        <button onClick={() => setTimerType('duration')} className={`px-4 py-1 rounded-full ${timerType === 'duration' ? 'bg-cyan-500 text-slate-900' : 'hover:text-white'}`}>Duration</button>
                                        <button onClick={() => setTimerType('until')} className={`px-4 py-1 rounded-full ${timerType === 'until' ? 'bg-fuchsia-500 text-white' : 'hover:text-white'}`}>Time Until</button>
                                    </div>

                                    {timerType === 'duration' ? (
                                        <>
                                            <input 
                                                type="range" min="1" max="60" value={totalTime} 
                                                onChange={(e) => { 
                                                    const val = Number(e.target.value); 
                                                    setTotalTime(val); 
                                                    setTimeLeft(val * 60); 
                                                    setIsActive(false); 
                                                }} 
                                                className="w-full accent-cyan-500 mb-2"
                                            />
                                            <div className="text-center text-cyan-400 font-bold">{totalTime} min</div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <label className="text-xs text-slate-500 mb-2">Count down until:</label>
                                            <input 
                                                type="time" 
                                                value={targetTimeStr} 
                                                onChange={handleSetTimeUntil}
                                                className="bg-slate-900 border border-slate-700 rounded p-2 text-white text-center outline-none focus:border-fuchsia-500"
                                            />
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

// --- CONFIGURATION & SERVICES ---

// 1. API Keys
const getGoogleApiKey = () => {
  try {
    if (import.meta.env && import.meta.env.VITE_GOOGLE_API_KEY) return import.meta.env.VITE_GOOGLE_API_KEY;
    if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_GOOGLE_API_KEY) return process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  } catch (e) {}
  return ""; 
};

// 2. Firebase Config
const getFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    try { return JSON.parse(__firebase_config); } catch(e) {}
  }
  try {
    if (import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY) {
      return {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      };
    }
  } catch (e) {}
  return null;
};

const GOOGLE_API_KEY = getGoogleApiKey();
const firebaseConfig = getFirebaseConfig();

let app, auth, db;
if (firebaseConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) { console.error("Firebase Init Error", err); }
}
const appId = typeof __app_id !== 'undefined' ? __app_id : 'prism-path-default';

// --- DASHBOARD UTILITIES ---

const formatAIResponse = (text) => {
  if (!text) return "";
  let clean = text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/#/g, "");
  clean = clean.replace(/\.([A-Z])/g, ". $1");
  return clean.trim();
};

const ComplianceService = {
  getStatus: (dateString) => {
    if (!dateString) return { color: 'bg-slate-600', text: 'No Date', icon: Clock };
    const today = new Date();
    const target = new Date(dateString); 
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { color: 'bg-red-500 animate-pulse', text: 'OVERDUE', icon: AlertTriangle };
    if (diffDays <= 30) return { color: 'bg-red-500', text: '< 1 Month', icon: Clock };
    if (diffDays <= 90) return { color: 'bg-orange-500', text: '< 3 Months', icon: Clock };
    if (diffDays <= 180) return { color: 'bg-yellow-500', text: '< 6 Months', icon: Calendar };
    return { color: 'bg-emerald-500', text: 'Compliant', icon: CheckCircle };
  }
};

const GeminiService = {
  generate: async (data, type) => {
    if (!GOOGLE_API_KEY) {
      console.warn("Missing API Key");
      return "Error: API Key not found. Please check VITE_GOOGLE_API_KEY.";
    }

    let systemInstruction = "";
    let userPrompt = "";

    if (type === 'behavior') {
        systemInstruction = "You are an expert Board Certified Behavior Analyst (BCBA). Analyze the incident log. Suggest 3 specific, low-prep interventions. Output clean text.";
        userPrompt = `Analyze logs: ${JSON.stringify(data)}. Target: ${data.targetBehavior}.`;
    } 
    else if (type === 'slicer') {
        systemInstruction = "You are an Executive Function Coach for students with ADHD/Autism. Break down the task into 5-7 clear, micro-steps. Ensure steps are safe, appropriate, and non-violent. Return ONLY the steps as a numbered list.";
        userPrompt = `Task to slice: ${data.task}`;
    }
    else if (type === 'email') {
        systemInstruction = "You are a professional Special Education Teacher. Write a polite, clear email to a parent. No markdown.";
        if (data.feedbackAreas) {
            userPrompt = `Write an email for student ${data.student} preparing for an IEP meeting. Ask for feedback on: ${data.feedbackAreas.join(', ')}.`;
        } else {
            userPrompt = `Write a positive update for student ${data.student} regarding ${data.topic}.`;
        }
    } 
    else if (type === 'goal') {
        systemInstruction = "Write a SMART IEP goal. Specific, Measurable, Achievable, Relevant, Time-bound. No markdown.";
        userPrompt = `Student: ${data.student}, Grade: ${data.grade}. Condition: ${data.condition}. Behavior: ${data.behavior}.`;
    } 
    else if (type === 'plaafp') {
        systemInstruction = "Write a PLAAFP statement connecting strengths, needs, and impact. No markdown.";
        userPrompt = `Student: ${data.student}. Strengths: ${data.strengths}. Needs: ${data.needs}. Impact: ${data.impact}.`;
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemInstruction + "\n\n" + userPrompt }] }] })
      });
      const result = await response.json();
      return formatAIResponse(result.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (error) { return "AI Service Error"; }
  }
};

// --- DASHBOARD COMPONENTS (Scoped) ---

const DashButton = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled = false }) => {
  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(217,70,239,0.5)] border border-white/10",
    secondary: "bg-slate-800 text-cyan-400 border border-slate-700 hover:bg-slate-700 hover:text-white hover:border-cyan-400/50",
    danger: "bg-red-900/20 text-red-400 border border-red-500/30 hover:bg-red-900/40",
    ghost: "text-slate-400 hover:text-white hover:bg-slate-800",
    copy: "w-full py-3 bg-emerald-900/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/40 font-mono tracking-widest uppercase shadow-lg"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center px-4 py-2 rounded-full font-bold transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} className="mr-2" />}
      {children}
    </button>
  );
};

const DashCard = ({ children, className = "", glow = false }) => (
  <div className={`relative rounded-2xl overflow-hidden bg-slate-900/60 border border-slate-700/50 ${className} ${glow ? 'shadow-[0_0_30px_rgba(6,182,212,0.1)]' : 'shadow-xl'}`}>
    {glow && <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>}
    <div className="relative z-10">{children}</div>
  </div>
);

const DashBadge = ({ children, color = "cyan" }) => {
  const styles = {
    cyan: "bg-cyan-900/20 text-cyan-400 border-cyan-500/30",
    fuchsia: "bg-fuchsia-900/20 text-fuchsia-400 border-fuchsia-500/30",
    emerald: "bg-emerald-900/20 text-emerald-400 border-emerald-500/30",
    amber: "bg-amber-900/20 text-amber-400 border-amber-500/30"
  };
  return <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest ${styles[color] || styles.cyan}`}>{children}</span>;
};

const CopyBlock = ({ content, label = "Copy for Documentation" }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="mt-4 pt-4 border-t border-slate-800 animate-in fade-in">
      <DashButton onClick={handleCopy} variant="copy" icon={copied ? CheckCircle : Copy}>
        {copied ? "Copied!" : label}
      </DashButton>
    </div>
  );
};

const SimpleLineChart = ({ data, target }) => {
  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-500 border border-slate-700 rounded-xl bg-slate-900/50">No Data Points</div>;
  const width = 600, height = 300, padding = 40, maxScore = 100;
  const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  const getX = (i) => padding + (i * ((width - padding * 2) / (sorted.length - 1 || 1)));
  const getY = (v) => height - (padding + (v / maxScore) * (height - padding * 2));
  const points = sorted.map((d, i) => `${getX(i)},${getY(d.score)}`).join(' ');
  
  return (
    <div className="w-full overflow-x-auto bg-slate-900 rounded-xl border border-slate-800 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {[0, 50, 100].map(v => (
          <g key={v}><line x1={padding} y1={getY(v)} x2={width-padding} y2={getY(v)} stroke="#334155" strokeWidth="1"/><text x={padding-10} y={getY(v)+4} fontSize="10" fill="#64748b" textAnchor="end">{v}%</text></g>
        ))}
        {target && <line x1={padding} y1={getY(target)} x2={width-padding} y2={getY(target)} stroke="#10b981" strokeWidth="2" strokeDasharray="5,5"/>}
        <polyline points={points} fill="none" stroke="#22d3ee" strokeWidth="3"/>
        {sorted.map((d, i) => <circle key={i} cx={getX(i)} cy={getY(d.score)} r="5" fill="#0f172a" stroke="#22d3ee" strokeWidth="2"/>)}
      </svg>
    </div>
  );
};

// --- TEACHER DASHBOARD LOGIC ---

const SAMPLE_STUDENTS = [
  { id: 1, name: "Alex M.", grade: "3rd", need: "Reading Decoding", nextIep: "2024-01-15", nextEval: "2025-05-20", summary: "Sample Data" },
  { id: 2, name: "Jordan K.", grade: "5th", need: "Math Calculation", nextIep: "2025-11-20", nextEval: "2026-09-01", summary: "Sample Data" },
  { id: 3, name: "Taylor S.", grade: "2nd", need: "Emotional Reg.", nextIep: "2024-12-01", nextEval: "2024-12-15", summary: "Sample Data" }
];

const TeacherDashboard = ({ onBack }) => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [students, setStudents] = useState(SAMPLE_STUDENTS);
  const [currentStudentId, setCurrentStudentId] = useState(1);
  const [showSamples, setShowSamples] = useState(true);
  
  // Auth
  useEffect(() => {
    if (auth) {
      return onAuthStateChanged(auth, (u) => {
        if (u) setUser({ name: "Educator", uid: u.uid, school: "My School" });
        else setUser(null);
      });
    }
  }, []);

  // Sync Students
  useEffect(() => {
    if (user && db) {
      try {
        const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'students'));
        return onSnapshot(q, (snap) => {
          const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setStudents(prev => showSamples ? [...SAMPLE_STUDENTS, ...fetched] : fetched);
        });
      } catch(e){}
    }
  }, [user, showSamples]);

  const displayedStudents = showSamples ? students : students.filter(s => s.id > 3 || typeof s.id === 'string');
  const activeStudent = displayedStudents.find(s => s.id === currentStudentId) || displayedStudents[0];

  // Logic States
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', grade: '', need: '', nextIep: '', nextEval: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Features
  const [emailTopic, setEmailTopic] = useState('Progress Update');
  const [feedbackAreas, setFeedbackAreas] = useState({});
  const [generatedEmail, setGeneratedEmail] = useState('');
  
  const [plaafpInputs, setPlaafpInputs] = useState({ strengths: '', needs: '', impact: '' });
  const [plaafpResult, setPlaafpResult] = useState('');

  const [goalInputs, setGoalInputs] = useState({ condition: '', behavior: '' });
  const [goalText, setGoalText] = useState('');
  const [firestoreGoals, setFirestoreGoals] = useState([]);
  const [localGoals, setLocalGoals] = useState([]); // Local state for sample/offline goals
  const [activeGoalId, setActiveGoalId] = useState(null);
  const [goalConfig, setGoalConfig] = useState({ frequency: 'Weekly', target: 80 });
  
  // Derived Goals: Merge Firestore + Local
  const allGoals = [...firestoreGoals, ...localGoals].filter(g => g.studentId === activeStudent?.id);
  const activeGoal = allGoals.find(g => g.id === activeGoalId) || allGoals[0];

  const [newMeasure, setNewMeasure] = useState({ date: '', score: '' });

  const [schedule, setSchedule] = useState(['Morning Meeting', 'ELA Block', 'Lunch']);
  const [trackingGoals, setTrackingGoals] = useState(['Safe Body', 'Kind Words']);
  const [trackerData, setTrackerData] = useState({});
  const [rewardThreshold, setRewardThreshold] = useState(80);
  const [isEditingTracker, setIsEditingTracker] = useState(false);
  const [behaviorLog, setBehaviorLog] = useState([]);
  const [newIncident, setNewIncident] = useState({ date: '', antecedent: '', behavior: '', consequence: '' });
  const [bipAnalysis, setBipAnalysis] = useState('');

  // Sync Goals - FIXED LOGIC HERE
  useEffect(() => {
    // If real student with DB access, fetch from Firestore
    const isRealStudent = activeStudent && (typeof activeStudent.id === 'string' && activeStudent.id.length > 5);
    
    if (user && db && isRealStudent) {
      const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'goals'), where('studentId', '==', activeStudent.id));
      return onSnapshot(q, (snap) => {
        const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setFirestoreGoals(fetched);
        if (fetched.length > 0 && !activeGoalId) setActiveGoalId(fetched[0].id);
      });
    } else {
        setFirestoreGoals([]); // Clear DB goals if switching to sample student
    }
  }, [user, activeStudent]);

  // Actions
  const handleLogin = async () => {
    if (auth) await signInAnonymously(auth);
    else setUser({ name: "Demo User", uid: "demo" });
  };

  const handleAddStudent = async () => {
    if (!newStudent.name) return;
    if (db && user) {
      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'students'), {
        ...newStudent, createdAt: serverTimestamp(), summary: "New profile."
      });
    } else {
      const id = Date.now();
      setStudents([...students, { ...newStudent, id, summary: "New profile." }]);
      setCurrentStudentId(id);
    }
    setIsAddingStudent(false);
    setNewStudent({ name: '', grade: '', need: '', nextIep: '', nextEval: '' });
  };

  const handleGenerate = async (type) => {
    setIsGenerating(true);
    let prompt;
    if(type === 'email') {
        prompt = { student: activeStudent?.name, topic: emailTopic };
        if(emailTopic === 'Solicit Feedback') prompt.feedbackAreas = Object.keys(feedbackAreas).filter(k => feedbackAreas[k]);
        setGeneratedEmail(await GeminiService.generate(prompt, 'email'));
    }
    if(type === 'plaafp') {
        setPlaafpResult(await GeminiService.generate({...plaafpInputs, student: activeStudent?.name}, 'plaafp'));
    }
    if(type === 'goal') {
        setGoalText(await GeminiService.generate({student: activeStudent?.name, grade: activeStudent?.grade, ...goalInputs}, 'goal'));
    }
    if(type === 'behavior') {
        setBipAnalysis(await GeminiService.generate({logs: behaviorLog, targetBehavior: behaviorLog[0]?.behavior}, 'behavior'));
    }
    setIsGenerating(false);
  };

  const handleLockGoal = async () => {
    const newGoalObj = {
        studentId: activeStudent.id, 
        text: goalText, 
        target: goalConfig.target, 
        frequency: goalConfig.frequency, 
        data: [], 
        createdAt: new Date().toISOString()
    };

    const isRealStudent = activeStudent && (typeof activeStudent.id === 'string' && activeStudent.id.length > 5);

    if(db && user && isRealStudent) {
      try {
          await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'goals'), {
            ...newGoalObj, createdAt: serverTimestamp()
          });
          alert("Goal Locked to Cloud!");
      } catch (e) {
          // Fallback to local if write fails
          setLocalGoals(prev => [...prev, { ...newGoalObj, id: `local-${Date.now()}` }]);
          alert("Goal Locked (Session Only - DB Error)!");
      }
    } else {
        // Sample student or no DB connection -> Local State
        setLocalGoals(prev => [...prev, { ...newGoalObj, id: `local-${Date.now()}` }]);
        alert("Goal Locked (Session Only)!");
    }
    setActiveTab('monitor');
  };

  const handleAddDataPoint = async () => {
    if (!activeGoal || !newMeasure.score) return;
    
    const newData = [...(activeGoal.data || []), { date: newMeasure.date || new Date().toISOString().split('T')[0], score: parseFloat(newMeasure.score) }];

    // If it's a Firestore goal
    if (activeGoal.id && !activeGoal.id.toString().startsWith('local-') && db) {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'goals', activeGoal.id), { data: newData });
    } else {
        // Local goal update
        setLocalGoals(prev => prev.map(g => g.id === activeGoal.id ? { ...g, data: newData } : g));
    }
    setNewMeasure({ date: '', score: '' });
  };

  const handleLogIncident = () => {
      setBehaviorLog([...behaviorLog, { ...newIncident, id: Date.now() }]);
      setNewIncident({ date: '', antecedent: '', behavior: '', consequence: '' });
  };

  // Views
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <DashCard className="p-8 max-w-md w-full text-center" glow>
          <div className="flex justify-center mb-6"><Sparkles className="text-cyan-400" size={48} /></div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Prism<span className="text-cyan-400">Path</span></h1>
          <p className="text-slate-400 mb-8">Educator Portal Access</p>
          <DashButton onClick={handleLogin} className="w-full py-3">Enter Secure Portal</DashButton>
          <button onClick={onBack} className="mt-4 text-xs text-slate-500 hover:text-white">Back to Home</button>
        </DashCard>
      </div>
    );
  }

  const iepStatus = activeStudent ? ComplianceService.getStatus(activeStudent.nextIep) : {};
  const evalStatus = activeStudent ? ComplianceService.getStatus(activeStudent.nextEval) : {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20 font-sans">
        <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
                    <Sparkles className="text-cyan-400" size={24}/>
                    <span className="font-bold text-white">Prism<span className="text-cyan-400">Path</span></span>
                </div>
                <div className="hidden md:flex gap-1 bg-slate-900 border border-slate-800 rounded-full p-1">
                    {['Profile', 'Identify', 'Develop', 'Monitor', 'Behavior'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t.toLowerCase())} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${activeTab === t.toLowerCase() ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-white'}`}>{t}</button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold hidden sm:block">{user.name}</span>
                    <button onClick={() => auth.signOut()} className="text-slate-500 hover:text-red-400"><LogOut size={18}/></button>
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
            {/* Roster */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide flex-1">
                    {displayedStudents.map(s => (
                        <button key={s.id} onClick={() => setCurrentStudentId(s.id)} className={`flex-shrink-0 px-4 py-3 rounded-xl border relative min-w-[160px] transition-all ${currentStudentId === s.id ? 'bg-slate-800 border-cyan-500/50 shadow-lg' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}>
                            <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${ComplianceService.getStatus(s.nextIep).color}`}></div>
                            <div className="text-left">
                                <p className={`font-bold ${currentStudentId === s.id ? 'text-white' : 'text-slate-400'}`}>{s.name}</p>
                                <p className="text-[10px] text-slate-500 uppercase">{s.need}</p>
                            </div>
                        </button>
                    ))}
                    <button onClick={() => setIsAddingStudent(true)} className="px-4 rounded-xl border border-dashed border-slate-700 text-slate-500 hover:text-cyan-400"><Plus/></button>
                </div>
                <button onClick={() => setShowSamples(!showSamples)} className="text-xs text-slate-500 flex items-center gap-1">{showSamples ? <ToggleRight className="text-cyan-400"/> : <ToggleLeft/>} Samples</button>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && activeStudent && (
                <div className="grid lg:grid-cols-3 gap-6 animate-in fade-in">
                    <div className="lg:col-span-2 space-y-6">
                        <DashCard className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div><h2 className="text-2xl font-bold text-white">{activeStudent.name}</h2><p className="text-slate-400">{activeStudent.grade} • {activeStudent.need}</p></div>
                                <div className="relative">
                                    <input type="file" id="upload" className="hidden" onChange={(e) => { alert(`Processed ${e.target.files[0]?.name}`); }} accept=".pdf,.docx,.txt" />
                                    <DashButton onClick={() => document.getElementById('upload').click()} variant="secondary" icon={UploadCloud}>Upload Data</DashButton>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-center relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-full h-1 ${iepStatus.color}`}></div>
                                    <p className="text-[10px] uppercase text-slate-500 font-bold">IEP Due</p>
                                    <h3 className="text-xl font-bold text-white">{activeStudent.nextIep}</h3>
                                    <DashBadge color={iepStatus.text === 'Compliant' ? 'emerald' : 'amber'}>{iepStatus.text}</DashBadge>
                                </div>
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-center relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-full h-1 ${evalStatus.color}`}></div>
                                    <p className="text-[10px] uppercase text-slate-500 font-bold">Eval Due</p>
                                    <h3 className="text-xl font-bold text-white">{activeStudent.nextEval}</h3>
                                    <DashBadge color={evalStatus.text === 'Compliant' ? 'emerald' : 'amber'}>{evalStatus.text}</DashBadge>
                                </div>
                            </div>
                        </DashCard>
                        <DashCard className="p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex gap-2"><BarChart3 className="text-cyan-400"/> Student Summary</h3>
                            <p className="text-slate-400 text-sm whitespace-pre-wrap">{activeStudent.summary}</p>
                        </DashCard>
                    </div>
                    <DashCard className="p-6 h-full flex flex-col" glow>
                        <h3 className="font-bold text-white mb-4 flex gap-2"><Mail className="text-fuchsia-400"/> Parent Comms</h3>
                        <div className="space-y-4 flex-1">
                            <select value={emailTopic} onChange={e => setEmailTopic(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white">
                                <option>Progress Update</option><option>Solicit Feedback</option><option>Meeting Request</option>
                            </select>
                            {emailTopic === 'Solicit Feedback' && (
                                <div className="space-y-2 p-2 bg-slate-950 rounded border border-slate-800">
                                    {['behavior', 'social', 'academic'].map(a => (
                                        <label key={a} className="flex gap-2 text-sm text-slate-400"><input type="checkbox" onChange={e => setFeedbackAreas({...feedbackAreas, [a]: e.target.checked})}/> {a}</label>
                                    ))}
                                </div>
                            )}
                            <DashButton onClick={() => handleGenerate('email')} disabled={isGenerating} className="w-full" icon={Wand2}>{isGenerating ? 'Drafting...' : 'Generate'}</DashButton>
                        </div>
                        {generatedEmail && <CopyBlock content={generatedEmail} label="Copy Email"/>}
                    </DashCard>
                </div>
            )}

            {/* Identify Tab */}
            {activeTab === 'identify' && (
                <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in">
                    <DashCard className="p-8">
                        <h2 className="text-xl font-bold text-white mb-6 flex gap-2"><FileText className="text-cyan-400"/> PLAAFP Wizard</h2>
                        <div className="space-y-4">
                            <textarea className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white h-20" placeholder="Strengths..." onChange={e => setPlaafpInputs({...plaafpInputs, strengths: e.target.value})} />
                            <textarea className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white h-20" placeholder="Needs..." onChange={e => setPlaafpInputs({...plaafpInputs, needs: e.target.value})} />
                            <textarea className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white h-20" placeholder="Impact..." onChange={e => setPlaafpInputs({...plaafpInputs, impact: e.target.value})} />
                            <DashButton onClick={() => handleGenerate('plaafp')} disabled={isGenerating} className="w-full" icon={Wand2}>Generate Narrative</DashButton>
                        </div>
                    </DashCard>
                    <DashCard className="p-8 bg-slate-950">
                        <h2 className="text-xs font-bold text-slate-500 uppercase mb-4">Preview</h2>
                        {plaafpResult ? <div className="text-slate-300 text-sm whitespace-pre-wrap">{plaafpResult}<CopyBlock content={plaafpResult}/></div> : <p className="text-slate-600">Enter data...</p>}
                    </DashCard>
                </div>
            )}

            {/* Develop Tab */}
            {activeTab === 'develop' && (
                <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in">
                    <DashCard className="p-8" glow>
                        <h2 className="text-xl font-bold text-white flex gap-2 mb-6"><Target className="text-fuchsia-400"/> Goal Drafter</h2>
                        <div className="space-y-6">
                            <input className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white" placeholder="Condition (e.g. Given text...)" onChange={e => setGoalInputs({...goalInputs, condition: e.target.value})}/>
                            <input className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white" placeholder="Behavior (e.g. Will decode...)" onChange={e => setGoalInputs({...goalInputs, behavior: e.target.value})}/>
                            <DashButton onClick={() => handleGenerate('goal')} disabled={isGenerating} className="w-full" icon={Wand2}>Draft Goal</DashButton>
                        </div>
                    </DashCard>
                    <DashCard className="p-8 bg-slate-950">
                        {goalText ? (
                            <div>
                                <p className="text-lg text-slate-200 mb-6">{goalText}</p>
                                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
                                    <div className="flex gap-2">
                                        <input type="number" value={goalConfig.target} onChange={e=>setGoalConfig({...goalConfig, target: e.target.value})} className="w-20 bg-slate-950 border border-slate-700 rounded p-2 text-white"/>
                                        <select value={goalConfig.frequency} onChange={e=>setGoalConfig({...goalConfig, frequency: e.target.value})} className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-white">
                                            <option>Weekly</option><option>Bi-Weekly</option>
                                        </select>
                                    </div>
                                    <DashButton onClick={handleLockGoal} icon={Lock} className="w-full" variant="secondary">Lock & Track</DashButton>
                                </div>
                                <CopyBlock content={goalText}/>
                            </div>
                        ) : <p className="text-slate-600">Draft a goal to see preview...</p>}
                    </DashCard>
                </div>
            )}

            {/* Monitor Tab */}
            {activeTab === 'monitor' && (
                <DashCard className="p-6">
                    <div className="flex justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex gap-2"><Activity className="text-emerald-400"/> Progress Monitoring</h2>
                        {activeGoal && <div className="text-xs bg-slate-900 px-3 py-1 rounded text-white">{activeGoal.frequency}</div>}
                    </div>
                    {!activeGoal ? (
                        <div className="text-center py-12 text-slate-500"><p>No locked goals.</p><DashButton onClick={()=>setActiveTab('develop')} variant="secondary">Create Goal</DashButton></div>
                    ) : (
                        <div>
                            <div className="flex gap-4 mb-6">
                                <select className="flex-1 bg-slate-900 border border-slate-700 rounded p-3 text-white" value={activeGoalId || ''} onChange={e => setActiveGoalId(e.target.value)}>
                                    {allGoals.map(g => <option key={g.id} value={g.id}>{g.text.substring(0,50)}...</option>)}
                                </select>
                                <DashButton onClick={() => window.print()} variant="secondary" icon={Printer}>Print</DashButton>
                            </div>
                            <div className="grid lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    <SimpleLineChart data={activeGoal.data} target={activeGoal.target}/>
                                    <p className="text-sm text-slate-400 italic bg-slate-900 p-4 rounded border border-slate-800">{activeGoal.text}</p>
                                </div>
                                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 h-fit space-y-4">
                                    <h3 className="font-bold text-white uppercase text-sm">Log Data</h3>
                                    <input type="date" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" onChange={e=>setNewMeasure({...newMeasure, date: e.target.value})}/>
                                    <input type="number" placeholder="Score %" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" onChange={e=>setNewMeasure({...newMeasure, score: e.target.value})}/>
                                    <DashButton onClick={handleAddDataPoint} className="w-full" icon={Plus}>Add Point</DashButton>
                                </div>
                            </div>
                        </div>
                    )}
                </DashCard>
            )}

            {/* Behavior Tab */}
            {activeTab === 'behavior' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        <h2 className="text-xl font-bold text-white">Daily Tracker</h2>
                        <div className="flex gap-4 items-center">
                            {isEditingTracker && (
                                <div className="flex gap-2">
                                    <button onClick={() => setSchedule([...schedule, "New Block"])} className="text-xs bg-slate-800 px-2 py-1 rounded text-white flex gap-1"><Plus size={12}/> Time</button>
                                    <button onClick={() => setTrackingGoals([...trackingGoals, "New Goal"])} className="text-xs bg-slate-800 px-2 py-1 rounded text-white flex gap-1"><Plus size={12}/> Goal</button>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-500 uppercase">Threshold:</span>
                                {isEditingTracker ? <input type="number" value={rewardThreshold} onChange={e=>setRewardThreshold(e.target.value)} className="w-12 bg-slate-950 text-white rounded p-1 border border-slate-700"/> : <span className="text-white font-bold">{rewardThreshold}%</span>}
                            </div>
                            <DashButton onClick={() => setIsEditingTracker(!isEditingTracker)} variant="secondary" icon={Settings} className="h-8 text-xs">{isEditingTracker ? "Done" : "Edit"}</DashButton>
                        </div>
                    </div>
                    <div className="overflow-x-auto pb-4">
                        <div className="min-w-[800px] bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                            <div className="flex border-b border-slate-700/50 bg-slate-900">
                                <div className="w-48 p-4 font-bold text-slate-400 text-xs uppercase">Time Block</div>
                                {trackingGoals.map((g, i) => (
                                    <div key={i} className="flex-1 p-4 font-bold text-cyan-400 text-center border-r border-slate-700/50">
                                        {isEditingTracker ? <input value={g} onChange={e => {const n=[...trackingGoals]; n[i]=e.target.value; setTrackingGoals(n)}} className="bg-slate-950 w-full text-center text-xs p-1 rounded border border-cyan-500/30"/> : g}
                                    </div>
                                ))}
                            </div>
                            {schedule.map((block, bI) => (
                                <div key={bI} className="flex border-b border-slate-700/50 last:border-b-0 hover:bg-slate-800/30">
                                    <div className="w-48 p-4 font-bold text-slate-300 border-r border-slate-700/50 flex justify-between items-center">
                                        {isEditingTracker ? <div className="flex gap-2 w-full"><input value={block} onChange={e => {const n=[...schedule]; n[bI]=e.target.value; setSchedule(n)}} className="bg-slate-950 w-full text-xs p-1 rounded border border-slate-700"/><button onClick={()=>setSchedule(schedule.filter((_,i)=>i!==bI))} className="text-red-400"><Minus size={12}/></button></div> : block}
                                    </div>
                                    {trackingGoals.map((g, gI) => {
                                        const k = `${block}-${g}`;
                                        const s = trackerData[k];
                                        return (
                                            <div key={gI} onClick={() => !isEditingTracker && setTrackerData({...trackerData, [k]: s==='star'?'smile':s==='smile'?'check':s==='check'?null:'star'})} className="flex-1 p-2 border-r border-slate-700/50 flex items-center justify-center cursor-pointer hover:bg-slate-800">
                                                {s==='star' && <Star className="text-yellow-400 fill-yellow-400"/>}
                                                {s==='smile' && <Smile className="text-emerald-400"/>}
                                                {s==='check' && <CheckCircle className="text-cyan-400"/>}
                                                {!s && <div className="w-3 h-3 rounded-full bg-slate-800"/>}
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {isAddingStudent && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4 z-50">
                <DashCard className="w-full max-w-md p-6 border-slate-600">
                    <h2 className="text-2xl font-bold text-white mb-4">Add Student</h2>
                    <div className="space-y-4">
                        <input placeholder="Name" className="w-full bg-slate-950 p-3 rounded border border-slate-700 text-white" onChange={e => setNewStudent({...newStudent, name: e.target.value})}/>
                        <input placeholder="Needs" className="w-full bg-slate-950 p-3 rounded border border-slate-700 text-white" onChange={e => setNewStudent({...newStudent, need: e.target.value})}/>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="date" className="w-full bg-slate-950 p-3 rounded border border-slate-700 text-white" onChange={e => setNewStudent({...newStudent, nextIep: e.target.value})}/>
                            <input type="date" className="w-full bg-slate-950 p-3 rounded border border-slate-700 text-white" onChange={e => setNewStudent({...newStudent, nextEval: e.target.value})}/>
                        </div>
                        <div className="flex justify-end gap-2">
                            <DashButton variant="ghost" onClick={() => setIsAddingStudent(false)}>Cancel</DashButton>
                            <DashButton onClick={handleAddStudent}>Save</DashButton>
                        </div>
                    </div>
                </DashCard>
            </div>
        )}
    </div>
  );
};

// --- MAIN LANDING PAGE ---

const Button = ({ children, primary, href, onClick, className = "", disabled }) => {
  const baseStyle = "inline-flex items-center px-5 py-2.5 rounded-full font-bold transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  const primaryStyle = "bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]";
  const secondaryStyle = "bg-slate-800 text-cyan-400 border border-slate-700 hover:bg-slate-700 hover:text-white";
  const classes = `${baseStyle} ${primary ? primaryStyle : secondaryStyle} ${className}`;
  if (href) return <a href={href} {...(href.startsWith('http') ? {target:"_blank", rel:"noopener noreferrer"} : {})} className={classes}>{children}</a>;
  return <button onClick={onClick} disabled={disabled} className={classes}>{children}</button>;
};

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
  <div className="group relative p-1 rounded-2xl bg-gradient-to-b from-slate-700 to-slate-800 hover:from-cyan-500 hover:to-fuchsia-500 transition-all duration-500" style={{ animationDelay: `${delay}ms` }}>
    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
    <div className="relative h-full bg-slate-900 rounded-xl p-6 sm:p-8 flex flex-col items-start border border-slate-800">
      <div className="p-3 bg-slate-800 rounded-lg text-cyan-400 mb-4 group-hover:text-fuchsia-400 transition-colors"><Icon size={32} /></div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-300 leading-relaxed">{description}</p>
    </div>
  </div>
);

const Disclaimer = () => (
  <div className="bg-fuchsia-950/40 border border-fuchsia-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
    <Info className="text-fuchsia-400 shrink-0 mt-0.5" size={18} />
    <p className="text-sm text-fuchsia-100/90 leading-relaxed"><strong>Note:</strong> This tool uses AI to generate educational suggestions. It does not replace professional medical advice or official IEPs.</p>
  </div>
);

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [studentMenuOpen, setStudentMenuOpen] = useState(false); 
  const [isLowStim, setIsLowStim] = useState(false);
  const [view, setView] = useState('home'); 
  const [challenge, setChallenge] = useState('');
  const [subject, setSubject] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const studentMenuRef = useRef(null);

  useEffect(() => {
    // 1. CHECK URL PARAMS ON LOAD
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('app');
    if (viewParam) setView(viewParam);

    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    const handleClickOutside = (event) => {
      if (studentMenuRef.current && !studentMenuRef.current.contains(event.target)) setStudentMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { window.removeEventListener('scroll', handleScroll); document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  const gemLink = "https://gemini.google.com/gem/1l1CXxrHsHi41oCGW-In9-MSlSfanKbbB?usp=sharing";

  const handleGenerate = async () => {
    if (!challenge.trim() || !subject.trim()) { setError("Please describe the challenge and the subject."); return; }
    setLoading(true); setError(''); setGeneratedPlan(null);
    try {
        const response = await GeminiService.generate({ targetBehavior: challenge, condition: subject }, 'behavior'); // Reuse service for quick demo
        setGeneratedPlan(response || "No suggestions generated.");
    } catch (err) { setError("Failed to generate."); } 
    finally { setLoading(false); }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 font-sans overflow-x-hidden selection:bg-fuchsia-500/30 selection:text-fuchsia-200`}>
      <div className={`fixed inset-0 pointer-events-none z-[100] transition-all duration-1000 ease-in-out ${isLowStim ? 'backdrop-grayscale bg-slate-950/20' : 'backdrop-grayscale-0 bg-transparent'}`}></div>
      <div className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000 ${isLowStim ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" style={{ maskImage: 'radial-gradient(ellipse 80% 80% at 50% 0%, black 40%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 0%, black 40%, transparent 100%)' }}></div>
      </div>

      {view === 'resume' ? <div className="relative z-10 pt-10"><ResumeBuilder onBack={() => setView('home')} isLowStim={isLowStim} /></div>
      : view === 'map' ? <div className="relative z-10 pt-20 h-screen"><SocialMap onBack={() => setView('home')} isLowStim={isLowStim} /></div>
      : view === 'cockpit' ? <div className="relative z-[150] h-screen"><EmotionalCockpit onBack={() => setView('home')} /></div>
      : view === 'neuro' ? <div className="relative z-[150] min-h-screen"><NeuroDriver onBack={() => setView('home')} /></div>
      : view === 'educator' ? <div className="relative z-[150] min-h-screen"><TeacherDashboard onBack={() => setView('home')} /></div>
      : (
        <>
          <nav className={`fixed w-full z-50 transition-all duration-300 border-b ${isScrolled ? 'bg-slate-950/90 backdrop-blur-md border-slate-800 py-3' : 'bg-transparent border-transparent py-6'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
              <div className="flex items-center space-x-2 group cursor-pointer" onClick={() => setView('home')}>
                <div className="relative">
                  <Sparkles className={`text-cyan-400 transition-colors duration-300 ${isLowStim ? 'text-slate-400' : 'group-hover:text-fuchsia-400'}`} size={26} />
                  <div className={`absolute inset-0 bg-cyan-400 blur-lg opacity-40 transition-all duration-1000 ${isLowStim ? 'opacity-0' : 'group-hover:bg-fuchsia-400 motion-safe:animate-pulse'}`} />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Prism<span className={`${isLowStim ? 'text-slate-400' : 'text-cyan-400'}`}>Path</span></span>
              </div>

              <div className="hidden md:flex items-center space-x-6">
                <button onClick={() => setIsLowStim(!isLowStim)} className={`p-2 rounded-full transition-all ${isLowStim ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>{isLowStim ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                <div className="h-6 w-px bg-slate-800"></div>
                
                {/* EDUCATOR LINK: Opens in new tab */}
                <a href="?app=educator" target="_blank" className="text-sm font-bold text-fuchsia-400 hover:text-fuchsia-300 transition-colors flex items-center gap-1"><GraduationCap size={16} /> For Educators</a>
                
                {/* FOR STUDENTS DROPDOWN: Uses router links */}
                <div className="relative" ref={studentMenuRef}>
                  <button 
                    onClick={() => setStudentMenuOpen(!studentMenuOpen)} 
                    className="flex items-center gap-1 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors focus:outline-none"
                  >
                    <SmilePlus size={16} /> For Students <ChevronDown size={14} className={`transition-transform ${studentMenuOpen ? 'rotate-180' : ''}`}/>
                  </button>
                  {studentMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                        <a href="?app=neuro" className="block w-full text-left px-4 py-3 hover:bg-slate-800 flex items-center gap-3 text-sm text-slate-200 group">
                            <div className="p-1.5 rounded bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20"><Brain size={16}/></div> Neuro Driver
                        </a>
                        <a href="?app=resume" className="block w-full text-left px-4 py-3 hover:bg-slate-800 flex items-center gap-3 text-sm text-slate-200 group border-t border-slate-800/50">
                            <div className="p-1.5 rounded bg-fuchsia-500/10 text-fuchsia-400 group-hover:bg-fuchsia-500/20"><FileText size={16}/></div> Resume Builder
                        </a>
                        <a href="?app=map" className="block w-full text-left px-4 py-3 hover:bg-slate-800 flex items-center gap-3 text-sm text-slate-200 group border-t border-slate-800/50">
                            <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20"><MapPin size={16}/></div> Social Map
                        </a>
                        <a href="?app=cockpit" className="block w-full text-left px-4 py-3 hover:bg-slate-800 flex items-center gap-3 text-sm text-slate-200 group border-t border-slate-800/50">
                            <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20"><Activity size={16}/></div> Emotional Cockpit
                        </a>
                    </div>
                  )}
                </div>

                <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</a>
                <Button href={gemLink} primary className="!px-4 !py-2 !text-sm">Launch Gem <ExternalLink size={14} className="ml-2" /></Button>
              </div>

              <button className="md:hidden text-slate-300 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
            </div>
            
            {mobileMenuOpen && (
              <div className="md:hidden absolute top-full left-0 w-full bg-slate-900 border-b border-slate-800 p-4 flex flex-col space-y-4 shadow-xl animate-in slide-in-from-top-5">
                <button onClick={() => setIsLowStim(!isLowStim)} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 w-full">{isLowStim ? <EyeOff size={16} /> : <Eye size={16} />}{isLowStim ? "Restore Colors" : "Low Stimulation Mode"}</button>
                <div className="h-px bg-slate-800 w-full my-1"></div>
                <a href="?app=educator" target="_blank" className="flex items-center gap-2 text-fuchsia-400 font-bold"><GraduationCap size={18}/> Educator Portal</a>
                
                <div className="pl-4 border-l-2 border-slate-800 space-y-3">
                    <p className="text-xs uppercase font-bold text-slate-500">For Students</p>
                    <a href="?app=neuro" className="flex items-center gap-2 text-slate-300 hover:text-cyan-400"><Brain size={18}/> Neuro Driver</a>
                    <a href="?app=resume" className="flex items-center gap-2 text-slate-300 hover:text-cyan-400"><FileText size={18}/> Resume Builder</a>
                    <a href="?app=map" className="flex items-center gap-2 text-slate-300 hover:text-cyan-400"><MapPin size={18}/> Social Map</a>
                    <a href="?app=cockpit" className="flex items-center gap-2 text-slate-300 hover:text-cyan-400"><Activity size={18}/> Emotional Cockpit</a>
                </div>

                <div className="h-px bg-slate-800 w-full my-1"></div>
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300 hover:text-white">Features</a>
                <Button href={gemLink} primary className="justify-center w-full">Launch Gem</Button>
              </div>
            )}
          </nav>

          <section className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/50 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wider uppercase mb-8 backdrop-blur-sm transition-all duration-1000 ${isLowStim ? 'grayscale' : ''}`}>
              <span className="w-2 h-2 rounded-full bg-cyan-400 motion-safe:animate-pulse"></span><span>AI-Powered Accommodations</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">Personalized Learning <br /><span className={`text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-purple-400 ${isLowStim ? 'text-white bg-none' : 'animate-gradient-x'}`}>Without Limits.</span></h1>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-300 leading-relaxed mb-10">Empowering <strong>educators</strong> and <strong>homeschool parents</strong> of special needs students. Get instant, AI-powered accommodations tailored to your student's unique learning profile.</p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Button primary href={gemLink}>Open Accommodation Gem <Zap size={18} className="ml-2" /></Button>
              <Button href="#accommodations">Try Quick Demo</Button>
            </div>
            <div className={`absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-[100px] pointer-events-none transition-opacity duration-1000 ${isLowStim ? 'opacity-0' : 'opacity-100'}`}></div>
            <div className={`absolute top-1/3 right-0 translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none transition-opacity duration-1000 ${isLowStim ? 'opacity-0' : 'opacity-100'}`}></div>
          </section>

          <section id="features" className="relative z-10 py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard icon={Brain} title="Cognitive Support" description="Strategies for memory retention, focus improvement, and information processing tailored to neurodiverse minds." delay={0} />
              <FeatureCard icon={Calendar} title="Visual Schedules" description="Generate clear, structured visual timelines to reduce anxiety and aid transition between tasks." delay={100} />
              <FeatureCard icon={Heart} title="Emotional Regulation" description="Tips for sensory breaks and emotional check-ins integrated directly into your lesson plans." delay={200} />
              <FeatureCard icon={ShieldCheck} title="Distraction Free" description="Get clean, text-based plans without the clutter of ad-heavy educational websites." delay={300} />
              <FeatureCard icon={Clock} title="Time Saving" description="What used to take hours of research now takes seconds. Spend more time teaching, less time planning." delay={400} />
              <FeatureCard icon={Zap} title="Instant Adaptation" description="Having a rough day? Ask the Gem to modify the day's load instantly to match your child's energy." delay={500} />
            </div>
          </section>

          <section id="accommodations" className="relative z-10 py-20 bg-slate-900 border-y border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-start gap-12">
              <div className="lg:w-5/12">
                <h2 className="text-3xl font-bold text-white mb-6">Instant AI Accommodations <br /><span className={`transition-colors duration-1000 ${isLowStim ? 'text-white' : 'text-cyan-400'}`}>Try it right here</span></h2>
                <Disclaimer />
                <p className="text-slate-300 mb-8 text-lg">Not sure what to ask the Gem? Try our Quick-Gen tool. Enter the primary challenge and current subject to see how Gemini can help.</p>
                <div className="grid grid-cols-1 gap-4 mb-8">
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-slate-300 mb-2">Primary Challenge</label><input type="text" value={challenge} onChange={(e) => setChallenge(e.target.value)} placeholder="e.g. Dyslexia, ADHD, Sensory Processing" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition-all placeholder:text-slate-600" /></div>
                    <div><label className="block text-sm font-medium text-slate-300 mb-2">Subject or Activity</label><input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Long Division, Silent Reading, Essay Writing" className={`w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:border-transparent outline-none transition-all placeholder:text-slate-600 ${isLowStim ? 'focus:ring-white' : 'focus:ring-fuchsia-400'}`} /></div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Button onClick={handleGenerate} primary disabled={loading}>{loading ? <><Loader2 className="ml-2 animate-spin" size={18} /> Processing</> : <>Generate Ideas ✨</>}</Button>
                  {error && <div className="text-red-400 text-sm flex items-center bg-red-900/20 px-3 py-2 rounded-lg border border-red-500/20"><span className="mr-2">⚠️</span> {error}</div>}
                </div>
              </div>
              <div className="lg:w-7/12 w-full relative">
                <div className={`absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-2xl blur-2xl transform rotate-1 transition-opacity duration-1000 ${isLowStim ? 'opacity-0' : 'opacity-10'}`}></div>
                <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl min-h-[500px] flex flex-col">
                  <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                    <div className={`flex items-center space-x-2 ${isLowStim ? 'grayscale opacity-50' : ''}`}><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="ml-4 text-xs text-slate-500 font-mono">PrismPath Engine</span></div>
                    <div className="text-xs text-slate-600 font-mono">model: gemini-2.0-flash</div>
                  </div>
                  <div className="flex-grow font-sans text-[15px] space-y-4 overflow-y-auto max-h-[400px] custom-scrollbar text-slate-300 leading-relaxed">
                    {!generatedPlan && !loading && <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50 pt-20"><MessageSquare size={48} className="mb-4" /><p>Waiting for your input...</p></div>}
                    {loading && <div className="space-y-4 animate-pulse pt-4"><div className="h-4 bg-slate-800 rounded w-3/4"></div><div className="h-4 bg-slate-800 rounded w-1/2"></div><div className="h-4 bg-slate-800 rounded w-5/6"></div></div>}
                    {generatedPlan && !loading && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex gap-4 mb-6"><span className="text-fuchsia-400 shrink-0 font-mono">$</span><span className="text-slate-300 font-mono">Analysis for: <span className="text-cyan-400">{challenge}</span> + <span className="text-cyan-400">{subject}</span></span></div>
                        <div className="h-px bg-slate-800 my-6"></div>
                        <ReactMarkdown components={{
                          strong: ({node, ...props}) => <span className="font-bold text-cyan-300" {...props} />,
                          p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2 marker:text-fuchsia-500" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-2 marker:text-cyan-500" {...props} />,
                          li: ({node, ...props}) => <li className="pl-1" {...props} />,
                          h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mb-4 mt-6" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-xl font-bold text-fuchsia-300 mb-3 mt-5" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-lg font-bold text-cyan-300 mb-2 mt-4" {...props} />,
                        }}>{generatedPlan}</ReactMarkdown>
                        <div className="mt-8 flex items-center space-x-2 text-emerald-400/80 text-xs border-t border-slate-800 pt-4 font-mono"><CheckCircle2 size={14} /><span>Generated by PrismPath AI. Verify with a specialist.</span></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer className="relative z-10 bg-slate-950 pt-20 pb-10 border-t border-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-6 md:mb-0">
                  <div className="flex items-center space-x-2"><Sparkles className={`transition-colors duration-1000 ${isLowStim ? 'text-slate-500' : 'text-fuchsia-500'}`} size={24} /><span className="text-xl font-bold text-white">Prism<span className={`transition-colors duration-1000 ${isLowStim ? 'text-slate-400' : 'text-cyan-400'}`}>Path</span></span></div>
                  <p className="text-slate-500 text-sm mt-2">Built to Empower Learners.</p>
                </div>
                <div className="flex space-x-6"><a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Privacy</a><a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Terms</a><a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Contact</a></div>
              </div>
              <div className="mt-8 pt-8 border-t border-slate-900 text-center text-slate-600 text-sm">&copy; {new Date().getFullYear()} PrismPath Accommodations. All rights reserved.</div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}


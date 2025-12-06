import ResumeBuilder from './ResumeBuilder';
import SocialMap from './SocialMap';
import EmotionalCockpit from './EmotionalCockpit';
import TeacherDashboard from './TeacherDashboard';
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
  RotateCcw, Timer, Volume2, VolumeX, Shuffle, Sun, Moon
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

// --- SHARED UI COMPONENTS (Defined at top to avoid ReferenceErrors) ---

const Disclaimer = () => (
  <div className="bg-fuchsia-900/10 border border-fuchsia-500/20 rounded-xl p-4 mb-8 flex items-start gap-3 text-left shadow-sm">
    <Info className="text-fuchsia-500 shrink-0 mt-0.5" size={18} />
    <p className="text-sm text-fuchsia-900/80 dark:text-fuchsia-100/90 leading-relaxed font-medium">
      <strong>Note:</strong> This tool uses AI to generate educational suggestions. It does not replace professional medical advice or official IEPs.
    </p>
  </div>
);

const Button = ({ children, primary, href, onClick, className = "", disabled }) => {
    const baseStyle = "inline-flex items-center px-6 py-3 rounded-full font-bold transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-sm";
    const primaryStyle = "bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white shadow-md hover:shadow-cyan-500/25";
    const secondaryStyle = "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-white dark:bg-slate-800 dark:text-cyan-400 dark:border-slate-700 dark:hover:bg-slate-700";
    const classes = `${baseStyle} ${primary ? primaryStyle : secondaryStyle} ${className}`;
    if (href) return <a href={href} {...(href.startsWith('http') ? {target:"_blank", rel:"noopener noreferrer"} : {})} className={classes}>{children}</a>;
    return <button onClick={onClick} disabled={disabled} className={classes}>{children}</button>;
};

// --- CONFIGURATION & SERVICES ---

const getGoogleApiKey = () => {
  try {
    if (import.meta.env && import.meta.env.VITE_GOOGLE_API_KEY) return import.meta.env.VITE_GOOGLE_API_KEY;
    if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_GOOGLE_API_KEY) return process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  } catch (e) {}
  return ""; 
};

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

// --- THEME ENGINE ---
const getTheme = (isDark) => ({
    bg: isDark ? "bg-slate-950" : "bg-slate-50",
    text: isDark ? "text-slate-200" : "text-slate-800",
    textMuted: isDark ? "text-slate-400" : "text-slate-500",
    cardBg: isDark ? "bg-slate-900/60 backdrop-blur-xl" : "bg-white/80 backdrop-blur-xl shadow-lg",
    cardBorder: isDark ? "border-slate-700/50" : "border-slate-200",
    inputBg: isDark ? "bg-slate-950" : "bg-white",
    inputBorder: isDark ? "border-slate-700" : "border-slate-300",
    primaryText: isDark ? "text-cyan-400" : "text-cyan-600",
    secondaryText: isDark ? "text-fuchsia-400" : "text-fuchsia-600",
    navBg: isDark ? "bg-slate-900/90" : "bg-white/90",
    glassBorder: isDark ? "border-white/10" : "border-black/5"
});

// --- DASHBOARD UTILITIES ---

const formatAIResponse = (text) => {
  if (!text) return "";
  let clean = text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/#/g, "");
  clean = clean.replace(/\.([A-Z])/g, ". $1");
  clean = clean.replace(/^(Here are|Sure|Here's).*?:/gim, "");
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
      return "Error: API Key not found.";
    }

    let systemInstruction = "";
    let userPrompt = "";

    if (type === 'behavior') {
        systemInstruction = "You are an expert BCBA. Analyze the log. Suggest 3 specific, low-prep interventions. Output clean text.";
        userPrompt = `Analyze logs: ${JSON.stringify(data)}. Target: ${data.targetBehavior}.`;
    } 
    else if (type === 'slicer') {
        systemInstruction = "You are a helpful assistant for students. Break the requested task into 5-7 simple, direct steps. Use very plain language. Do NOT use introductory phrases. Just list the steps. Example: 1. Get a pencil. 2. Open notebook.";
        userPrompt = `Task: ${data.task}`;
    }
    else if (type === 'email') {
        systemInstruction = "You are a professional Special Education Teacher. Write a polite email to a parent. No markdown.";
        userPrompt = data.feedbackAreas 
            ? `Email for student ${data.student} preparing for IEP. Ask for feedback on: ${data.feedbackAreas.join(', ')}.`
            : `Positive update for ${data.student} regarding ${data.topic}.`;
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

// --- AUDIO UTILS ---
const AudioEngine = {
    ctx: null,
    noiseNode: null,
    gainNode: null,
    
    init: () => {
        if (!AudioEngine.ctx) AudioEngine.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (AudioEngine.ctx.state === 'suspended') AudioEngine.ctx.resume();
    },

    toggleBrownNoise: (play) => {
        AudioEngine.init();
        if (play) {
            if (AudioEngine.noiseNode) return; 
            const bufferSize = AudioEngine.ctx.sampleRate * 2; 
            const buffer = AudioEngine.ctx.createBuffer(1, bufferSize, AudioEngine.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5; 
            }
            AudioEngine.noiseNode = AudioEngine.ctx.createBufferSource();
            AudioEngine.noiseNode.buffer = buffer;
            AudioEngine.noiseNode.loop = true;
            AudioEngine.gainNode = AudioEngine.ctx.createGain();
            AudioEngine.gainNode.gain.value = 0.15; 
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
        osc.frequency.setValueAtTime(440, AudioEngine.ctx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(880, AudioEngine.ctx.currentTime + 0.1); 
        gain.gain.setValueAtTime(0.1, AudioEngine.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, AudioEngine.ctx.currentTime + 1.5);
        osc.start();
        osc.stop(AudioEngine.ctx.currentTime + 1.5);
    },

    playVictory: () => {
        AudioEngine.init();
        const now = AudioEngine.ctx.currentTime;
        // Triumphant Major Arpeggio
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = AudioEngine.ctx.createOscillator();
            const gain = AudioEngine.ctx.createGain();
            osc.connect(gain);
            gain.connect(AudioEngine.ctx.destination);
            osc.frequency.value = freq;
            osc.type = 'triangle';
            gain.gain.setValueAtTime(0, now + i*0.1);
            gain.gain.linearRampToValueAtTime(0.1, now + i*0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i*0.1 + 0.6);
            osc.start(now + i*0.1);
            osc.stop(now + i*0.1 + 0.7);
        });
    }
};

// --- COMPONENTS ---

const DashCard = ({ children, className = "", glow = false, isDark = true }) => {
    const theme = getTheme(isDark);
    return (
        <div className={`relative rounded-2xl overflow-hidden border ${theme.cardBg} ${theme.cardBorder} ${className} ${glow ? 'shadow-[0_0_30px_rgba(6,182,212,0.1)]' : 'shadow-xl'}`}>
            {glow && <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-500/5'}`}></div>}
            <div className="relative z-10">{children}</div>
        </div>
    );
};

// --- REUSABLE BUTTONS FOR DASHBOARD ---
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


// --- NEURO DRIVER COMPONENT ---

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
                                            {/* Slider as fallback for quick adjust */}
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

// --- TEACHER DASHBOARD (Modified for Props) ---
const TeacherDashboard = ({ onBack, isDark }) => {
  const theme = getTheme(isDark);
  return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-8 flex items-center justify-center`}>
          <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">Educator Dashboard</h1>
              <p className="mb-6">Please open in a dedicated tab for full functionality.</p>
              <button onClick={onBack} className="bg-slate-800 text-white px-6 py-2 rounded-full">Back Home</button>
          </div>
      </div>
  )
};

// --- LANDING PAGE COMPONENTS ---

const FeatureCard = ({ icon: Icon, title, description, delay, isDark, onClick }) => {
    const theme = getTheme(isDark);
    return (
        <div 
            onClick={onClick}
            className={`group relative p-1 rounded-2xl bg-gradient-to-b ${isDark ? 'from-slate-700 to-slate-800' : 'from-slate-200 to-slate-100'} hover:from-cyan-500 hover:to-fuchsia-500 transition-all duration-500 cursor-pointer`} 
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
            <div className={`relative h-full ${theme.cardBg} rounded-xl p-6 sm:p-8 flex flex-col items-start border ${theme.cardBorder}`}>
                <div className={`p-3 ${isDark ? 'bg-slate-800' : 'bg-slate-200'} rounded-lg text-cyan-500 mb-4 group-hover:text-fuchsia-500 transition-colors`}><Icon size={32} /></div>
                <h3 className={`text-xl font-bold ${theme.text} mb-2`}>{title}</h3>
                <p className={`${theme.textMuted} leading-relaxed`}>{description}</p>
            </div>
        </div>
    );
};

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [studentMenuOpen, setStudentMenuOpen] = useState(false); 
  const [isDark, setIsDark] = useState(true); // Light/Dark State
  const [view, setView] = useState('home'); 
  const [challenge, setChallenge] = useState('');
  const [subject, setSubject] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const studentMenuRef = useRef(null);

  useEffect(() => {
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

  const theme = getTheme(isDark);
  const gemLink = "https://gemini.google.com/gem/1l1CXxrHsHi41oCGW-In9-MSlSfanKbbB?usp=sharing";

  const handleGenerate = async () => {
    if (!challenge.trim() || !subject.trim()) { setError("Please describe the challenge and the subject."); return; }
    setLoading(true); setError(''); setGeneratedPlan(null);
    try {
        const response = await GeminiService.generate({ targetBehavior: challenge, condition: subject }, 'behavior'); 
        setGeneratedPlan(response || "No suggestions generated.");
    } catch (err) { setError("Failed to generate."); } 
    finally { setLoading(false); }
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans overflow-x-hidden selection:bg-fuchsia-500/30 selection:text-fuchsia-200 transition-colors duration-500`}>
      {/* Dynamic Background */}
      <div className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000 ${isDark ? 'opacity-100' : 'opacity-30'}`}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {view === 'resume' ? <div className="relative z-10 pt-10"><ResumeBuilder onBack={() => setView('home')} isLowStim={!isDark} /></div>
      : view === 'map' ? <div className="relative z-10 pt-20 h-screen"><SocialMap onBack={() => setView('home')} isLowStim={!isDark} /></div>
      : view === 'cockpit' ? <div className="relative z-[150] h-screen"><EmotionalCockpit onBack={() => setView('home')} isLowStim={!isDark} /></div>
      : view === 'neuro' ? <div className="relative z-[150] min-h-screen"><NeuroDriver onBack={() => setView('home')} isDark={isDark} /></div>
      : view === 'educator' ? <div className="relative z-[150] min-h-screen"><TeacherDashboard onBack={() => setView('home')} isDark={isDark} /></div>
      : (
        <>
          <nav className={`fixed w-full z-50 transition-all duration-300 border-b ${isScrolled ? `${theme.navBg} backdrop-blur-md ${theme.glassBorder} py-3` : 'bg-transparent border-transparent py-6'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
              <div className="flex items-center space-x-2 group cursor-pointer" onClick={() => setView('home')}>
                <div className="relative">
                  <Sparkles className={`${isDark ? 'text-cyan-400' : 'text-cyan-600'} transition-colors duration-300`} size={26} />
                  <div className={`absolute inset-0 bg-cyan-400 blur-lg opacity-40 transition-all duration-1000 ${isDark ? 'group-hover:bg-fuchsia-400' : 'opacity-0'}`} />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-fuchsia-500">PrismPath</span>
              </div>

              <div className="hidden md:flex items-center space-x-6">
                <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full transition-all ${isDark ? 'bg-slate-800 text-yellow-400' : 'bg-slate-200 text-orange-500'}`}>
                    {isDark ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                <div className={`h-6 w-px ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`}></div>
                
                <a href="?app=educator" target="_blank" className={`text-sm font-bold ${theme.secondaryText} hover:opacity-80 transition-colors flex items-center gap-1`}><GraduationCap size={16} /> For Educators</a>
                
                <div className="relative" ref={studentMenuRef}>
                  <button 
                    onClick={() => setStudentMenuOpen(!studentMenuOpen)} 
                    className={`flex items-center gap-1 text-sm font-bold ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'} transition-colors focus:outline-none`}
                  >
                    <SmilePlus size={16} /> For Students <ChevronDown size={14} className={`transition-transform ${studentMenuOpen ? 'rotate-180' : ''}`}/>
                  </button>
                  {studentMenuOpen && (
                    <div className={`absolute top-full left-0 mt-2 w-56 ${theme.cardBg} border ${theme.cardBorder} rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50`}>
                        <button onClick={() => {setView('neuro'); setStudentMenuOpen(false)}} className={`w-full text-left px-4 py-3 hover:bg-slate-500/10 flex items-center gap-3 text-sm ${theme.text} group`}>
                            <div className="p-1.5 rounded bg-amber-500/10 text-amber-500"><Brain size={16}/></div> Neuro Driver
                        </button>
                        <button onClick={() => {setView('resume'); setStudentMenuOpen(false)}} className={`w-full text-left px-4 py-3 hover:bg-slate-500/10 flex items-center gap-3 text-sm ${theme.text} group border-t ${theme.cardBorder}`}>
                            <div className="p-1.5 rounded bg-fuchsia-500/10 text-fuchsia-500"><FileText size={16}/></div> Resume Builder
                        </button>
                        <button onClick={() => {setView('map'); setStudentMenuOpen(false)}} className={`w-full text-left px-4 py-3 hover:bg-slate-500/10 flex items-center gap-3 text-sm ${theme.text} group border-t ${theme.cardBorder}`}>
                            <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-500"><MapPin size={16}/></div> Social Map
                        </button>
                        <button onClick={() => {setView('cockpit'); setStudentMenuOpen(false)}} className={`w-full text-left px-4 py-3 hover:bg-slate-500/10 flex items-center gap-3 text-sm ${theme.text} group border-t ${theme.cardBorder}`}>
                            <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-500"><Activity size={16}/></div> Emotional Cockpit
                        </button>
                    </div>
                  )}
                </div>

                <a href="#features" className={`text-sm font-medium ${theme.textMuted} hover:text-current transition-colors`}>Features</a>
                <a href={gemLink} target="_blank" className="px-4 py-2 text-sm bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-full font-bold shadow-lg hover:shadow-cyan-500/25 transition-all">Launch Gem <ExternalLink size={14} className="inline ml-1" /></a>
              </div>

              <button className={`md:hidden ${theme.text}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
            </div>
            
            {mobileMenuOpen && (
              <div className={`md:hidden absolute top-full left-0 w-full ${theme.bg} border-b ${theme.cardBorder} p-4 flex flex-col space-y-4 shadow-xl animate-in slide-in-from-top-5`}>
                 <button onClick={() => setIsDark(!isDark)} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${theme.cardBorder} w-full`}>{isDark ? <Moon size={16} /> : <Sun size={16} />}{isDark ? "Dark Mode" : "Light Mode"}</button>
                 <button onClick={() => setView('neuro')} className="block w-full text-left py-2 font-bold text-amber-500">Neuro Driver</button>
                 <button onClick={() => setView('resume')} className="block w-full text-left py-2 font-bold text-fuchsia-500">Resume Builder</button>
                 <button onClick={() => setView('cockpit')} className="block w-full text-left py-2 font-bold text-indigo-500">Emotional Cockpit</button>
                 <button onClick={() => setView('map')} className="block w-full text-left py-2 font-bold text-cyan-500">Social Map</button>
              </div>
            )}
          </nav>

          <section className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${isDark ? 'bg-slate-800/50 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'} text-cyan-500 text-xs font-bold tracking-wider uppercase mb-8 backdrop-blur-sm`}>
              <span className="w-2 h-2 rounded-full bg-cyan-500 motion-safe:animate-pulse"></span><span>AI-Powered Accommodations</span>
            </div>
            <h1 className={`text-5xl md:text-7xl font-extrabold tracking-tight ${theme.text} mb-6`}>Personalized Learning <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-purple-400">Without Limits.</span></h1>
            <p className={`mt-4 max-w-2xl mx-auto text-xl ${theme.textMuted} leading-relaxed mb-10`}>Empowering <strong>educators, students</strong> and <strong>homeschool parents</strong>. Get instant, AI-powered accommodations tailored to match your learner's energy and unique learning profile.</p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <a href={gemLink} target="_blank" className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-full font-bold shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center gap-2">Open Gem <Zap size={18}/></a>
              <a href="#accommodations" className={`px-6 py-3 rounded-full font-bold border ${theme.cardBorder} hover:bg-slate-500/10 transition-all`}>Try Demo</a>
            </div>
          </section>

          <section id="features" className="relative z-10 py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard onClick={() => setView('neuro')} icon={Brain} title="Cognitive Support" description="Neuro-divergent friendly task slicer and focus tools." delay={0} isDark={isDark} />
              <FeatureCard icon={Calendar} title="Visual Schedules" description="Generate clear structured visual timelines." delay={100} isDark={isDark} />
              <FeatureCard onClick={() => setView('cockpit')} icon={Heart} title="Emotional Regulation" description="Tips for sensory breaks and emotional check-ins." delay={200} isDark={isDark} />
              <FeatureCard icon={ShieldCheck} title="Distraction Free" description="Clean, text-based plans without clutter." delay={300} isDark={isDark} />
              <FeatureCard icon={Clock} title="Time Saving" description="Seconds, not hours of research." delay={400} isDark={isDark} />
              <FeatureCard icon={Zap} title="Instant Adaptation" description="Modify load instantly to match energy." delay={500} isDark={isDark} />
            </div>
          </section>

          <section id="accommodations" className={`relative z-10 py-20 ${isDark ? 'bg-slate-900 border-y border-slate-800' : 'bg-slate-50 border-y border-slate-200'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-start gap-12">
              <div className="lg:w-5/12">
                <h2 className={`text-3xl font-bold ${theme.text} mb-6`}>Instant AI Accommodations <br /><span className="text-cyan-500">Try it right here</span></h2>
                <Disclaimer />
                <div className="space-y-4 mb-8">
                    <div><label className={`block text-sm font-medium ${theme.textMuted} mb-2`}>Challenge</label><input type="text" value={challenge} onChange={(e) => setChallenge(e.target.value)} placeholder="e.g. Dyslexia" className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} focus:border-cyan-500 outline-none`} /></div>
                    <div><label className={`block text-sm font-medium ${theme.textMuted} mb-2`}>Subject</label><input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Reading" className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} focus:border-fuchsia-500 outline-none`} /></div>
                </div>
                <button onClick={handleGenerate} disabled={loading} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-full font-bold shadow-lg disabled:opacity-50">{loading ? 'Processing...' : 'Generate Ideas ✨'}</button>
              </div>
              <div className="lg:w-7/12 w-full">
                <div className={`relative ${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-6 md:p-8 shadow-2xl min-h-[500px]`}>
                    <div className="flex items-center gap-2 mb-6 opacity-50"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div></div>
                    <div className="prose prose-invert max-w-none">
                        {generatedPlan ? 
                            <ReactMarkdown components={{
                                p: ({node, ...props}) => <p className={`mb-4 leading-relaxed ${theme.text}`} {...props} />,
                                strong: ({node, ...props}) => <strong className="font-bold text-cyan-500" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 mb-4 marker:text-fuchsia-500" {...props} />,
                                li: ({node, ...props}) => <li className={`pl-1 ${theme.text}`} {...props} />
                            }}>{generatedPlan}</ReactMarkdown> 
                            : <div className="text-center opacity-50 pt-20"><MessageSquare size={48} className={`mx-auto mb-4 ${theme.textMuted}`}/><p className={theme.textMuted}>Ready for input...</p></div>
                        }
                    </div>
                </div>
              </div>
            </div>
          </section>

          <footer className={`relative z-10 ${isDark ? 'bg-slate-950 border-t border-slate-900' : 'bg-white border-t border-slate-100'} pt-20 pb-10`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
              &copy; {new Date().getFullYear()} PrismPath Accommodations. All rights reserved.
            </div>
          </footer>
        </>
      )}
    </div>
  );
}


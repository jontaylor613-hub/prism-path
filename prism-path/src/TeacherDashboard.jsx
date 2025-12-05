import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Target, BookOpen, Plus, Save, Trash2, TrendingUp, 
  CheckCircle, Brain, Layout, FileText, Sparkles, ClipboardList, 
  AlertCircle, ArrowRight, GraduationCap, Lock, Shield, Eye, 
  EyeOff, Key, LogOut, Chrome, CreditCard, Star, Check, Zap, 
  Grid, Building, Users, Search, List, Library, Compass, Sun, 
  Moon, School, Files, ArrowUpRight, X, ListOrdered, ChevronDown, 
  User, Wand2, Printer, Copy, Heart, Calendar, Clock, Calculator, 
  Mail, MessageSquare, Edit2, FileDown
} from 'lucide-react';

// --- Configuration ---
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID_HERE";

// --- Security & Utility Services ---

const SecurityService = {
  generatePseudonym: (realName) => {
    const hash = realName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `STU-${1000 + (hash % 9000)}`;
  },
  anonymizePayload: (studentData) => {
    const { name, ...rest } = studentData;
    return {
      student_id: SecurityService.generatePseudonym(name),
      ...rest,
      narrative_safe: rest.impact.replace(new RegExp(name, 'gi'), '[STUDENT]')
    };
  },
  encryptData: async (data) => {
    console.log("🔒 Encrypting data chunk with AES-256...");
    return btoa(JSON.stringify(data)); 
  },
  decodeJwt: (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Failed to decode JWT", e);
      return null;
    }
  }
};

// --- Mock Data ---

const INITIAL_STUDENTS = [
  { id: 1, name: "Alex M.", grade: "3rd", need: "Reading Decoding", strength: "Visual Memory", nextIep: "2024-11-15", nextReeval: "2025-03-10" },
  { id: 2, name: "Jordan K.", grade: "5th", need: "Math Calculation", strength: "Verbal Reasoning", nextIep: "2024-05-20", nextReeval: "2026-09-01" },
  { id: 3, name: "Taylor S.", grade: "2nd", need: "Emotional Regulation", strength: "Creativity", nextIep: "2024-02-28", nextReeval: "2024-04-15" }
];

const ASSESSMENT_LIBRARY = [
  { name: 'DIBELS 8th Edition', type: 'Reading Fluency', grades: 'K-8', desc: 'Measures phonemic awareness, phonics, and fluency.' },
  { name: 'WIAT-4', type: 'Achievement', grades: 'PK-12', desc: 'Comprehensive academic achievement test.' },
  { name: 'KeyMath-3', type: 'Math', grades: 'K-12', desc: 'Diagnostic assessment of essential mathematical concepts and skills.' },
  { name: 'BASC-3', type: 'Behavior', grades: 'PK-12', desc: 'Behavior assessment system for children (Teacher/Parent rating scales).' },
  { name: 'Woodcock-Johnson IV', type: 'Cognitive/Achievement', grades: 'PK-Adult', desc: 'Identifies learning disabilities and academic strengths.' },
  { name: 'CELF-5', type: 'Speech/Language', grades: '5-21', desc: 'Clinical evaluation of language fundamentals.' }
];

const IMPACT_TEMPLATES = [
  { label: "Reading Decoding", text: "The student's deficit in decoding fluency hinders their ability to comprehend grade-level texts in Science and Social Studies, requiring extended time and audio supports." },
  { label: "Math Calculation", text: "Difficulty with basic calculation automaticity affects the student's ability to solve multi-step application problems, slowing progress in the general math curriculum." },
  { label: "Executive Function", text: "Deficits in organization and task-initiation result in missing assignments and difficulty completing long-term projects without adult scaffolding." }
];

const SDI_RESOURCES = [
  { 
    id: 'sdi-1',
    category: 'Instruction', 
    title: 'Direct Instruction', 
    desc: 'Explicitly teaching skills using a systematic "I do, We do, You do" approach.', 
    tips: 'Ensure the "I Do" phase includes thinking aloud to model cognitive processes.', 
    evidence: 'High Impact (Hattie d=0.60)', 
    udl: 'Representation',
    tags: ['Reading', 'Math', 'Writing'],
    steps: [
      "1. Review: Briefly recap previous learning or prerequisite skills.",
      "2. Presentation (I Do): Explicitly model the skill. Think aloud to show your reasoning.",
      "3. Guided Practice (We Do): Practice together with the class. Provide immediate corrective feedback.",
      "4. Independent Practice (You Do): Student practices alone while you monitor.",
      "5. Periodic Review: Revisit the skill weekly to ensure retention."
    ]
  },
  { 
    id: 'sdi-2',
    category: 'Accommodations', 
    title: 'Graphic Organizers', 
    desc: 'Visual displays that demonstrate relationships between facts, concepts or ideas.', 
    tips: 'Pre-fill parts of the organizer for students with processing speed deficits.', 
    evidence: 'Moderate Impact (Hattie d=0.40)', 
    udl: 'Action & Expression',
    tags: ['Reading', 'Writing', 'Executive Function'],
    steps: [
      "1. Select: Choose an organizer that matches the text structure (e.g., Venn Diagram for comparison).",
      "2. Model: Show students how to extract information from text and place it in the organizer.",
      "3. Guide: Fill out the first few sections together.",
      "4. Fade: Provide partially filled organizers, gradually removing support until students can complete it blank."
    ]
  },
  { 
    id: 'sdi-3',
    category: 'Modifications', 
    title: 'Modified Grading', 
    desc: 'Changing the standard grading criteria to account for disability (e.g., grading on progress vs. standard).', 
    tips: 'Ensure this is documented clearly in the IEP to avoid transcript issues.', 
    evidence: 'Equity / Compliance', 
    udl: 'Engagement',
    tags: ['All'],
    steps: [
      "1. Define the essential standards the student MUST meet.",
      "2. Determine if the student is being graded on 'effort', 'progress', or 'modified standards'.",
      "3. Create a rubric specifically for that student.",
      "4. Note 'Modified Curriculum' on report cards if required by district policy."
    ]
  },
  {
    id: 'sdi-4',
    category: 'Behavior',
    title: 'Check-In/Check-Out',
    desc: 'A daily cycle of feedback and encouragement to self-monitor behavior.',
    tips: 'Pick a facilitator the student likes.',
    evidence: 'High Impact (Behavior)',
    udl: 'Engagement',
    tags: ['Behavior', 'Emotional Regulation'],
    steps: [
      "1. Morning Check-In: Student picks up daily point card, reviews goals with adult.",
      "2. Class Feedback: Teachers provide quick feedback/points after each period.",
      "3. Afternoon Check-Out: Review total points, calculate percentage, give reward if earned.",
      "4. Home: Data goes home for parent signature."
    ]
  }
];

// --- Theme Management ---

const getThemeClasses = (theme) => {
  if (theme === 'light') {
    return {
      bg: "bg-slate-50",
      text: "text-slate-800",
      textMuted: "text-slate-500",
      card: "bg-white border border-slate-200 shadow-sm",
      header: "bg-white border-b border-slate-200 shadow-sm",
      input: "bg-white border-slate-300 text-slate-800 focus:ring-indigo-500 focus:border-indigo-500",
      accent: "indigo",
      navActive: "bg-indigo-50 text-indigo-700 font-bold ring-1 ring-indigo-200",
      navInactive: "text-slate-600 hover:bg-slate-100",
      logoText: "text-indigo-700",
      chartGrid: "#e2e8f0",
      chartLine: "#4f46e5", 
    };
  } else {
    // Retro/Dark Mode
    return {
      bg: "bg-slate-950",
      text: "text-slate-200",
      textMuted: "text-slate-500",
      card: "bg-slate-900/60 backdrop-blur-md border border-slate-700/50 shadow-lg",
      header: "bg-slate-900/80 backdrop-blur-md border-b border-slate-800",
      input: "bg-slate-900 border-slate-700 text-slate-200 focus:ring-cyan-500 focus:border-cyan-500",
      accent: "cyan",
      navActive: "bg-slate-800 text-cyan-400 font-bold shadow-sm border border-slate-700",
      navInactive: "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50",
      logoText: "text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400",
      chartGrid: "#334155",
      chartLine: "#22d3ee",
    };
  }
};

// --- Components ---

const Card = ({ children, className = "", theme = 'dark', onClick }) => {
  const styles = getThemeClasses(theme);
  return (
    <div onClick={onClick} className={`rounded-xl overflow-hidden relative ${styles.card} ${className} ${onClick ? 'cursor-pointer hover:scale-[1.01] transition-transform' : ''}`}>
      {theme === 'dark' && (
        <div className="absolute -top-10 -left-10 w-20 h-20 bg-fuchsia-500/10 rounded-full blur-xl pointer-events-none"></div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled = false, theme = 'dark' }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-sm";
  
  const variants = {
    primary: theme === 'dark' 
      ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-[0_0_15px_rgba(192,38,211,0.4)] hover:shadow-[0_0_25px_rgba(192,38,211,0.6)] border border-fuchsia-500/30 hover:scale-[1.02]"
      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    secondary: theme === 'dark'
      ? "bg-transparent text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/10 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)]"
      : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    danger: "bg-red-900/20 text-red-400 border border-red-500/30 hover:bg-red-900/40",
    ghost: theme === 'dark'
      ? "bg-transparent text-slate-400 hover:text-white hover:bg-white/5"
      : "bg-transparent text-slate-600 hover:bg-slate-100",
    ai: theme === 'dark'
      ? "bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_30px_rgba(6,182,212,0.7)] border-none animate-pulse-slow"
      : "bg-violet-600 text-white hover:bg-violet-700 shadow-md",
    premium: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md hover:brightness-110",
    district: theme === 'dark'
      ? "bg-slate-800 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-900/20 shadow-[0_0_10px_rgba(34,211,238,0.1)]"
      : "bg-slate-800 text-white hover:bg-slate-900",
    copy: "w-full py-4 text-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-md flex items-center justify-center gap-3 font-black tracking-widest border border-emerald-500/50"
  };
  
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`}>
      {Icon && <Icon size={variant === 'copy' ? 24 : 18} />}
      {children}
    </button>
  );
};

const Badge = ({ children, color = "blue", icon: Icon, theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const colors = {
    blue: isDark ? "bg-blue-500/10 text-blue-400 border-blue-500/30" : "bg-blue-100 text-blue-700 border-blue-200",
    green: isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-emerald-100 text-emerald-700 border-emerald-200",
    purple: isDark ? "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30" : "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
    amber: isDark ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-amber-100 text-amber-800 border-amber-200",
    indigo: isDark ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" : "bg-indigo-100 text-indigo-700 border-indigo-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 w-fit ${colors[color] || colors.blue}`}>
      {Icon && <Icon size={10} />}
      {children}
    </span>
  );
};

// Custom Dropdown Component
const CustomSelect = ({ options, value, onChange, theme, icon: Icon, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || value;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center w-full px-3 py-2 rounded-lg border cursor-pointer transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-700 hover:border-cyan-500' : 'bg-slate-100 border-slate-200 hover:border-indigo-400'}`}
      >
        {Icon && <Icon size={16} className={`mr-2 ${theme === 'dark' ? 'text-cyan-400' : 'text-indigo-600'}`} />}
        <span className={`flex-1 font-bold text-sm truncate ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
          {label ? `${label}: ${selectedLabel}` : selectedLabel}
        </span>
        <ChevronDown size={14} className="text-slate-500" />
      </div>
      
      {isOpen && (
        <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-xl z-50 max-h-60 overflow-y-auto ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`px-4 py-2 text-sm cursor-pointer transition-colors ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-800 hover:text-cyan-400' : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'} ${value === option.value ? 'font-bold' : ''}`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Toast = ({ message, theme = 'dark' }) => {
  if (!message) return null;
  return (
    <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-xl z-50 animate-fade-in-up flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-800 text-cyan-400 border border-cyan-500/30' : 'bg-slate-800 text-white'}`}>
      <CheckCircle size={18} className={theme === 'dark' ? 'text-fuchsia-400' : 'text-green-400'} />
      <span className="font-bold text-sm">{message}</span>
    </div>
  );
};

const SimpleChart = ({ data, target, theme = 'dark' }) => {
  const styles = getThemeClasses(theme);
  
  if (!data || data.length === 0) return (
    <div className={`h-64 flex items-center justify-center rounded-lg border border-dashed font-mono text-sm ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700 text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-400'}`}>
      [NO_DATA_DETECTED]
    </div>
  );
  
  const height = 300; const width = 600; const padding = 40; const maxScore = 100;
  const getX = (index) => padding + (index * ((width - (padding * 2)) / (data.length - 1 || 1)));
  const getY = (value) => height - (padding + (value / maxScore) * (height - (padding * 2)));
  const points = data.map((d, i) => `${getX(i)},${getY(d.score)}`).join(' ');
  const targetY = getY(target);
  
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className={`w-full h-auto rounded-lg border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={theme === 'dark' ? "#22d3ee" : "#4f46e5"} />
            <stop offset="100%" stopColor={theme === 'dark' ? "#e879f9" : "#818cf8"} />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map(val => (
          <g key={val}>
            <line x1={padding} y1={getY(val)} x2={width - padding} y2={getY(val)} stroke={styles.chartGrid} strokeWidth="1" />
            <text x={padding - 10} y={getY(val) + 4} fontSize="10" textAnchor="end" fill={theme === 'dark' ? "#64748b" : "#94a3b8"} fontFamily="monospace">{val}%</text>
          </g>
        ))}
        {target && (
          <g>
            <line x1={padding} y1={targetY} x2={width - padding} y2={targetY} stroke="#10b981" strokeWidth="1" strokeDasharray="4,4" opacity="0.6" />
            <text x={width - padding + 5} y={targetY + 4} fontSize="10" fill="#10b981" fontWeight="bold" fontFamily="monospace">GOAL:{target}</text>
          </g>
        )}
        <polyline points={points} fill="none" stroke="url(#lineGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <g key={i} className="group cursor-pointer">
            <circle cx={getX(i)} cy={getY(d.score)} r="4" fill={theme === 'dark' ? "#0f172a" : "#ffffff"} stroke={styles.chartLine} strokeWidth="2" className="transition-all duration-200 group-hover:r-6"/>
            <rect x={getX(i) - 35} y={getY(d.score) - 45} width="70" height="30" rx="4" fill="#1e293b" stroke="#334155" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"/>
            <text x={getX(i)} y={getY(d.score) - 26} textAnchor="middle" fontSize="10" fill="#e2e8f0" fontFamily="monospace" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">{d.date}: {d.score}%</text>
          </g>
        ))}
      </svg>
    </div>
  );
};

const PaywallModal = ({ onClose, onUpgrade, onDistrictCode, theme = 'dark' }) => {
  const [view, setView] = useState('individual');
  const [districtCode, setDistrictCode] = useState('');
  const [error, setError] = useState('');
  const handleCodeSubmit = () => { if (districtCode.toUpperCase() === 'PRISM2025') { onDistrictCode(); } else { setError('Invalid District Access Code'); } };
  
  const bgClass = theme === 'dark' ? 'bg-slate-900 border-fuchsia-500/30 text-white' : 'bg-white border-slate-200 text-slate-800';
  const sidebarClass = theme === 'dark' ? 'bg-slate-950 border-r border-slate-800' : 'bg-slate-50 border-r border-slate-200';
  
  return (
    <div className={`fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${theme === 'dark' ? 'bg-slate-950/80' : 'bg-slate-500/50'}`}>
      <div className={`${bgClass} border rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden relative flex flex-col md:flex-row h-[500px]`}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-current transition-colors z-20">✕</button>
        <div className={`w-full md:w-1/3 ${sidebarClass} p-6 flex flex-col gap-2`}>
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Select Plan Type</h3>
          <button onClick={() => setView('individual')} className={`p-4 rounded-xl border text-left transition-all ${view === 'individual' ? (theme === 'dark' ? 'bg-fuchsia-900/20 border-fuchsia-500/50' : 'bg-indigo-50 border-indigo-200') : 'border-transparent'}`}>
             <p className={`font-bold text-sm ${view === 'individual' ? (theme === 'dark' ? 'text-white' : 'text-indigo-700') : 'text-slate-500'}`}>Individual</p>
          </button>
          <button onClick={() => setView('district')} className={`p-4 rounded-xl border text-left transition-all ${view === 'district' ? (theme === 'dark' ? 'bg-cyan-900/20 border-cyan-500/50' : 'bg-cyan-50 border-cyan-200') : 'border-transparent'}`}>
            <p className={`font-bold text-sm ${view === 'district' ? (theme === 'dark' ? 'text-white' : 'text-cyan-700') : 'text-slate-500'}`}>District</p>
          </button>
        </div>
        <div className="flex-1 p-8 relative overflow-y-auto">
           {/* Simplified content for brevity */}
           <h2 className="text-2xl font-black mb-4">{view === 'individual' ? 'Prism Pro' : 'District Access'}</h2>
           {view === 'district' && (
              <div className={`p-4 rounded-xl border mb-6 ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex gap-2">
                  <input type="text" placeholder="ENTER CODE" className={`flex-1 p-2 rounded text-sm outline-none border ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-black'}`} value={districtCode} onChange={(e) => setDistrictCode(e.target.value)} />
                  <button onClick={handleCodeSubmit} className="bg-cyan-600 text-white px-4 rounded text-xs font-bold">Unlock</button>
                </div>
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
              </div>
           )}
           <Button onClick={onUpgrade} variant="premium" className="w-full mt-auto" theme={theme}>Start Trial</Button>
        </div>
      </div>
    </div>
  );
};

const StrategyDetailModal = ({ strategy, onClose, theme = 'dark' }) => {
  if (!strategy) return null;
  const bgClass = theme === 'dark' ? 'bg-slate-900 border-emerald-500/30 text-white' : 'bg-white border-slate-200 text-slate-800';
  return (
    <div className={`fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${theme === 'dark' ? 'bg-slate-950/80' : 'bg-slate-500/50'}`}>
      <div className={`${bgClass} border rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden relative flex flex-col max-h-[80vh] animate-fade-in-up`}>
        <div className={`p-6 border-b flex justify-between items-start ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
          <div>
            <Badge color="green" theme={theme} className="mb-2">{strategy.category}</Badge>
            <h2 className="text-2xl font-black uppercase tracking-wide">{strategy.title}</h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>UDL Focus: {strategy.udl}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest opacity-70 flex items-center gap-2"><BookOpen size={14}/> Definition</h4>
            <p className="text-sm leading-relaxed">{strategy.desc}</p>
          </div>
          <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <h4 className="text-xs font-bold uppercase tracking-widest opacity-70 flex items-center gap-2 mb-3"><ListOrdered size={14}/> Implementation Steps</h4>
            <div className="space-y-3">
              {strategy.steps && strategy.steps.map((step, idx) => (
                <div key={idx} className="text-sm flex gap-3">
                  <span className={`font-mono font-bold ${theme === 'dark' ? 'text-emerald-500' : 'text-emerald-700'}`}>{(idx + 1).toString().padStart(2, '0')}</span>
                  <span>{step.replace(/^\d+\.\s*/, '')}</span> 
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className={`p-3 rounded border ${theme === 'dark' ? 'bg-amber-900/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                <h5 className={`text-xs font-bold uppercase mb-1 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'}`}>Pro Tip</h5>
                <p className="text-xs opacity-80">{strategy.tips}</p>
             </div>
             <div className={`p-3 rounded border ${theme === 'dark' ? 'bg-blue-900/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
                <h5 className={`text-xs font-bold uppercase mb-1 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>Evidence Base</h5>
                <p className="text-xs opacity-80">{strategy.evidence}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryModal = ({ student, plaafp, goal, strategies, parentInput, lre, trackers, onClose, theme }) => {
  const bgClass = theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-800';
  const borderClass = theme === 'dark' ? 'border-slate-800' : 'border-slate-200';
  
  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${theme === 'dark' ? 'bg-slate-950/90' : 'bg-slate-500/50'} backdrop-blur-sm flex justify-center py-8`}>
      <div className={`w-full max-w-4xl ${bgClass} rounded-xl shadow-2xl p-8 relative min-h-[80vh]`}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-black/10 rounded-full print:hidden"><X/></button>
        
        <div className="text-center border-b border-slate-200/20 pb-6 mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">IEP Summary Draft</h1>
          <p className="text-sm opacity-60 font-mono">CONFIDENTIAL: Generated by Prism Path | {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-8">
          {/* I. Profile */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-3 border-b border-slate-500/20 pb-1">I. Student Profile</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded bg-slate-500/5">
              <div><span className="font-bold block text-[10px] opacity-70 uppercase">Name</span> <span className="text-lg font-bold">{student.name}</span></div>
              <div><span className="font-bold block text-[10px] opacity-70 uppercase">Grade</span> <span className="text-lg">{student.grade}</span></div>
              <div><span className="font-bold block text-[10px] opacity-70 uppercase">Primary Need</span> <span className="text-lg">{student.need}</span></div>
              <div><span className="font-bold block text-[10px] opacity-70 uppercase">Next IEP</span> <span className="text-lg font-mono">{student.nextIep}</span></div>
            </div>
          </section>

          {/* II. PLAAFP & Parent Input */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-3 border-b border-slate-500/20 pb-1">II. Present Levels (PLAAFP)</h2>
              <div className={`p-4 rounded-lg border ${borderClass} h-full`}>
                <p className="leading-relaxed font-serif text-sm">{plaafp || "No PLAAFP generated."}</p>
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-3 border-b border-slate-500/20 pb-1">III. Parent Input</h2>
              <div className={`p-4 rounded-lg border ${borderClass} h-full`}>
                <p className="leading-relaxed font-serif text-sm">{parentInput || "No parent input recorded."}</p>
              </div>
            </div>
          </section>

          {/* IV. Goals */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-3 border-b border-slate-500/20 pb-1">IV. Measurable Goals</h2>
            <div className={`p-4 rounded-lg border ${borderClass}`}>
              <div className="flex items-start gap-4">
                <Target className="mt-1 opacity-50" size={20}/>
                <p className="leading-relaxed font-serif font-medium">{goal || "No goal generated."}</p>
              </div>
            </div>
          </section>

          {/* V. Services & Data */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-3 border-b border-slate-500/20 pb-1">V. Services & LRE</h2>
                <div className={`p-4 rounded-lg border ${borderClass}`}>
                   <div className="flex justify-between mb-2">
                      <span className="text-sm">Special Ed Minutes:</span>
                      <span className="font-mono font-bold">{lre?.specialEdMinutes || 0} / week</span>
                   </div>
                   <div className="flex justify-between mb-2">
                      <span className="text-sm">Total School Minutes:</span>
                      <span className="font-mono font-bold">{lre?.totalSchoolMinutes || 0} / week</span>
                   </div>
                   <div className="mt-4 pt-4 border-t border-slate-500/20">
                      <span className="block text-xs uppercase font-bold opacity-70 mb-1">Calculated LRE Percentage</span>
                      <span className="text-2xl font-black">{lre?.percentage ? `${lre.percentage}%` : "N/A"}</span>
                   </div>
                </div>
             </div>
             <div>
                <h2 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-3 border-b border-slate-500/20 pb-1">VI. Progress Data Summary</h2>
                <div className={`p-4 rounded-lg border ${borderClass}`}>
                   <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left opacity-50 border-b border-slate-500/20">
                          <th className="pb-2">Date</th>
                          <th className="pb-2 text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trackers[0].data.slice(-5).map((d, i) => (
                          <tr key={i}>
                            <td className="py-2 font-mono">{d.date}</td>
                            <td className="py-2 text-right font-bold">{d.score}%</td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </section>

          {/* VII. Accommodations */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-3 border-b border-slate-500/20 pb-1">VII. Strategies & Accommodations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {strategies.length > 0 ? strategies.map(s => (
                <div key={s.id} className={`p-3 rounded border flex justify-between items-center ${borderClass}`}>
                  <span className="font-bold text-sm">{s.title}</span>
                  <span className="text-[10px] opacity-70 uppercase border border-slate-500/30 px-2 py-0.5 rounded">{s.category}</span>
                </div>
              )) : <p className="text-sm opacity-50 italic">No strategies saved to plan.</p>}
            </div>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200/20 flex justify-end gap-4 print:hidden">
          <Button onClick={onClose} variant="ghost" theme={theme}>Close</Button>
          <Button onClick={() => window.print()} variant="primary" icon={Printer} theme={theme}>Print / Save PDF</Button>
        </div>
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin, onBack }) => {
  const [district, setDistrict] = useState('');
  const [school, setSchool] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [role, setRole] = useState('Special Education Teacher');
  
  // Dev Bypass
  const handleDevBypass = (isPremium) => { 
    if (!district || !school || !subject || !grade) {
      alert("Please complete your educator profile.");
      return;
    }
    onLogin({ 
      name: isPremium ? "Pro Teacher" : "Free Teacher", 
      email: isPremium ? "pro@demo.edu" : "free@demo.edu", 
      picture: null, 
      isPremium: isPremium,
      district,
      school,
      subject,
      grade,
      role
    }); 
  };
  
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-700 shadow-[0_0_20px_rgba(34,211,238,0.2)]"><GraduationCap className="text-cyan-400" size={32} /></div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-cyan-300 uppercase tracking-widest mb-1">Prism Path</h1>
          <p className="text-xs text-slate-500 font-mono">SECURE EDUCATOR TERMINAL</p>
        </div>
        
        <div className="p-8 space-y-4">
          <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-cyan-400 uppercase mb-1">District</label>
                <input type="text" className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-200 focus:border-cyan-500 outline-none focus:ring-0" placeholder="e.g. Fayette County" value={district} onChange={e => setDistrict(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-cyan-400 uppercase mb-1">School</label>
                <input type="text" className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-200 focus:border-cyan-500 outline-none focus:ring-0" placeholder="e.g. Lincoln Elementary" value={school} onChange={e => setSchool(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-fuchsia-400 uppercase mb-1">Subject</label>
                  <input type="text" className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-200 focus:border-fuchsia-500 outline-none focus:ring-0" placeholder="e.g. Math" value={subject} onChange={e => setSubject(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-fuchsia-400 uppercase mb-1">Grade</label>
                  <input type="text" className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-200 focus:border-fuchsia-500 outline-none focus:ring-0" placeholder="e.g. 3rd" value={grade} onChange={e => setGrade(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-400 uppercase mb-1">Role</label>
                <div className="relative">
                  <select 
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-slate-200 focus:border-emerald-500 outline-none appearance-none focus:ring-0"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                  >
                    <option className="bg-slate-900 text-slate-200">Special Education Teacher</option>
                    <option className="bg-slate-900 text-slate-200">General Education Teacher</option>
                    <option className="bg-slate-900 text-slate-200">Administrator</option>
                    <option className="bg-slate-900 text-slate-200">Related Service Provider</option>
                    <option className="bg-slate-900 text-slate-200">Other Educator</option>
                  </select>
                  <ChevronDown size={14} className="text-slate-500 pointer-events-none absolute right-3 top-3" />
                </div>
              </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
              <p className="text-[10px] text-slate-500 text-center mb-3">DEV BYPASS (Requires Fields Above)</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleDevBypass(false)} className="text-[10px] text-slate-400 py-3 border border-slate-700 rounded hover:bg-slate-800 uppercase tracking-wider">Free Tier</button>
                <button onClick={() => handleDevBypass(true)} className="text-[10px] text-amber-500 py-3 border border-amber-900/30 bg-amber-900/10 rounded hover:bg-amber-900/20 uppercase tracking-wider font-bold">Pro Tier</button>
              </div>
          </div>
        </div>
        
        {/* ADDED: Back to Home Button */}
        <div className="px-8 pb-8">
          <button onClick={onBack} className="w-full py-2 text-slate-500 text-xs hover:text-white transition-colors">← Back to Main Site</button>
        </div>
      </div>
    </div>
  );
};

// --- Main Application ---

export default function TeacherDashboard({ onBack }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('home');
  const [subTab, setSubTab] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  
  // Student State
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [currentStudentId, setCurrentStudentId] = useState(1);
  const activeStudent = students.find(s => s.id === currentStudentId) || students[0];
  
  // Compliance Editing State
  const [isEditingCompliance, setIsEditingCompliance] = useState(false);
  const [complianceDates, setComplianceDates] = useState({ nextIep: activeStudent.nextIep, nextReeval: activeStudent.nextReeval });

  // Parent Input State
  const [parentInput, setParentInput] = useState({ topic: 'General', script: '', response: '', formatted: '' });

  const [plaafp, setPlaafp] = useState({ 
    name: activeStudent.name, 
    area: 'General', 
    strength: activeStudent.strength, 
    need: activeStudent.need, 
    data: '', 
    impact: '' 
  });
  
  const [goalInputs, setGoalInputs] = useState({ student: activeStudent.name, timeframe: 'By end of year', condition: 'given a text', behavior: 'will answer', criteria: '80%', measurement: 'probes', baseline: '45%' });
  const [generatedPlaafp, setGeneratedPlaafp] = useState('');
  const [generatedGoal, setGeneratedGoal] = useState('');
  const [savedStrategies, setSavedStrategies] = useState([]);
  const [trackers, setTrackers] = useState([{ id: 1, name: `${activeStudent.name} - ${activeStudent.need}`, target: 80, data: [{ date: '10/01', score: 45 }, { date: '10/22', score: 60 }] }]);
  const [selectedTracker, setSelectedTracker] = useState(trackers[0].id);
  const [newDataPoint, setNewDataPoint] = useState({ date: '', score: '' });
  const [sdiFilter, setSdiFilter] = useState('all');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  
  // New State for Services/LRE Calculator
  const [serviceMinutes, setServiceMinutes] = useState({
    totalSchoolMinutes: 1800, // Weekly (e.g. 6 hours * 5 days)
    specialEdMinutes: 300 // e.g. 60 mins x 5 days
  });
  const [lreResult, setLreResult] = useState(null);

  useEffect(() => {
    setPlaafp({ 
      name: activeStudent.name, 
      area: 'General', 
      strength: activeStudent.strength, 
      need: activeStudent.need, 
      data: '', 
      impact: '' 
    });
    setGoalInputs(prev => ({ ...prev, student: activeStudent.name }));
    setTrackers([{ id: 1, name: `${activeStudent.name} - ${activeStudent.need}`, target: 80, data: [{ date: '10/01', score: 45 }] }]);
    setComplianceDates({ nextIep: activeStudent.nextIep, nextReeval: activeStudent.nextReeval });
    setSavedStrategies([]);
    setNotification(`Switched to ${activeStudent.name}`);
    setTimeout(() => setNotification(null), 3000);
  }, [currentStudentId]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const handleUpgrade = () => { alert("Redirecting to Stripe..."); setUser({ ...user, isPremium: true, plan: 'individual' }); setShowPaywall(false); };
  const handleDistrictUnlock = () => { setUser({ ...user, isPremium: true, plan: 'district' }); setShowPaywall(false); };
  const showNotification = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

  const handleAiAutoFill = (type) => {
    if (!user.isPremium) { setShowPaywall(true); return; }
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      if (type === 'goal') {
        let suggested = {};
        if (activeStudent.need.includes("Reading")) {
          suggested = { condition: "given a grade-level passage", behavior: "will decode multisyllabic words", criteria: "90% accuracy" };
        } else if (activeStudent.need.includes("Math")) {
          suggested = { condition: "given 10 mixed calculation problems", behavior: "will solve using standard algorithm", criteria: "8/10 correct" };
        } else {
          suggested = { condition: "given a stressful situation", behavior: "will use a self-regulation strategy", criteria: "in 4/5 opportunities" };
        }
        setGoalInputs(prev => ({ ...prev, ...suggested }));
        showNotification("AI generated goal based on student needs");
      }
    }, 1000);
  };

  const handleRecommendStrategies = () => {
    if (sdiFilter === 'recommended') {
      setSdiFilter('all');
    } else {
      setSdiFilter('recommended');
      showNotification(`Showing strategies for ${activeStudent.need}`);
    }
  };

  const handleToggleSaveStrategy = (strategy) => {
    if (savedStrategies.find(s => s.id === strategy.id)) {
      setSavedStrategies(prev => prev.filter(s => s.id !== strategy.id));
      showNotification("Strategy removed from plan");
    } else {
      setSavedStrategies(prev => [...prev, strategy]);
      showNotification("Strategy saved to student plan");
    }
  };

  const handleCopyStrategies = () => {
    const text = savedStrategies.map(s => `- ${s.title}: ${s.desc}`).join('\n');
    copyToClipboard(text);
  };

  const handleAddAssessment = (name) => {
    const newData = plaafp.data ? `${plaafp.data}, ${name}` : name;
    setPlaafp(prev => ({ ...prev, data: newData }));
    showNotification(`Added ${name} to Data Sources`);
  };

  const handleSelectImpact = (text) => {
    setPlaafp({ ...plaafp, impact: text });
    showNotification("Impact Statement Updated");
  };
  
  const calculateLRE = () => {
    const regularEdMinutes = serviceMinutes.totalSchoolMinutes - serviceMinutes.specialEdMinutes;
    const percentage = (regularEdMinutes / serviceMinutes.totalSchoolMinutes) * 100;
    setLreResult(percentage.toFixed(1));
  };

  const generatePlaafp = () => { setGeneratedPlaafp(`Current data indicates that ${plaafp.name} ${plaafp.strength}. However, ${plaafp.name} ${plaafp.need}, as evidenced by ${plaafp.data}. ${plaafp.impact}`); };
  const generateSmartGoal = () => { setGeneratedGoal(`${goalInputs.timeframe}, ${goalInputs.student} ${goalInputs.condition}, ${goalInputs.behavior} with ${goalInputs.criteria} as measured by ${goalInputs.measurement}.`); };
  const addDataPoint = () => { 
    if (!newDataPoint.date || !newDataPoint.score) return;
    const updated = trackers.map(t => t.id === selectedTracker ? { ...t, data: [...t.data, { date: newDataPoint.date, score: parseInt(newDataPoint.score) }] } : t);
    setTrackers(updated); setNewDataPoint({ date: '', score: '' });
  };
  const runAiAnalysis = () => {
    if (!user.isPremium) { setShowPaywall(true); return; }
    setIsAnalyzing(true);
    setTimeout(() => {
      setAiAnalysis({ score: 92, coherence: [{ item: "Alignment", status: "pass", msg: "Goal aligns with deficit." }], research: "Hattie (2018): Direct Instruction d=0.60" });
      setIsAnalyzing(false);
    }, 1500);
  };
  const copyToClipboard = (text) => { 
    // Fallback for iframe/permissions issues
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Ensure it's not visible but part of the DOM
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        showNotification("Copied to Documentation");
      } else {
        showNotification("Copy failed. Please copy manually.");
      }
    } catch (err) {
      console.error('Fallback copy failed', err);
      showNotification("Copy failed. Please copy manually.");
    }
  };

  const handleSaveCompliance = () => {
    const updatedStudents = students.map(s => 
      s.id === currentStudentId 
        ? { ...s, nextIep: complianceDates.nextIep, nextReeval: complianceDates.nextReeval }
        : s
    );
    setStudents(updatedStudents);
    setIsEditingCompliance(false);
    showNotification("Compliance dates updated");
  };

  const handleGenerateParentScript = () => {
    const script = `Dear [Parent Name],\n\nI am currently gathering information for ${activeStudent.name}'s upcoming IEP meeting. As a valued member of the IEP team, your input is vital.\n\nCould you please share your thoughts regarding ${activeStudent.name}'s progress in ${parentInput.topic.toLowerCase()}? specifically:\n\n1. What strengths have you noticed at home?\n2. Do you have any specific concerns in this area?\n3. Are there any new goals you would like us to consider?\n\nThank you for your partnership,\n\n${user.name}`;
    setParentInput(prev => ({ ...prev, script }));
  };

  const handleFormatParentResponse = () => {
    if (!parentInput.response) return;
    const formatted = `Parent Input:\nWhen asked about ${parentInput.topic.toLowerCase()}, the parent reported: "${parentInput.response}"`;
    setParentInput(prev => ({ ...prev, formatted }));
  };

  const styles = getThemeClasses(theme);

  const getFilteredSDI = () => {
    if (sdiFilter === 'recommended') {
      const need = activeStudent.need.toLowerCase();
      if (need.includes('reading')) return SDI_RESOURCES.filter(s => s.tags.includes('Reading'));
      if (need.includes('math')) return SDI_RESOURCES.filter(s => s.tags.includes('Math'));
      if (need.includes('emotion') || need.includes('behavior')) return SDI_RESOURCES.filter(s => s.tags.includes('Behavior') || s.tags.includes('Emotional Regulation'));
      return SDI_RESOURCES;
    }
    return sdiFilter === 'all' ? SDI_RESOURCES : SDI_RESOURCES.filter(s => s.category === sdiFilter);
  };
  
  const currentStrategies = getFilteredSDI();

  if (!user) return <LoginScreen onLogin={setUser} onBack={onBack} />;

  const renderHome = () => (
    <div className="space-y-8 animate-fade-in">
      {/* Compliance Snapshot */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-6 ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-slate-800 text-cyan-400' : 'bg-slate-100 text-indigo-600'}`}>
            <User size={24} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${styles.text}`}>Compliance Status: {activeStudent.name}</h2>
            <p className={`text-sm ${styles.textMuted}`}>Next actions required for caseload compliance.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           {isEditingCompliance ? (
             <div className="flex gap-4 items-end">
               <div>
                 <label className={`block text-[10px] uppercase font-bold mb-1 ${styles.textMuted}`}>IEP Due</label>
                 <input type="date" className={`p-2 rounded text-sm outline-none border ${styles.input}`} value={complianceDates.nextIep} onChange={(e) => setComplianceDates({...complianceDates, nextIep: e.target.value})} />
               </div>
               <div>
                 <label className={`block text-[10px] uppercase font-bold mb-1 ${styles.textMuted}`}>Re-Eval Due</label>
                 <input type="date" className={`p-2 rounded text-sm outline-none border ${styles.input}`} value={complianceDates.nextReeval} onChange={(e) => setComplianceDates({...complianceDates, nextReeval: e.target.value})} />
               </div>
               <button onClick={handleSaveCompliance} className="p-2 bg-emerald-600 text-white rounded hover:bg-emerald-500"><Check size={16}/></button>
             </div>
           ) : (
             <>
               <div className={`px-6 py-3 rounded-xl border text-center min-w-[140px] ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Annual Review Due</p>
                  <div className="flex items-center justify-center gap-2">
                      <Calendar size={16} className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} />
                      <span className={`font-mono font-bold ${styles.text}`}>{activeStudent.nextIep}</span>
                  </div>
               </div>
               <div className={`px-6 py-3 rounded-xl border text-center min-w-[140px] ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Re-Eval Due</p>
                  <div className="flex items-center justify-center gap-2">
                      <Clock size={16} className={theme === 'dark' ? 'text-amber-400' : 'text-amber-600'} />
                      <span className={`font-mono font-bold ${styles.text}`}>{activeStudent.nextReeval}</span>
                  </div>
               </div>
               <button onClick={() => setIsEditingCompliance(true)} className={`p-2 rounded-full hover:bg-white/10 transition-colors ${styles.textMuted}`}><Edit2 size={16}/></button>
             </>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { id: 'identify', label: 'Identify', sub: 'wizard', icon: FileText, desc: 'Present Levels & Needs', color: 'fuchsia' },
          { id: 'develop', label: 'Develop', sub: 'wizard', icon: Target, desc: 'Goals & Data Tracking', color: 'cyan' },
          { id: 'discover', label: 'Discover', sub: 'sdi', icon: BookOpen, desc: 'Strategies & UDL', color: 'emerald' }
        ].map(item => (
          <div 
            key={item.id}
            onClick={() => { setActiveTab(item.id); setSubTab(item.sub); }}
            className={`group relative h-80 rounded-2xl border overflow-hidden transition-all cursor-pointer ${theme === 'dark' ? `bg-slate-900/50 border-${item.color}-500/30 hover:border-${item.color}-500 hover:shadow-[0_0_30px_rgba(var(--color-${item.color}-500),0.2)]` : 'bg-white border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-300'}`}
          >
            {theme === 'dark' && <div className={`absolute inset-0 bg-gradient-to-b from-${item.color}-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>}
            <div className="p-8 h-full flex flex-col items-center justify-center text-center relative z-10">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 border transition-transform group-hover:scale-110 ${theme === 'dark' ? `bg-${item.color}-500/10 border-${item.color}-500/50` : 'bg-slate-50 border-slate-200'}`}>
                <item.icon className={theme === 'dark' ? `text-${item.color}-400` : 'text-slate-700'} size={32} />
              </div>
              <h2 className={`text-2xl font-black uppercase tracking-wider mb-2 ${styles.text}`}>{item.label}</h2>
              <p className={`text-sm font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? `text-${item.color}-200/70` : 'text-indigo-600'}`}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans pb-20 ${styles.bg} ${styles.text}`}>
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} onUpgrade={handleUpgrade} onDistrictCode={handleDistrictUnlock} theme={theme} />}
      {showSummary && (
        <SummaryModal 
          student={activeStudent} 
          plaafp={generatedPlaafp} 
          goal={generatedGoal} 
          strategies={savedStrategies} 
          parentInput={parentInput.formatted}
          lre={{ ...serviceMinutes, percentage: lreResult }}
          trackers={trackers}
          onClose={() => setShowSummary(false)} 
          theme={theme} 
        />
      )}
      {selectedStrategy && <StrategyDetailModal strategy={selectedStrategy} onClose={() => setSelectedStrategy(null)} theme={theme} />}
      <Toast message={notification} theme={theme} />
      
      <header className={`sticky top-0 z-40 ${styles.header}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Nav (Left) */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className={`p-2 rounded-lg text-white ${theme === 'dark' ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-indigo-600'}`}><Layout size={20} /></div>
              <div className="hidden lg:block">
                <h1 className={`text-xl font-black tracking-widest uppercase ${styles.logoText}`}>Prism Path</h1>
              </div>
            </div>

            {/* Core Workflow Nav - Prominently Placed */}
            <div className={`hidden md:flex gap-1 p-1 rounded-lg border ${theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
               <button onClick={() => { setActiveTab('identify'); setSubTab('wizard'); }} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${activeTab === 'identify' ? styles.navActive : styles.navInactive}`}><FileText size={14}/> Identify</button>
               <button onClick={() => { setActiveTab('develop'); setSubTab('wizard'); }} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${activeTab === 'develop' ? styles.navActive : styles.navInactive}`}><Target size={14}/> Develop</button>
               <button onClick={() => { setActiveTab('discover'); setSubTab('sdi'); }} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${activeTab === 'discover' ? styles.navActive : styles.navInactive}`}><BookOpen size={14}/> Discover</button>
            </div>
          </div>

          {/* Student Selector (Center) */}
          <div className="flex-1 max-w-xs mx-4 hidden sm:block">
            <CustomSelect 
              value={currentStudentId} 
              onChange={setCurrentStudentId} 
              theme={theme}
              icon={User}
              options={students.map(s => ({ value: s.id, label: s.name }))}
            />
          </div>

          {/* Tools & Profile (Right) */}
          <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowSummary(true)}
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider border transition-colors ${theme === 'dark' ? 'border-fuchsia-500/50 text-fuchsia-400 hover:bg-fuchsia-500/10' : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}
              >
                 <ClipboardList size={14} /> Compile Summary
              </button>

              <div className="h-8 w-[1px] bg-slate-700/50 hidden md:block mx-1"></div>

              <div className="flex items-center gap-2">
                <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`}>
                   {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                
                {/* Profile Block */}
                <div className="text-right hidden sm:block">
                  <p className={`text-xs font-bold ${styles.text}`}>{user.name}</p>
                  <div className="flex flex-col items-end gap-0.5 text-[10px] text-slate-500 font-mono">
                    <span>{user.role}</span>
                    <span>{user.school}</span>
                  </div>
                </div>

                <button onClick={() => setUser(null)} className={`p-2 transition-colors ${theme === 'dark' ? 'text-slate-600 hover:text-red-400' : 'text-slate-400 hover:text-red-600'}`}><LogOut size={18} /></button>
              </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'identify' && (
          <div className="animate-fade-in space-y-6">
            <div className="flex gap-2 border-b border-slate-700/50 pb-2 mb-4 overflow-x-auto">
              {['wizard', 'assessments', 'impact', 'parent'].map(t => (
                <button key={t} onClick={() => setSubTab(t)} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider ${subTab === t ? (theme === 'dark' ? 'bg-fuchsia-500 text-white' : 'bg-indigo-600 text-white') : 'text-slate-500 hover:text-current'}`}>
                  {t === 'wizard' ? 'PLAAFP Wizard' : t === 'assessments' ? 'Assessment Library' : t === 'impact' ? 'Impact Generator' : 'Parent Input'}
                </button>
              ))}
            </div>
            {/* ... Existing Tabs ... */}
            {subTab === 'wizard' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card theme={theme} className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-lg font-bold flex items-center gap-2 uppercase tracking-wide ${styles.text}`}><FileText className={theme==='dark' ? 'text-fuchsia-400' : 'text-indigo-600'} /> PLAAFP Builder</h3>
                    <div className="text-xs bg-fuchsia-500/10 text-fuchsia-500 px-2 py-1 rounded border border-fuchsia-500/20 font-mono">Student: {activeStudent.name}</div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className={`block text-[10px] uppercase font-bold mb-1 ${styles.textMuted}`}>Strength</label><input type="text" className={`w-full p-2 rounded outline-none ${styles.input}`} placeholder="Strength" value={plaafp.strength} onChange={e => setPlaafp({...plaafp, strength: e.target.value})} /></div>
                      <div><label className={`block text-[10px] uppercase font-bold mb-1 ${styles.textMuted}`}>Specific Need</label><input type="text" className={`w-full p-2 rounded outline-none ${styles.input}`} placeholder="Need/Deficit" value={plaafp.need} onChange={e => setPlaafp({...plaafp, need: e.target.value})} /></div>
                    </div>
                    <div>
                      <label className={`block text-[10px] uppercase font-bold mb-1 ${styles.textMuted}`}>Data Sources</label>
                      <div className="flex gap-2">
                        <input type="text" className={`flex-1 p-2 rounded outline-none ${styles.input}`} placeholder="Add assessments..." value={plaafp.data} onChange={e => setPlaafp({...plaafp, data: e.target.value})} />
                        <div className="w-40">
                          <CustomSelect 
                            options={ASSESSMENT_LIBRARY.map(a => ({ value: a.name, label: a.name }))}
                            value=""
                            onChange={handleAddAssessment}
                            theme={theme}
                            label="Add"
                          />
                        </div>
                      </div>
                    </div>
                    <div><label className={`block text-[10px] uppercase font-bold mb-1 ${styles.textMuted}`}>Impact Statement</label><textarea className={`w-full p-2 rounded outline-none h-24 ${styles.input}`} placeholder="How does this disability affect involvement..." value={plaafp.impact} onChange={e => setPlaafp({...plaafp, impact: e.target.value})} /></div>
                    <Button onClick={generatePlaafp} className="w-full mt-4" icon={Brain} theme={theme}>Compile Narrative</Button>
                  </div>
                </Card>
                <Card theme={theme} className={`p-6 ${theme === 'dark' ? 'bg-slate-900/40' : 'bg-slate-50'}`}>
                  <h3 className={`text-lg font-bold mb-6 uppercase tracking-wide ${styles.text}`}>Output</h3>
                  <div className={`p-6 rounded border ${theme === 'dark' ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'} font-serif leading-relaxed min-h-[150px]`}>"{generatedPlaafp || "Awaiting input..."}"</div>
                  {generatedPlaafp && (<div className="mt-4"><Button onClick={() => copyToClipboard(generatedPlaafp)} variant="copy" icon={Copy}>Copy to Documentation</Button></div>)}
                </Card>
              </div>
            )}
            {/* ... Other tabs ... */}
            {subTab === 'assessments' && (
              <Card theme={theme} className="p-6">
                <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-wide ${styles.text}`}><Library className={theme === 'dark' ? 'text-fuchsia-400' : 'text-indigo-600'} /> Assessment Library</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{ASSESSMENT_LIBRARY.map((a, i) => (<div key={i} className={`p-4 rounded border transition-colors ${theme === 'dark' ? 'bg-slate-950 border-slate-800 hover:border-fuchsia-500/50' : 'bg-white border-slate-200 hover:border-indigo-400'}`}><div className="flex justify-between items-start mb-2"><h4 className={`font-bold ${styles.text}`}>{a.name}</h4><Badge color="purple" theme={theme}>{a.type}</Badge></div><p className={`text-xs mb-3 ${styles.textMuted}`}>{a.desc}</p><Button onClick={() => handleAddAssessment(a.name)} variant="secondary" theme={theme} className="w-full text-xs py-1" icon={Plus}>Add to Data Source</Button></div>))}</div>
              </Card>
            )}
            {subTab === 'impact' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card theme={theme} className="p-6">
                  <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-wide ${styles.text}`}><Compass className={theme === 'dark' ? 'text-fuchsia-400' : 'text-indigo-600'} /> Impact Templates</h3>
                  <div className="space-y-3">{IMPACT_TEMPLATES.map((t, i) => (<div key={i} onClick={() => handleSelectImpact(t.text)} className={`p-3 border rounded cursor-pointer group ${theme === 'dark' ? 'bg-slate-950 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}><div className="flex justify-between mb-1"><span className={`font-bold text-sm ${theme === 'dark' ? 'text-fuchsia-400 group-hover:text-fuchsia-300' : 'text-indigo-600 group-hover:text-indigo-700'}`}>{t.label}</span><ArrowRight size={14} className={styles.textMuted}/></div><p className={`text-xs line-clamp-2 ${styles.textMuted}`}>{t.text}</p></div>))}</div>
                </Card>
                <Card theme={theme} className="p-6"><h3 className={`text-lg font-bold mb-4 uppercase tracking-wide ${styles.text}`}>Current Impact Statement</h3><textarea className={`w-full p-4 rounded h-48 outline-none ${styles.input}`} value={plaafp.impact} onChange={(e) => setPlaafp({...plaafp, impact: e.target.value})} placeholder="Select a template or type here..."/></Card>
              </div>
            )}
            {/* New Parent Input Tab */}
            {subTab === 'parent' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card theme={theme} className="p-6">
                  <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 uppercase tracking-wide ${styles.text}`}><Mail className={theme==='dark' ? 'text-fuchsia-400' : 'text-indigo-600'} /> Parent Input Generator</h3>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-[10px] uppercase font-bold mb-1 ${styles.textMuted}`}>Concern Area</label>
                      <CustomSelect 
                        options={[{value: 'Reading', label: 'Reading'}, {value: 'Math', label: 'Math'}, {value: 'Behavior', label: 'Behavior'}, {value: 'Social Skills', label: 'Social Skills'}, {value: 'General', label: 'General'}]}
                        value={parentInput.topic}
                        onChange={(val) => setParentInput({...parentInput, topic: val})}
                        theme={theme}
                      />
                    </div>
                    <Button onClick={handleGenerateParentScript} className="w-full mt-2" icon={Mail} theme={theme}>Generate Email Script</Button>
                    
                    {parentInput.script && (
                      <div className={`mt-4 p-4 rounded text-sm whitespace-pre-wrap border ${theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                        {parentInput.script}
                        <div className="mt-2 pt-2 border-t border-slate-700/20">
                          <Button onClick={() => copyToClipboard(parentInput.script)} variant="ghost" className="w-full text-xs" icon={Copy} theme={theme}>Copy Email</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
                <Card theme={theme} className="p-6">
                  <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 uppercase tracking-wide ${styles.text}`}><MessageSquare className={theme==='dark' ? 'text-fuchsia-400' : 'text-indigo-600'} /> Summarize Response</h3>
                  <div className="space-y-4">
                    <textarea 
                      className={`w-full p-4 rounded h-32 outline-none ${styles.input}`} 
                      placeholder="Paste parent's email response here..."
                      value={parentInput.response}
                      onChange={(e) => setParentInput({...parentInput, response: e.target.value})}
                    />
                    <Button onClick={handleFormatParentResponse} className="w-full" icon={Brain} theme={theme}>Format for IEP</Button>
                    {parentInput.formatted && (
                      <div className={`mt-4 p-4 rounded text-sm border ${theme === 'dark' ? 'bg-slate-950 border-slate-800 text-emerald-400' : 'bg-white border-slate-200 text-emerald-700'}`}>
                        {parentInput.formatted}
                        <div className="mt-2">
                          <Button onClick={() => copyToClipboard(parentInput.formatted)} variant="copy" icon={Copy} theme={theme}>Copy to Documentation</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* DEVELOP TAB */}
        {activeTab === 'develop' && (
          <div className="animate-fade-in space-y-6">
             <div className="flex gap-2 border-b border-slate-700/50 pb-2 mb-4 overflow-x-auto">
              {['wizard', 'tracker', 'services'].map(t => (<button key={t} onClick={() => setSubTab(t)} className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider ${subTab === t ? (theme === 'dark' ? 'bg-cyan-500 text-white' : 'bg-indigo-600 text-white') : 'text-slate-500 hover:text-current'}`}>{t === 'wizard' ? 'Goal Wizard' : t === 'tracker' ? 'Data Tracker' : 'Services & LRE'}</button>))}
            </div>
            {subTab === 'wizard' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card theme={theme} className="p-6">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className={`text-lg font-bold flex items-center gap-2 uppercase tracking-wide ${styles.text}`}><Target className={theme==='dark' ? 'text-cyan-400' : 'text-indigo-600'} /> Goal Generator</h3>
                      <button onClick={() => handleAiAutoFill('goal')} className={`text-xs flex items-center gap-1 px-3 py-1 rounded font-bold border transition-colors ${theme === 'dark' ? 'bg-fuchsia-900/20 text-fuchsia-400 border-fuchsia-500/50 hover:bg-fuchsia-900/40' : 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-200'}`}><Wand2 size={12} /> ✨ Draft with AI</button>
                   </div>
                   <div className="space-y-4">
                      <input type="text" className={`w-full p-2 rounded outline-none ${styles.input}`} placeholder="Condition (Given what?)" value={goalInputs.condition} onChange={e => setGoalInputs({...goalInputs, condition: e.target.value})} />
                      <input type="text" className={`w-full p-2 rounded outline-none ${styles.input}`} placeholder="Behavior (Will do what?)" value={goalInputs.behavior} onChange={e => setGoalInputs({...goalInputs, behavior: e.target.value})} />
                      <input type="text" className={`w-full p-2 rounded outline-none ${styles.input}`} placeholder="Criteria (How well?)" value={goalInputs.criteria} onChange={e => setGoalInputs({...goalInputs, criteria: e.target.value})} />
                      {isAnalyzing && <div className="text-xs text-fuchsia-500 animate-pulse">AI is generating goal based on {activeStudent.need}...</div>}
                      <Button onClick={generateSmartGoal} className="w-full mt-4" icon={ArrowRight} theme={theme}>Generate</Button>
                   </div>
                 </Card>
                 <Card theme={theme} className={`p-6 ${theme === 'dark' ? 'bg-slate-900/40' : 'bg-slate-50'}`}>
                   <h3 className={`text-lg font-bold mb-6 uppercase tracking-wide ${styles.text}`}>Draft</h3>
                   <div className={`p-6 rounded border ${theme === 'dark' ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'} font-serif min-h-[150px]`}>"{generatedGoal || "Awaiting inputs..."}"</div>
                   {generatedGoal && (<div className="mt-4"><Button onClick={() => copyToClipboard(generatedGoal)} variant="copy" icon={Copy}>Copy to Documentation</Button></div>)}
                 </Card>
              </div>
            )}
            {subTab === 'tracker' && (
               <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className={`text-2xl font-black ${styles.text}`}>{trackers[0].name}</h2>
                    <Button onClick={() => window.print()} variant="secondary" icon={FileDown} theme={theme}>Print / Save PDF</Button>
                  </div>
                  <Card theme={theme} className="p-6">
                     <SimpleChart data={trackers[0].data} target={trackers[0].target} theme={theme} />
                  </Card>
                  <Card theme={theme} className="p-6">
                    <h4 className={`font-bold mb-4 flex items-center gap-2 uppercase tracking-wide text-sm ${styles.text}`}><Plus size={16}/> Log New Data</h4>
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className={`block text-[10px] uppercase font-bold mb-1 ${styles.textMuted}`}>Date</label>
                        <input type="date" className={`w-full p-2 rounded outline-none border ${styles.input}`} value={newDataPoint.date} onChange={(e) => setNewDataPoint({...newDataPoint, date: e.target.value})} />
                      </div>
                      <div className="flex-1">
                        <label className={`block text-[10px] uppercase font-bold mb-1 ${styles.textMuted}`}>Score (%)</label>
                        <input type="number" className={`w-full p-2 rounded outline-none border ${styles.input}`} placeholder="0-100" value={newDataPoint.score} onChange={(e) => setNewDataPoint({...newDataPoint, score: e.target.value})} />
                      </div>
                      <Button onClick={addDataPoint} icon={Save} theme={theme}>Log</Button>
                    </div>
                  </Card>
               </div>
            )}
            {subTab === 'services' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card theme={theme} className="p-6">
                  <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 uppercase tracking-wide ${styles.text}`}><Calculator className={theme==='dark' ? 'text-cyan-400' : 'text-indigo-600'} /> LRE Calculator</h3>
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-[10px] uppercase font-bold mb-1 ${styles.textMuted}`}>Total School Minutes (Weekly)</label>
                      <input type="number" className={`w-full p-2 rounded outline-none ${styles.input}`} value={serviceMinutes.totalSchoolMinutes} onChange={e => setServiceMinutes({...serviceMinutes, totalSchoolMinutes: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className={`block text-[10px] uppercase font-bold mb-1 ${styles.textMuted}`}>Special Ed Minutes (Weekly)</label>
                      <input type="number" className={`w-full p-2 rounded outline-none ${styles.input}`} value={serviceMinutes.specialEdMinutes} onChange={e => setServiceMinutes({...serviceMinutes, specialEdMinutes: Number(e.target.value)})} />
                    </div>
                    <Button onClick={calculateLRE} className="w-full mt-4" icon={Calculator} theme={theme}>Calculate Percentage</Button>
                  </div>
                </Card>
                <Card theme={theme} className="p-6 flex flex-col justify-center items-center text-center">
                  <h3 className={`text-lg font-bold mb-2 uppercase tracking-wide ${styles.text}`}>Time in Regular Class</h3>
                  {lreResult ? (
                    <div className="animate-fade-in-up w-full">
                      <div className={`text-6xl font-black mb-2 ${Number(lreResult) >= 80 ? (theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600') : (theme === 'dark' ? 'text-amber-400' : 'text-amber-600')}`}>
                        {lreResult}%
                      </div>
                      <p className={`text-sm font-bold uppercase tracking-widest mb-6 ${styles.textMuted}`}>
                        {Number(lreResult) >= 80 ? "Inside Regular Class (80% or more)" : Number(lreResult) >= 40 ? "Resource Room (40-79%)" : "Separate Class (<40%)"}
                      </p>
                      <Button onClick={() => copyToClipboard(`LRE Calculation:\nTotal School Minutes: ${serviceMinutes.totalSchoolMinutes}\nSpecial Ed Minutes: ${serviceMinutes.specialEdMinutes}\nPercentage in Regular Class: ${lreResult}%\nPlacement: ${Number(lreResult) >= 80 ? "Inside Regular Class (80% or more)" : Number(lreResult) >= 40 ? "Resource Room (40-79%)" : "Separate Class (<40%)"}`)} variant="copy" icon={Copy}>Copy to Documentation</Button>
                    </div>
                  ) : (
                    <div className={`text-sm ${styles.textMuted}`}>Enter minutes to calculate LRE.</div>
                  )}
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === 'discover' && (
          <div className="animate-fade-in space-y-6">
            <Card theme={theme} className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-lg font-bold flex items-center gap-2 uppercase tracking-wide ${styles.text}`}><BookOpen className={theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} /> Strategies & UDL Index</h3>
                  <div className="flex gap-2 items-center">
                    <button onClick={handleRecommendStrategies} className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-2 ${sdiFilter === 'recommended' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-none shadow-lg' : (theme === 'dark' ? 'border-slate-700 text-slate-500 hover:text-white' : 'border-slate-300 text-slate-500 hover:text-slate-800')}`}><Sparkles size={12} /> Recommended for {activeStudent.name.split(' ')[0]}</button>
                    <div className="h-4 w-[1px] bg-slate-700 mx-1"></div>
                    {['all', 'Instruction', 'Accommodations', 'Modifications'].map(filter => (<button key={filter} onClick={() => setSdiFilter(filter)} className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors ${sdiFilter === filter ? (theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-emerald-100 text-emerald-700 border-emerald-300') : (theme === 'dark' ? 'border-slate-700 text-slate-500 hover:text-white' : 'border-slate-300 text-slate-500 hover:text-slate-800')}`}>{filter}</button>))}
                  </div>
                </div>
                <div className="mb-4 flex justify-end">
                   {savedStrategies.length > 0 && (
                     <Button onClick={() => copyToClipboard(savedStrategies.map(s => `- ${s.title}: ${s.desc}`).join('\n'))} variant="copy" icon={Copy} className="w-auto px-6 py-2 text-sm">Copy Saved Strategies to Documentation</Button>
                   )}
                </div>
                <p className={`text-xs mb-6 text-center ${styles.textMuted}`}>Click any card below to view detailed implementation steps.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getFilteredSDI().map((item, idx) => (
                      <div key={idx} className={`p-4 rounded border transition-all relative group ${theme === 'dark' ? 'bg-slate-950 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md'}`}>
                        <div className="absolute top-4 right-4 flex gap-2 z-20"><button onClick={(e) => { e.stopPropagation(); handleToggleSaveStrategy(item); }} className={`p-1.5 rounded-full transition-all hover:bg-slate-800 ${savedStrategies.find(s => s.id === item.id) ? 'text-fuchsia-500 bg-fuchsia-500/10' : 'text-slate-500'}`}><Heart size={16} fill={savedStrategies.find(s => s.id === item.id) ? "currentColor" : "none"} /></button></div>
                        <div onClick={() => setSelectedStrategy(item)} className="cursor-pointer">
                          <div className="flex justify-between items-start mb-3"><Badge color="green" theme={theme}>{item.category}</Badge></div>
                          <h4 className={`font-bold mb-2 text-lg ${styles.text}`}>{item.title}</h4>
                          <p className={`text-sm mb-4 line-clamp-2 ${styles.textMuted}`}>{item.desc}</p>
                          <div className="flex items-center gap-2"><span className={`text-[10px] font-mono px-2 py-1 rounded ${theme === 'dark' ? 'text-emerald-400 bg-emerald-900/20' : 'text-emerald-700 bg-emerald-50'}`}>UDL: {item.udl}</span></div>
                        </div>
                      </div>
                  ))}
                </div>
            </Card>
          </div>
        )}

        {activeTab === 'threads' && (
          <div className="space-y-6 animate-fade-in">
            <div className={`rounded-2xl p-8 border relative overflow-hidden ${theme === 'dark' ? 'bg-gradient-to-r from-violet-900/50 to-fuchsia-900/50 border-fuchsia-500/20' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'}`}>
               <h2 className={`text-4xl font-black mb-4 flex items-center gap-3 uppercase italic tracking-tighter ${theme === 'dark' ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-fuchsia-400' : 'text-indigo-800'}`}><Sparkles className={theme === 'dark' ? "text-fuchsia-400" : "text-indigo-600"} size={36} /> Threads AI</h2>
               <p className={`text-lg mb-8 max-w-2xl ${styles.textMuted}`}>The neural backbone of Prism Path. Analyze any IEP component for legal compliance, coherence, and research alignment.</p>
               <Button onClick={runAiAnalysis} disabled={isAnalyzing} variant="ai" className="px-8 py-4 text-base" theme={theme}>{isAnalyzing ? "Processing..." : user.isPremium ? "Initialize Analysis" : "Unlock Neural Capabilities"}</Button>
            </div>
            {aiAnalysis && (
              <Card theme={theme} className={`p-6 border-t-4 ${theme === 'dark' ? 'border-t-fuchsia-500' : 'border-t-indigo-500'}`}>
                <div className="flex justify-between mb-4"><h3 className={`text-xl font-bold ${styles.text}`}>Analysis Report</h3><div className={`px-4 py-1 rounded font-mono font-bold ${theme === 'dark' ? 'bg-slate-800 text-cyan-400' : 'bg-slate-100 text-indigo-700'}`}>SCORE: {aiAnalysis.score}</div></div>
                <div className="space-y-2">{aiAnalysis.coherence.map((c, i) => (<div key={i} className={`flex gap-2 ${styles.text}`}><CheckCircle className="text-emerald-500" size={16}/> {c.msg}</div>))}</div>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

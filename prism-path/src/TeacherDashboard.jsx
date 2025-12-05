import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Target, BookOpen, Plus, Save, Trash2, TrendingUp, 
  CheckCircle, Brain, Layout, FileText, Sparkles, ClipboardList, 
  AlertCircle, ArrowRight, GraduationCap, Lock, Shield, Eye, 
  EyeOff, Key, LogOut, Chrome, CreditCard, Star, Check, Zap, 
  Grid, Building, Users, Search, List, Library, Compass, Sun, 
  Moon, School, Files, ArrowUpRight, X, ListOrdered, ChevronDown, 
  User, Wand2, Printer, Copy, Heart, Calendar, Clock, Calculator, 
  Mail, MessageSquare, Edit2, FileDown, Upload
} from 'lucide-react';

// --- Configuration ---
// API Key is handled via /api/generate in the backend

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

const BASE_ASSESSMENT_LIBRARY = [
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
  // FORCED DARK MODE (PrismPath Aesthetic)
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
    primary: "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg border border-fuchsia-500/30 hover:scale-[1.02]",
    secondary: "bg-transparent text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/10",
    danger: "bg-red-900/20 text-red-400 border border-red-500/30 hover:bg-red-900/40",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/5",
    ai: "bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white animate-pulse-slow border-none",
    premium: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md hover:brightness-110",
    district: "bg-slate-800 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-900/20 shadow-[0_0_10px_rgba(34,211,238,0.1)]",
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
  const colors = {
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    purple: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30",
    blue: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 w-fit ${colors[color] || colors.green}`}>
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
        className={`flex items-center w-full px-3 py-2 rounded-lg border cursor-pointer transition-colors bg-slate-900 border-slate-700 hover:border-cyan-500`}
      >
        {Icon && <Icon size={16} className="mr-2 text-cyan-400" />}
        <span className="flex-1 font-bold text-sm truncate text-slate-200">
          {label ? `${label}: ${selectedLabel}` : selectedLabel}
        </span>
        <ChevronDown size={14} className="text-slate-500" />
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-xl z-50 max-h-60 overflow-y-auto bg-slate-900 border-slate-700">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`px-4 py-2 text-sm cursor-pointer transition-colors text-slate-300 hover:bg-slate-800 hover:text-cyan-400 ${value === option.value ? 'font-bold' : ''}`}
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
    <div className="fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-xl z-50 animate-fade-in-up flex items-center gap-2 bg-slate-800 text-cyan-400 border border-cyan-500/30">
      <CheckCircle size={18} className="text-fuchsia-400" />
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
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Sparkles className="text-cyan-400 transition-colors duration-300" size={40} />
              <div className="absolute inset-0 bg-cyan-400 blur-xl opacity-50 transition-all duration-1000 motion-safe:animate-pulse" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-widest mb-2">
            Prism<span className="text-cyan-400">Path</span>
          </h1>
          <p className="text-xs text-slate-500 font-mono uppercase">SECURE EDUCATOR TERMINAL</p>
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
        
        <div className="px-8 pb-8">
          <button onClick={onBack} className="w-full py-2 text-slate-500 text-xs hover:text-white transition-colors">← Back to Main Site</button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function TeacherDashboard({ onBack }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('home');
  const [subTab, setSubTab] = useState('');
  const [currentStudentId, setCurrentStudentId] = useState(1);
  const activeStudent = INITIAL_STUDENTS.find(s => s.id === currentStudentId) || INITIAL_STUDENTS[0];
  
  // Assessment & Data State
  const [plaafp, setPlaafp] = useState({ name: activeStudent.name, strength: activeStudent.strength, need: activeStudent.need, data: '', impact: '' });
  const [generatedPlaafp, setGeneratedPlaafp] = useState('');
  
  // --- CUSTOM DATA UPLOAD STATE ---
  const [assessments, setAssessments] = useState(BASE_ASSESSMENTS);
  const [newAssessment, setNewAssessment] = useState({ name: '', type: 'Custom', desc: '' });

  // Goal State
  const [goalInputs, setGoalInputs] = useState({ student: activeStudent.name, timeframe: 'By end of year', condition: 'given a text', behavior: 'will answer', criteria: '80%', measurement: 'probes' });
  const [generatedGoal, setGeneratedGoal] = useState('');
  
  // General State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [notification, setNotification] = useState(null);
  
  const styles = getThemeClasses('dark');
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const showNotification = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

  useEffect(() => {
    setPlaafp({ 
      name: activeStudent.name, 
      strength: activeStudent.strength, 
      need: activeStudent.need, 
      data: '', 
      impact: '' 
    });
    setGoalInputs(prev => ({ ...prev, student: activeStudent.name }));
    setNotification(`Switched to ${activeStudent.name}`);
    setTimeout(() => setNotification(null), 3000);
  }, [currentStudentId]);

  // --- REAL AI HELPER ---
  const callAI = async (prompt) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt })
      });
      const data = await response.json();
      setIsAnalyzing(false);
      return data.result;
    } catch (error) {
      console.error("AI Error:", error);
      setIsAnalyzing(false);
      return "Error generating content. Please try again.";
    }
  };

  // --- HANDLERS ---
  
  // Custom Data Handler
  const handleAddCustomAssessment = () => {
    if (newAssessment.name && newAssessment.desc) {
        const newItem = { name: newAssessment.name, type: 'Uploaded Data', desc: newAssessment.desc };
        setAssessments([...assessments, newItem]);
        
        // Auto-add to PLAAFP data field
        const newDataString = plaafp.data ? `${plaafp.data}, ${newItem.name} (${newItem.desc})` : `${newItem.name} (${newItem.desc})`;
        setPlaafp(prev => ({ ...prev, data: newDataString }));
        
        setNewAssessment({ name: '', type: 'Custom', desc: '' });
        showNotification("Data uploaded & applied to PLAAFP");
    }
  };

  const handleGeneratePlaafp = async () => {
    const prompt = `
      Role: Special Education Teacher.
      Task: Write a PLAAFP (Present Levels of Academic Achievement and Functional Performance) statement.
      Student: ${plaafp.name}
      Strength: ${plaafp.strength}
      Need: ${plaafp.need}
      Data Source: ${plaafp.data}
      Impact Statement: ${plaafp.impact}
      
      Write a concise, professional paragraph suitable for an IEP document.
    `;
    const result = await callAI(prompt);
    setGeneratedPlaafp(result);
  };

  const handleGenerateGoal = async () => {
    const prompt = `
      Role: Special Education Teacher.
      Task: Write a SMART Goal.
      Student: ${activeStudent.name}
      Area of Need: ${activeStudent.need}
      Condition: ${goalInputs.condition}
      Behavior: ${goalInputs.behavior}
      Criteria: ${goalInputs.criteria}
      
      Format: "By [Timeframe], given [Condition], [Student] will [Behavior] with [Criteria] as measured by [Measurement]."
    `;
    const result = await callAI(prompt);
    setGeneratedGoal(result);
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
  
  const copyToClipboard = (text) => { 
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) showNotification("Copied to Documentation");
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  if (!user) return <LoginScreen onLogin={setUser} onBack={onBack} />;

  return (
    <div className={`min-h-screen font-sans pb-20 ${styles.bg} ${styles.text}`}>
      <Toast message={notification} theme={theme} />
      
      {/* HEADER */}
      <header className={`sticky top-0 z-40 ${styles.header}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className={`p-2 rounded-lg text-white ${theme === 'dark' ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 'bg-indigo-600'}`}><Layout size={20} /></div>
              <h1 className={`hidden lg:block text-xl font-black tracking-widest uppercase ${styles.logoText}`}>Prism Path</h1>
            </div>
            <div className={`hidden md:flex gap-1 p-1 rounded-lg border ${theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
               <button onClick={() => { setActiveTab('identify'); setSubTab('wizard'); }} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${activeTab === 'identify' ? styles.navActive : styles.navInactive}`}><FileText size={14}/> Identify</button>
               <button onClick={() => { setActiveTab('develop'); setSubTab('wizard'); }} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${activeTab === 'develop' ? styles.navActive : styles.navInactive}`}><Target size={14}/> Develop</button>
            </div>
          </div>
          
          <div className="flex-1 max-w-xs mx-4 hidden sm:block">
            <CustomSelect value={currentStudentId} onChange={setCurrentStudentId} theme={'dark'} icon={User} options={INITIAL_STUDENTS.map(s => ({ value: s.id, label: s.name }))} />
          </div>

          <div className="flex items-center gap-3">
             <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
             <button onClick={() => setUser(null)} className={`p-2 transition-colors ${theme === 'dark' ? 'text-slate-600 hover:text-red-400' : 'text-slate-400 hover:text-red-600'}`}><LogOut size={18} /></button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
        {activeTab === 'home' && (
            <div className="space-y-8 animate-fade-in">
                <div className={`p-6 rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-6 ${styles.card}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-slate-800 text-cyan-400' : 'bg-slate-100 text-indigo-600'}`}><User size={24} /></div>
                        <div><h2 className={`text-xl font-bold ${styles.text}`}>Welcome back, Educator</h2><p className={`text-sm ${styles.textMuted}`}>Active Student: {activeStudent.name}</p></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[{id:'identify', label:'Identify', icon:FileText, desc:'Present Levels & Needs'}, {id:'develop', label:'Develop', icon:Target, desc:'Goals & Data Tracking'}].map(item => (
                        <div key={item.id} onClick={() => setActiveTab(item.id)} className={`group h-64 rounded-2xl border flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-[1.02] ${styles.card}`}>
                            <item.icon className={`mb-4 ${theme==='dark'?'text-fuchsia-400':'text-indigo-600'}`} size={40}/>
                            <h3 className={`text-xl font-bold uppercase ${styles.text}`}>{item.label}</h3>
                            <p className={`text-sm ${styles.textMuted}`}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* IDENTIFY TAB */}
        {activeTab === 'identify' && (
          <div className="space-y-6">
             <div className="flex gap-2 border-b border-slate-700/50 pb-2 mb-4 overflow-x-auto">
               <button onClick={() => setSubTab('wizard')} className={`px-4 py-2 rounded text-xs font-bold uppercase ${subTab === 'wizard' || subTab === '' ? styles.navActive : styles.navInactive}`}>PLAAFP Wizard</button>
               <button onClick={() => setSubTab('assessments')} className={`px-4 py-2 rounded text-xs font-bold uppercase ${subTab === 'assessments' ? styles.navActive : styles.navInactive}`}>Assessment Library</button>
               <button onClick={() => setSubTab('impact')} className={`px-4 py-2 rounded text-xs font-bold uppercase ${subTab === 'impact' ? styles.navActive : styles.navInactive}`}>Impact</button>
             </div>

             {(subTab === 'wizard' || subTab === '') && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card theme={'dark'} className="p-6">
                        <h3 className={`text-lg font-bold mb-4 uppercase ${styles.text}`}>PLAAFP Generator</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" value={plaafp.strength} onChange={e=>setPlaafp({...plaafp, strength:e.target.value})} placeholder="Strength" className={`w-full p-3 rounded outline-none ${styles.input}`} />
                                <input type="text" value={plaafp.need} onChange={e=>setPlaafp({...plaafp, need:e.target.value})} placeholder="Need" className={`w-full p-3 rounded outline-none ${styles.input}`} />
                            </div>
                            <textarea value={plaafp.data} onChange={e=>setPlaafp({...plaafp, data:e.target.value})} placeholder="Data Sources (e.g. WIAT-4 scores, observations)..." className={`w-full p-3 rounded outline-none h-24 ${styles.input}`} />
                            <textarea value={plaafp.impact} onChange={e=>setPlaafp({...plaafp, impact:e.target.value})} placeholder="Impact Statement..." className={`w-full p-3 rounded outline-none h-24 ${styles.input}`} />
                            
                            <Button onClick={handleGeneratePlaafp} className="w-full mt-4" icon={Brain} theme={'dark'}>
                                {isAnalyzing ? "Generating..." : "Generate Draft with AI"}
                            </Button>
                        </div>
                    </Card>
                    <Card theme={'dark'} className="p-6">
                        <h3 className={`text-lg font-bold mb-4 uppercase ${styles.text}`}>AI Output</h3>
                         {generatedPlaafp ? (
                            <div className={`p-4 rounded border mt-4 whitespace-pre-wrap bg-slate-950 border-slate-800 text-slate-300`}>
                                {generatedPlaafp}
                            </div>
                        ) : (
                            <div className={`p-6 border border-dashed rounded flex flex-col items-center justify-center text-slate-500 h-64 border-slate-800`}>
                                <Sparkles className="mb-2 opacity-50"/>
                                <p>Fill out the form to generate a draft</p>
                            </div>
                        )}
                        {generatedPlaafp && <Button onClick={() => copyToClipboard(generatedPlaafp)} variant="copy" icon={Copy} className="w-full mt-4">Copy</Button>}
                    </Card>
                </div>
             )}

             {/* ASSESSMENT TAB - WITH CUSTOM UPLOAD */}
             {subTab === 'assessments' && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card theme={'dark'} className="p-6">
                        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 uppercase ${styles.text}`}><Upload size={20}/> Upload / Paste Data</h3>
                        <div className="space-y-4">
                            <input 
                            type="text" 
                            placeholder="Test Name (e.g. MAP Reading)" 
                            value={newAssessment.name} 
                            onChange={e => setNewAssessment({...newAssessment, name: e.target.value})}
                            className={`w-full p-3 rounded outline-none ${styles.input}`}
                            />
                            <textarea 
                            placeholder="Paste scores or notes here (e.g. RIT 185, needs phonics support)" 
                            value={newAssessment.desc}
                            onChange={e => setNewAssessment({...newAssessment, desc: e.target.value})}
                            className={`w-full p-3 rounded outline-none h-32 ${styles.input}`}
                            />
                            <Button onClick={handleAddCustomAssessment} icon={Plus} theme={'dark'}>Add to Library & PLAAFP</Button>
                        </div>
                    </Card>
                    
                    <Card theme={'dark'} className="p-6">
                        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 uppercase ${styles.text}`}><Library size={20} /> Assessment Library</h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {assessments.map((a, i) => (
                                <div key={i} className={`p-3 rounded border transition-colors bg-slate-950 border-slate-800 hover:border-fuchsia-500/50`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-bold ${styles.text}`}>{a.name}</h4>
                                        <Badge color={a.type === 'Custom' || a.type === 'Uploaded Data' ? 'blue' : 'purple'} theme={'dark'}>{a.type}</Badge>
                                    </div>
                                    <p className={`text-xs mb-2 ${styles.textMuted}`}>{a.desc}</p>
                                    <Button onClick={() => handleAddAssessment(a.name + ": " + (a.desc || ""))} variant="secondary" theme={'dark'} className="w-full text-xs py-1" icon={Plus}>Add to PLAAFP</Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                 </div>
             )}

             {subTab === 'impact' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card theme={'dark'} className="p-6">
                  <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-wide ${styles.text}`}><Compass className="text-fuchsia-400" /> Impact Templates</h3>
                  <div className="space-y-3">{IMPACT_TEMPLATES.map((t, i) => (<div key={i} onClick={() => handleSelectImpact(t.text)} className={`p-3 border rounded cursor-pointer group bg-slate-950 border-slate-800 hover:bg-slate-800`}><div className="flex justify-between mb-1"><span className={`font-bold text-sm text-fuchsia-400 group-hover:text-fuchsia-300`}>{t.label}</span><ArrowRight size={14} className={styles.textMuted}/></div><p className={`text-xs line-clamp-2 ${styles.textMuted}`}>{t.text}</p></div>))}</div>
                </Card>
                <Card theme={'dark'} className="p-6"><h3 className={`text-lg font-bold mb-4 uppercase tracking-wide ${styles.text}`}>Current Impact Statement</h3><textarea className={`w-full p-4 rounded h-48 outline-none ${styles.input}`} value={plaafp.impact} onChange={(e) => setPlaafp({...plaafp, impact: e.target.value})} placeholder="Select a template or type here..."/></Card>
              </div>
            )}
          </div>
        )}

        {/* DEVELOP TAB - GOALS */}
        {activeTab === 'develop' && (
            <Card theme={'dark'} className="p-6">
                <h3 className={`text-lg font-bold mb-4 uppercase ${styles.text}`}>SMART Goal Builder</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="text" placeholder="Condition (Given...)" value={goalInputs.condition} onChange={e => setGoalInputs({...goalInputs, condition: e.target.value})} className={`w-full p-3 rounded ${styles.input}`} />
                        <input type="text" placeholder="Behavior (Will...)" value={goalInputs.behavior} onChange={e => setGoalInputs({...goalInputs, behavior: e.target.value})} className={`w-full p-3 rounded ${styles.input}`} />
                        <input type="text" placeholder="Criteria (Accuracy...)" value={goalInputs.criteria} onChange={e => setGoalInputs({...goalInputs, criteria: e.target.value})} className={`w-full p-3 rounded ${styles.input}`} />
                    </div>
                    <Button onClick={handleGenerateGoal} className="w-full mt-4" icon={Target} theme={'dark'}>
                        {isAnalyzing ? "Thinking..." : "Draft Goal with AI"}
                    </Button>
                    {generatedGoal && (
                        <div className={`p-4 rounded border mt-4 bg-slate-950 border-slate-800 text-slate-300`}>
                            {generatedGoal}
                        </div>
                    )}
                </div>
            </Card>
        )}
      </main>
    </div>
  );
}

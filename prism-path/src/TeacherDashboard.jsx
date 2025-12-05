import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Target, BookOpen, Plus, Save, Trash2, TrendingUp, 
  CheckCircle, Brain, Layout, FileText, Sparkles, ClipboardList, 
  AlertCircle, ArrowRight, GraduationCap, Lock, Shield, Eye, 
  EyeOff, Key, LogOut, Chrome, CreditCard, Star, Check, Zap, 
  Grid, Building, Users, Search, List, Library, Compass, Sun, 
  Moon, School, Files, ArrowUpRight, X, ListOrdered, ChevronDown, 
  User, Wand2, Printer, Copy, Heart, Calendar, Clock, Calculator, 
  Mail, MessageSquare, Edit2, FileDown, Upload, LockKeyhole
} from 'lucide-react';

// --- CONFIGURATION ---
// API calls are routed to your existing /api/generate backend

// --- SECURITY SERVICE (FERPA) ---
const SecurityService = {
  // Anonymizes student data before sending to AI
  anonymize: (text, studentName) => {
    if (!text) return "";
    const nameRegex = new RegExp(studentName, 'gi');
    return text.replace(nameRegex, "[STUDENT]");
  },
  // Re-inserts name after AI processing
  deanonymize: (text, studentName) => {
    if (!text) return "";
    return text.replace(/\[STUDENT\]/g, studentName);
  }
};

// --- MOCK DATABASE ---
const INITIAL_STUDENTS = [
  { id: 1, name: "Alex M.", grade: "3rd", need: "Reading Decoding", strength: "Visual Memory", nextIep: "2024-11-15", nextReeval: "2025-03-10" },
  { id: 2, name: "Jordan K.", grade: "5th", need: "Math Calculation", strength: "Verbal Reasoning", nextIep: "2024-05-20", nextReeval: "2026-09-01" },
  { id: 3, name: "Taylor S.", grade: "2nd", need: "Emotional Regulation", strength: "Creativity", nextIep: "2024-02-28", nextReeval: "2024-04-15" }
];

const BASE_ASSESSMENTS = [
  { name: 'DIBELS 8th', type: 'Reading', desc: 'Fluency & Phonemic Awareness' },
  { name: 'WIAT-4', type: 'Achievement', desc: 'Broad academic achievement' },
  { name: 'KeyMath-3', type: 'Math', desc: 'Diagnostic math concepts' },
  { name: 'BASC-3', type: 'Behavior', desc: 'Behavioral rating scales' }
];

const IMPACT_TEMPLATES = [
  { label: "Reading", text: "Deficits in decoding fluency hinder comprehension of grade-level texts in Science and Social Studies, requiring extended time and audio supports." },
  { label: "Math", text: "Difficulty with calculation automaticity affects ability to solve multi-step problems, slowing progress in the general curriculum." },
  { label: "Executive Function", text: "Deficits in task-initiation result in missing assignments and difficulty completing long-term projects without scaffolding." }
];

const SDI_RESOURCES = [
  { id: 'sdi-1', category: 'Instruction', title: 'Direct Instruction', desc: 'Explicit teaching using "I do, We do, You do".', udl: 'Representation', steps: ["Review prereqs", "Model (I Do)", "Guided (We Do)", "Independent (You Do)"], tips: "Think aloud during modeling." },
  { id: 'sdi-2', category: 'Accommodations', title: 'Graphic Organizers', desc: 'Visual maps for concepts.', udl: 'Action', steps: ["Select organizer", "Model use", "Partial fill", "Independent use"], tips: "Color code sections." },
  { id: 'sdi-3', category: 'Modifications', title: 'Modified Grading', desc: 'Grading on IEP goals vs standard.', udl: 'Engagement', steps: ["Define essential standards", "Create rubric", "Adjust gradebook"], tips: "Document in IEP." },
  { id: 'sdi-4', category: 'Behavior', title: 'Check-In/Check-Out', desc: 'Daily feedback cycle.', udl: 'Engagement', steps: ["Morning Goal Set", "Teacher Feedback", "End of Day Review"], tips: "Use preferred adult." }
];

// --- THEME ENGINE ---
const getThemeClasses = (theme) => {
  if (theme === 'light') {
    return {
      bg: "bg-slate-50", text: "text-slate-800", textMuted: "text-slate-500",
      card: "bg-white border border-slate-200 shadow-sm",
      header: "bg-white border-b border-slate-200",
      input: "bg-white border-slate-300 text-slate-800 focus:ring-indigo-500",
      navActive: "bg-indigo-50 text-indigo-700 font-bold ring-1 ring-indigo-200",
      navInactive: "text-slate-600 hover:bg-slate-100",
      chartGrid: "#e2e8f0", chartLine: "#4f46e5"
    };
  } else {
    // PrismPath Retrowave
    return {
      bg: "bg-slate-950", text: "text-slate-200", textMuted: "text-slate-500",
      card: "bg-slate-900/60 backdrop-blur-md border border-slate-700/50 shadow-lg",
      header: "bg-slate-900/80 backdrop-blur-md border-b border-slate-800",
      input: "bg-slate-900 border-slate-700 text-slate-200 focus:ring-cyan-500 focus:border-cyan-500",
      navActive: "bg-slate-800 text-cyan-400 font-bold shadow-sm border border-slate-700",
      navInactive: "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50",
      chartGrid: "#334155", chartLine: "#22d3ee"
    };
  }
};

// --- REUSABLE COMPONENTS ---

const Card = ({ children, className = "", theme, onClick }) => {
  const styles = getThemeClasses(theme);
  return (
    <div onClick={onClick} className={`rounded-xl overflow-hidden relative ${styles.card} ${className} ${onClick ? 'cursor-pointer hover:scale-[1.01] transition-transform' : ''}`}>
      {theme === 'dark' && <div className="absolute -top-10 -left-10 w-20 h-20 bg-fuchsia-500/10 rounded-full blur-xl pointer-events-none"></div>}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

const Button = ({ children, onClick, variant = "primary", icon: Icon, disabled, theme }) => {
  const base = "px-4 py-2 rounded-lg font-bold tracking-wide transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50";
  const variants = {
    primary: theme === 'dark' ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg border border-fuchsia-500/30 hover:scale-[1.02]" : "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: theme === 'dark' ? "bg-transparent text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/10" : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    ai: "bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white animate-pulse-slow border-none shadow-[0_0_15px_rgba(6,182,212,0.5)]",
    ghost: "bg-transparent hover:bg-slate-500/10 text-slate-500 hover:text-current",
    premium: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md"
  };
  return <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]}`}>{Icon && <Icon size={16}/>}{children}</button>;
};

const Badge = ({ children, color = "blue", theme }) => {
  const isDark = theme === 'dark';
  const colors = {
    green: isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-emerald-100 text-emerald-700 border-emerald-200",
    purple: isDark ? "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30" : "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
    blue: isDark ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" : "bg-blue-100 text-blue-700 border-blue-200",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30"
  };
  return <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${colors[color]}`}>{children}</span>;
};

const SimpleChart = ({ data, target, theme }) => {
  if (!data || data.length === 0) return <div className="h-48 flex items-center justify-center border border-dashed rounded text-xs opacity-50">No Data Recorded</div>;
  const styles = getThemeClasses(theme);
  const h=200, w=500, p=20;
  const getX = (i) => p + (i * ((w - p*2) / (data.length - 1 || 1)));
  const getY = (v) => h - (p + (v/100) * (h - p*2));
  const points = data.map((d, i) => `${getX(i)},${getY(d.score)}`).join(' ');
  
  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${w} ${h}`} className={`w-full h-auto rounded border ${theme==='dark'?'bg-slate-900/50 border-slate-800':'bg-white border-slate-200'}`}>
        {[0,25,50,75,100].map(v => <line key={v} x1={p} y1={getY(v)} x2={w-p} y2={getY(v)} stroke={styles.chartGrid} strokeWidth="1" />)}
        {target && <line x1={p} y1={getY(target)} x2={w-p} y2={getY(target)} stroke="#10b981" strokeWidth="2" strokeDasharray="4"/>}
        <polyline points={points} fill="none" stroke={styles.chartLine} strokeWidth="3" />
        {data.map((d, i) => <circle key={i} cx={getX(i)} cy={getY(d.score)} r="4" fill={styles.chartLine} />)}
      </svg>
    </div>
  );
};

// --- MODALS ---

const SummaryModal = ({ student, plaafp, goal, strategies, parentInput, lre, trackers, onClose, theme }) => {
  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto backdrop-blur-sm flex justify-center py-8 ${theme==='dark'?'bg-slate-950/90':'bg-slate-500/50'}`}>
      <div className={`w-full max-w-4xl rounded-xl shadow-2xl p-8 relative min-h-[80vh] ${theme==='dark'?'bg-slate-900 text-white':'bg-white text-slate-900'}`}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-black/10 rounded-full print:hidden"><X/></button>
        <div className="text-center border-b border-slate-500/20 pb-6 mb-8">
          <h1 className="text-3xl font-black uppercase">IEP Draft Document</h1>
          <p className="text-sm opacity-60 font-mono">CONFIDENTIAL | Generated by PrismPath</p>
        </div>
        <div className="space-y-8">
          <section className="grid grid-cols-4 gap-4 p-4 rounded bg-slate-500/10">
            <div><span className="text-[10px] opacity-70 block font-bold">STUDENT</span>{student.name}</div>
            <div><span className="text-[10px] opacity-70 block font-bold">GRADE</span>{student.grade}</div>
            <div><span className="text-[10px] opacity-70 block font-bold">PRIMARY NEED</span>{student.need}</div>
            <div><span className="text-[10px] opacity-70 block font-bold">NEXT IEP</span>{student.nextIep}</div>
          </section>
          <section className="grid grid-cols-2 gap-6">
            <div><h3 className="text-sm font-bold uppercase border-b border-slate-500/20 pb-2 mb-2">II. Present Levels (PLAAFP)</h3><div className="p-4 border rounded border-slate-500/20 text-sm leading-relaxed">{plaafp || "Not drafted."}</div></div>
            <div><h3 className="text-sm font-bold uppercase border-b border-slate-500/20 pb-2 mb-2">III. Parent Input</h3><div className="p-4 border rounded border-slate-500/20 text-sm leading-relaxed">{parentInput || "None recorded."}</div></div>
          </section>
          <section>
            <h3 className="text-sm font-bold uppercase border-b border-slate-500/20 pb-2 mb-2">IV. Measurable Goal</h3>
            <div className="p-4 border rounded border-slate-500/20 font-medium flex gap-3"><Target size={18} className="mt-1 opacity-50"/> {goal || "No goal drafted."}</div>
          </section>
          <section className="grid grid-cols-2 gap-6">
             <div><h3 className="text-sm font-bold uppercase border-b border-slate-500/20 pb-2 mb-2">V. LRE & Services</h3><div className="p-4 border rounded border-slate-500/20"><div className="text-3xl font-black">{lre.percentage}%</div><div className="text-xs opacity-70">Inside Regular Class</div></div></div>
             <div><h3 className="text-sm font-bold uppercase border-b border-slate-500/20 pb-2 mb-2">VI. Accommodations</h3><ul className="p-4 border rounded border-slate-500/20 text-sm list-disc pl-5">{strategies.map(s => <li key={s.id}>{s.title}</li>)}</ul></div>
          </section>
          <section>
             <h3 className="text-sm font-bold uppercase border-b border-slate-500/20 pb-2 mb-2">VII. Progress Data</h3>
             <div className="p-4 border rounded border-slate-500/20">
                <table className="w-full text-sm text-left"><thead><tr><th>Date</th><th>Score</th></tr></thead><tbody>{trackers[0].data.map((d,i)=><tr key={i}><td className="py-1">{d.date}</td><td>{d.score}%</td></tr>)}</tbody></table>
             </div>
          </section>
        </div>
        <div className="mt-12 flex justify-end gap-4 print:hidden">
          <Button onClick={() => window.print()} icon={Printer} theme={theme}>Print / Save PDF</Button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD ---

export default function TeacherDashboard({ onBack }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('home');
  const [subTab, setSubTab] = useState('');
  
  // Student & Data State
  const [currentStudentId, setCurrentStudentId] = useState(1);
  const activeStudent = INITIAL_STUDENTS.find(s => s.id === currentStudentId) || INITIAL_STUDENTS[0];
  const [assessments, setAssessments] = useState(BASE_ASSESSMENTS);
  const [customData, setCustomData] = useState({ name: '', result: '' });
  
  // Work State
  const [plaafp, setPlaafp] = useState({ name: activeStudent.name, strength: activeStudent.strength, need: activeStudent.need, data: '', impact: '' });
  const [goalInputs, setGoalInputs] = useState({ student: activeStudent.name, condition: '', behavior: '', criteria: '', measurement: '', timeframe: 'By end of IEP' });
  const [generatedPlaafp, setGeneratedPlaafp] = useState('');
  const [generatedGoal, setGeneratedGoal] = useState('');
  const [parentInput, setParentInput] = useState({ topic: 'Reading', script: '', response: '', formatted: '' });
  
  // Tools State
  const [serviceMinutes, setServiceMinutes] = useState({ total: 1800, sped: 300 });
  const [lreResult, setLreResult] = useState(null);
  const [trackers, setTrackers] = useState([{ id: 1, name: "Goal 1 Data", target: 80, data: [{date:'2023-10-01', score:40}, {date:'2023-10-15', score:55}] }]);
  const [newDataPoint, setNewDataPoint] = useState({ date: '', score: '' });
  const [savedStrategies, setSavedStrategies] = useState([]);
  const [isEditingCompliance, setIsEditingCompliance] = useState(false);
  const [complianceDates, setComplianceDates] = useState({ iep: activeStudent.nextIep, reeval: activeStudent.nextReeval });

  // UI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [notification, setNotification] = useState(null);

  const styles = getThemeClasses(theme);
  const showNotification = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

  // Update fields when student changes
  useEffect(() => {
    setPlaafp(prev => ({ ...prev, name: activeStudent.name, strength: activeStudent.strength, need: activeStudent.need }));
    setComplianceDates({ iep: activeStudent.nextIep, reeval: activeStudent.nextReeval });
    showNotification(`Switched to ${activeStudent.name}`);
  }, [currentStudentId]);

  // --- REAL AI ENGINE ---
  const callAI = async (prompt) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: SecurityService.anonymize(prompt, activeStudent.name) }) // FERPA PROTECT
      });
      const data = await response.json();
      setIsAnalyzing(false);
      return SecurityService.deanonymize(data.result, activeStudent.name); // RE-INSERT NAME
    } catch (error) {
      setIsAnalyzing(false);
      console.error(error);
      return "Error generating content.";
    }
  };

  // --- HANDLERS ---
  const handleAddCustomData = () => {
    if (!customData.name || !customData.result) return;
    const newAssessment = { name: customData.name, type: 'Custom', desc: customData.result };
    setAssessments([...assessments, newAssessment]);
    setPlaafp(prev => ({ ...prev, data: prev.data ? `${prev.data}, ${newAssessment.name} (${newAssessment.desc})` : `${newAssessment.name} (${newAssessment.desc})` }));
    setCustomData({ name: '', result: '' });
    showNotification("Data added & synced to PLAAFP");
  };

  const handleGeneratePlaafp = async () => {
    const p = `Write a professional IEP PLAAFP statement. Student Strength: ${plaafp.strength}. Area of Need: ${plaafp.need}. Assessment Data: ${plaafp.data}. Educational Impact: ${plaafp.impact}. Tone: Formal.`;
    setGeneratedPlaafp(await callAI(p));
  };

  const handleGenerateGoal = async () => {
    const p = `Write a SMART IEP Goal. Area: ${activeStudent.need}. Condition: ${goalInputs.condition}. Behavior: ${goalInputs.behavior}. Criteria: ${goalInputs.criteria}. Measurement: ${goalInputs.measurement}.`;
    setGeneratedGoal(await callAI(p));
  };

  const handleLreCalc = () => {
    const percent = ((serviceMinutes.total - serviceMinutes.sped) / serviceMinutes.total * 100).toFixed(1);
    setLreResult(percent);
  };

  const handleParentScript = () => {
    setParentInput(prev => ({ ...prev, script: `Dear Family,\n\nWe are preparing for the upcoming IEP. I would value your input regarding ${parentInput.topic}.\n\n1. What strengths do you see at home?\n2. Do you have concerns in this area?\n\nBest,\nThe IEP Team` }));
  };

  const handleFormatParent = async () => {
    const p = `Summarize this parent email response for an IEP "Parent Concerns" section: "${parentInput.response}"`;
    const res = await callAI(p);
    setParentInput(prev => ({ ...prev, formatted: res }));
  };

  const handleAddDataPoint = () => {
    setTrackers(prev => [{ ...prev[0], data: [...prev[0].data, { date: newDataPoint.date, score: parseInt(newDataPoint.score) }] }]);
    setNewDataPoint({ date: '', score: '' });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showNotification("Copied to Clipboard");
  };

  if (!user) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full relative z-10 text-center">
        <div className="mb-8 flex flex-col items-center">
            <Sparkles className="text-cyan-400 mb-4" size={48}/>
            <h1 className="text-3xl font-black text-white tracking-widest uppercase mb-2">Prism<span className="text-cyan-400">Path</span></h1>
            <p className="text-xs text-slate-500 font-mono">EDUCATOR PORTAL ACCESS</p>
        </div>
        <div className="space-y-4">
            <input className="w-full p-3 bg-slate-950 border border-slate-700 rounded text-white outline-none focus:border-cyan-500 transition-colors" placeholder="District ID" />
            <input className="w-full p-3 bg-slate-950 border border-slate-700 rounded text-white outline-none focus:border-cyan-500 transition-colors" placeholder="Password" type="password" />
            <button onClick={() => setUser({ name: "Educator" })} className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded shadow-lg hover:brightness-110 transition-all">SECURE LOGIN</button>
            <button onClick={onBack} className="text-xs text-slate-500 hover:text-white transition-colors">← Return to Main Site</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen font-sans pb-20 ${styles.bg} ${styles.text}`}>
      {notification && <div className="fixed bottom-6 right-6 bg-slate-800 border border-cyan-500 text-cyan-400 px-4 py-3 rounded shadow-xl z-[100] flex items-center gap-2 animate-fade-in-up"><CheckCircle size={16}/> {notification}</div>}
      {showSummary && <SummaryModal student={activeStudent} plaafp={generatedPlaafp} goal={generatedGoal} strategies={savedStrategies} parentInput={parentInput.formatted} lre={{...serviceMinutes, percentage: lreResult}} trackers={trackers} onClose={() => setShowSummary(false)} theme={theme} />}

      {/* HEADER */}
      <header className={`sticky top-0 z-40 ${styles.header}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveTab('home')}>
                <div className="relative"><Sparkles className="text-cyan-400" size={26} /><div className="absolute inset-0 bg-cyan-400 blur-lg opacity-40 animate-pulse" /></div>
                <span className={`text-xl font-black tracking-widest uppercase ${styles.logoText}`}>Prism Path</span>
            </div>
            <div className={`hidden md:flex gap-1 p-1 rounded-lg border ${theme==='dark'?'bg-slate-950/50 border-slate-800':'bg-slate-100 border-slate-200'}`}>
               {['Identify', 'Develop', 'Discover'].map(t => (
                 <button key={t} onClick={() => { setActiveTab(t.toLowerCase()); setSubTab(''); }} className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${activeTab === t.toLowerCase() ? styles.navActive : styles.navInactive}`}>{t}</button>
               ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
             {/* Custom Student Select */}
             <div className="relative hidden sm:block group">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded border cursor-pointer ${theme==='dark'?'bg-slate-900 border-slate-700':'bg-white border-slate-200'}`}>
                   <User size={14} className="text-cyan-400"/>
                   <span className="text-sm font-bold">{activeStudent.name}</span>
                   <ChevronDown size={14} className="text-slate-500"/>
                </div>
                <div className="absolute top-full right-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded shadow-xl hidden group-hover:block z-50">
                   {INITIAL_STUDENTS.map(s => <div key={s.id} onClick={() => setCurrentStudentId(s.id)} className="px-4 py-2 text-sm hover:bg-slate-800 cursor-pointer text-slate-300">{s.name}</div>)}
                   <div className="border-t border-slate-800 px-4 py-2 text-xs text-cyan-400 font-bold cursor-pointer hover:bg-slate-800">+ Add Student</div>
                </div>
             </div>
             <button onClick={() => setTheme(theme==='dark'?'light':'dark')} className="p-2 rounded-full hover:bg-white/10">{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button>
             <button onClick={() => setUser(null)} className="p-2 text-slate-500 hover:text-red-400"><LogOut size={18}/></button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* 1. HOME DASHBOARD */}
        {activeTab === 'home' && (
           <div className="space-y-6 animate-fade-in">
              <Card theme={theme} className="p-6 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-800 text-cyan-400"><User size={24}/></div>
                    <div><h2 className={`text-xl font-bold ${styles.text}`}>Dashboard: {activeStudent.name}</h2><p className={`text-sm ${styles.textMuted}`}>{activeStudent.grade} Grade • {activeStudent.need}</p></div>
                 </div>
                 <div className="flex items-center gap-6">
                    {isEditingCompliance ? (
                        <div className="flex gap-2 items-end">
                            <div><label className="text-[10px] font-bold block mb-1">IEP Due</label><input type="date" className={`p-1 rounded text-xs ${styles.input}`} value={complianceDates.iep} onChange={e => setComplianceDates({...complianceDates, iep: e.target.value})}/></div>
                            <button onClick={() => setIsEditingCompliance(false)} className="p-1 bg-green-500 text-white rounded"><Check size={16}/></button>
                        </div>
                    ) : (
                        <div className="text-right group cursor-pointer relative" onClick={() => setIsEditingCompliance(true)}>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">Next IEP Due</p>
                            <div className="flex items-center justify-end gap-2 text-emerald-400 font-mono font-bold text-lg"><Calendar size={16}/> {complianceDates.iep} <Edit2 size={12} className="opacity-0 group-hover:opacity-100"/></div>
                        </div>
                    )}
                 </div>
              </Card>
              <div className="grid grid-cols-3 gap-6">
                 {[{id:'identify', icon:FileText, lbl:'Identify'}, {id:'develop', icon:Target, lbl:'Develop'}, {id:'discover', icon:BookOpen, lbl:'Discover'}].map(m => (
                    <div key={m.id} onClick={() => setActiveTab(m.id)} className={`h-40 rounded-xl border flex flex-col items-center justify-center cursor-pointer hover:scale-[1.02] transition-all ${styles.card}`}>
                        <m.icon size={32} className="mb-2 text-fuchsia-400"/>
                        <h3 className={`text-lg font-bold uppercase ${styles.text}`}>{m.lbl}</h3>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* 2. IDENTIFY MODULE */}
        {activeTab === 'identify' && (
           <div className="space-y-6 animate-fade-in">
              <div className="flex gap-2 border-b border-slate-700/50 pb-2">
                 {['Wizard', 'Assessments', 'Parent Input'].map(t => <button key={t} onClick={() => setSubTab(t)} className={`px-4 py-1 text-xs font-bold uppercase rounded ${subTab===t||(subTab===''&&t==='Wizard') ? styles.navActive : ''}`}>{t}</button>)}
              </div>

              {(subTab === 'Wizard' || subTab === '') && (
                  <div className="grid grid-cols-2 gap-6">
                     <Card theme={theme} className="p-6">
                        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${styles.text}`}><FileText size={18}/> PLAAFP Builder</h3>
                        <div className="space-y-3">
                           <div className="grid grid-cols-2 gap-3">
                              <input className={`w-full p-2 rounded text-sm ${styles.input}`} placeholder="Strength" value={plaafp.strength} onChange={e => setPlaafp({...plaafp, strength: e.target.value})} />
                              <input className={`w-full p-2 rounded text-sm ${styles.input}`} placeholder="Need" value={plaafp.need} onChange={e => setPlaafp({...plaafp, need: e.target.value})} />
                           </div>
                           <textarea className={`w-full p-2 rounded text-sm h-20 ${styles.input}`} placeholder="Data Sources (Auto-filled from Assessments)" value={plaafp.data} onChange={e => setPlaafp({...plaafp, data: e.target.value})} />
                           <textarea className={`w-full p-2 rounded text-sm h-20 ${styles.input}`} placeholder="Educational Impact" value={plaafp.impact} onChange={e => setPlaafp({...plaafp, impact: e.target.value})} />
                           <div className="flex gap-2 mt-2 overflow-x-auto pb-1">{IMPACT_TEMPLATES.map((t,i) => <button key={i} onClick={() => setPlaafp({...plaafp, impact: t.text})} className="whitespace-nowrap px-2 py-1 rounded border border-slate-700 text-[10px] hover:bg-slate-800 text-slate-400">{t.label}</button>)}</div>
                           <Button onClick={handleGeneratePlaafp} theme={theme} icon={Brain} className="w-full">{isAnalyzing ? "Generating..." : "Draft PLAAFP with AI"}</Button>
                        </div>
                     </Card>
                     <Card theme={theme} className="p-6">
                        <h3 className={`text-lg font-bold mb-4 ${styles.text}`}>AI Draft</h3>
                        <div className={`p-4 rounded border h-64 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap ${theme==='dark'?'bg-slate-950 border-slate-800 text-slate-300':'bg-white border-slate-200'}`}>{generatedPlaafp || "Waiting for input..."}</div>
                        {generatedPlaafp && <Button onClick={() => copyToClipboard(generatedPlaafp)} variant="copy" icon={Copy} className="w-full mt-4">Copy to Clipboard</Button>}
                     </Card>
                  </div>
              )}

              {subTab === 'Assessments' && (
                  <div className="grid grid-cols-2 gap-6">
                     <Card theme={theme} className="p-6">
                        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${styles.text}`}><Upload size={18}/> Upload Custom Data</h3>
                        <div className="space-y-4">
                           <input className={`w-full p-3 rounded ${styles.input}`} placeholder="Test Name (e.g. WISC-V)" value={customData.name} onChange={e => setCustomData({...customData, name: e.target.value})} />
                           <textarea className={`w-full p-3 rounded h-32 ${styles.input}`} placeholder="Scores & Notes (e.g. FSIQ 92, low working memory)" value={customData.result} onChange={e => setCustomData({...customData, result: e.target.value})} />
                           <Button onClick={handleAddCustomData} icon={Plus} theme={theme}>Add to Library & PLAAFP</Button>
                        </div>
                     </Card>
                     <Card theme={theme} className="p-6">
                        <h3 className={`text-lg font-bold mb-4 ${styles.text}`}>Assessment Library</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                           {assessments.map((a, i) => (
                              <div key={i} className={`p-3 rounded border flex justify-between items-center ${theme==='dark'?'bg-slate-950 border-slate-800':'bg-white border-slate-200'}`}>
                                 <div><span className={`font-bold text-sm block ${styles.text}`}>{a.name}</span><span className={`text-xs ${styles.textMuted}`}>{a.desc}</span></div>
                                 <button onClick={() => { setPlaafp(prev => ({...prev, data: prev.data ? `${prev.data}, ${a.name}` : a.name})); showNotification("Added to Data Source"); }} className="text-xs bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded hover:bg-cyan-500/20">+ Add</button>
                              </div>
                           ))}
                        </div>
                     </Card>
                  </div>
              )}

              {subTab === 'Parent Input' && (
                  <div className="grid grid-cols-2 gap-6">
                     <Card theme={theme} className="p-6">
                        <h3 className={`text-lg font-bold mb-4 ${styles.text}`}>Input Request Generator</h3>
                        <CustomSelect options={[{value:'Reading', label:'Reading'}, {value:'Behavior', label:'Behavior'}]} value={parentInput.topic} onChange={v => setParentInput({...parentInput, topic: v})} theme={theme} label="Topic" />
                        <Button onClick={handleParentScript} className="w-full mt-4" icon={Mail} theme={theme}>Generate Email Script</Button>
                        {parentInput.script && <div className={`mt-4 p-3 rounded text-xs whitespace-pre-wrap border ${theme==='dark'?'bg-slate-950 border-slate-800 text-slate-400':'bg-white border-slate-200'}`}>{parentInput.script} <div className="mt-2 pt-2 border-t border-slate-700"><button onClick={() => copyToClipboard(parentInput.script)} className="text-cyan-400 font-bold">Copy Email</button></div></div>}
                     </Card>
                     <Card theme={theme} className="p-6">
                        <h3 className={`text-lg font-bold mb-4 ${styles.text}`}>Summarize Reply</h3>
                        <textarea className={`w-full p-3 rounded h-32 ${styles.input}`} placeholder="Paste parent email reply here..." value={parentInput.response} onChange={e => setParentInput({...parentInput, response: e.target.value})} />
                        <Button onClick={handleFormatParent} className="w-full mt-4" icon={MessageSquare} theme={theme}>Format for IEP</Button>
                        {parentInput.formatted && <div className={`mt-4 p-3 rounded text-sm border ${theme==='dark'?'bg-slate-950 border-slate-800 text-emerald-400':'bg-white border-slate-200 text-emerald-700'}`}>{parentInput.formatted} <button onClick={() => copyToClipboard(parentInput.formatted)} className="ml-2 underline text-xs">Copy</button></div>}
                     </Card>
                  </div>
              )}
           </div>
        )}

        {/* 3. DEVELOP MODULE */}
        {activeTab === 'develop' && (
           <div className="space-y-6 animate-fade-in">
              <div className="flex gap-2 border-b border-slate-700/50 pb-2">
                 {['Goal Wizard', 'Data Tracker', 'LRE Calc'].map(t => <button key={t} onClick={() => setSubTab(t)} className={`px-4 py-1 text-xs font-bold uppercase rounded ${subTab===t||(subTab===''&&t==='Goal Wizard') ? styles.navActive : ''}`}>{t}</button>)}
              </div>

              {(subTab === 'Goal Wizard' || subTab === '') && (
                 <div className="grid grid-cols-2 gap-6">
                    <Card theme={theme} className="p-6">
                       <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${styles.text}`}><Target size={18}/> SMART Goal Builder</h3>
                       <div className="space-y-3">
                          <input className={`w-full p-2 rounded ${styles.input}`} placeholder="Condition (Given what?)" value={goalInputs.condition} onChange={e => setGoalInputs({...goalInputs, condition: e.target.value})} />
                          <input className={`w-full p-2 rounded ${styles.input}`} placeholder="Behavior (Will do what?)" value={goalInputs.behavior} onChange={e => setGoalInputs({...goalInputs, behavior: e.target.value})} />
                          <input className={`w-full p-2 rounded ${styles.input}`} placeholder="Criteria (Accuracy?)" value={goalInputs.criteria} onChange={e => setGoalInputs({...goalInputs, criteria: e.target.value})} />
                          <Button onClick={handleGenerateGoal} className="w-full mt-2" icon={Brain} theme={theme}>{isAnalyzing ? "Thinking..." : "Draft Goal"}</Button>
                       </div>
                    </Card>
                    <Card theme={theme} className="p-6">
                       <h3 className={`text-lg font-bold mb-4 ${styles.text}`}>Draft</h3>
                       <div className={`p-4 rounded border h-40 ${theme==='dark'?'bg-slate-950 border-slate-800 text-slate-300':'bg-white border-slate-200'}`}>{generatedGoal}</div>
                       {generatedGoal && <Button onClick={() => copyToClipboard(generatedGoal)} variant="copy" icon={Copy} className="w-full mt-4">Copy Goal</Button>}
                    </Card>
                 </div>
              )}

              {subTab === 'Data Tracker' && (
                 <div className="space-y-6">
                    <Card theme={theme} className="p-6">
                       <div className="flex justify-between mb-4"><h3 className={`text-lg font-bold ${styles.text}`}>Progress Monitoring</h3><Button onClick={() => window.print()} variant="secondary" icon={Printer} theme={theme}>Print Chart</Button></div>
                       <SimpleChart data={trackers[0].data} target={80} theme={theme} />
                    </Card>
                    <Card theme={theme} className="p-6">
                       <div className="flex gap-4 items-end">
                          <div className="flex-1"><label className="text-xs font-bold mb-1 block">Date</label><input type="date" className={`w-full p-2 rounded ${styles.input}`} value={newDataPoint.date} onChange={e => setNewDataPoint({...newDataPoint, date: e.target.value})}/></div>
                          <div className="flex-1"><label className="text-xs font-bold mb-1 block">Score</label><input type="number" className={`w-full p-2 rounded ${styles.input}`} value={newDataPoint.score} onChange={e => setNewDataPoint({...newDataPoint, score: e.target.value})}/></div>
                          <Button onClick={handleAddDataPoint} icon={Save} theme={theme}>Log Data</Button>
                       </div>
                    </Card>
                 </div>
              )}

              {subTab === 'LRE Calc' && (
                 <div className="grid grid-cols-2 gap-6">
                    <Card theme={theme} className="p-6">
                       <h3 className={`text-lg font-bold mb-4 ${styles.text}`}>Minutes Calculator</h3>
                       <div className="space-y-3">
                          <label className="text-xs font-bold">Total School Minutes (Weekly)</label><input type="number" className={`w-full p-2 rounded ${styles.input}`} value={serviceMinutes.total} onChange={e => setServiceMinutes({...serviceMinutes, total: e.target.value})} />
                          <label className="text-xs font-bold">Special Ed Minutes (Weekly)</label><input type="number" className={`w-full p-2 rounded ${styles.input}`} value={serviceMinutes.sped} onChange={e => setServiceMinutes({...serviceMinutes, sped: e.target.value})} />
                          <Button onClick={handleLreCalc} className="w-full mt-2" icon={Calculator} theme={theme}>Calculate</Button>
                       </div>
                    </Card>
                    <Card theme={theme} className="p-6 flex flex-col items-center justify-center text-center">
                       <h3 className="text-sm font-bold uppercase tracking-widest mb-2">Time in Regular Class</h3>
                       {lreResult ? <div className="animate-fade-in-up"><div className={`text-6xl font-black mb-2 ${lreResult>=80 ? 'text-emerald-400' : 'text-amber-400'}`}>{lreResult}%</div><p className="text-xs opacity-50">{lreResult>=80 ? "Inside Regular Class (80%+)" : "Resource Room"}</p><button onClick={() => copyToClipboard(`LRE: ${lreResult}%`)} className="mt-4 text-xs underline text-cyan-400">Copy</button></div> : <span className="text-xs opacity-50">Enter minutes...</span>}
                    </Card>
                 </div>
              )}
           </div>
        )}

        {/* 4. DISCOVER MODULE */}
        {activeTab === 'discover' && (
           <div className="space-y-6 animate-fade-in">
              <Card theme={theme} className="p-6">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-lg font-bold ${styles.text}`}>Strategy Index</h3>
                    <div className="flex gap-2">
                       <button onClick={() => setSdiFilter(sdiFilter === 'recommended' ? 'all' : 'recommended')} className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${sdiFilter === 'recommended' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-none' : 'border-slate-700 text-slate-500'}`}><Sparkles size={12} className="inline mr-1"/> Recommended</button>
                       {['all', 'Instruction', 'Accommodations'].map(f => <button key={f} onClick={() => setSdiFilter(f)} className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${sdiFilter === f ? styles.navActive : 'border-slate-700 text-slate-500'}`}>{f}</button>)}
                    </div>
                 </div>
                 <div className="grid grid-cols-3 gap-4">
                    {getFilteredSDI().map((s, i) => (
                       <div key={i} className={`p-4 rounded border relative group ${theme==='dark'?'bg-slate-950 border-slate-800':'bg-white border-slate-200'}`}>
                          <button onClick={() => handleToggleSaveStrategy(s)} className={`absolute top-3 right-3 p-1 rounded-full ${savedStrategies.find(x=>x.id===s.id) ? 'text-fuchsia-500' : 'text-slate-600 hover:text-white'}`}><Heart size={16} fill={savedStrategies.find(x=>x.id===s.id)?"currentColor":"none"}/></button>
                          <Badge theme={theme} color="green">{s.category}</Badge>
                          <h4 className={`font-bold mt-2 ${styles.text}`}>{s.title}</h4>
                          <p className={`text-xs mt-1 line-clamp-2 ${styles.textMuted}`}>{s.desc}</p>
                          <button onClick={() => setSelectedStrategy(s)} className="text-xs text-cyan-400 mt-3 hover:underline">View Steps</button>
                       </div>
                    ))}
                 </div>
                 {savedStrategies.length > 0 && <div className="mt-6 flex justify-end"><Button onClick={() => copyToClipboard(savedStrategies.map(s => `- ${s.title}`).join('\n'))} variant="copy" icon={Copy} className="w-auto">Copy Saved Strategies</Button></div>}
              </Card>
           </div>
        )}

      </main>

      {/* Floating Summary Button */}
      <div className="fixed bottom-6 right-6">
         <Button onClick={() => setShowSummary(true)} variant="primary" icon={ClipboardList} className="shadow-2xl py-3 px-6 text-sm" theme={theme}>Compile Summary</Button>
      </div>
    </div>
  );
}

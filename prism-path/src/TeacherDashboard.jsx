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
      navActive: "bg-indigo-50 text-indigo-700 font-bold ring-1 ring-indigo-200",
      navInactive: "text-slate-600 hover:bg-slate-100",
      logoText: "text-indigo-700",
      chartGrid: "#e2e8f0",
      chartLine: "#4f46e5", 
    };
  } else {
    return {
      bg: "bg-slate-950",
      text: "text-slate-200",
      textMuted: "text-slate-500",
      card: "bg-slate-900/60 backdrop-blur-md border border-slate-700/50 shadow-lg",
      header: "bg-slate-900/80 backdrop-blur-md border-b border-slate-800",
      input: "bg-slate-900 border-slate-700 text-slate-200 focus:ring-cyan-500 focus:border-cyan-500",
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
      {theme === 'dark' && <div className="absolute -top-10 -left-10 w-20 h-20 bg-fuchsia-500/10 rounded-full blur-xl pointer-events-none"></div>}
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
    ghost: theme === 'dark'
      ? "bg-transparent text-slate-400 hover:text-white hover:bg-white/5"
      : "bg-transparent text-slate-600 hover:bg-slate-100",
    ai: theme === 'dark'
      ? "bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_30px_rgba(6,182,212,0.7)] border-none animate-pulse-slow"
      : "bg-violet-600 text-white hover:bg-violet-700 shadow-md",
    copy: "w-full py-4 text-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-md flex items-center justify-center gap-3 font-black tracking-widest border border-emerald-500/50"
  };
  
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const Badge = ({ children, color = "blue", theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const colors = {
    green: isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-emerald-100 text-emerald-700 border-emerald-200",
    purple: isDark ? "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30" : "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
    blue: isDark ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" : "bg-blue-100 text-blue-700 border-blue-200",
  };
  return <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 w-fit ${colors[color] || colors.green}`}>{children}</span>;
};

const CustomSelect = ({ options, value, onChange, theme, icon: Icon, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const selectedLabel = options.find(o => o.value === value)?.label || value;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className={`flex items-center w-full px-3 py-2 rounded-lg border cursor-pointer transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-700 hover:border-cyan-500' : 'bg-slate-100 border-slate-200 hover:border-indigo-400'}`}>
        {Icon && <Icon size={16} className={`mr-2 ${theme === 'dark' ? 'text-cyan-400' : 'text-indigo-600'}`} />}
        <span className={`flex-1 font-bold text-sm truncate ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{label ? `${label}: ${selectedLabel}` : selectedLabel}</span>
        <ChevronDown size={14} className="text-slate-500" />
      </div>
      {isOpen && (
        <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-xl z-50 max-h-60 overflow-y-auto ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
          {options.map((option) => (
            <div key={option.value} onClick={() => { onChange(option.value); setIsOpen(false); }} className={`px-4 py-2 text-sm cursor-pointer ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-800 hover:text-cyan-400' : 'text-slate-700 hover:bg-slate-50'}`}>{option.label}</div>
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

const LoginScreen = ({ onLogin, onBack }) => {
  const [role, setRole] = useState('Special Education Teacher');
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-700 shadow-[0_0_20px_rgba(34,211,238,0.2)]"><GraduationCap className="text-cyan-400" size={32} /></div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-cyan-300 uppercase tracking-widest">Prism Path</h1>
          <p className="text-xs text-slate-500 font-mono mt-1">SECURE EDUCATOR TERMINAL</p>
        </div>
        <div className="space-y-4">
          <button onClick={() => onLogin({ name: "Pro Teacher", role: "Special Education", isPremium: true })} className="w-full py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold rounded-lg shadow-lg hover:shadow-fuchsia-500/20 transition-all">ENTER DASHBOARD</button>
          <button onClick={onBack} className="w-full py-3 text-slate-400 text-sm font-bold hover:text-white">← Back to Home</button>
          <p className="text-[10px] text-slate-600 text-center">Authorized Personnel Only</p>
        </div>
      </div>
    </div>
  );
};

// --- SHARED DATA ---
const INITIAL_STUDENTS = [
  { id: 1, name: "Alex M.", grade: "3rd", need: "Reading Decoding", strength: "Visual Memory", nextIep: "2024-11-15", nextReeval: "2025-03-10" },
  { id: 2, name: "Jordan K.", grade: "5th", need: "Math Calculation", strength: "Verbal Reasoning", nextIep: "2024-05-20", nextReeval: "2026-09-01" }
];

const BASE_ASSESSMENT_LIBRARY = [
  { name: 'DIBELS 8th Edition', type: 'Reading Fluency', grades: 'K-8', desc: 'Measures phonemic awareness, phonics, and fluency.' },
  { name: 'WIAT-4', type: 'Achievement', grades: 'PK-12', desc: 'Comprehensive academic achievement test.' },
  { name: 'KeyMath-3', type: 'Math', grades: 'K-12', desc: 'Diagnostic assessment of essential concepts.' },
  { name: 'BASC-3', type: 'Behavior', grades: 'PK-12', desc: 'Behavior rating scales.' }
];

const IMPACT_TEMPLATES = [
  { label: "Reading Decoding", text: "The student's deficit in decoding fluency hinders their ability to comprehend grade-level texts in Science and Social Studies, requiring extended time and audio supports." },
  { label: "Math Calculation", text: "Difficulty with basic calculation automaticity affects the student's ability to solve multi-step application problems, slowing progress in the general math curriculum." }
];

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
  const [assessments, setAssessments] = useState(BASE_ASSESSMENT_LIBRARY);
  const [newAssessment, setNewAssessment] = useState({ name: '', type: 'Custom', desc: '' });

  // Goal State
  const [goalInputs, setGoalInputs] = useState({ student: activeStudent.name, timeframe: 'By end of year', condition: 'given a text', behavior: 'will answer', criteria: '80%', measurement: 'probes' });
  const [generatedGoal, setGeneratedGoal] = useState('');
  
  // General State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [notification, setNotification] = useState(null);
  
  const styles = getThemeClasses(theme);
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
  
  // Add Custom Data to Library and auto-select it
  const handleAddCustomAssessment = () => {
    if (newAssessment.name && newAssessment.desc) {
        const newEntry = { ...newAssessment, type: 'Uploaded Data' };
        setAssessments([...assessments, newEntry]);
        
        // Auto-add to data field
        const newDataString = plaafp.data ? `${plaafp.data}, ${newEntry.name} (${newEntry.desc})` : `${newEntry.name} (${newEntry.desc})`;
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
      Task: Write a SMART Goal (Specific, Measurable, Achievable, Relevant, Time-bound).
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
            <CustomSelect value={currentStudentId} onChange={setCurrentStudentId} theme={theme} icon={User} options={INITIAL_STUDENTS.map(s => ({ value: s.id, label: s.name }))} />
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
                        <div><h2 className={`text-xl font-bold ${styles.text}`}>Welcome back, {user.name}</h2><p className={`text-sm ${styles.textMuted}`}>Educator Dashboard</p></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[{id:'identify', label:'Identify', icon:FileText, desc:'Present Levels & Needs'}, {id:'develop', label:'Develop', icon:Target, desc:'Goals & Data Tracking'}, {id:'discover', label:'Discover', icon:BookOpen, desc:'Strategies & UDL'}].map(item => (
                        <div key={item.id} onClick={() => setActiveTab(item.id)} className={`group h-64 rounded-2xl border flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-[1.02] ${styles.card}`}>
                            <item.icon className={`mb-4 ${theme==='dark'?'text-fuchsia-400':'text-indigo-600'}`} size={40}/>
                            <h3 className={`text-xl font-bold uppercase ${styles.text}`}>{item.label}</h3>
                            <p className={`text-sm ${styles.textMuted}`}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* IDENTIFY TAB - PLAAFP & DATA */}
        {activeTab === 'identify' && (
          <div className="space-y-6">
             <div className="flex gap-2 border-b border-slate-700/50 pb-2 mb-4 overflow-x-auto">
               <button onClick={() => setSubTab('wizard')} className={`px-4 py-2 rounded text-xs font-bold uppercase ${subTab === 'wizard' || subTab === '' ? styles.navActive : styles.navInactive}`}>PLAAFP Wizard</button>
               <button onClick={() => setSubTab('assessments')} className={`px-4 py-2 rounded text-xs font-bold uppercase ${subTab === 'assessments' ? styles.navActive : styles.navInactive}`}>Assessment Library</button>
               <button onClick={() => setSubTab('impact')} className={`px-4 py-2 rounded text-xs font-bold uppercase ${subTab === 'impact' ? styles.navActive : styles.navInactive}`}>Impact</button>
             </div>

             {(subTab === 'wizard' || subTab === '') && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card theme={theme} className="p-6">
                        <h3 className={`text-lg font-bold mb-4 uppercase ${styles.text}`}>PLAAFP Generator</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" value={plaafp.strength} onChange={e=>setPlaafp({...plaafp, strength:e.target.value})} placeholder="Strength" className={`w-full p-3 rounded outline-none ${styles.input}`} />
                                <input type="text" value={plaafp.need} onChange={e=>setPlaafp({...plaafp, need:e.target.value})} placeholder="Need" className={`w-full p-3 rounded outline-none ${styles.input}`} />
                            </div>
                            <textarea value={plaafp.data} onChange={e=>setPlaafp({...plaafp, data:e.target.value})} placeholder="Data Sources (e.g. WIAT-4 scores, observations)..." className={`w-full p-3 rounded outline-none h-24 ${styles.input}`} />
                            <textarea value={plaafp.impact} onChange={e=>setPlaafp({...plaafp, impact:e.target.value})} placeholder="Impact Statement..." className={`w-full p-3 rounded outline-none h-24 ${styles.input}`} />
                            
                            <Button onClick={handleGeneratePlaafp} className="w-full mt-4" icon={Brain} theme={theme}>
                                {isAnalyzing ? "Generating..." : "Generate Draft with AI"}
                            </Button>
                        </div>
                    </Card>
                    <Card theme={theme} className="p-6">
                        <h3 className={`text-lg font-bold mb-4 uppercase ${styles.text}`}>AI Output</h3>
                         {generatedPlaafp ? (
                            <div className={`p-4 rounded border mt-4 whitespace-pre-wrap ${theme==='dark'?'bg-slate-950 border-slate-800 text-slate-300':'bg-slate-50 border-slate-200 text-slate-800'}`}>
                                {generatedPlaafp}
                            </div>
                        ) : (
                            <div className={`p-6 border border-dashed rounded flex flex-col items-center justify-center text-slate-500 h-64 ${theme==='dark'?'border-slate-800':'border-slate-300'}`}>
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
                    <Card theme={theme} className="p-6">
                        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 uppercase ${styles.text}`}><Upload size={20}/> Upload / Paste Data</h3>
                        <div className="space-y-4">
                            <input 
                            type="text" 
                            placeholder="Assessment Name (e.g. Spelling Test 10/24)" 
                            value={newAssessment.name} 
                            onChange={e => setNewAssessment({...newAssessment, name: e.target.value})}
                            className={`w-full p-3 rounded outline-none ${styles.input}`}
                            />
                            <textarea 
                            placeholder="Paste raw data, scores, or notes here..." 
                            value={newAssessment.desc}
                            onChange={e => setNewAssessment({...newAssessment, desc: e.target.value})}
                            className={`w-full p-3 rounded outline-none h-32 ${styles.input}`}
                            />
                            <Button onClick={handleAddCustomAssessment} icon={Plus} theme={theme}>Add to Library & PLAAFP</Button>
                        </div>
                    </Card>
                    <Card theme={theme} className="p-6">
                        <h3 className={`text-lg font-bold mb-4 uppercase ${styles.text}`}>Data Library</h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {assessments.map((a, i) => (
                                <div key={i} className={`p-3 rounded border transition-colors ${theme === 'dark' ? 'bg-slate-950 border-slate-800 hover:border-fuchsia-500/50' : 'bg-white border-slate-200 hover:border-indigo-400'}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`font-bold ${styles.text}`}>{a.name}</h4>
                                        <Badge color={a.type === 'Custom' || a.type === 'Uploaded Data' ? 'blue' : 'purple'} theme={theme}>{a.type}</Badge>
                                    </div>
                                    <p className={`text-xs mb-2 ${styles.textMuted}`}>{a.desc}</p>
                                    <Button onClick={() => handleAddAssessment(a.name + ": " + (a.desc || ""))} variant="secondary" theme={theme} className="w-full text-xs py-1" icon={Plus}>Add to PLAAFP</Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                 </div>
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
          </div>
        )}

        {/* DEVELOP TAB - GOALS */}
        {activeTab === 'develop' && (
            <Card theme={theme} className="p-6">
                <h3 className={`text-lg font-bold mb-4 uppercase ${styles.text}`}>SMART Goal Builder</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="text" placeholder="Condition (Given...)" value={goalInputs.condition} onChange={e => setGoalInputs({...goalInputs, condition: e.target.value})} className={`w-full p-3 rounded ${styles.input}`} />
                        <input type="text" placeholder="Behavior (Will...)" value={goalInputs.behavior} onChange={e => setGoalInputs({...goalInputs, behavior: e.target.value})} className={`w-full p-3 rounded ${styles.input}`} />
                        <input type="text" placeholder="Criteria (Accuracy...)" value={goalInputs.criteria} onChange={e => setGoalInputs({...goalInputs, criteria: e.target.value})} className={`w-full p-3 rounded ${styles.input}`} />
                    </div>
                    <Button onClick={handleGenerateGoal} className="w-full mt-4" icon={Target} theme={theme}>
                        {isAnalyzing ? "Thinking..." : "Draft Goal with AI"}
                    </Button>
                    {generatedGoal && (
                        <div className={`p-4 rounded border mt-4 ${theme==='dark'?'bg-slate-950 border-slate-800 text-slate-300':'bg-slate-50 border-slate-200 text-slate-800'}`}>
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

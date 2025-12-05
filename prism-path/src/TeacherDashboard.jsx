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
// (API Key is handled via /api/generate in the backend, no client ID needed here)

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
  }
};

// --- Mock Data ---

const INITIAL_STUDENTS = [
  { id: 1, name: "Alex M.", grade: "3rd", need: "Reading Decoding", strength: "Visual Memory", nextIep: "2024-11-15", nextReeval: "2025-03-10" },
  { id: 2, name: "Jordan K.", grade: "5th", need: "Math Calculation", strength: "Verbal Reasoning", nextIep: "2024-05-20", nextReeval: "2026-09-01" },
  { id: 3, name: "Taylor S.", grade: "2nd", need: "Emotional Regulation", strength: "Creativity", nextIep: "2024-02-28", nextReeval: "2024-04-15" }
];

const BASE_ASSESSMENTS = [
  { name: 'DIBELS 8th Edition', type: 'Reading Fluency', grades: 'K-8', desc: 'Measures phonemic awareness, phonics, and fluency.' },
  { name: 'WIAT-4', type: 'Achievement', grades: 'PK-12', desc: 'Comprehensive academic achievement test.' },
  { name: 'KeyMath-3', type: 'Math', grades: 'K-12', desc: 'Diagnostic assessment of essential mathematical concepts and skills.' },
  { name: 'BASC-3', type: 'Behavior', grades: 'PK-12', desc: 'Behavior assessment system for children.' },
  { name: 'Woodcock-Johnson IV', type: 'Cognitive/Achievement', grades: 'PK-Adult', desc: 'Identifies learning disabilities and academic strengths.' }
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
    steps: ["1. Review", "2. Presentation (I Do)", "3. Guided Practice (We Do)", "4. Independent Practice (You Do)", "5. Periodic Review"]
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
    steps: ["1. Select appropriate organizer", "2. Model extraction", "3. Guide filling", "4. Fade support"]
  },
  { 
    id: 'sdi-3',
    category: 'Modifications', 
    title: 'Modified Grading', 
    desc: 'Changing the standard grading criteria to account for disability.', 
    tips: 'Ensure this is documented clearly in the IEP.', 
    evidence: 'Equity / Compliance', 
    udl: 'Engagement',
    tags: ['All'],
    steps: ["1. Define essential standards", "2. Determine grading basis", "3. Create rubric", "4. Note on report card"]
  }
];

// --- Theme Management ---

const getThemeClasses = (theme) => {
  // Force Dark Mode to match PrismPath aesthetic
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
      <div className="absolute -top-10 -left-10 w-20 h-20 bg-fuchsia-500/10 rounded-full blur-xl pointer-events-none"></div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled = false, theme = 'dark' }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-sm";
  
  const variants = {
    primary: "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-[0_0_15px_rgba(192,38,211,0.4)] hover:shadow-[0_0_25px_rgba(192,38,211,0.6)] border border-fuchsia-500/30 hover:scale-[1.02]",
    secondary: "bg-transparent text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/10 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(34,211,238,0.3)]",
    danger: "bg-red-900/20 text-red-400 border border-red-500/30 hover:bg-red-900/40",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/5",
    ai: "bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_30px_rgba(6,182,212,0.7)] border-none animate-pulse-slow",
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
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    purple: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 w-fit ${colors[color] || colors.blue}`}>
      {Icon && <Icon size={10} />}
      {children}
    </span>
  );
};

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

// --- REAL AI HELPER ---
const callAI = async (prompt) => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt })
    });
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("AI Error:", error);
    return "Error generating content. Please try again.";
  }
};

// --- MAIN COMPONENT ---

export default function TeacherDashboard({ onBack }) {
  const [activeTab, setActiveTab] = useState('home');
  const [subTab, setSubTab] = useState('');
  const [currentStudentId, setCurrentStudentId] = useState(1);
  const activeStudent = INITIAL_STUDENTS.find(s => s.id === currentStudentId) || INITIAL_STUDENTS[0];
  
  // States
  const [plaafp, setPlaafp] = useState({ name: activeStudent.name, strength: activeStudent.strength, need: activeStudent.need, data: '', impact: '' });
  const [generatedPlaafp, setGeneratedPlaafp] = useState('');
  const [goalInputs, setGoalInputs] = useState({ student: activeStudent.name, timeframe: 'By end of year', condition: 'given a text', behavior: 'will answer', criteria: '80%', measurement: 'probes' });
  const [generatedGoal, setGeneratedGoal] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Custom Data Upload State
  const [assessments, setAssessments] = useState(BASE_ASSESSMENTS);
  const [customData, setCustomData] = useState({ name: '', result: '' });

  const styles = getThemeClasses('dark');
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

  // --- Handlers ---

  const handleAddCustomData = () => {
    if (customData.name && customData.result) {
        const newItem = { name: customData.name, type: 'Custom Data', desc: customData.result, grades: 'N/A' };
        setAssessments([...assessments, newItem]);
        // Auto-add to PLAAFP data
        setPlaafp(prev => ({ ...prev, data: prev.data ? `${prev.data}, ${customData.name} (${customData.result})` : `${customData.name} (${customData.result})` }));
        setCustomData({ name: '', result: '' });
        showNotification("Data uploaded and added to profile");
    }
  };

  const handleGeneratePlaafp = async () => {
    setIsAnalyzing(true);
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
    setIsAnalyzing(false);
  };

  const handleGenerateGoal = async () => {
    setIsAnalyzing(true);
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
    setIsAnalyzing(false);
  };

  const handleAddAssessment = (name) => {
    const newData = plaafp.data ? `${plaafp.data}, ${name}` : name;
    setPlaafp(prev => ({ ...prev, data: newData }));
    showNotification(`Added ${name} to Data Sources`);
  };

  return (
    <div className={`min-h-screen font-sans pb-20 ${styles.bg} ${styles.text}`}>
      <Toast message={notification} />
      
      {/* HEADER */}
      <header className={`sticky top-0 z-40 ${styles.header}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
             {/* PRISMPATH LOGO REPLACEMENT */}
             <div className="flex items-center space-x-2 group cursor-pointer" onClick={onBack}>
                <div className="relative">
                  <Sparkles className="text-cyan-400 transition-colors duration-300 group-hover:text-fuchsia-400" size={26} />
                  <div className="absolute inset-0 bg-cyan-400 blur-lg opacity-40 transition-all duration-1000 group-hover:bg-fuchsia-400 motion-safe:animate-pulse" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  Prism<span className="text-cyan-400">Path</span>
                </span>
            </div>

            <div className="hidden md:flex gap-1 p-1 rounded-lg border bg-slate-950/50 border-slate-800">
               <button onClick={() => { setActiveTab('identify'); setSubTab('wizard'); }} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${activeTab === 'identify' ? styles.navActive : styles.navInactive}`}><FileText size={14}/> Identify</button>
               <button onClick={() => { setActiveTab('develop'); setSubTab('wizard'); }} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${activeTab === 'develop' ? styles.navActive : styles.navInactive}`}><Target size={14}/> Develop</button>
            </div>
          </div>
          
          <div className="flex-1 max-w-xs mx-4 hidden sm:block">
            <CustomSelect value={currentStudentId} onChange={setCurrentStudentId} theme={'dark'} icon={User} options={INITIAL_STUDENTS.map(s => ({ value: s.id, label: s.name }))} />
          </div>

          <div className="flex items-center gap-3">
             <button onClick={onBack} className="p-2 transition-colors text-slate-600 hover:text-red-400"><LogOut size={18} /></button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
        {activeTab === 'home' && (
            <div className="space-y-8 animate-fade-in">
                <div className={`p-6 rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-6 ${styles.card}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-800 text-cyan-400"><User size={24} /></div>
                        <div><h2 className={`text-xl font-bold ${styles.text}`}>Welcome back, Educator</h2><p className={`text-sm ${styles.textMuted}`}>Active Student: {activeStudent.name}</p></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[{id:'identify', label:'Identify', icon:FileText, desc:'Present Levels & Needs'}, {id:'develop', label:'Develop', icon:Target, desc:'Goals & Data Tracking'}, {id:'discover', label:'Discover', icon:BookOpen, desc:'Strategies & UDL'}].map(item => (
                        <div key={item.id} onClick={() => setActiveTab(item.id)} className={`group h-64 rounded-2xl border flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-[1.02] ${styles.card}`}>
                            <item.icon className="mb-4 text-fuchsia-400" size={40}/>
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
                            <div className="p-4 rounded border mt-4 whitespace-pre-wrap bg-slate-950 border-slate-800 text-slate-300">
                                {generatedPlaafp}
                            </div>
                        ) : (
                            <div className="p-6 border border-dashed rounded flex flex-col items-center justify-center text-slate-500 h-64 border-slate-800">
                                <Sparkles className="mb-2 opacity-50"/>
                                <p>Fill out the form to generate a draft</p>
                            </div>
                        )}
                    </Card>
                </div>
             )}

             {subTab === 'assessments' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {/* Custom Data Entry */}
                   <Card theme={'dark'} className="p-6">
                      <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 uppercase ${styles.text}`}><Upload size={20}/> Upload / Paste Data</h3>
                      <div className="space-y-4">
                          <input 
                            type="text" 
                            placeholder="Test Name (e.g. MAP Reading)" 
                            value={customData.name} 
                            onChange={e => setCustomData({...customData, name: e.target.value})}
                            className={`w-full p-3 rounded outline-none ${styles.input}`}
                          />
                          <textarea 
                            placeholder="Paste scores or notes here (e.g. RIT 185, needs phonics support)" 
                            value={customData.result}
                            onChange={e => setCustomData({...customData, result: e.target.value})}
                            className={`w-full p-3 rounded outline-none h-32 ${styles.input}`}
                          />
                          <Button onClick={handleAddCustomData} icon={Plus} theme={'dark'}>Add to Profile</Button>
                      </div>
                   </Card>
                   
                   {/* Library */}
                   <Card theme={'dark'} className="p-6">
                      <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 uppercase ${styles.text}`}><Library size={20} /> Assessment Library</h3>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                          {assessments.map((a, i) => (
                              <div key={i} className="p-3 rounded border transition-colors bg-slate-950 border-slate-800 hover:border-fuchsia-500/50">
                                  <div className="flex justify-between items-start mb-1">
                                      <h4 className={`font-bold ${styles.text}`}>{a.name}</h4>
                                      <Badge color="purple" theme={'dark'}>{a.type}</Badge>
                                  </div>
                                  <p className={`text-xs mb-2 ${styles.textMuted}`}>{a.desc}</p>
                                  <Button onClick={() => handleAddAssessment(a.name)} variant="secondary" theme={'dark'} className="w-full text-xs py-1" icon={Plus}>Add to PLAAFP</Button>
                              </div>
                          ))}
                      </div>
                   </Card>
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
                        <div className="p-4 rounded border mt-4 bg-slate-950 border-slate-800 text-slate-300">
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

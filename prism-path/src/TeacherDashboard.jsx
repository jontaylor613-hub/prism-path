import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Target, BookOpen, Plus, Save, Trash2, CheckCircle,
  Brain, Layout, FileText, Sparkles, ClipboardList, ArrowRight,
  GraduationCap, LogOut, Calculator, Calendar, Clock,
  Search, ChevronDown, User, Wand2, Copy, Heart,
  MessageSquare, Edit2, FileDown, Menu, X, MapPin, Activity, 
  Eye, EyeOff, AlertTriangle, Mail, UploadCloud, BarChart3, ShieldAlert,
  Star, Smile, Settings, Users, ToggleLeft, ToggleRight, FileCheck, Minus, Lock, Printer
} from 'lucide-react';

// --- CONFIGURATION ---
const getGoogleApiKey = () => {
  try {
    if (import.meta.env && import.meta.env.VITE_GOOGLE_API_KEY) return import.meta.env.VITE_GOOGLE_API_KEY;
    if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_GOOGLE_API_KEY) return process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  } catch (e) {}
  return ""; 
};

const GOOGLE_API_KEY = getGoogleApiKey();

// --- AESTHETIC CONFIG ---
const THEME = {
  colors: {
    bg: "bg-slate-950",
    cardBg: "bg-slate-900/60",
    cardBorder: "border-slate-700/50",
    textMain: "text-slate-200",
    textMuted: "text-slate-400",
    primary: "cyan",
    secondary: "fuchsia",
  },
  gradients: {
    primary: "bg-gradient-to-r from-cyan-500 to-fuchsia-500",
    text: "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-purple-400",
    glass: "backdrop-blur-xl bg-slate-900/80"
  },
  shadows: {
    glow: "shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(217,70,239,0.5)]"
  }
};

// --- UTILITIES ---

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
      return "Error: API Key not found. Please add VITE_GOOGLE_API_KEY to your .env or Vercel settings.";
    }

    let systemInstruction = "";
    let userPrompt = "";

    if (type === 'behavior') {
        systemInstruction = "You are an expert Board Certified Behavior Analyst (BCBA). Analyze the incident log provided. Identify patterns in antecedents and consequences. Suggest 3 specific, low-prep interventions. Keep output clean, professional, and free of markdown symbols.";
        userPrompt = `Analyze these behavior logs: ${JSON.stringify(data)}. Focus on the behavior: ${data.targetBehavior || 'General Disruption'}.`;
    } 
    else if (type === 'email') {
        systemInstruction = "You are a warm, professional Special Education Teacher. Write an email to a parent. Be empathetic, clear, and concise. Do not use asterisks or markdown.";
        if (data.feedbackAreas) {
            userPrompt = `Write an email to the parent of ${data.student}. We are preparing for an IEP meeting. Ask for their feedback specifically regarding: ${data.feedbackAreas.join(', ')}.`;
        } else {
            userPrompt = `Write a positive update email for ${data.student} regarding their progress in ${data.topic}.`;
        }
    } 
    else if (type === 'goal') {
        systemInstruction = "You are a Special Education Consultant. Write a SMART goal (Specific, Measurable, Achievable, Relevant, Time-bound). Do not use markdown formatting.";
        userPrompt = `Student: ${data.student}, Grade: ${data.grade}. Condition: ${data.condition}. Target Behavior: ${data.behavior}.`;
    } 
    else if (type === 'plaafp') {
        systemInstruction = "You are an IEP compliance expert. Write a Present Levels (PLAAFP) narrative statement. Ensure it connects strengths, needs, and impact. No markdown.";
        userPrompt = `Student: ${data.student}. Strengths: ${data.strengths}. Needs: ${data.needs}. Impact of Disability: ${data.impact}.`;
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemInstruction + "\n\n" + userPrompt }] }]
        })
      });

      const result = await response.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
      return formatAIResponse(rawText);

    } catch (error) {
      console.error("Network Error:", error);
      return "Failed to connect to AI service.";
    }
  }
};

// --- CHART COMPONENT (SVG) ---
const SimpleLineChart = ({ data, target }) => {
  if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-500 border border-slate-700 rounded-xl bg-slate-900/50">No Data Points Recorded</div>;

  const width = 600;
  const height = 300;
  const padding = 40;
  const maxScore = 100;

  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const getX = (index) => {
    if (sortedData.length <= 1) return width / 2;
    return padding + (index * ((width - (padding * 2)) / (sortedData.length - 1)));
  };
  
  const getY = (value) => height - (padding + (value / maxScore) * (height - (padding * 2)));
  
  const points = sortedData.map((d, i) => `${getX(i)},${getY(d.score)}`).join(' ');
  const targetY = getY(target);

  return (
    <div className="w-full overflow-x-auto bg-slate-900 rounded-xl border border-slate-800 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Grid Lines */}
        {[0, 25, 50, 75, 100].map(val => (
          <g key={val}>
            <line x1={padding} y1={getY(val)} x2={width - padding} y2={getY(val)} stroke="#334155" strokeWidth="1" />
            <text x={padding - 10} y={getY(val) + 4} fontSize="10" textAnchor="end" fill="#64748b" fontFamily="monospace">{val}%</text>
          </g>
        ))}
        
        {/* Target Line */}
        {target && (
          <g>
            <line x1={padding} y1={targetY} x2={width - padding} y2={targetY} stroke="#10b981" strokeWidth="2" strokeDasharray="5,5" />
            <text x={width - padding + 5} y={targetY + 4} fontSize="10" fill="#10b981" fontWeight="bold" fontFamily="monospace">GOAL: {target}%</text>
          </g>
        )}

        {/* Data Line */}
        <polyline points={points} fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Data Points */}
        {sortedData.map((d, i) => (
          <g key={i} className="group cursor-pointer">
            <circle cx={getX(i)} cy={getY(d.score)} r="5" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" className="transition-all duration-200 hover:r-8"/>
            <title>{d.date}: {d.score}%</title>
          </g>
        ))}
      </svg>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled = false }) => {
  const baseStyle = "inline-flex items-center justify-center px-4 py-2 rounded-full font-bold transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide";
  
  const variants = {
    primary: `${THEME.gradients.primary} text-white ${THEME.shadows.glow} border border-white/10`,
    secondary: "bg-slate-800 text-cyan-400 border border-slate-700 hover:bg-slate-700 hover:text-white hover:border-cyan-400/50",
    danger: "bg-red-900/20 text-red-400 border border-red-500/30 hover:bg-red-900/40",
    ghost: "text-slate-400 hover:text-white hover:bg-slate-800",
    copy: "w-full py-3 bg-emerald-900/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/40 font-mono tracking-widest uppercase shadow-lg hover:shadow-emerald-500/20"
  };
  
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`}>
      {Icon && <Icon size={18} className="mr-2" />}
      {children}
    </button>
  );
};

const Card = ({ children, className = "", glow = false }) => (
  <div className={`relative rounded-2xl overflow-hidden ${THEME.colors.cardBg} ${THEME.colors.cardBorder} border ${className} ${glow ? 'shadow-[0_0_30px_rgba(6,182,212,0.1)]' : 'shadow-xl'}`}>
    {glow && <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>}
    <div className="relative z-10">{children}</div>
  </div>
);

const Badge = ({ children, color = "cyan" }) => {
  const styles = {
    cyan: "bg-cyan-900/20 text-cyan-400 border-cyan-500/30",
    fuchsia: "bg-fuchsia-900/20 text-fuchsia-400 border-fuchsia-500/30",
    emerald: "bg-emerald-900/20 text-emerald-400 border-emerald-500/30",
    amber: "bg-amber-900/20 text-amber-400 border-amber-500/30"
  };
  return (
    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest ${styles[color] || styles.cyan}`}>
      {children}
    </span>
  );
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
      <Button onClick={handleCopy} variant="copy" icon={copied ? CheckCircle : Copy}>
        {copied ? "Copied to Clipboard!" : label}
      </Button>
      <p className="text-center text-[10px] text-slate-500 mt-2 uppercase tracking-widest">Ready for Infinite Campus / IEP Direct</p>
    </div>
  );
};

// --- INITIAL DATA ---
const SAMPLE_STUDENTS = [
  { id: 1, name: "Alex M.", grade: "3rd", need: "Reading Decoding", nextIep: "2024-01-15", nextEval: "2025-05-20", behaviorPlan: true, summary: "Sample data." },
  { id: 2, name: "Jordan K.", grade: "5th", need: "Math Calculation", nextIep: "2025-11-20", nextEval: "2026-09-01", behaviorPlan: false, summary: "Sample data." },
  { id: 3, name: "Taylor S.", grade: "2nd", need: "Emotional Regulation", nextIep: "2024-12-01", nextEval: "2024-12-15", behaviorPlan: true, summary: "Sample data." }
];

// --- MAIN DASHBOARD ---

const Dashboard = ({ user, onLogout, onBack }) => {
  const [activeTab, setActiveTab] = useState('profile');
  
  // Student State
  const [students, setStudents] = useState(SAMPLE_STUDENTS);
  const [currentStudentId, setCurrentStudentId] = useState(1);
  const [showSamples, setShowSamples] = useState(true);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', grade: '', need: '', nextIep: '', nextEval: '' });

  // Goals State (Local Only)
  const [goals, setGoals] = useState([]);
  const [activeGoalId, setActiveGoalId] = useState(null);

  // Derived State
  const displayedStudents = showSamples ? students : students.filter(s => s.id > 3);
  const activeStudent = displayedStudents.find(s => s.id === currentStudentId) || displayedStudents[0];
  const activeGoal = goals.find(g => g.id === activeGoalId);

  // -- STATES --
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // Identify State
  const [plaafpInputs, setPlaafpInputs] = useState({ strengths: '', needs: '', impact: '' });
  const [plaafpResult, setPlaafpResult] = useState('');

  // Profile/Email State
  const [emailTopic, setEmailTopic] = useState('Progress Update');
  const [feedbackAreas, setFeedbackAreas] = useState({ behavior: false, social: false, academic: false, independence: false });
  const [generatedEmail, setGeneratedEmail] = useState('');

  // Behavior State
  const [behaviorTab, setBehaviorTab] = useState('tracker'); 
  const [behaviorLog, setBehaviorLog] = useState([]);
  const [bipAnalysis, setBipAnalysis] = useState('');
  const [newIncident, setNewIncident] = useState({ date: '', antecedent: '', behavior: '', consequence: '' });

  // Monitor State
  const [newMeasure, setNewMeasure] = useState({ date: '', score: '' });

  // PBIS Tracker State
  const [schedule, setSchedule] = useState(['Morning Meeting', 'ELA Block', 'Lunch/Recess', 'Math Block', 'Specials', 'Dismissal']);
  const [trackingGoals, setTrackingGoals] = useState(['Safe Body', 'Kind Words', 'On Task']);
  const [trackerData, setTrackerData] = useState({});
  const [isEditingTracker, setIsEditingTracker] = useState(false);
  const [rewardThreshold, setRewardThreshold] = useState(80);

  // Goal State
  const [goalInputs, setGoalInputs] = useState({ condition: '', behavior: '' });
  const [goalText, setGoalText] = useState("");
  const [goalConfig, setGoalConfig] = useState({ frequency: 'Weekly', target: 80 });

  // -- HANDLERS --

  const handleAddStudent = () => {
      if(!newStudent.name) return;
      
      const student = {
          ...newStudent,
          id: Date.now(),
          summary: "New student profile created locally."
      };
      
      setStudents([...students, student]);
      setIsAddingStudent(false);
      setNewStudent({ name: '', grade: '', need: '', nextIep: '', nextEval: '' });
      setCurrentStudentId(student.id);
  };

  const handleLockGoal = () => {
      if (!goalText) return;
      
      const newGoal = {
          id: Date.now().toString(),
          studentId: activeStudent.id,
          text: goalText,
          target: goalConfig.target,
          frequency: goalConfig.frequency,
          data: [], // Init empty data array
          createdAt: new Date().toISOString()
      };
      
      setGoals([...goals, newGoal]);
      setActiveGoalId(newGoal.id);
      
      alert("Goal Locked! Go to 'Monitor' tab to track progress.");
      setActiveTab('monitor');
  };

  const handleAddDataPoint = () => {
      if (!activeGoal || !newMeasure.date || !newMeasure.score) return;
      
      const updatedGoal = {
          ...activeGoal,
          data: [...(activeGoal.data || []), { date: newMeasure.date, score: parseFloat(newMeasure.score) }]
      };
      
      setGoals(goals.map(g => g.id === activeGoal.id ? updatedGoal : g));
      setNewMeasure({ date: '', score: '' });
  };

  const copyGraphSummary = () => {
      if (!activeGoal) return;
      const avg = activeGoal.data.length > 0 ? activeGoal.data.reduce((acc, curr) => acc + curr.score, 0) / activeGoal.data.length : 0;
      const text = `Progress Monitoring Summary for ${activeStudent.name}:\nGoal: ${activeGoal.text}\n\nCurrent Average: ${avg.toFixed(1)}%\nLatest Score: ${activeGoal.data[activeGoal.data.length-1]?.score || 'N/A'}%\n\nData collected via ${activeGoal.frequency} monitoring.`;
      navigator.clipboard.writeText(text);
      alert("Summary copied to clipboard!");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setTimeout(() => { setIsUploading(false); alert(`Successfully processed ${file.name}.`); }, 2000);
  };
  
  const handleGeneratePlaafp = async () => {
    setIsGenerating(true);
    const result = await GeminiService.generate({ ...plaafpInputs, student: activeStudent?.name || 'Student' }, 'plaafp');
    setPlaafpResult(result);
    setIsGenerating(false);
  }

  const handleGenerateEmail = async () => {
    setIsGenerating(true);
    let prompt = { student: activeStudent?.name, topic: emailTopic };
    if (emailTopic === 'Solicit Feedback') {
        const areas = Object.keys(feedbackAreas).filter(k => feedbackAreas[k]).map(k => k.charAt(0).toUpperCase() + k.slice(1));
        prompt = { ...prompt, feedbackAreas: areas };
    }
    const result = await GeminiService.generate(prompt, 'email');
    setGeneratedEmail(result);
    setIsGenerating(false);
  };

  const handleGenerateGoal = async () => {
    setIsGenerating(true);
    const result = await GeminiService.generate({ student: activeStudent?.name, grade: activeStudent?.grade, ...goalInputs }, 'goal');
    setGoalText(result);
    setIsGenerating(false);
  };

  const handleLogBehavior = () => {
    if (!newIncident.behavior) return;
    const log = { ...newIncident, id: Date.now(), timestamp: new Date().toLocaleDateString() };
    setBehaviorLog([log, ...behaviorLog]);
    setNewIncident({ date: '', antecedent: '', behavior: '', consequence: '' });
  };

  const handleAnalyzeBehavior = async () => {
    setIsGenerating(true);
    const result = await GeminiService.generate({ logs: behaviorLog, targetBehavior: behaviorLog[0]?.behavior || 'General' }, 'behavior');
    setBipAnalysis(result);
    setIsGenerating(false);
  };

  // Behavior Tracker Logic
  const handleTrackerClick = (block, goal) => {
      const key = `${block}-${goal}`;
      const current = trackerData[key];
      let next = 'star';
      if (current === 'star') next = 'smile';
      else if (current === 'smile') next = 'check';
      else if (current === 'check') next = null;
      setTrackerData({ ...trackerData, [key]: next });
  };

  const calculateReward = () => {
      const totalCells = schedule.length * trackingGoals.length;
      if (totalCells === 0) return 0;
      const earned = Object.values(trackerData).filter(v => v).length;
      return Math.round((earned / totalCells) * 100) || 0;
  };

  const addTimeBlock = () => { if (schedule.length < 10) setSchedule([...schedule, "New Block"]); };
  const removeTimeBlock = (index) => setSchedule(schedule.filter((_, i) => i !== index));
  const addGoal = () => { if (trackingGoals.length < 5) setTrackingGoals([...trackingGoals, "New Goal"]); };
  const removeGoal = (index) => setTrackingGoals(trackingGoals.filter((_, i) => i !== index));
  const copyTemplate = () => alert("Configuration Saved!");

  if (!activeStudent && displayedStudents.length === 0) {
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 p-8">
              <Users size={48} className="mb-4 text-cyan-500" />
              <h2 className="text-xl font-bold text-white mb-2">No Students Found</h2>
              <p className="mb-6 text-center">You have hidden sample students. Add a new student to begin.</p>
              <div className="flex gap-4">
                  <Button onClick={() => setShowSamples(true)} icon={ToggleLeft}>Show Samples</Button>
                  <Button onClick={() => setIsAddingStudent(true)} icon={Plus}>Add Student</Button>
              </div>
                {isAddingStudent && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                        <Card className="p-6 w-full max-w-md bg-slate-900 border-slate-700">
                             <h3 className="text-xl font-bold text-white mb-4">Add Student</h3>
                             <div className="space-y-3">
                                <input placeholder="Name" className="w-full bg-slate-950 p-3 rounded border border-slate-700 text-white" value={newStudent.name} onChange={e=>setNewStudent({...newStudent, name: e.target.value})} />
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button onClick={() => setIsAddingStudent(false)} variant="ghost">Cancel</Button>
                                    <Button onClick={handleAddStudent}>Save</Button>
                                </div>
                             </div>
                        </Card>
                    </div>
                )}
          </div>
      )
  }

  return (
    <div className={`min-h-screen ${THEME.colors.bg} ${THEME.colors.textMain} font-sans pb-20`}>
      <div className="fixed inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,black_40%,transparent_100%)]"></div>

      {/* HEADER */}
      <header className={`sticky top-0 z-50 border-b ${THEME.colors.cardBorder} ${THEME.gradients.glass}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setActiveTab('profile')}>
            <Sparkles className="text-cyan-400" size={24} />
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Prism<span className="text-cyan-400">Path</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1 bg-slate-900/50 p-1 rounded-full border border-slate-800">
            {['Profile', 'Identify', 'Develop', 'Monitor', 'Behavior'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${activeTab === tab.toLowerCase() ? 'bg-slate-800 text-cyan-400 shadow-lg' : 'text-slate-500 hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-bold hidden sm:block">{user.name}</span>
            <button onClick={onBack} className="text-xs font-bold text-slate-400 hover:text-white mr-2">EXIT</button>
            <button onClick={onLogout} className="bg-slate-800 p-2 rounded-full border border-slate-700 hover:text-red-400"><LogOut size={16}/></button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* ROSTER MANAGEMENT */}
        <div className="flex items-center justify-between">
            <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide flex-1 mr-4">
            {displayedStudents.map(s => {
                const status = ComplianceService.getStatus(s.nextIep);
                return (
                <button 
                    key={s.id}
                    onClick={() => setCurrentStudentId(s.id)}
                    className={`flex-shrink-0 px-4 py-3 rounded-xl border transition-all relative min-w-[160px] ${currentStudentId === s.id ? 'bg-slate-800 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'}`}
                >
                    <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${status.color}`}></div>
                    <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${currentStudentId === s.id ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400'}`}>
                        {s.name.charAt(0)}
                    </div>
                    <div className="text-left">
                        <p className={`text-sm font-bold ${currentStudentId === s.id ? 'text-white' : 'text-slate-400'}`}>{s.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase truncate max-w-[100px]">{s.need}</p>
                    </div>
                    </div>
                </button>
                );
            })}
            <button onClick={() => setIsAddingStudent(true)} className="flex-shrink-0 px-4 py-3 rounded-xl border border-dashed border-slate-700 hover:border-cyan-500/50 text-slate-500 hover:text-cyan-400 flex items-center justify-center">
                <Plus size={20} />
            </button>
            </div>
            
            <div className="flex flex-col items-end gap-2">
                <button onClick={() => setShowSamples(!showSamples)} className="text-[10px] uppercase font-bold text-slate-500 hover:text-white flex items-center gap-1">
                    {showSamples ? <ToggleRight className="text-cyan-400"/> : <ToggleLeft />}
                    Samples {showSamples ? 'On' : 'Off'}
                </button>
            </div>
        </div>

        {/* --- PROFILE TAB --- */}
        {activeTab === 'profile' && activeStudent && (
          <div className="grid lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="lg:col-span-2 space-y-6">
               <Card className="p-6">
                 <div className="flex justify-between items-start mb-6">
                   <div>
                     <h2 className="text-2xl font-bold text-white">{activeStudent.name}</h2>
                     <p className="text-slate-400">Grade: {activeStudent.grade} • Primary Need: {activeStudent.need}</p>
                   </div>
                   
                   <div className="relative">
                       <input 
                         type="file" 
                         ref={fileInputRef}
                         onChange={handleFileUpload} 
                         className="hidden" 
                         accept=".pdf,.doc,.docx,.txt"
                       />
                       <Button 
                         variant="secondary" 
                         onClick={() => fileInputRef.current.click()} 
                         icon={isUploading ? Settings : UploadCloud}
                         disabled={isUploading}
                       >
                         {isUploading ? "Analyzing..." : "Upload Data"}
                       </Button>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border border-slate-700/50 bg-slate-900/50 flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden`}>
                      <div className={`absolute top-0 left-0 w-full h-1 ${ComplianceService.getStatus(activeStudent.nextIep).color}`}></div>
                      <p className="text-[10px] uppercase font-bold text-slate-500">IEP Due Date</p>
                      <h3 className="text-xl font-bold text-white">{activeStudent.nextIep}</h3>
                      <Badge color={ComplianceService.getStatus(activeStudent.nextIep).text === 'Compliant' ? 'emerald' : 'amber'}>{ComplianceService.getStatus(activeStudent.nextIep).text}</Badge>
                    </div>
                    <div className={`p-4 rounded-xl border border-slate-700/50 bg-slate-900/50 flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden`}>
                      <div className={`absolute top-0 left-0 w-full h-1 ${ComplianceService.getStatus(activeStudent.nextEval).color}`}></div>
                      <p className="text-[10px] uppercase font-bold text-slate-500">Evaluation Due</p>
                      <h3 className="text-xl font-bold text-white">{activeStudent.nextEval}</h3>
                      <Badge color={ComplianceService.getStatus(activeStudent.nextEval).text === 'Compliant' ? 'emerald' : 'amber'}>{ComplianceService.getStatus(activeStudent.nextEval).text}</Badge>
                    </div>
                 </div>
               </Card>
               
               <Card className="p-6">
                 <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><BarChart3 className="text-cyan-400"/> Student Summary</h3>
                 <p className="text-slate-400 leading-relaxed text-sm whitespace-pre-wrap">
                   {activeStudent.summary}
                 </p>
               </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6 h-full flex flex-col" glow>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Mail className="text-fuchsia-400"/> Parent Communication</h3>
                <div className="space-y-4 flex-1">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Topic</label>
                     <select value={emailTopic} onChange={(e) => setEmailTopic(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none">
                       <option>Progress Update</option>
                       <option>Solicit Feedback</option>
                       <option>Meeting Request</option>
                       <option>Behavior Report</option>
                     </select>
                   </div>

                   {emailTopic === 'Solicit Feedback' && (
                       <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2">
                           <p className="text-xs font-bold text-slate-400 uppercase">Ask about:</p>
                           {['behavior', 'social', 'academic', 'independence'].map(area => (
                               <label key={area} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-white">
                                   <input type="checkbox" checked={feedbackAreas[area]} onChange={e => setFeedbackAreas({...feedbackAreas, [area]: e.target.checked})} className="accent-cyan-500"/>
                                   {area.charAt(0).toUpperCase() + area.slice(1)} at Home
                               </label>
                           ))}
                       </div>
                   )}

                   <Button onClick={handleGenerateEmail} disabled={isGenerating} className="w-full" icon={Wand2}>
                     {isGenerating ? "Drafting..." : "Generate Email Draft"}
                   </Button>
                </div>
                {generatedEmail && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="bg-slate-950 p-3 rounded text-xs text-slate-300 whitespace-pre-wrap font-mono mb-2 border border-slate-800">
                      {generatedEmail}
                    </div>
                    <Button onClick={() => navigator.clipboard.writeText(generatedEmail)} variant="secondary" className="w-full" icon={Copy}>Copy to Clipboard</Button>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* --- IDENTIFY TAB --- */}
        {activeTab === 'identify' && (
           <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
              <Card className="p-8">
                 <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><FileText className="text-cyan-400"/> PLAAFP Wizard</h2>
                 <p className="text-sm text-slate-400 mb-6">Input basic observations to generate a comprehensive Present Levels narrative.</p>
                 <div className="space-y-4">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Student Strengths</label>
                     <textarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none h-20" placeholder="e.g. Visual learner, kind to peers..." value={plaafpInputs.strengths} onChange={(e) => setPlaafpInputs({...plaafpInputs, strengths: e.target.value})} />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Key Needs/Deficits</label>
                     <textarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none h-20" placeholder="e.g. Reading decoding..." value={plaafpInputs.needs} onChange={(e) => setPlaafpInputs({...plaafpInputs, needs: e.target.value})} />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Impact of Disability</label>
                     <textarea className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none h-20" placeholder="e.g. Difficulty accessing text..." value={plaafpInputs.impact} onChange={(e) => setPlaafpInputs({...plaafpInputs, impact: e.target.value})} />
                   </div>
                   <Button onClick={handleGeneratePlaafp} disabled={isGenerating} className="w-full" icon={Wand2}>
                      {isGenerating ? "Compiling..." : "Generate Narrative"}
                   </Button>
                 </div>
              </Card>
              <Card className="p-8 bg-slate-950 flex flex-col">
                 <h2 className="text-xs font-bold text-slate-500 uppercase mb-4">Narrative Preview</h2>
                 {plaafpResult ? (
                     <div className="flex-1 flex flex-col">
                        <div className="flex-1 bg-slate-900/50 rounded-xl p-6 text-slate-200 text-sm whitespace-pre-wrap leading-relaxed border border-slate-800 font-serif">
                            {plaafpResult}
                        </div>
                        <CopyBlock content={plaafpResult} label="Copy PLAAFP to Documentation" />
                     </div>
                 ) : (
                     <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                        <Brain size={48} className="mb-4 opacity-50"/>
                        <p>Enter data to generate statement.</p>
                     </div>
                 )}
              </Card>
           </div>
        )}

        {/* --- DEVELOP TAB --- */}
        {activeTab === 'develop' && (
           <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
              <Card className="p-8" glow>
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Target className="text-fuchsia-400"/> Goal Drafter</h2>
                    <Badge color="cyan">AI Active</Badge>
                 </div>
                 <div className="space-y-6">
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Condition</label>
                     <input type="text" value={goalInputs.condition} onChange={(e) => setGoalInputs({...goalInputs, condition: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none" placeholder="e.g. Given a grade level text..." />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Behavior</label>
                     <input type="text" value={goalInputs.behavior} onChange={(e) => setGoalInputs({...goalInputs, behavior: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-1 focus:ring-cyan-500 outline-none" placeholder="e.g. Student will decode..." />
                   </div>
                   <Button onClick={handleGenerateGoal} disabled={isGenerating} className="w-full">
                     {isGenerating ? <span className="animate-pulse">Generating...</span> : <span><Wand2 size={16} className="inline mr-2"/> Draft Smart Goal</span>}
                   </Button>
                 </div>
              </Card>

              <Card className="p-8 bg-slate-950 flex flex-col">
                <h2 className="text-xs font-bold text-slate-500 uppercase mb-4">Goal Preview</h2>
                {goalText ? (
                    <div className="flex-1 flex flex-col">
                        <div className="bg-slate-900/50 rounded-xl p-6 mb-4 border border-slate-700">
                            <p className="text-lg text-slate-200 leading-relaxed font-medium whitespace-pre-wrap">{goalText}</p>
                        </div>
                        
                        {/* Lock & Track Configuration */}
                        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target %</label>
                                    <input type="number" value={goalConfig.target} onChange={e => setGoalConfig({...goalConfig, target: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Frequency</label>
                                    <select value={goalConfig.frequency} onChange={e => setGoalConfig({...goalConfig, frequency: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                                        <option>Daily</option>
                                        <option>Weekly</option>
                                        <option>Bi-Weekly</option>
                                        <option>Monthly</option>
                                    </select>
                                </div>
                            </div>
                            <Button onClick={handleLockGoal} icon={Lock} className="w-full" variant="secondary">Lock & Track This Goal</Button>
                        </div>
                        
                        <div className="mt-4">
                            <CopyBlock content={goalText} label="Copy Goal Only" />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                        <Target size={32} className="mx-auto mb-2 opacity-50"/>
                        <p>Define conditions to generate a goal.</p>
                    </div>
                )}
              </Card>
           </div>
        )}

        {/* --- MONITOR TAB (New) --- */}
        {activeTab === 'monitor' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                <Card className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Activity className="text-emerald-400"/> Progress Monitoring</h2>
                        {activeGoal && <div className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded border border-slate-800">Data Collection: <span className="text-white font-bold">{activeGoal.frequency}</span></div>}
                    </div>

                    {goals.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <p className="mb-4">No locked goals found for this student.</p>
                            <Button onClick={() => setActiveTab('develop')} variant="secondary">Go to Develop Tab to Create Goals</Button>
                        </div>
                    ) : (
                        <div>
                            <div className="flex gap-4 mb-6">
                                <select 
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none"
                                    value={activeGoalId || ''}
                                    onChange={(e) => setActiveGoalId(e.target.value)}
                                >
                                    {goals.map(g => (
                                        <option key={g.id} value={g.id}>{g.text.substring(0, 60)}...</option>
                                    ))}
                                </select>
                                <Button onClick={() => window.print()} variant="secondary" icon={Printer}>Print Graph</Button>
                                <Button onClick={copyGraphSummary} variant="secondary" icon={Copy}>Copy Summary</Button>
                            </div>

                            {activeGoal && (
                                <div className="grid lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 space-y-6">
                                        <SimpleLineChart data={activeGoal.data} target={activeGoal.target} />
                                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                            <p className="text-sm text-slate-300 font-medium">Goal Statement:</p>
                                            <p className="text-sm text-slate-400 italic mt-1">{activeGoal.text}</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 h-fit">
                                        <h3 className="text-sm font-bold text-white uppercase mb-4">Log Data Point</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                                                <input type="date" value={newMeasure.date} onChange={e => setNewMeasure({...newMeasure, date: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Score (%)</label>
                                                <input type="number" placeholder="0-100" value={newMeasure.score} onChange={e => setNewMeasure({...newMeasure, score: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                                            </div>
                                            <Button onClick={handleAddDataPoint} className="w-full" icon={Plus}>Add Data Point</Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        )}

        {/* --- BEHAVIOR TAB --- */}
        {activeTab === 'behavior' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="flex gap-4 mb-6 border-b border-slate-800 pb-2">
                  <button onClick={() => setBehaviorTab('tracker')} className={`text-sm font-bold uppercase tracking-wider pb-2 border-b-2 transition-colors ${behaviorTab === 'tracker' ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-white'}`}>Daily Tracker (PBIS)</button>
                  <button onClick={() => setBehaviorTab('log')} className={`text-sm font-bold uppercase tracking-wider pb-2 border-b-2 transition-colors ${behaviorTab === 'log' ? 'text-fuchsia-400 border-fuchsia-400' : 'text-slate-500 border-transparent hover:text-white'}`}>Incident Log (BIP)</button>
              </div>

              {behaviorTab === 'tracker' && (
                  <div className="space-y-6">
                      <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                          <div>
                              <h2 className="text-xl font-bold text-white mb-1">Daily Success Tracker</h2>
                              <p className="text-slate-400 text-xs">Click cells to cycle: Star → Smile → Check</p>
                          </div>
                          <div className="flex items-center gap-4">
                             {isEditingTracker && (
                                 <div className="flex gap-2">
                                     <button onClick={addTimeBlock} disabled={schedule.length>=10} className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50 text-xs flex items-center gap-1"><Plus size={12}/> Time</button>
                                     <button onClick={addGoal} disabled={trackingGoals.length>=5} className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 disabled:opacity-50 text-xs flex items-center gap-1"><Plus size={12}/> Goal</button>
                                     <button onClick={copyTemplate} className="px-3 py-1 bg-fuchsia-900/30 text-fuchsia-400 rounded hover:bg-fuchsia-900/50 text-xs flex items-center gap-1"><Save size={12}/> Save Template</button>
                                 </div>
                             )}
                             <div className="flex items-center gap-2">
                                 <span className="text-xs uppercase font-bold text-slate-500">Reward Goal:</span>
                                 {isEditingTracker ? (
                                     <input type="number" className="w-12 bg-slate-950 border border-slate-700 rounded p-1 text-center text-sm font-bold text-white" value={rewardThreshold} onChange={(e) => setRewardThreshold(Number(e.target.value))} />
                                 ) : (
                                     <span className="text-sm font-bold text-white">{rewardThreshold}%</span>
                                 )}
                             </div>
                             <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                                <span className="text-xs font-bold text-slate-500 uppercase">Current:</span>
                                <span className={`font-mono font-bold ${calculateReward() >= rewardThreshold ? 'text-emerald-400' : 'text-amber-400'}`}>{calculateReward()}%</span>
                             </div>
                             {calculateReward() >= rewardThreshold && (
                                 <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-3 py-1 rounded-full flex items-center gap-1 text-xs shadow-lg animate-pulse">
                                     <Star fill="black" size={12}/> Unlocked!
                                 </div>
                             )}
                             <Button onClick={() => setIsEditingTracker(!isEditingTracker)} variant="secondary" icon={Settings} className="h-8 text-xs">{isEditingTracker ? "Done" : "Edit"}</Button>
                          </div>
                      </div>

                      <div className="overflow-x-auto pb-4">
                        <div className="min-w-[800px] bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                            <div className="flex border-b border-slate-700/50 bg-slate-900">
                                <div className="w-48 p-4 font-bold text-slate-400 uppercase text-xs tracking-wider flex-shrink-0 border-r border-slate-700/50">Time Block</div>
                                {trackingGoals.map((goal, idx) => (
                                    <div key={idx} className="flex-1 p-4 font-bold text-cyan-400 text-center border-r border-slate-700/50 last:border-r-0 relative group">
                                        {isEditingTracker ? (
                                            <div className="flex flex-col gap-1">
                                                <input className="bg-slate-950 text-cyan-400 text-center w-full p-1 rounded border border-cyan-500/30 text-xs" value={goal} onChange={(e) => {
                                                    const newGoals = [...trackingGoals];
                                                    newGoals[idx] = e.target.value;
                                                    setTrackingGoals(newGoals);
                                                }} />
                                                <button onClick={() => removeGoal(idx)} className="text-red-400 text-[10px] hover:text-red-300">Remove</button>
                                            </div>
                                        ) : goal}
                                    </div>
                                ))}
                            </div>
                            {schedule.map((block, bIdx) => (
                                <div key={bIdx} className="flex border-b border-slate-700/50 last:border-b-0 hover:bg-slate-800/30 transition-colors">
                                    <div className="w-48 p-4 font-bold text-slate-300 flex-shrink-0 border-r border-slate-700/50 flex items-center justify-between">
                                        {isEditingTracker ? (
                                            <div className="flex items-center gap-2 w-full">
                                                <input className="bg-slate-950 text-white w-full p-1 rounded border border-slate-700 text-xs" value={block} onChange={(e) => {
                                                    const newSched = [...schedule];
                                                    newSched[bIdx] = e.target.value;
                                                    setSchedule(newSched);
                                                }} />
                                                <button onClick={() => removeTimeBlock(bIdx)} className="text-red-400"><Minus size={12}/></button>
                                            </div>
                                        ) : block}
                                    </div>
                                    {trackingGoals.map((goal, gIdx) => {
                                        const status = trackerData[`${block}-${goal}`];
                                        return (
                                            <div key={gIdx} onClick={() => !isEditingTracker && handleTrackerClick(block, goal)} className="flex-1 p-2 border-r border-slate-700/50 last:border-r-0 flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors">
                                                {status === 'star' && <Star className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" size={24} />}
                                                {status === 'smile' && <Smile className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" size={24} />}
                                                {status === 'check' && <CheckCircle className="text-cyan-400" size={24} />}
                                                {!status && <div className="w-3 h-3 rounded-full bg-slate-800"></div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                      </div>
                  </div>
              )}

              {behaviorTab === 'log' && (
                  <div className="grid lg:grid-cols-2 gap-8">
                    <Card className="p-8" glow>
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><ShieldAlert className="text-fuchsia-400"/> Incident Log</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input type="date" className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none" onChange={e => setNewIncident({...newIncident, date: e.target.value})} />
                                <input type="text" placeholder="Antecedent" className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none" onChange={e => setNewIncident({...newIncident, antecedent: e.target.value})} />
                            </div>
                            <input type="text" placeholder="Behavior Observed" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none" onChange={e => setNewIncident({...newIncident, behavior: e.target.value})} />
                            <input type="text" placeholder="Consequence/Intervention" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none" onChange={e => setNewIncident({...newIncident, consequence: e.target.value})} />
                            <div className="flex gap-2">
                                <Button onClick={handleLogBehavior} className="flex-1" icon={Plus}>Log Incident</Button>
                                <Button onClick={handleAnalyzeBehavior} variant="secondary" className="flex-1" icon={Brain}>Analyze Patterns</Button>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-8 bg-slate-950 flex flex-col">
                        <h2 className="text-xs font-bold text-slate-500 uppercase mb-4">Intervention Analysis</h2>
                        {bipAnalysis ? (
                            <div className="flex-1 flex flex-col">
                                <div className="flex-1 bg-slate-900/50 rounded-xl p-6 text-slate-200 text-sm whitespace-pre-wrap leading-relaxed border border-slate-800 font-serif">{bipAnalysis}</div>
                                <CopyBlock content={bipAnalysis} label="Copy BIP to Documentation" />
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                                <Activity size={48} className="mb-4 opacity-50"/>
                                <p>Log incidents to generate AI strategies.</p>
                            </div>
                        )}
                    </Card>
                    <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                         <table className="w-full text-sm text-left text-slate-400">
                             <thead className="bg-slate-950 text-slate-200 font-bold uppercase text-xs">
                                 <tr><th className="p-4">Date</th><th className="p-4">Antecedent</th><th className="p-4">Behavior</th><th className="p-4">Consequence</th></tr>
                             </thead>
                             <tbody className="divide-y divide-slate-800">
                                 {behaviorLog.length === 0 ? <tr><td colSpan="4" className="p-8 text-center italic opacity-50">No incidents logged yet.</td></tr> : behaviorLog.map(log => (
                                     <tr key={log.id}><td className="p-4 font-mono text-cyan-400">{log.date}</td><td className="p-4">{log.antecedent}</td><td className="p-4 text-white">{log.behavior}</td><td className="p-4">{log.consequence}</td></tr>
                                 ))}
                             </tbody>
                         </table>
                    </div>
                  </div>
              )}
          </div>
        )}

      </main>
      
      {/* ADD STUDENT MODAL */}
      {isAddingStudent && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-lg p-8 border-slate-600 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-white">Add to Caseload</h2>
                      <button onClick={() => setIsAddingStudent(false)} className="text-slate-400 hover:text-white"><X /></button>
                  </div>
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <input placeholder="Student Name" className="bg-slate-950 p-3 rounded-lg border border-slate-700 text-white outline-none focus:border-cyan-500" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                          <input placeholder="Grade" className="bg-slate-950 p-3 rounded-lg border border-slate-700 text-white outline-none focus:border-cyan-500" value={newStudent.grade} onChange={e => setNewStudent({...newStudent, grade: e.target.value})} />
                      </div>
                      <input placeholder="Primary Need" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 text-white outline-none focus:border-cyan-500" value={newStudent.need} onChange={e => setNewStudent({...newStudent, need: e.target.value})} />
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">IEP Date</label>
                              <input type="date" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 text-white outline-none focus:border-cyan-500" value={newStudent.nextIep} onChange={e => setNewStudent({...newStudent, nextIep: e.target.value})} />
                          </div>
                          <div>
                              <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Eval Date</label>
                              <input type="date" className="w-full bg-slate-950 p-3 rounded-lg border border-slate-700 text-white outline-none focus:border-cyan-500" value={newStudent.nextEval} onChange={e => setNewStudent({...newStudent, nextEval: e.target.value})} />
                          </div>
                      </div>
                      <div className="pt-4 flex justify-end gap-2">
                          <Button variant="ghost" onClick={() => setIsAddingStudent(false)}>Cancel</Button>
                          <Button onClick={handleAddStudent}>Save</Button>
                      </div>
                  </div>
              </Card>
          </div>
      )}
    </div>
  );
};

// --- LOGIN SCREEN ---
const LoginScreen = ({ onLogin, onBack }) => {
  const [loading, setLoading] = useState(false);
  const handleAnonLogin = () => {
      setLoading(true);
      // Simulate login delay
      setTimeout(() => {
        onLogin({ name: "Educator (Guest)", uid: "guest-123", role: "Teacher", school: "Demo School" });
        setLoading(false);
      }, 800);
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_40%,transparent_100%)]"></div>
      <div className="relative z-10 w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl text-center">
         <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 mb-6 shadow-lg">
           <Sparkles className="text-cyan-400" size={40} />
         </div>
         <h1 className="text-3xl font-extrabold text-white mb-2">Prism<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">Path</span></h1>
         <p className="text-slate-400 font-medium mb-8">Educator Portal Access</p>
         <Button className="w-full" onClick={handleAnonLogin} disabled={loading}>
           {loading ? "Accessing..." : "Enter Portal (Offline Mode)"}
         </Button>
         <button onClick={onBack} className="mt-4 text-xs text-slate-500 hover:text-white uppercase font-bold tracking-widest">Back to Home</button>
      </div>
    </div>
  );
};

export default function TeacherDashboard({ onBack }) {
  const [user, setUser] = useState(null);
  // Simple local state auth simulation
  return user ? <Dashboard user={user} onLogout={() => setUser(null)} onBack={onBack} /> : <LoginScreen onLogin={setUser} onBack={onBack} />;
}

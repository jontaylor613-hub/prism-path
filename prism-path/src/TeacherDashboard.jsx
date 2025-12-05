import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Target, BookOpen, Plus, Save, Trash2, TrendingUp, 
  CheckCircle, Brain, Layout, FileText, Sparkles, ClipboardList, 
  AlertCircle, ArrowRight, GraduationCap, Lock, Shield, Eye, 
  EyeOff, Key, LogOut, Calendar, Clock, Calculator, 
  Mail, MessageSquare, Edit2, FileDown, X, ListOrdered, ChevronDown, 
  User, Wand2, Printer, Copy, Heart, Library, Compass, Sun, Moon
} from 'lucide-react';

// --- THEME HELPERS ---
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

// --- COMPONENTS ---

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
    primary: theme === 'dark' ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg border border-fuchsia-500/30" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    secondary: theme === 'dark' ? "bg-transparent text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/10" : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    ghost: theme === 'dark' ? "bg-transparent text-slate-400 hover:text-white hover:bg-white/5" : "bg-transparent text-slate-600 hover:bg-slate-100",
    ai: theme === 'dark' ? "bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white animate-pulse-slow border-none" : "bg-violet-600 text-white hover:bg-violet-700 shadow-md",
    copy: "w-full py-4 text-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-md border border-emerald-500/50"
  };
  return <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`}>{Icon && <Icon size={18} />}{children}</button>;
};

const Badge = ({ children, color = "blue", theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const colors = {
    green: isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-emerald-100 text-emerald-700 border-emerald-200",
    purple: isDark ? "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30" : "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  };
  return <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest w-fit ${colors[color] || colors.green}`}>{children}</span>;
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

const LoginScreen = ({ onLogin, onBack }) => {
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
          <p className="text-[10px] text-slate-600 text-center mt-4">Authorized Personnel Only</p>
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

// --- MAIN COMPONENT ---
export default function TeacherDashboard({ onBack }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('home');
  const [subTab, setSubTab] = useState('');
  const [currentStudentId, setCurrentStudentId] = useState(1);
  const activeStudent = INITIAL_STUDENTS.find(s => s.id === currentStudentId) || INITIAL_STUDENTS[0];
  const [plaafp, setPlaafp] = useState({ name: activeStudent.name, strength: activeStudent.strength, need: activeStudent.need, data: '', impact: '' });
  const [generatedPlaafp, setGeneratedPlaafp] = useState('');
  
  const styles = getThemeClasses(theme);
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  if (!user) return <LoginScreen onLogin={setUser} onBack={onBack} />;

  return (
    <div className={`min-h-screen font-sans pb-20 ${styles.bg} ${styles.text}`}>
      
      {/* DASHBOARD HEADER */}
      <header className={`sticky top-0 z-40 ${styles.header}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className={`p-2 rounded-lg text-white ${theme === 'dark' ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 'bg-indigo-600'}`}><Layout size={20} /></div>
              <h1 className={`hidden lg:block text-xl font-black tracking-widest uppercase ${styles.logoText}`}>Prism Path</h1>
            </div>
            <div className={`hidden md:flex gap-1 p-1 rounded-lg border ${theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
               <button onClick={() => setActiveTab('identify')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${activeTab === 'identify' ? styles.navActive : styles.navInactive}`}><FileText size={14}/> Identify</button>
               <button onClick={() => setActiveTab('develop')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${activeTab === 'develop' ? styles.navActive : styles.navInactive}`}><Target size={14}/> Develop</button>
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
                        <div><h2 className={`text-xl font-bold ${styles.text}`}>Welcome back, {user.name}</h2><p className={`text-sm ${styles.textMuted}`}>Active Student: {activeStudent.name}</p></div>
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

        {activeTab === 'identify' && (
            <Card theme={theme} className="p-6">
                <h3 className={`text-lg font-bold mb-4 uppercase ${styles.text}`}>PLAAFP Generator</h3>
                <div className="space-y-4">
                    <input type="text" value={plaafp.strength} onChange={e=>setPlaafp({...plaafp, strength:e.target.value})} placeholder="Student Strength" className={`w-full p-2 rounded ${styles.input}`} />
                    <input type="text" value={plaafp.need} onChange={e=>setPlaafp({...plaafp, need:e.target.value})} placeholder="Student Need" className={`w-full p-2 rounded ${styles.input}`} />
                    <Button onClick={() => setGeneratedPlaafp(`Based on data, ${plaafp.name} demonstrates strength in ${plaafp.strength}, but requires support in ${plaafp.need}.`)} theme={theme}>Generate Draft</Button>
                    {generatedPlaafp && <div className={`p-4 rounded border mt-4 ${theme==='dark'?'bg-slate-950 border-slate-800':'bg-slate-50 border-slate-200'}`}>{generatedPlaafp}</div>}
                </div>
            </Card>
        )}
      </main>
    </div>
  );
}

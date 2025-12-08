import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  LineChart, Target, BookOpen, Plus, Save, Trash2, CheckCircle,
  Brain, Layout, FileText, Sparkles, ClipboardList, ArrowRight,
  GraduationCap, LogOut, Calculator, Calendar, Clock,
  Search, ChevronDown, User, Wand2, Copy, Heart,
  MessageSquare, Edit2, FileDown, Menu, X, MapPin, Activity, 
  Eye, EyeOff, AlertTriangle, Mail, UploadCloud, BarChart3, ShieldAlert,
  Star, Smile, Settings, Users, ToggleLeft, ToggleRight, FileCheck, Minus, Lock, Printer,
  Sun, Moon, Loader2, Thermometer
} from 'lucide-react';

// --- IMPORTS ---
import { ComplianceService, GeminiService, getTheme } from './utils';
import { signUp, signIn, onAuthChange, logout, ROLES, getCurrentUserProfile } from './auth';
import AccommodationGem from './AccommodationGem';
import { 
  getStudentsForUser, 
  createStudent, 
  removeStudent, 
  getStudentGoals,
  getIepSummary,
  get504Accommodations,
  updateStudent
} from './studentData';
import { ChatHistoryService } from './chatHistory';

// --- SUB-COMPONENT: BURNOUT CHECK-IN (NEW) ---
const BurnoutCheck = ({ theme }) => {
    const [step, setStep] = useState('intro'); // intro, quiz, results
    const [answers, setAnswers] = useState({});
    const [score, setScore] = useState(0);

    const questions = [
        { id: 1, text: "I feel emotionally drained from my work." },
        { id: 2, text: "I feel used up at the end of the workday." },
        { id: 3, text: "I dread getting up in the morning and having to face another day on the job." },
        { id: 4, text: "I feel I am working too hard on my job." },
        { id: 5, text: "I feel frustrated by my job." }
    ];

    const handleAnswer = (qId, value) => {
        setAnswers({ ...answers, [qId]: value });
    };

    const calculateResults = () => {
        const total = Object.values(answers).reduce((a, b) => a + b, 0);
        setScore(total);
        setStep('results');
    };

    const getLocalSupport = () => {
        // Dynamic Location Search - No API Key needed
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                // Opens Google Maps searching for support near exact coords
                const url = `https://www.google.com/maps/search/mental+health+support+teacher+support+groups/@${latitude},${longitude},12z`;
                window.open(url, '_blank');
            }, () => {
                // Fallback if permission denied
                window.open('https://www.google.com/maps/search/mental+health+support+near+me', '_blank');
            });
        } else {
            window.open('https://www.google.com/maps/search/mental+health+support+near+me', '_blank');
        }
    };

    const getResultContent = () => {
        if (score < 12) return {
            level: "Low Risk",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10 border-emerald-500",
            msg: "You are balancing well! Keep prioritizing your boundaries.",
            tips: ["Share a positive moment with a colleague today.", "Take your full lunch break away from your desk.", "Drink a glass of water right now."]
        };
        if (score < 20) return {
            level: "Moderate Risk",
            color: "text-amber-500",
            bg: "bg-amber-500/10 border-amber-500",
            msg: "Warning signs detected. You may be pushing too hard.",
            tips: ["Say 'no' to one extra task this week.", "Leave school exactly at contract time on Friday.", "Schedule 15 mins of silence today."]
        };
        return {
            level: "High Risk",
            color: "text-red-500",
            bg: "bg-red-500/10 border-red-500",
            msg: "You are in the burnout zone. Please prioritize recovery.",
            tips: ["Speak with your union rep or admin about workload.", "Use a sick day for mental health.", "Connect with professional support immediately."]
        };
    };

    const resultData = getResultContent();

    return (
        <Card className="p-8 h-full flex flex-col items-center justify-center min-h-[500px]" theme={theme}>
            
            {step === 'intro' && (
                <div className="text-center max-w-lg animate-in zoom-in">
                    <div className="bg-fuchsia-500/20 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 text-fuchsia-500">
                        <Heart size={40} fill="currentColor" />
                    </div>
                    <h2 className={`text-3xl font-bold ${theme.text} mb-4`}>Educator Pulse Check</h2>
                    <p className={`${theme.textMuted} mb-8 leading-relaxed`}>
                        Teaching is demanding. This quick, private check-in helps you gauge your energy levels and connects you with local resources.
                    </p>
                    <Button onClick={() => setStep('quiz')} theme={theme}>Start Check-in</Button>
                </div>
            )}

            {step === 'quiz' && (
                <div className="w-full max-w-xl animate-in slide-in-from-right">
                    <h3 className={`text-xl font-bold ${theme.text} mb-6`}>Over the last 2 weeks...</h3>
                    <div className="space-y-8">
                        {questions.map((q) => (
                            <div key={q.id} className="space-y-3">
                                <p className={`font-medium ${theme.text}`}>{q.text}</p>
                                <div className="grid grid-cols-5 gap-2">
                                    {[1, 2, 3, 4, 5].map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => handleAnswer(q.id, val)}
                                            className={`p-3 rounded-lg border transition-all ${
                                                answers[q.id] === val 
                                                ? 'bg-cyan-500 text-white border-cyan-500' 
                                                : `${theme.inputBg} ${theme.inputBorder} ${theme.textMuted} hover:border-cyan-400`
                                            }`}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-between text-xs uppercase tracking-widest opacity-50">
                                    <span className={theme.textMuted}>Never</span>
                                    <span className={theme.textMuted}>Always</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 flex justify-end">
                        <Button 
                            onClick={calculateResults}
                            disabled={Object.keys(answers).length < questions.length}
                            theme={theme}
                        >
                            See Results
                        </Button>
                    </div>
                </div>
            )}

            {step === 'results' && (
                <div className="w-full max-w-2xl animate-in zoom-in">
                    <div className={`p-6 rounded-xl border-l-8 mb-8 ${resultData.bg}`}>
                        <h3 className={`text-2xl font-black mb-2 ${resultData.color}`}>{resultData.level}</h3>
                        <p className={`${theme.text} text-lg`}>{resultData.msg}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <h4 className={`font-bold ${theme.textMuted} uppercase tracking-widest text-sm mb-4`}>Suggested Actions</h4>
                            <ul className="space-y-3">
                                {resultData.tips.map((tip, i) => (
                                    <li key={i} className={`flex items-start gap-3 ${theme.text}`}>
                                        <CheckCircle size={18} className="text-cyan-500 mt-1 shrink-0" />
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className={`${theme.inputBg} p-6 rounded-xl border ${theme.cardBorder} flex flex-col items-center justify-center text-center`}>
                            <MapPin size={32} className="text-fuchsia-500 mb-3" />
                            <h4 className={`font-bold ${theme.text} mb-2`}>Find Local Support</h4>
                            <p className={`text-sm ${theme.textMuted} mb-4`}>Locate support groups and therapists near your current location.</p>
                            <Button onClick={getLocalSupport} variant="secondary" icon={ArrowRight} theme={theme}>Search Near Me</Button>
                        </div>
                    </div>

                    <div className="text-center">
                        <button onClick={() => {setStep('intro'); setAnswers({});}} className={`text-sm ${theme.textMuted} hover:${theme.text} underline`}>
                            Retake Check-in
                        </button>
                    </div>
                </div>
            )}
        </Card>
    );
};

// --- CHART COMPONENT ---
const SimpleLineChart = ({ data, target, theme }) => {
  if (!data || data.length === 0) return <div className={`h-64 flex items-center justify-center ${theme.textMuted} border ${theme.cardBorder} rounded-xl ${theme.inputBg}`}>No Data Points Recorded</div>;

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
    <div className={`w-full overflow-x-auto ${theme.inputBg} rounded-xl border ${theme.cardBorder} p-4`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {[0, 25, 50, 75, 100].map(val => (
          <g key={val}>
            <line x1={padding} y1={getY(val)} x2={width - padding} y2={getY(val)} stroke={theme.textMuted === 'text-slate-400' ? "#334155" : "#cbd5e1"} strokeWidth="1" />
            <text x={padding - 10} y={getY(val) + 4} fontSize="10" textAnchor="end" fill={theme.textMuted === 'text-slate-400' ? "#64748b" : "#94a3b8"} fontFamily="monospace">{val}%</text>
          </g>
        ))}
        {target && (
          <g>
            <line x1={padding} y1={targetY} x2={width - padding} y2={targetY} stroke="#10b981" strokeWidth="2" strokeDasharray="5,5" />
            <text x={width - padding + 5} y={targetY + 4} fontSize="10" fill="#10b981" fontWeight="bold" fontFamily="monospace">GOAL: {target}%</text>
          </g>
        )}
        <polyline points={points} fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {sortedData.map((d, i) => (
          <g key={i} className="group cursor-pointer">
            <circle cx={getX(i)} cy={getY(d.score)} r="5" fill={theme.textMuted === 'text-slate-400' ? "#0f172a" : "#fff"} stroke="#22d3ee" strokeWidth="2" className="transition-all duration-200 hover:r-8"/>
            <title>{d.date}: {d.score}%</title>
          </g>
        ))}
      </svg>
    </div>
  );
};

// --- HELPER COMPONENTS ---
const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled = false, theme }) => {
  const baseStyle = "inline-flex items-center justify-center px-4 py-2 rounded-full font-bold transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide relative overflow-hidden";
  
  const variants = {
    primary: "text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(217,70,239,0.5)] border border-white/10",
    secondary: `${theme.inputBg} ${theme.primaryText} border ${theme.inputBorder} hover:opacity-80`,
    danger: "bg-red-900/20 text-red-400 border border-red-500/30 hover:bg-red-900/40",
    ghost: `${theme.textMuted} hover:${theme.text}`,
    copy: "w-full py-3 bg-emerald-900/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/40 font-mono tracking-widest uppercase shadow-lg hover:shadow-emerald-500/20"
  };
  
  // For primary buttons, use absolute positioned gradient background to ensure full coverage
  const primaryGradientBg = variant === 'primary' ? (
    <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 -z-0"></span>
  ) : null;
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`}
    >
      {primaryGradientBg}
      <span className="relative z-10 flex items-center">
        {Icon && <Icon size={18} className={`mr-2 ${Icon === Loader2 ? 'animate-spin' : ''}`} />}
        {children}
      </span>
    </button>
  );
};

const Card = ({ children, className = "", glow = false, theme }) => (
  <div className={`relative rounded-2xl overflow-hidden ${theme.cardBg} ${theme.cardBorder} border ${className} ${glow ? 'shadow-[0_0_30px_rgba(6,182,212,0.1)]' : 'shadow-xl'}`}>
    {glow && <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>}
    <div className="relative z-10">{children}</div>
  </div>
);

// --- FIXED BADGE COMPONENT ---
const Badge = ({ children, color = "cyan", isDark }) => {
  // Define styles for both modes
  const styles = isDark ? {
    cyan: "bg-cyan-900/20 text-cyan-400 border-cyan-500/30",
    fuchsia: "bg-fuchsia-900/20 text-fuchsia-400 border-fuchsia-500/30",
    emerald: "bg-emerald-900/20 text-emerald-400 border-emerald-500/30",
    amber: "bg-amber-900/20 text-amber-400 border-amber-500/30",
    red: "bg-red-900/20 text-red-400 border-red-500/30"
  } : {
    // LIGHT MODE: Use solid colors or darker text for contrast
    cyan: "bg-cyan-100 text-cyan-700 border-cyan-200",
    fuchsia: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200", // Darker amber for readability
    red: "bg-red-100 text-red-700 border-red-200"
  };

  return <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-widest ${styles[color] || styles.cyan}`}>{children}</span>;
};

const CopyBlock = ({ content, label = "Copy for Documentation", theme }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={`mt-4 pt-4 border-t ${theme.cardBorder} animate-in fade-in`}>
      <Button onClick={handleCopy} variant="copy" icon={copied ? CheckCircle : Copy} theme={theme}>{copied ? "Copied to Clipboard!" : label}</Button>
      <p className={`text-center text-[10px] ${theme.textMuted} mt-2 uppercase tracking-widest`}>Ready for Infinite Campus / IEP Direct</p>
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
const Dashboard = ({ user, onLogout, onBack, isDark, onToggleTheme }) => {
  const theme = getTheme(isDark);
  const [activeTab, setActiveTab] = useState('profile');
  const [students, setStudents] = useState([]);
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [showSamples, setShowSamples] = useState(true);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', grade: '', need: '', nextIep: '', nextEval: '', next504: '' });
  const [goals, setGoals] = useState([]);
  const [activeGoalId, setActiveGoalId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudentForGem, setSelectedStudentForGem] = useState(null);
  const [chatHistories, setChatHistories] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editStudentData, setEditStudentData] = useState({});
  const [sortBy, setSortBy] = useState('iep'); // Default to sorting by IEP due date
  
  // Track demo mode student additions (localStorage, not saved)
  const getDemoStudentCount = () => {
    if (!user?.isDemo) return 0;
    const count = localStorage.getItem('prismpath_demo_students_count');
    return count ? parseInt(count, 10) : 0;
  };
  
  const incrementDemoStudentCount = () => {
    if (!user?.isDemo) return;
    const current = getDemoStudentCount();
    localStorage.setItem('prismpath_demo_students_count', (current + 1).toString());
  };
  
  // Load students from Firebase on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadStudents = async () => {
      // Always set loading to true initially
      if (isMounted) setLoading(true);
      
      // If no user or no uid, show sample students immediately
      if (!user || !user.uid || user.isDemo) {
        if (isMounted) {
          if (showSamples) {
            setStudents(SAMPLE_STUDENTS);
            setCurrentStudentId(prev => prev || SAMPLE_STUDENTS[0]?.id || null);
          } else {
            setStudents([]);
            setCurrentStudentId(null);
          }
          setLoading(false);
        }
        return;
      }
      
      try {
        // Try to load from Firebase with timeout
        const firebasePromise = getStudentsForUser(user.uid, user.role);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        );
        
        const firebaseStudents = await Promise.race([firebasePromise, timeoutPromise]);
        
        if (!isMounted) return;
        
        // Merge with sample students if showSamples is true
        const allStudents = showSamples 
          ? [...SAMPLE_STUDENTS, ...firebaseStudents]
          : firebaseStudents;
        
        setStudents(allStudents);
        
        // Set first student as active if none selected
        if (allStudents.length > 0) {
          setCurrentStudentId(prev => prev || allStudents[0].id);
        } else {
          setCurrentStudentId(null);
        }
      } catch (error) {
        console.error('Error loading students:', error);
        if (!isMounted) return;
        // Fallback to sample students on error
        if (showSamples) {
          setStudents(SAMPLE_STUDENTS);
          setCurrentStudentId(prev => prev || SAMPLE_STUDENTS[0]?.id || null);
        } else {
          setStudents([]);
          setCurrentStudentId(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadStudents();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, user?.role, showSamples]);

  // Filter and sort students based on showSamples toggle and sort preference
  const displayedStudents = useMemo(() => {
    let filtered = showSamples 
      ? students 
      : students.filter(s => !SAMPLE_STUDENTS.some(sample => sample.id === s.id));
    
    // Sort by selected criteria
    if (sortBy === 'iep') {
      filtered = [...filtered].sort((a, b) => {
        const dateA = a.nextIep || a.nextIepDate || '';
        const dateB = b.nextIep || b.nextIepDate || '';
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return new Date(dateA) - new Date(dateB);
      });
    } else if (sortBy === '504') {
      filtered = [...filtered].sort((a, b) => {
        const dateA = a.next504 || a.next504Date || '';
        const dateB = b.next504 || b.next504Date || '';
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return new Date(dateA) - new Date(dateB);
      });
    } else {
      // Sort by name
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return filtered;
  }, [students, showSamples, sortBy]);
  
  const activeStudent = displayedStudents.length > 0 
    ? (displayedStudents.find(s => s.id === currentStudentId) || displayedStudents[0])
    : null;
  const activeGoal = goals.find(g => g.id === activeGoalId);

  // State for student summary
  const [studentSummary, setStudentSummary] = useState('');

  // Load goals and summary when student changes
  useEffect(() => {
    const loadStudentData = async () => {
      if (!activeStudent || !user?.uid) return;
      
      try {
        // Load goals from Firebase
        if (activeStudent.id && typeof activeStudent.id === 'string') {
          const studentGoals = await getStudentGoals(activeStudent.id, user.uid);
          setGoals(studentGoals);
          
          // Load IEP summary for student summary display
          const iepSummary = await getIepSummary(activeStudent.id, user.uid);
          if (iepSummary) {
            setStudentSummary(iepSummary);
          } else {
            // If no IEP summary, check if there's a summary in activeStudent
            setStudentSummary(activeStudent.summary || 'No summary available. Click "Open in Gem" to start working with this student.');
          }
        } else {
          // For demo/local students, use their summary if available
          setStudentSummary(activeStudent.summary || 'No summary available. Click "Open in Gem" to start working with this student.');
        }
      } catch (error) {
        console.error('Error loading student data:', error);
        setStudentSummary(activeStudent.summary || 'No summary available. Click "Open in Gem" to start working with this student.');
      }
    };
    
    loadStudentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStudent?.id, user?.uid, activeStudent]);

  // Load chat histories
  useEffect(() => {
    const histories = ChatHistoryService.getAll();
    setChatHistories(histories);
  }, [activeStudent]);

  // States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false); 
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [plaafpInputs, setPlaafpInputs] = useState({ strengths: '', needs: '', impact: '' });
  const [plaafpResult, setPlaafpResult] = useState('');
  const [emailTopic, setEmailTopic] = useState('Progress Update');
  const [feedbackAreas, setFeedbackAreas] = useState({ behavior: false, social: false, academic: false, independence: false });
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [behaviorTab, setBehaviorTab] = useState('tracker'); 
  const [behaviorLog, setBehaviorLog] = useState([]);
  const [bipAnalysis, setBipAnalysis] = useState('');
  const [newIncident, setNewIncident] = useState({ date: '', antecedent: '', behavior: '', consequence: '' });
  const [newMeasure, setNewMeasure] = useState({ date: '', score: '' });
  const [schedule, setSchedule] = useState(['Morning Meeting', 'ELA Block', 'Lunch/Recess', 'Math Block', 'Specials', 'Dismissal']);
  const [trackingGoals, setTrackingGoals] = useState(['Safe Body', 'Kind Words', 'On Task']);
  const [trackerData, setTrackerData] = useState({});
  const [isEditingTracker, setIsEditingTracker] = useState(false);
  const [rewardThreshold, setRewardThreshold] = useState(80);
  const [goalInputs, setGoalInputs] = useState({ condition: '', behavior: '' });
  const [goalText, setGoalText] = useState("");
  const [goalConfig, setGoalConfig] = useState({ frequency: 'Weekly', target: 80 });

  // Helpers
  const getBadgeColor = (text) => {
      if (text === 'Compliant') return 'emerald';
      if (text === 'OVERDUE' || text.includes('< 1')) return 'red';
      if (text.includes('< 3')) return 'amber';
      return 'cyan';
  };

  // Handlers
  const handleAddStudent = async () => {
      if(!newStudent.name) {
        alert('Please enter a student name');
        return;
      }
      
      // If no user or demo mode, add to local state (demo mode - limit 1)
      if (!user?.uid || user?.isDemo) {
        // Check demo limit
        if (user?.isDemo && getDemoStudentCount() >= 1) {
          alert('Demo mode limit reached. You can only add 1 student in demo mode. Please create an account for full access.');
          return;
        }
        
        const student = { 
          ...newStudent, 
          id: Date.now(), 
          summary: "New student profile created locally. This data is not saved.",
          behaviorPlan: false,
          isDemo: true // Mark as demo student
        };
        setStudents([...students, student]);
        setIsAddingStudent(false);
        setNewStudent({ name: '', grade: '', need: '', nextIep: '', nextEval: '', next504: '' });
        setCurrentStudentId(student.id);
        incrementDemoStudentCount();
        return;
      }
      
      try {
        const studentData = {
          name: newStudent.name,
          grade: newStudent.grade,
          need: newStudent.need,
          nextIep: newStudent.nextIep,
          nextEval: newStudent.nextEval,
          next504: newStudent.next504
        };
        
        const createdStudent = await createStudent(studentData, user.uid, user.role);
        // Reload students from Firebase to get the updated list
        const firebaseStudents = await getStudentsForUser(user.uid, user.role);
        const allStudents = showSamples 
          ? [...SAMPLE_STUDENTS, ...firebaseStudents]
          : firebaseStudents;
        setStudents(allStudents);
        setIsAddingStudent(false);
        setNewStudent({ name: '', grade: '', need: '', nextIep: '', nextEval: '', next504: '' });
        setCurrentStudentId(createdStudent.id);
      } catch (error) {
        alert(`Error adding student: ${error.message}`);
        console.error('Error adding student:', error);
      }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent || !user?.uid) return;
    
    try {
      const updates = {
        name: editStudentData.name,
        grade: editStudentData.grade,
        primaryNeed: editStudentData.need,
        nextIepDate: editStudentData.nextIep || '',
        next504Date: editStudentData.next504 || '',
        nextEvalDate: editStudentData.nextEval || '',
        hasIep: !!editStudentData.nextIep,
        has504: !!editStudentData.next504
      };
      
      await updateStudent(editingStudent.id, updates, user.uid, user.role);
      
      // Reload students
      const firebaseStudents = await getStudentsForUser(user.uid, user.role);
      const allStudents = showSamples 
        ? [...SAMPLE_STUDENTS, ...firebaseStudents]
        : firebaseStudents;
      setStudents(allStudents);
      setEditingStudent(null);
      setEditStudentData({});
    } catch (error) {
      alert(`Error updating student: ${error.message}`);
      console.error('Error updating student:', error);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!confirm('Are you sure you want to remove this student from your roster?')) return;
    
    // Check if it's a sample student
    const isSample = SAMPLE_STUDENTS.find(s => s.id === studentId);
    if (isSample) {
      // Just remove from display, don't call Firebase
      setStudents(students.filter(s => s.id !== studentId));
      if (currentStudentId === studentId) {
        const remaining = students.filter(s => s.id !== studentId);
        setCurrentStudentId(remaining[0]?.id || null);
      }
      return;
    }
    
    // For Firebase students, actually remove them
    if (!user?.uid) {
      alert('You must be logged in to remove students');
      return;
    }
    
    try {
      await removeStudent(studentId, user.uid, user.role);
      // Reload students from Firebase
      const firebaseStudents = await getStudentsForUser(user.uid, user.role);
      const allStudents = showSamples 
        ? [...SAMPLE_STUDENTS, ...firebaseStudents]
        : firebaseStudents;
      setStudents(allStudents);
      if (currentStudentId === studentId) {
        const remaining = allStudents.filter(s => s.id !== studentId);
        setCurrentStudentId(remaining[0]?.id || null);
      }
    } catch (error) {
      alert(`Error removing student: ${error.message}`);
      console.error('Error removing student:', error);
    }
  };

  // Open Gem with selected student
  const handleOpenGemWithStudent = async () => {
    if (!activeStudent || !user?.uid) return;
    
    try {
      // Load IEP and 504 data
      let studentProfile = `Student: ${activeStudent.name}\nGrade: ${activeStudent.grade}\nPrimary Need: ${activeStudent.need || 'Not specified'}\n\n`;
      
      if (activeStudent.id && typeof activeStudent.id === 'string') {
        try {
          const iepSummary = await getIepSummary(activeStudent.id, user.uid);
          const plan504 = await get504Accommodations(activeStudent.id, user.uid);
          
          if (iepSummary) {
            studentProfile += `IEP Summary:\n${iepSummary}\n\n`;
          }
          if (plan504) {
            studentProfile += `504 Plan Accommodations:\n${plan504}\n\n`;
          }
          
          // Load and add goals
          const studentGoals = await getStudentGoals(activeStudent.id, user.uid);
          if (studentGoals && studentGoals.length > 0) {
            studentProfile += `Current Goals:\n`;
            studentGoals.forEach((goal, index) => {
              studentProfile += `${index + 1}. ${goal.text || goal.goalText || JSON.stringify(goal)}\n`;
              if (goal.target) {
                studentProfile += `   Target: ${goal.target}%\n`;
              }
              if (goal.frequency) {
                studentProfile += `   Frequency: ${goal.frequency}\n`;
              }
            });
            studentProfile += `\n`;
          }
        } catch (err) {
          console.error('Error loading plan data:', err);
        }
      }
      
      if (activeStudent.nextIep) {
        studentProfile += `IEP Due Date: ${activeStudent.nextIep}\n`;
      }
      if (activeStudent.next504) {
        studentProfile += `504 Plan Due Date: ${activeStudent.next504}\n`;
      }
      if (activeStudent.nextEval) {
        studentProfile += `Evaluation Due Date: ${activeStudent.nextEval}\n`;
      }
      
      setSelectedStudentForGem({
        ...activeStudent,
        profileText: studentProfile
      });
      setActiveTab('gem');
    } catch (error) {
      console.error('Error preparing student for gem:', error);
      setSelectedStudentForGem(activeStudent);
      setActiveTab('gem');
    }
  };

  const handleLockGoal = () => {
      if (!goalText) return;
      const newGoal = { id: Date.now().toString(), studentId: activeStudent.id, text: goalText, target: goalConfig.target, frequency: goalConfig.frequency, data: [], createdAt: new Date().toISOString() };
      setGoals([...goals, newGoal]);
      setActiveGoalId(newGoal.id);
      alert("Goal Locked! Go to 'Monitor' tab to track progress.");
      setActiveTab('monitor');
  };

  const handleAddDataPoint = () => {
      if (!activeGoal || !newMeasure.date || !newMeasure.score) return;
      const updatedGoal = { ...activeGoal, data: [...(activeGoal.data || []), { date: newMeasure.date, score: parseFloat(newMeasure.score) }] };
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
    // Clear previous email to allow regeneration
    setGeneratedEmail('');
    
    // Ensure student name is included - use activeStudent name or fallback
    const studentName = activeStudent?.name || 'the student';
    let prompt = { student: studentName, topic: emailTopic };
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
    if (behaviorLog.length === 0) { alert("Please add at least one incident to the log first."); return; }
    setIsAnalyzing(true); 
    const result = await GeminiService.generate({ logs: behaviorLog, targetBehavior: behaviorLog[0]?.behavior || 'General' }, 'behavior');
    setBipAnalysis(result);
    setIsAnalyzing(false); 
  };

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

  // Don't render early return - let the main render handle it

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans pb-20 transition-colors duration-500`}>
      <div className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000 ${isDark ? 'opacity-100' : 'opacity-30'}`}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* HEADER */}
      <header className={`sticky top-0 z-50 border-b ${theme.cardBorder} ${theme.navBg} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setActiveTab('profile')}>
            <Sparkles className="text-cyan-400" size={24} />
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-fuchsia-500">PrismPath</span>
          </div>

          <div className={`hidden md:flex items-center gap-1 ${isDark ? 'bg-slate-900/50' : 'bg-slate-100'} p-1 rounded-full border ${theme.cardBorder}`}>
            {['Profile', 'Identify', 'Develop', 'Monitor', 'Behavior', 'Gem', 'Roster', 'Wellness'].map((tab) => {
              const isGem = tab === 'Gem';
              const isWellness = tab === 'Wellness';
              return (
                <button 
                  key={tab} 
                  onClick={() => {
                    if (tab === 'Gem' && activeStudent) {
                      handleOpenGemWithStudent();
                    } else {
                      setActiveTab(tab.toLowerCase());
                    }
                  }} 
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === tab.toLowerCase() 
                      ? isGem 
                        ? 'bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-purple-500 text-white shadow-lg shadow-cyan-500/50' 
                        : 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white shadow-lg'
                      : isGem
                        ? `${theme.textMuted} hover:text-cyan-400 border border-cyan-500/30 hover:border-cyan-500/50`
                        : `${theme.textMuted} hover:${theme.text}`
                  } ${isGem ? 'ring-2 ring-cyan-500/20' : ''}`}
                >
                  {isGem && <Sparkles size={12} className="inline mr-1" />}
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onToggleTheme} className={`p-2 rounded-full transition-all ${isDark ? 'bg-slate-800 text-yellow-400' : 'bg-slate-200 text-orange-500'}`}>
                {isDark ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <span className="text-xs font-bold hidden sm:block">{user.name}</span>
            <button onClick={onBack} className={`text-xs font-bold ${theme.textMuted} hover:${theme.text} mr-2`}>EXIT</button>
            <button onClick={onLogout} className={`p-2 rounded-full border ${theme.cardBorder} hover:text-red-400`}><LogOut size={16}/></button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8">
        {loading ? (
          <div className={`flex items-center justify-center py-20 ${theme.textMuted}`}>
            <Loader2 className="animate-spin mr-3" size={24} />
            <span>Loading students...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
                <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide flex-1 mr-4">
                {displayedStudents.length === 0 ? (
                  <div className={`flex-shrink-0 px-4 py-3 rounded-xl border ${theme.cardBorder} ${theme.textMuted} text-sm`}>
                    No students to display. {showSamples ? 'Toggle samples off or' : ''} Add a student to get started.
                  </div>
                ) : (
                  displayedStudents.map(s => {
                    const status = ComplianceService.getStatus(s.nextIep || s.nextIepDate);
                    return (
                    <button key={s.id} onClick={() => setCurrentStudentId(s.id)} className={`flex-shrink-0 px-4 py-3 rounded-xl border transition-all relative min-w-[160px] ${currentStudentId === s.id ? `${theme.inputBg} border-cyan-500/50 shadow-lg` : `${theme.cardBg} ${theme.cardBorder} hover:opacity-80`}`}>
                        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${status.color}`}></div>
                        <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${currentStudentId === s.id ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-400'}`}>{s.name.charAt(0)}</div>
                        <div className="text-left"><p className={`text-sm font-bold ${theme.text}`}>{s.name}</p><p className={`text-[10px] ${theme.textMuted} uppercase truncate max-w-[100px]`}>{s.need || s.primaryNeed || 'N/A'}</p></div>
                        </div>
                    </button>
                    );
                  })
                )}
                <button onClick={() => setIsAddingStudent(true)} className={`flex-shrink-0 px-4 py-3 rounded-xl border border-dashed ${theme.cardBorder} ${theme.textMuted} hover:text-cyan-400 flex items-center justify-center`}><Plus size={20} /></button>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <button onClick={() => setShowSamples(!showSamples)} className={`text-[10px] uppercase font-bold ${theme.textMuted} hover:${theme.text} flex items-center gap-1`}>{showSamples ? <ToggleRight className="text-cyan-400"/> : <ToggleLeft />} Samples {showSamples ? 'On' : 'Off'}</button>
                </div>
            </div>

        {activeTab === 'profile' && (
          activeStudent ? (
          <div className="grid lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="lg:col-span-2 space-y-6">
               <Card className="p-6" theme={theme}>
                 <div className="flex justify-between items-start mb-6">
                   <div><h2 className={`text-2xl font-bold ${theme.text}`}>{activeStudent.name}</h2><p className={theme.textMuted}>Grade: {activeStudent.grade} • Primary Need: {activeStudent.need || activeStudent.primaryNeed}</p></div>
                   <div className="flex gap-2">
                     <Button onClick={handleOpenGemWithStudent} icon={Sparkles} theme={theme}>Open in Gem</Button>
                     <div className="relative"><input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt" /><Button variant="secondary" onClick={() => fileInputRef.current.click()} icon={isUploading ? Settings : UploadCloud} disabled={isUploading} theme={theme}>{isUploading ? "Analyzing..." : "Upload Data"}</Button></div>
                   </div>
                 </div>
                 <div className={`grid gap-4 ${(activeStudent.nextIep || activeStudent.nextIepDate) && (activeStudent.next504 || activeStudent.next504Date) ? 'grid-cols-3' : (activeStudent.nextIep || activeStudent.nextIepDate || activeStudent.next504 || activeStudent.next504Date) ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {(activeStudent.nextIep || activeStudent.nextIepDate) && (
                      <div className={`p-4 rounded-xl border ${theme.cardBorder} ${theme.inputBg} flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden`}>
                        <div className={`absolute top-0 left-0 w-full h-1 ${ComplianceService.getStatus(activeStudent.nextIep || activeStudent.nextIepDate).color}`}></div>
                        <p className={`text-[10px] uppercase font-bold ${theme.textMuted}`}>IEP Due Date</p><h3 className={`text-xl font-bold ${theme.text}`}>{activeStudent.nextIep || activeStudent.nextIepDate || 'N/A'}</h3><Badge color={getBadgeColor(ComplianceService.getStatus(activeStudent.nextIep || activeStudent.nextIepDate).text)} isDark={isDark}>{ComplianceService.getStatus(activeStudent.nextIep || activeStudent.nextIepDate).text}</Badge>
                      </div>
                    )}
                    {(activeStudent.next504 || activeStudent.next504Date) && (
                      <div className={`p-4 rounded-xl border ${theme.cardBorder} ${theme.inputBg} flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden`}>
                        <div className={`absolute top-0 left-0 w-full h-1 ${ComplianceService.getStatus(activeStudent.next504 || activeStudent.next504Date).color}`}></div>
                        <p className={`text-[10px] uppercase font-bold ${theme.textMuted}`}>504 Due Date</p><h3 className={`text-xl font-bold ${theme.text}`}>{activeStudent.next504 || activeStudent.next504Date || 'N/A'}</h3><Badge color={getBadgeColor(ComplianceService.getStatus(activeStudent.next504 || activeStudent.next504Date).text)} isDark={isDark}>{ComplianceService.getStatus(activeStudent.next504 || activeStudent.next504Date).text}</Badge>
                      </div>
                    )}
                    {(activeStudent.nextEval || activeStudent.nextEvalDate) && (
                      <div className={`p-4 rounded-xl border ${theme.cardBorder} ${theme.inputBg} flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden`}>
                        <div className={`absolute top-0 left-0 w-full h-1 ${ComplianceService.getStatus(activeStudent.nextEval || activeStudent.nextEvalDate).color}`}></div>
                        <p className={`text-[10px] uppercase font-bold ${theme.textMuted}`}>Evaluation Due</p><h3 className={`text-xl font-bold ${theme.text}`}>{activeStudent.nextEval || activeStudent.nextEvalDate || 'N/A'}</h3><Badge color={getBadgeColor(ComplianceService.getStatus(activeStudent.nextEval || activeStudent.nextEvalDate).text)} isDark={isDark}>{ComplianceService.getStatus(activeStudent.nextEval || activeStudent.nextEvalDate).text}</Badge>
                      </div>
                    )}
                 </div>
               </Card>
               <Card className="p-6" theme={theme}>
                 <h3 className={`text-lg font-bold ${theme.text} mb-4 flex items-center gap-2`}>
                   <BarChart3 className="text-cyan-400"/> Student Summary
                 </h3>
                 <p className={`${theme.textMuted} leading-relaxed text-sm whitespace-pre-wrap`}>
                   {studentSummary || activeStudent.summary || 'No summary available. Click "Open in Gem" to start working with this student.'}
                 </p>
               </Card>
               
               {/* Chat Histories Section */}
               {chatHistories.length > 0 && (
                 <Card className="p-6" theme={theme}>
                   <h3 className={`text-lg font-bold ${theme.text} mb-4 flex items-center gap-2`}>
                     <MessageSquare className="text-fuchsia-400"/> Chat Histories
                   </h3>
                   <div className="space-y-3 max-h-64 overflow-y-auto">
                     {chatHistories
                       .filter(chat => {
                         // Filter chats that match current student if available
                         if (activeStudent && activeStudent.name) {
                           const profileName = typeof chat.profile === 'object' && chat.profile.name 
                             ? chat.profile.name 
                             : (typeof chat.profile === 'string' ? chat.profile.match(/Student:\s*([^\n]+)/i)?.[1] : '');
                           return profileName && profileName.toLowerCase().includes(activeStudent.name.toLowerCase());
                         }
                         return true; // Show all if no student selected
                       })
                       .map((chat) => (
                         <div
                           key={chat.id}
                           onClick={() => {
                             setSelectedStudentForGem({
                               profileText: typeof chat.profile === 'object' ? chat.profile.profileText || JSON.stringify(chat.profile) : chat.profile,
                               name: typeof chat.profile === 'object' && chat.profile.name ? chat.profile.name : activeStudent?.name
                             });
                             setActiveTab('gem');
                           }}
                           className={`p-3 rounded-lg border cursor-pointer transition-all ${
                             theme.cardBorder
                           } ${theme.inputBg} hover:border-cyan-500/50`}
                         >
                           <div className="flex items-start justify-between gap-2">
                             <div className="flex-1 min-w-0">
                               <div className={`font-medium ${theme.text} text-sm mb-1 truncate`}>
                                 {typeof chat.profile === 'object' && chat.profile.name 
                                   ? chat.profile.name 
                                   : (typeof chat.profile === 'string' ? chat.profile.match(/Student:\s*([^\n]+)/i)?.[1] || 'Chat History' : 'Chat History')}
                               </div>
                               <div className={`text-xs ${theme.textMuted} flex items-center gap-1`}>
                                 <Clock size={12} />
                                 {new Date(chat.lastAccessed).toLocaleDateString()}
                               </div>
                               {chat.messages && chat.messages.length > 0 && (
                                 <div className={`text-xs ${theme.textMuted} mt-1`}>
                                   {chat.messages.length} {chat.messages.length === 1 ? 'message' : 'messages'}
                                 </div>
                               )}
                             </div>
                             <Sparkles size={16} className="text-cyan-400 shrink-0" />
                           </div>
                         </div>
                       ))}
                   </div>
                   {chatHistories.filter(chat => {
                     if (activeStudent && activeStudent.name) {
                       const profileName = typeof chat.profile === 'object' && chat.profile.name 
                         ? chat.profile.name 
                         : (typeof chat.profile === 'string' ? chat.profile.match(/Student:\s*([^\n]+)/i)?.[1] : '');
                       return profileName && profileName.toLowerCase().includes(activeStudent.name.toLowerCase());
                     }
                     return true;
                   }).length === 0 && (
                     <p className={`text-sm ${theme.textMuted} text-center py-4`}>
                       No chat histories found for this student. Open in Gem to start a conversation.
                     </p>
                   )}
                 </Card>
               )}
            </div>
            <div className="space-y-6">
              <Card className="p-6 h-full flex flex-col" glow theme={theme}>
                <h3 className={`text-lg font-bold ${theme.text} mb-4 flex items-center gap-2`}><Mail className="text-fuchsia-400"/> Parent Communication</h3>
                <div className="space-y-4 flex-1">
                   <div><label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-2`}>Topic</label><select value={emailTopic} onChange={(e) => setEmailTopic(e.target.value)} className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none`}><option>Progress Update</option><option>Solicit Feedback</option><option>Meeting Request</option><option>Behavior Report</option></select></div>
                   {emailTopic === 'Solicit Feedback' && (
                       <div className={`${theme.inputBg} p-3 rounded border ${theme.cardBorder} space-y-2`}><p className={`text-xs font-bold ${theme.textMuted} uppercase`}>Ask about:</p>{['behavior', 'social', 'academic', 'independence'].map(area => (<label key={area} className={`flex items-center gap-2 text-sm ${theme.textMuted} cursor-pointer hover:${theme.text}`}><input type="checkbox" checked={feedbackAreas[area]} onChange={e => setFeedbackAreas({...feedbackAreas, [area]: e.target.checked})} className="accent-cyan-500"/>{area.charAt(0).toUpperCase() + area.slice(1)} at Home</label>))}</div>
                   )}
                   <Button onClick={handleGenerateEmail} disabled={isGenerating} className="w-full" icon={isGenerating ? Loader2 : Wand2} theme={theme}>
                     {isGenerating ? (
                       <span className="flex items-center gap-2">
                         <Loader2 className="animate-spin" size={16} />
                         Drafting...
                       </span>
                     ) : "Generate Email Draft"}
                   </Button>
                </div>
                {isGenerating && (
                  <div className={`mt-4 pt-4 border-t ${theme.cardBorder} flex items-center justify-center py-4`}>
                    <Loader2 className="animate-spin text-cyan-400" size={24} />
                    <span className={`ml-2 ${theme.textMuted}`}>Generating email...</span>
                  </div>
                )}
                {generatedEmail && !isGenerating && (
                  <div className={`mt-4 pt-4 border-t ${theme.cardBorder}`}>
                    <div className={`${theme.inputBg} p-3 rounded text-xs ${theme.textMuted} whitespace-pre-wrap font-mono mb-2 border ${theme.cardBorder}`}>{generatedEmail}</div>
                    <div className="flex gap-2">
                      <Button onClick={() => navigator.clipboard.writeText(generatedEmail)} variant="secondary" className="flex-1" icon={Copy} theme={theme}>Copy to Clipboard</Button>
                      <Button onClick={handleGenerateEmail} variant="secondary" className="flex-1" icon={Wand2} theme={theme}>Regenerate</Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
          ) : (
            <div className={`text-center py-12 ${theme.textMuted}`}>
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p className="mb-4">No student selected. Please select a student from the list above.</p>
            </div>
          )
        )}

        {activeTab === 'identify' && (
           <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
              <Card className="p-8" theme={theme}>
                 <h2 className={`text-xl font-bold ${theme.text} mb-6 flex items-center gap-2`}><FileText className="text-cyan-400"/> PLAAFP Wizard</h2>
                 <p className={`text-sm ${theme.textMuted} mb-6`}>Input basic observations to generate a comprehensive Present Levels narrative.</p>
                 <div className="space-y-4">
                   <div><label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-2`}>Student Strengths</label><textarea className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none h-20`} placeholder="e.g. Visual learner, kind to peers..." value={plaafpInputs.strengths} onChange={(e) => setPlaafpInputs({...plaafpInputs, strengths: e.target.value})} /></div>
                   <div><label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-2`}>Key Needs/Deficits</label><textarea className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none h-20`} placeholder="e.g. Reading decoding..." value={plaafpInputs.needs} onChange={(e) => setPlaafpInputs({...plaafpInputs, needs: e.target.value})} /></div>
                   <div><label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-2`}>Impact of Disability</label><textarea className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none h-20`} placeholder="e.g. Difficulty accessing text..." value={plaafpInputs.impact} onChange={(e) => setPlaafpInputs({...plaafpInputs, impact: e.target.value})} /></div>
                   <Button onClick={handleGeneratePlaafp} disabled={isGenerating} className="w-full" icon={Wand2} theme={theme}>{isGenerating ? "Compiling..." : "Generate Narrative"}</Button>
                 </div>
              </Card>
              <Card className={`p-8 flex flex-col`} theme={theme}>
                 <h2 className={`text-xs font-bold ${theme.textMuted} uppercase mb-4`}>Narrative Preview</h2>
                 {plaafpResult ? (
                     <div className="flex-1 flex flex-col"><div className={`flex-1 ${theme.inputBg} rounded-xl p-6 ${theme.text} text-sm whitespace-pre-wrap leading-relaxed border ${theme.cardBorder} font-serif`}>{plaafpResult}</div><CopyBlock content={plaafpResult} label="Copy PLAAFP to Documentation" theme={theme} /></div>
                 ) : (
                     <div className={`flex-1 flex flex-col items-center justify-center ${theme.textMuted}`}><Brain size={48} className="mb-4 opacity-50"/><p>Enter data to generate statement.</p></div>
                 )}
              </Card>
           </div>
        )}

        {activeTab === 'develop' && (
           <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
              <Card className="p-8" glow theme={theme}>
                 <div className="flex justify-between items-center mb-6"><h2 className={`text-xl font-bold ${theme.text} flex items-center gap-2`}><Target className="text-fuchsia-400"/> Goal Drafter</h2><Badge color="cyan" isDark={isDark}>AI Active</Badge></div>
                 <div className="space-y-6">
                   <div><label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-2`}>Condition</label><input type="text" value={goalInputs.condition} onChange={(e) => setGoalInputs({...goalInputs, condition: e.target.value})} className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none`} placeholder="e.g. Given a grade level text..." /></div>
                   <div><label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-2`}>Behavior</label><input type="text" value={goalInputs.behavior} onChange={(e) => setGoalInputs({...goalInputs, behavior: e.target.value})} className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none`} placeholder="e.g. Student will decode..." /></div>
                   <Button onClick={handleGenerateGoal} disabled={isGenerating} className="w-full" theme={theme}>{isGenerating ? <span className="animate-pulse">Generating...</span> : <span><Wand2 size={16} className="inline mr-2"/> Draft Smart Goal</span>}</Button>
                 </div>
              </Card>
              <Card className={`p-8 flex flex-col`} theme={theme}>
                <h2 className={`text-xs font-bold ${theme.textMuted} uppercase mb-4`}>Goal Preview</h2>
                {goalText ? (
                    <div className="flex-1 flex flex-col">
                        <div className={`${theme.inputBg} rounded-xl p-6 mb-4 border ${theme.cardBorder}`}><p className={`text-lg ${theme.text} leading-relaxed font-medium whitespace-pre-wrap`}>{goalText}</p></div>
                        <div className={`p-4 ${theme.inputBg} rounded-xl border ${theme.cardBorder} space-y-4`}>
                            <div className="flex gap-4">
                                <div className="flex-1"><label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-1`}>Target %</label><input type="number" value={goalConfig.target} onChange={e => setGoalConfig({...goalConfig, target: Number(e.target.value)})} className={`w-full ${theme.bg} border ${theme.cardBorder} rounded p-2 ${theme.text}`} /></div>
                                <div className="flex-1"><label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-1`}>Frequency</label><select value={goalConfig.frequency} onChange={e => setGoalConfig({...goalConfig, frequency: e.target.value})} className={`w-full ${theme.bg} border ${theme.cardBorder} rounded p-2 ${theme.text}`}><option>Daily</option><option>Weekly</option><option>Bi-Weekly</option><option>Monthly</option></select></div>
                            </div>
                            <Button onClick={handleLockGoal} icon={Lock} className="w-full" variant="secondary" theme={theme}>Lock & Track This Goal</Button>
                        </div>
                        <div className="mt-4"><CopyBlock content={goalText} label="Copy Goal Only" theme={theme} /></div>
                    </div>
                ) : (
                    <div className={`flex-1 flex flex-col items-center justify-center ${theme.textMuted}`}><Target size={32} className="mx-auto mb-2 opacity-50"/><p>Define conditions to generate a goal.</p></div>
                )}
              </Card>
           </div>
        )}

        {activeTab === 'monitor' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
                <Card className="p-6" theme={theme}>
                    <div className="flex justify-between items-center mb-6"><h2 className={`text-xl font-bold ${theme.text} flex items-center gap-2`}><Activity className="text-emerald-400"/> Progress Monitoring</h2>{activeGoal && <div className={`text-xs ${theme.textMuted} ${theme.inputBg} px-3 py-1 rounded border ${theme.cardBorder}`}>Data Collection: <span className={`${theme.text} font-bold`}>{activeGoal.frequency}</span></div>}</div>
                    {goals.length === 0 ? (
                        <div className={`text-center py-12 ${theme.textMuted}`}><p className="mb-4">No locked goals found for this student.</p><Button onClick={() => setActiveTab('develop')} variant="secondary" theme={theme}>Go to Develop Tab to Create Goals</Button></div>
                    ) : (
                        <div>
                            <div className="flex gap-4 mb-6">
                                <select className={`flex-1 ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none`} value={activeGoalId || ''} onChange={(e) => setActiveGoalId(e.target.value)}>{goals.map(g => (<option key={g.id} value={g.id}>{g.text.substring(0, 60)}...</option>))}</select>
                                <Button onClick={() => window.print()} variant="secondary" icon={Printer} theme={theme}>Print Graph</Button>
                                <Button onClick={copyGraphSummary} variant="secondary" icon={Copy} theme={theme}>Copy Summary</Button>
                            </div>
                            {activeGoal && (
                                <div className="grid lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 space-y-6"><SimpleLineChart data={activeGoal.data} target={activeGoal.target} theme={theme} /><div className={`${theme.inputBg} p-4 rounded-xl border ${theme.cardBorder}`}><p className={`text-sm ${theme.textMuted} font-medium`}>Goal Statement:</p><p className={`text-sm ${theme.text} italic mt-1`}>{activeGoal.text}</p></div></div>
                                    <div className={`${theme.inputBg} rounded-xl border ${theme.cardBorder} p-6 h-fit`}>
                                        <h3 className={`text-sm font-bold ${theme.text} uppercase mb-4`}>Log Data Point</h3>
                                        <div className="space-y-4">
                                            <div><label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-1`}>Date</label><input type="date" value={newMeasure.date} onChange={e => setNewMeasure({...newMeasure, date: e.target.value})} className={`w-full ${theme.bg} border ${theme.cardBorder} rounded p-2 ${theme.text}`} /></div>
                                            <div><label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-1`}>Score (%)</label><input type="number" placeholder="0-100" value={newMeasure.score} onChange={e => setNewMeasure({...newMeasure, score: e.target.value})} className={`w-full ${theme.bg} border ${theme.cardBorder} rounded p-2 ${theme.text}`} /></div>
                                            <Button onClick={handleAddDataPoint} className="w-full" icon={Plus} theme={theme}>Add Data Point</Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        )}

        {activeTab === 'behavior' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className={`flex gap-4 mb-6 border-b ${theme.cardBorder} pb-2`}>
                  <button onClick={() => setBehaviorTab('tracker')} className={`text-sm font-bold uppercase tracking-wider pb-2 border-b-2 transition-colors ${behaviorTab === 'tracker' ? 'text-cyan-400 border-cyan-400' : `${theme.textMuted} border-transparent hover:${theme.text}`}`}>Daily Tracker (PBIS)</button>
                  <button onClick={() => setBehaviorTab('log')} className={`text-sm font-bold uppercase tracking-wider pb-2 border-b-2 transition-colors ${behaviorTab === 'log' ? 'text-fuchsia-400 border-fuchsia-400' : `${theme.textMuted} border-transparent hover:${theme.text}`}`}>Incident Log (BIP)</button>
              </div>
              {behaviorTab === 'tracker' && (
                  <div className="space-y-6">
                      <div className={`flex justify-between items-center ${theme.inputBg} p-4 rounded-xl border ${theme.cardBorder}`}>
                          <div><h2 className={`text-xl font-bold ${theme.text} mb-1`}>Daily Success Tracker</h2><p className={`${theme.textMuted} text-xs`}>Click cells to cycle: Star → Smile → Check</p></div>
                          <div className="flex items-center gap-4">
                             {isEditingTracker && (<div className="flex gap-2"><button onClick={addTimeBlock} disabled={schedule.length>=10} className={`px-3 py-1 ${theme.bg} rounded hover:opacity-80 disabled:opacity-50 text-xs flex items-center gap-1 ${theme.text}`}><Plus size={12}/> Time</button><button onClick={addGoal} disabled={trackingGoals.length>=5} className={`px-3 py-1 ${theme.bg} rounded hover:opacity-80 disabled:opacity-50 text-xs flex items-center gap-1 ${theme.text}`}><Plus size={12}/> Goal</button><button onClick={copyTemplate} className="px-3 py-1 bg-fuchsia-900/30 text-fuchsia-400 rounded hover:bg-fuchsia-900/50 text-xs flex items-center gap-1"><Save size={12}/> Save Template</button></div>)}
                             <div className="flex items-center gap-2"><span className={`text-xs uppercase font-bold ${theme.textMuted}`}>Reward Goal:</span>{isEditingTracker ? (<input type="number" className={`w-12 ${theme.bg} border ${theme.cardBorder} rounded p-1 text-center text-sm font-bold ${theme.text}`} value={rewardThreshold} onChange={(e) => setRewardThreshold(Number(e.target.value))} />) : (<span className={`text-sm font-bold ${theme.text}`}>{rewardThreshold}%</span>)}</div>
                             <div className={`flex items-center gap-2 ${theme.bg} px-3 py-1 rounded-full border ${theme.cardBorder}`}><span className={`text-xs font-bold ${theme.textMuted} uppercase`}>Current:</span><span className={`font-mono font-bold ${calculateReward() >= rewardThreshold ? 'text-emerald-400' : 'text-amber-400'}`}>{calculateReward()}%</span></div>
                             {calculateReward() >= rewardThreshold && (<div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold px-3 py-1 rounded-full flex items-center gap-1 text-xs shadow-lg animate-pulse"><Star fill="black" size={12}/> Unlocked!</div>)}
                             <Button onClick={() => setIsEditingTracker(!isEditingTracker)} variant="secondary" icon={Settings} className="h-8 text-xs" theme={theme}>{isEditingTracker ? "Done" : "Edit"}</Button>
                          </div>
                      </div>
                      <div className="overflow-x-auto pb-4"><div className={`min-w-[800px] ${theme.inputBg} rounded-2xl border ${theme.cardBorder} overflow-hidden`}>
                            <div className={`flex border-b ${theme.cardBorder} ${theme.bg}`}>
                                <div className={`w-48 p-4 font-bold ${theme.textMuted} uppercase text-xs tracking-wider flex-shrink-0 border-r ${theme.cardBorder}`}>Time Block</div>
                                {trackingGoals.map((goal, idx) => (<div key={idx} className={`flex-1 p-4 font-bold text-cyan-400 text-center border-r ${theme.cardBorder} last:border-r-0 relative group`}>{isEditingTracker ? (<div className="flex flex-col gap-1"><input className={`bg-slate-950 text-cyan-400 text-center w-full p-1 rounded border border-cyan-500/30 text-xs`} value={goal} onChange={(e) => {const newGoals = [...trackingGoals];newGoals[idx] = e.target.value;setTrackingGoals(newGoals);}} /><button onClick={() => removeGoal(idx)} className="text-red-400 text-[10px] hover:text-red-300">Remove</button></div>) : goal}</div>))}
                            </div>
                            {schedule.map((block, bIdx) => (<div key={bIdx} className={`flex border-b ${theme.cardBorder} last:border-b-0 hover:opacity-90 transition-colors`}>
                                    <div className={`w-48 p-4 font-bold ${theme.textMuted} flex-shrink-0 border-r ${theme.cardBorder} flex items-center justify-between`}>{isEditingTracker ? (<div className="flex items-center gap-2 w-full"><input className={`bg-slate-950 text-white w-full p-1 rounded border border-slate-700 text-xs`} value={block} onChange={(e) => {const newSched = [...schedule];newSched[bIdx] = e.target.value;setSchedule(newSched);}} /><button onClick={() => removeTimeBlock(bIdx)} className="text-red-400"><Minus size={12}/></button></div>) : block}</div>
                                    {trackingGoals.map((goal, gIdx) => {const status = trackerData[`${block}-${goal}`];return (<div key={gIdx} onClick={() => !isEditingTracker && handleTrackerClick(block, goal)} className={`flex-1 p-2 border-r ${theme.cardBorder} last:border-r-0 flex items-center justify-center cursor-pointer hover:${theme.bg} transition-colors`}>{status === 'star' && <Star className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" size={24} />}{status === 'smile' && <Smile className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" size={24} />}{status === 'check' && <CheckCircle className="text-cyan-400" size={24} />}{!status && <div className={`w-3 h-3 rounded-full ${theme.bg} opacity-50`}></div>}</div>);})}
                                </div>))}
                        </div></div>
                  </div>
              )}
              {behaviorTab === 'log' && (
                  <div className="grid lg:grid-cols-2 gap-8">
                    <Card className="p-8" glow theme={theme}><h2 className={`text-xl font-bold ${theme.text} mb-6 flex items-center gap-2`}><ShieldAlert className="text-fuchsia-400"/> Incident Log</h2><div className="space-y-4"><div className="grid grid-cols-2 gap-4"><input type="date" className={`${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none`} onChange={e => setNewIncident({...newIncident, date: e.target.value})} /><input type="text" placeholder="Antecedent" className={`${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none`} onChange={e => setNewIncident({...newIncident, antecedent: e.target.value})} /></div><input type="text" placeholder="Behavior Observed" className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none`} onChange={e => setNewIncident({...newIncident, behavior: e.target.value})} /><input type="text" placeholder="Consequence/Intervention" className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none`} onChange={e => setNewIncident({...newIncident, consequence: e.target.value})} /><div className="flex gap-2"><Button onClick={handleLogBehavior} className="flex-1 overflow-hidden" icon={Plus} theme={theme}>Log Incident</Button><Button onClick={handleAnalyzeBehavior} disabled={isAnalyzing} variant="secondary" className="flex-1" icon={isAnalyzing ? Loader2 : Brain} theme={theme}>{isAnalyzing ? "Analyzing..." : "Analyze Patterns"}</Button></div></div></Card>
                    <Card className={`p-8 flex flex-col`} theme={theme}><h2 className={`text-xs font-bold ${theme.textMuted} uppercase mb-4`}>Intervention Analysis</h2>{bipAnalysis ? (<div className="flex-1 flex flex-col"><div className={`flex-1 ${theme.inputBg} rounded-xl p-6 ${theme.text} text-sm whitespace-pre-wrap leading-relaxed border ${theme.cardBorder} font-serif`}>{bipAnalysis}</div><CopyBlock content={bipAnalysis} label="Copy BIP to Documentation" theme={theme} /></div>) : (<div className={`flex-1 flex flex-col items-center justify-center ${theme.textMuted}`}><Activity size={48} className="mb-4 opacity-50"/><p>Log incidents to generate AI strategies.</p></div>)}</Card>
                    <div className={`lg:col-span-2 ${theme.inputBg} rounded-xl border ${theme.cardBorder} overflow-hidden`}><table className={`w-full text-sm text-left ${theme.textMuted}`}><thead className={`${theme.bg} ${theme.text} font-bold uppercase text-xs`}><tr><th className="p-4">Date</th><th className="p-4">Antecedent</th><th className="p-4">Behavior</th><th className="p-4">Consequence</th></tr></thead><tbody className={`divide-y ${theme.cardBorder}`}>{behaviorLog.length === 0 ? <tr><td colSpan="4" className="p-8 text-center italic opacity-50">No incidents logged yet.</td></tr> : behaviorLog.map(log => (<tr key={log.id}><td className="p-4 font-mono text-cyan-400">{log.date}</td><td className="p-4">{log.antecedent}</td><td className={`p-4 ${theme.text}`}>{log.behavior}</td><td className="p-4">{log.consequence}</td></tr>))}</tbody></table></div>
                  </div>
              )}
          </div>
        )}

        {/* --- WELLNESS TAB (NEW) --- */}
        {activeTab === 'wellness' && (
            <BurnoutCheck theme={theme} />
        )}

        {/* --- GEM TAB (NEW) --- */}
        {activeTab === 'gem' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
                <AccommodationGem 
                  isDark={isDark} 
                  user={user} 
                  onBack={() => setActiveTab('profile')} 
                  isEmbedded={true}
                  selectedStudent={selectedStudentForGem}
                />
            </div>
        )}

        {/* --- ROSTER TAB (NEW) --- */}
        {activeTab === 'roster' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
            <Card className="p-6" theme={theme}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${theme.text} flex items-center gap-2`}>
                  <Users className="text-cyan-400" size={24} />
                  Student Roster
                </h2>
                <div className="flex items-center gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={`${theme.inputBg} border ${theme.inputBorder} rounded-lg px-3 py-2 ${theme.text} outline-none focus:border-cyan-500 text-sm`}
                  >
                    <option value="name">Sort by Name</option>
                    <option value="iep">Sort by IEP Due Date</option>
                    <option value="504">Sort by 504 Due Date</option>
                  </select>
                  <Button onClick={() => setIsAddingStudent(true)} icon={Plus} theme={theme}>
                    Add Student
                  </Button>
                </div>
              </div>
              
              {loading ? (
                <div className={`text-center py-12 ${theme.textMuted}`}>
                  <Loader2 className="animate-spin mx-auto mb-4" size={32} />
                  <p>Loading students...</p>
                </div>
              ) : displayedStudents.length === 0 ? (
                <div className={`text-center py-12 ${theme.textMuted}`}>
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="mb-4">No students in your roster yet.</p>
                  <Button onClick={() => setIsAddingStudent(true)} icon={Plus} theme={theme}>
                    Add Your First Student
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className={`${theme.bg} ${theme.text} font-bold uppercase text-xs border-b ${theme.cardBorder}`}>
                      <tr>
                        <th className="p-4">Student</th>
                        <th className="p-4">Grade</th>
                        <th className="p-4">Primary Need</th>
                        <th className="p-4">IEP Due Date</th>
                        <th className="p-4">504 Due Date</th>
                        <th className="p-4">Evaluation Due</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme.cardBorder}`}>
                      {displayedStudents.map((student) => {
                        const iepStatus = ComplianceService.getStatus(student.nextIep || student.nextIepDate);
                        const evalStatus = ComplianceService.getStatus(student.nextEval || student.nextEvalDate);
                        const plan504Status = ComplianceService.getStatus(student.next504 || student.next504Date);
                        
                        return (
                          <tr key={student.id} className={`hover:${theme.inputBg} transition-colors`}>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${theme.inputBg} border ${theme.cardBorder}`}>
                                  {student.name.charAt(0)}
                                </div>
                                <span className={`font-medium ${theme.text}`}>{student.name}</span>
                              </div>
                            </td>
                            <td className={`p-4 ${theme.textMuted}`}>{student.grade || 'N/A'}</td>
                            <td className={`p-4 ${theme.textMuted}`}>{student.need || student.primaryNeed || 'N/A'}</td>
                            <td className="p-4">
                              {student.nextIep || student.nextIepDate ? (
                                <div className="flex items-center gap-2">
                                  <span className={theme.text}>{student.nextIep || student.nextIepDate}</span>
                                  <Badge color={getBadgeColor(iepStatus.text)} isDark={isDark}>
                                    {iepStatus.text}
                                  </Badge>
                                </div>
                              ) : (
                                <span className={theme.textMuted}>No IEP</span>
                              )}
                            </td>
                            <td className="p-4">
                              {student.next504 || student.next504Date ? (
                                <div className="flex items-center gap-2">
                                  <span className={theme.text}>{student.next504 || student.next504Date}</span>
                                  <Badge color={getBadgeColor(plan504Status.text)} isDark={isDark}>
                                    {plan504Status.text}
                                  </Badge>
                                </div>
                              ) : (
                                <span className={theme.textMuted}>No 504</span>
                              )}
                            </td>
                            <td className="p-4">
                              {student.nextEval || student.nextEvalDate ? (
                                <div className="flex items-center gap-2">
                                  <span className={theme.text}>{student.nextEval || student.nextEvalDate}</span>
                                  <Badge color={getBadgeColor(evalStatus.text)} isDark={isDark}>
                                    {evalStatus.text}
                                  </Badge>
                                </div>
                              ) : (
                                <span className={theme.textMuted}>N/A</span>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Button 
                                  onClick={() => {
                                    setCurrentStudentId(student.id);
                                    setActiveTab('profile');
                                  }}
                                  variant="secondary"
                                  className="text-xs"
                                  theme={theme}
                                >
                                  View
                                </Button>
                                <Button 
                                  onClick={() => {
                                    setEditingStudent(student);
                                    setEditStudentData({
                                      name: student.name,
                                      grade: student.grade,
                                      need: student.need || student.primaryNeed,
                                      nextIep: student.nextIep || student.nextIepDate || '',
                                      next504: student.next504 || student.next504Date || '',
                                      nextEval: student.nextEval || student.nextEvalDate || ''
                                    });
                                  }}
                                  variant="secondary"
                                  className="text-xs"
                                  icon={Edit2}
                                  theme={theme}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  onClick={() => {
                                    setCurrentStudentId(student.id);
                                    handleOpenGemWithStudent();
                                  }}
                                  variant="secondary"
                                  className="text-xs"
                                  icon={Sparkles}
                                  theme={theme}
                                >
                                  Gem
                                </Button>
                                <button
                                  onClick={() => handleRemoveStudent(student.id)}
                                  className={`p-2 rounded-lg ${theme.textMuted} hover:text-red-400 transition-colors`}
                                  title="Remove student"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}
          </>
        )}

      </main>
      
      {editingStudent && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-lg p-8 border-slate-600 shadow-2xl" theme={theme}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-2xl font-bold ${theme.text}`}>Edit Student</h2>
                  <button onClick={() => {setEditingStudent(null); setEditStudentData({});}} className={`${theme.textMuted} hover:${theme.text}`}>
                    <X />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      placeholder="Student Name" 
                      className={`${theme.inputBg} p-3 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`} 
                      value={editStudentData.name || ''} 
                      onChange={e => setEditStudentData({...editStudentData, name: e.target.value})} 
                    />
                    <input 
                      placeholder="Grade" 
                      className={`${theme.inputBg} p-3 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`} 
                      value={editStudentData.grade || ''} 
                      onChange={e => setEditStudentData({...editStudentData, grade: e.target.value})} 
                    />
                  </div>
                  <input 
                    placeholder="Primary Need" 
                    className={`w-full ${theme.inputBg} p-3 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`} 
                    value={editStudentData.need || ''} 
                    onChange={e => setEditStudentData({...editStudentData, need: e.target.value})} 
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={`text-[10px] uppercase font-bold ${theme.textMuted} mb-1 block`}>IEP Due Date</label>
                      <input 
                        type="date" 
                        className={`w-full ${theme.inputBg} p-3 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`} 
                        value={editStudentData.nextIep || ''} 
                        onChange={e => setEditStudentData({...editStudentData, nextIep: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] uppercase font-bold ${theme.textMuted} mb-1 block`}>504 Due Date</label>
                      <input 
                        type="date" 
                        className={`w-full ${theme.inputBg} p-3 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`} 
                        value={editStudentData.next504 || ''} 
                        onChange={e => setEditStudentData({...editStudentData, next504: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] uppercase font-bold ${theme.textMuted} mb-1 block`}>Eval Date</label>
                      <input 
                        type="date" 
                        className={`w-full ${theme.inputBg} p-3 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`} 
                        value={editStudentData.nextEval || ''} 
                        onChange={e => setEditStudentData({...editStudentData, nextEval: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => {setEditingStudent(null); setEditStudentData({});}} theme={theme}>Cancel</Button>
                    <Button onClick={handleUpdateStudent} theme={theme}>Save Changes</Button>
                  </div>
                </div>
              </Card>
          </div>
      )}

      {isAddingStudent && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-lg p-8 border-slate-600 shadow-2xl" theme={theme}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-2xl font-bold ${theme.text}`}>Add to Caseload</h2>
                  <button onClick={() => setIsAddingStudent(false)} className={`${theme.textMuted} hover:${theme.text}`}>
                    <X />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      placeholder="Student Name" 
                      className={`${theme.inputBg} p-3 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`} 
                      value={newStudent.name} 
                      onChange={e => setNewStudent({...newStudent, name: e.target.value})} 
                    />
                    <input 
                      placeholder="Grade" 
                      className={`${theme.inputBg} p-3 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`} 
                      value={newStudent.grade} 
                      onChange={e => setNewStudent({...newStudent, grade: e.target.value})} 
                    />
                  </div>
                  <input 
                    placeholder="Primary Need" 
                    className={`w-full ${theme.inputBg} p-3 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`} 
                    value={newStudent.need} 
                    onChange={e => setNewStudent({...newStudent, need: e.target.value})} 
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className={`text-[10px] uppercase font-bold ${theme.textMuted} mb-1 block`}>IEP Due Date</label>
                      <input 
                        type="date" 
                        className={`w-full ${theme.inputBg} p-3 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`} 
                        value={newStudent.nextIep} 
                        onChange={e => setNewStudent({...newStudent, nextIep: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] uppercase font-bold ${theme.textMuted} mb-1 block`}>504 Due Date</label>
                      <input 
                        type="date" 
                        className={`w-full ${theme.inputBg} p-3 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`} 
                        value={newStudent.next504} 
                        onChange={e => setNewStudent({...newStudent, next504: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className={`text-[10px] uppercase font-bold ${theme.textMuted} mb-1 block`}>Eval Date</label>
                      <input 
                        type="date" 
                        className={`w-full ${theme.inputBg} p-3 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`} 
                        value={newStudent.nextEval} 
                        onChange={e => setNewStudent({...newStudent, nextEval: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsAddingStudent(false)} theme={theme}>Cancel</Button>
                    <Button onClick={handleAddStudent} theme={theme}>Save</Button>
                  </div>
                </div>
              </Card>
          </div>
      )}
    </div>
  );
};

// --- LOGIN SCREEN (FERPA-Compliant) ---
const LoginScreen = ({ onLogin, onBack }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'regular_ed',
    school: '',
    schoolDistrict: ''
  });


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        await signUp(formData.email, formData.password, {
          name: formData.name,
          role: formData.role,
          school: formData.school,
          schoolDistrict: formData.schoolDistrict
        });
        // After signup, automatically sign in
        const userCredential = await signIn(formData.email, formData.password);
        const profile = await getCurrentUserProfile(userCredential.user.uid);
        onLogin(profile);
      } else {
        const userCredential = await signIn(formData.email, formData.password);
        const profile = await getCurrentUserProfile(userCredential.user.uid);
        onLogin(profile);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const theme = getTheme(true);
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black_40%,transparent_100%)]"></div>
      <div className="relative z-10 w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
         <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 mb-6 shadow-lg mx-auto"><Sparkles className="text-cyan-400" size={40} /></div>
         <h1 className="text-3xl font-extrabold text-white mb-2 text-center">Prism<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">Path</span></h1>
         <p className="text-slate-400 font-medium mb-6 text-center">FERPA-Compliant Educator Portal</p>
         
         <form onSubmit={handleSubmit} className="space-y-4">
           {isSignUp && (
             <>
               <div>
                 <label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-1`}>Full Name</label>
                 <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none focus:border-cyan-500`} placeholder="Jane Doe" />
               </div>
               <div>
                 <label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-1`}>Role</label>
                 <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none focus:border-cyan-500`}>
                   <option value="regular_ed">Regular Education Teacher</option>
                   <option value="sped">Special Education Teacher</option>
                   <option value="admin">Administrator</option>
                 </select>
               </div>
               <div>
                 <label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-1`}>School</label>
                 <input type="text" value={formData.school} onChange={e => setFormData({...formData, school: e.target.value})} className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none focus:border-cyan-500`} placeholder="Lincoln Elementary" />
               </div>
               <div>
                 <label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-1`}>School District</label>
                 <input type="text" value={formData.schoolDistrict} onChange={e => setFormData({...formData, schoolDistrict: e.target.value})} className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none focus:border-cyan-500`} placeholder="Springfield School District" />
               </div>
             </>
           )}
           <div>
             <label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-1`}>Email</label>
             <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none focus:border-cyan-500`} placeholder="teacher@school.edu" />
           </div>
           <div>
             <label className={`block text-xs font-bold ${theme.textMuted} uppercase mb-1`}>Password</label>
             <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} minLength={6} className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none focus:border-cyan-500`} placeholder="••••••••" />
             {isSignUp && <p className={`text-xs ${theme.textMuted} mt-1`}>Minimum 6 characters</p>}
           </div>
           
           {error && <div className={`p-3 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-sm`}>{error}</div>}
           
           <Button type="submit" className="w-full" disabled={loading} theme={theme}>
             {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
           </Button>
         </form>
         
         <div className="mt-6 text-center">
           <button onClick={() => {setIsSignUp(!isSignUp); setError('');}} className={`text-sm ${theme.textMuted} hover:text-cyan-400`}>
             {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
           </button>
         </div>
         
         <div className="mt-6 pt-6 border-t border-slate-700/50">
           <button 
             onClick={() => {
               // Demo mode - bypass authentication
               onLogin({
                 uid: 'demo-user',
                 name: 'Demo Educator',
                 email: 'demo@prismpath.com',
                 role: 'sped',
                 school: 'Demo School',
                 schoolDistrict: 'Demo District',
                 isDemo: true
               });
             }}
             className="w-full px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
           >
             <Sparkles size={16} className="text-cyan-400" />
             Try Demo Mode (No Account Required)
           </button>
           <p className="text-[10px] text-slate-500 mt-2 text-center">Perfect for exploring the platform</p>
         </div>
         
         <button onClick={onBack} className="mt-4 text-xs text-slate-500 hover:text-white uppercase font-bold tracking-widest block mx-auto">Back to Home</button>
      </div>
    </div>
  );
};

export default function TeacherDashboard({ onBack, isDark, onToggleTheme }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const unsubscribe = onAuthChange((userProfile) => {
      if (userProfile) {
        setUser(userProfile);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Pass props down correctly to Dashboard
  return user ? <Dashboard user={user} onLogout={handleLogout} onBack={onBack} isDark={isDark} onToggleTheme={onToggleTheme} /> : <LoginScreen onLogin={setUser} onBack={onBack} />;
}

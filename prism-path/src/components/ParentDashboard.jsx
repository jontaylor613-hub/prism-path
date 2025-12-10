import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Plus, X, Loader2, Heart, Sparkles, LogOut, 
  User, ArrowRight, Calendar, FileText, Brain, BarChart3, Zap
} from 'lucide-react';
import { onAuthChange, logout } from '../auth';
import { getStudentsForUser, createStudent } from '../studentData';
import { getTheme } from '../utils';
import AccommodationGem from '../AccommodationGem';
import NeuroDriver from '../NeuroDriver';
import StudentProgressChart from './StudentProgressChart';
import DashboardBriefing from './DashboardBriefing';
import CommandBar from './CommandBar';

// Sample demo children for demo mode
const DEMO_CHILDREN = [
  { 
    id: 'demo-1', 
    name: "Alex M.", 
    grade: "3rd", 
    need: "Reading Decoding", 
    primaryNeed: "Reading Decoding",
    nextIep: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    nextEval: "2025-05-20", 
    next504: "",
    behaviorPlan: true, 
    summary: "Sample demo data.",
    isDemo: true
  },
  { 
    id: 'demo-2', 
    name: "Jordan K.", 
    grade: "5th", 
    need: "Math Calculation", 
    primaryNeed: "Math Calculation",
    nextIep: "2025-11-20", 
    nextEval: "2026-09-01", 
    next504: "",
    behaviorPlan: false, 
    summary: "Sample demo data.",
    isDemo: true
  }
];

// Shared components (simplified versions from TeacherDashboard)
const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon, disabled = false, theme, type = "button" }) => {
  const safeTheme = theme || getTheme(true);
  const baseStyle = "inline-flex items-center justify-center px-4 py-2 rounded-full font-bold transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide relative overflow-hidden";
  
  const variants = {
    primary: "text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(217,70,239,0.5)] border border-white/10",
    secondary: `${safeTheme.inputBg} ${safeTheme.primaryText} border ${safeTheme.inputBorder} hover:opacity-80`,
    ghost: `${safeTheme.textMuted} hover:${safeTheme.text}`
  };
  
  const primaryGradientBg = variant === 'primary' ? (
    <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 -z-0"></span>
  ) : null;
  
  return (
    <button 
      type={type}
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

const Card = ({ children, className = "", glow = false, theme }) => {
  const safeTheme = theme || getTheme(true);
  return (
    <div className={`relative rounded-2xl overflow-hidden ${safeTheme.cardBg} ${safeTheme.cardBorder} border ${className} ${glow ? 'shadow-[0_0_30px_rgba(6,182,212,0.1)]' : 'shadow-xl'}`}>
      {glow && <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default function ParentDashboard({ onBack, isDark }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'student', 'gem', 'neuro'
  const [demoMode, setDemoMode] = useState(false); // Demo mode toggle
  
  const [newChild, setNewChild] = useState({
    name: '',
    grade: '',
    need: '',
    nextIep: '',
    nextEval: '',
    next504: ''
  });

  const theme = getTheme(isDark);

  // Auth state observer
  useEffect(() => {
    const unsubscribe = onAuthChange((userProfile) => {
      if (userProfile && userProfile.role === 'parent') {
        setUser(userProfile);
      } else if (userProfile && userProfile.role !== 'parent') {
        // Redirect educators to their dashboard
        navigate('/educator');
      } else {
        setUser(null);
        navigate('/signup?type=parent');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Load students when user is available
  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true);
      
      // Demo mode: show demo children
      if (demoMode) {
        setStudents(DEMO_CHILDREN);
        if (DEMO_CHILDREN.length === 1) {
          setSelectedStudent(DEMO_CHILDREN[0]);
          setActiveView('student');
        }
        setLoading(false);
        return;
      }
      
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      
      try {
        const studentList = await getStudentsForUser(user.uid, 'parent');
        setStudents(studentList);
        
        // Auto-redirect if only 1 child
        if (studentList.length === 1) {
          setSelectedStudent(studentList[0]);
          setActiveView('student');
        }
      } catch (error) {
        console.error('Error loading students:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStudents();
  }, [user, demoMode]);

  const handleAddChild = async () => {
    if (!newChild.name) {
      alert('Please enter a child name');
      return;
    }
    
    if (!user?.uid) return;
    
    try {
      const childData = {
        name: newChild.name,
        grade: newChild.grade,
        need: newChild.need,
        nextIep: newChild.nextIep,
        nextEval: newChild.nextEval,
        next504: newChild.next504
      };
      
      const createdChild = await createStudent(childData, user.uid, 'parent');
      
      // Reload students
      const studentList = await getStudentsForUser(user.uid, 'parent');
      setStudents(studentList);
      
      setIsAddingChild(false);
      setNewChild({ name: '', grade: '', need: '', nextIep: '', nextEval: '', next504: '' });
      
      // If this is the first child, show their detail view
      if (studentList.length === 1) {
        setSelectedStudent(createdChild);
        setActiveView('student');
      }
    } catch (error) {
      alert(`Error adding child: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setActiveView('student');
  };

  // If not authenticated, show loading
  if (!user) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <Loader2 className="animate-spin text-cyan-400" size={32} />
      </div>
    );
  }

  // Student Detail View
  if (activeView === 'student' && selectedStudent) {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
        <div className="max-w-7xl mx-auto">
          {/* Command Bar - Global Navigation */}
          <CommandBar
            students={students}
            onNavigate={(view) => {
              if (view === 'profile') setActiveView('student');
              if (view === 'roster') setActiveView('dashboard');
            }}
            onAddStudent={() => setIsAddingChild(true)}
            onDraftEmail={() => setActiveView('gem')}
            onSelectStudent={(studentId) => {
              const student = students.find(s => s.id === studentId);
              if (student) {
                setSelectedStudent(student);
                setActiveView('student');
              }
            }}
            isDark={isDark}
          />

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => {
                  setActiveView('dashboard');
                  setSelectedStudent(null);
                }}
                variant="ghost"
                icon={ArrowRight}
                theme={theme}
              >
                Back to Family
              </Button>
              <h1 className={`text-3xl font-bold ${theme.text}`}>{selectedStudent.name}</h1>
              {demoMode && (
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded-full text-xs font-bold uppercase tracking-widest">
                  Demo Mode
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!demoMode && (
                <Button onClick={handleLogout} variant="ghost" icon={LogOut} theme={theme}>
                  Logout
                </Button>
              )}
            </div>
          </div>

          {/* Morning Briefing Widget */}
          <div className="mb-6">
            <DashboardBriefing
              students={[selectedStudent]}
              isDark={isDark}
              onReviewNow={() => {
                // Scroll to student info or show relevant section
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>

          {/* Premium Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="p-6" theme={theme}>
              <h2 className={`text-xl font-bold ${theme.text} mb-4 flex items-center gap-2`}>
                <Sparkles className="text-cyan-400" size={24} />
                Accommodation Assistant
              </h2>
              <p className={`${theme.textMuted} mb-4`}>
                Get AI-powered accommodation suggestions for {selectedStudent.name}.
              </p>
              <Button
                onClick={() => setActiveView('gem')}
                className="w-full"
                theme={theme}
              >
                Open Assistant
              </Button>
            </Card>

            <Card className="p-6" theme={theme}>
              <h2 className={`text-xl font-bold ${theme.text} mb-4 flex items-center gap-2`}>
                <Brain className="text-amber-400" size={24} />
                Neuro Driver
              </h2>
              <p className={`${theme.textMuted} mb-4`}>
                Task management and focus tools.
              </p>
              <Button
                onClick={() => setActiveView('neuro')}
                className="w-full"
                theme={theme}
              >
                Open Neuro Driver
              </Button>
            </Card>

            <Card className="p-6" theme={theme}>
              <h2 className={`text-xl font-bold ${theme.text} mb-4`}>Student Info</h2>
              <div className="space-y-2">
                <div>
                  <span className={`text-xs uppercase ${theme.textMuted}`}>Grade</span>
                  <p className={theme.text}>{selectedStudent.grade || 'N/A'}</p>
                </div>
                <div>
                  <span className={`text-xs uppercase ${theme.textMuted}`}>Primary Need</span>
                  <p className={theme.text}>{selectedStudent.primaryNeed || selectedStudent.need || 'N/A'}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Visual Progress Chart - "The Tesla Screen" */}
          <div className="mb-6">
            <StudentProgressChart
              student={selectedStudent}
              isDark={isDark}
            />
          </div>
        </div>
      </div>
    );
  }

  // Gem View
  if (activeView === 'gem' && selectedStudent) {
    return (
      <div className="min-h-screen">
        <AccommodationGem
          isDark={isDark}
          user={user}
          onBack={() => setActiveView('student')}
          isEmbedded={false}
        />
      </div>
    );
  }

  // Neuro Driver View
  if (activeView === 'neuro' && selectedStudent) {
    return (
      <div className="min-h-screen">
        <NeuroDriver
          onBack={() => setActiveView('student')}
          isDark={isDark}
        />
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Command Bar - Global Navigation */}
        <CommandBar
          students={students}
          onNavigate={(view) => {
            if (view === 'profile') {
              if (students.length > 0) {
                setSelectedStudent(students[0]);
                setActiveView('student');
              }
            }
            if (view === 'roster') setActiveView('dashboard');
          }}
          onAddStudent={() => setIsAddingChild(true)}
          onDraftEmail={() => {
            if (students.length > 0) {
              setSelectedStudent(students[0]);
              setActiveView('gem');
            }
          }}
          onSelectStudent={(studentId) => {
            const student = students.find(s => s.id === studentId);
            if (student) {
              setSelectedStudent(student);
              setActiveView('student');
            }
          }}
          isDark={isDark}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-4xl font-bold ${theme.text} mb-2`}>My Family</h1>
            <p className={theme.textMuted}>Manage your children's learning profiles</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Demo Mode Toggle */}
            <Button
              onClick={() => setDemoMode(!demoMode)}
              variant={demoMode ? "primary" : "secondary"}
              icon={Zap}
              theme={theme}
            >
              {demoMode ? 'Exit Demo' : 'Try Demo Mode'}
            </Button>
            {!demoMode && (
              <>
                <div className={`${theme.inputBg} px-4 py-2 rounded-lg border ${theme.inputBorder} flex items-center gap-2`}>
                  <User size={18} />
                  <span className={theme.text}>{user?.name || 'Parent'}</span>
                </div>
                <Button onClick={handleLogout} variant="ghost" icon={LogOut} theme={theme}>
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Morning Briefing Widget - Show when in demo mode or has students */}
        {(demoMode || students.length > 0) && (
          <div className="mb-8">
            <DashboardBriefing
              students={students}
              isDark={isDark}
              onReviewNow={() => {
                // Navigate to first student with upcoming deadline
                const studentWithDeadline = students.find(s => {
                  const iepDate = s.nextIep || s.nextIepDate;
                  if (!iepDate) return false;
                  const reviewDate = new Date(iepDate);
                  const now = new Date();
                  const sevenDaysFromNow = new Date(now);
                  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
                  return reviewDate >= now && reviewDate <= sevenDaysFromNow;
                });
                if (studentWithDeadline) {
                  setSelectedStudent(studentWithDeadline);
                  setActiveView('student');
                }
              }}
            />
          </div>
        )}

        {/* Students Grid */}
        {loading ? (
          <div className={`text-center py-12 ${theme.textMuted}`}>
            <Loader2 className="animate-spin mx-auto mb-4" size={32} />
            <p>Loading children...</p>
          </div>
        ) : students.length === 0 ? (
          <Card className="p-12 text-center" theme={theme}>
            <Users size={64} className="mx-auto mb-6 opacity-50 text-cyan-400" />
            <h2 className={`text-2xl font-bold ${theme.text} mb-4`}>No children added yet</h2>
            <p className={`${theme.textMuted} mb-6`}>
              {demoMode 
                ? 'Click "Try Demo Mode" to see sample children and explore premium features.'
                : 'Add your first child to get started with personalized learning support.'}
            </p>
            {!demoMode && (
              <Button onClick={() => setIsAddingChild(true)} icon={Plus} theme={theme}>
                Add Your First Child
              </Button>
            )}
            {demoMode && (
              <Button onClick={() => setDemoMode(false)} variant="secondary" theme={theme}>
                Exit Demo Mode
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <Card
                key={student.id}
                className="p-6 cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleStudentClick(student)}
                theme={theme}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl ${theme.inputBg} border ${theme.cardBorder}`}>
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${theme.text}`}>{student.name}</h3>
                    <p className={theme.textMuted}>{student.grade || 'No grade'}</p>
                  </div>
                </div>
                {student.primaryNeed || student.need ? (
                  <p className={`text-sm ${theme.textMuted} mb-4`}>
                    {student.primaryNeed || student.need}
                  </p>
                ) : null}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStudentClick(student);
                  }}
                  className="w-full"
                  theme={theme}
                >
                  View Profile <ArrowRight size={16} className="ml-2" />
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Add Child Button */}
        {students.length > 0 && !demoMode && (
          <div className="mt-8 flex justify-center">
            <Button onClick={() => setIsAddingChild(true)} icon={Plus} theme={theme}>
              Add Child
            </Button>
          </div>
        )}

        {/* Add Child Modal */}
        {isAddingChild && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg p-8 border-slate-600 shadow-2xl" theme={theme}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${theme.text}`}>Add Child</h2>
                <button
                  onClick={() => setIsAddingChild(false)}
                  className={`${theme.textMuted} hover:${theme.text}`}
                >
                  <X />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="Child Name"
                    className={`${theme.inputBg} p-3 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`}
                    value={newChild.name}
                    onChange={e => setNewChild({...newChild, name: e.target.value})}
                  />
                  <input
                    placeholder="Grade"
                    className={`${theme.inputBg} p-3 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`}
                    value={newChild.grade}
                    onChange={e => setNewChild({...newChild, grade: e.target.value})}
                  />
                </div>
                <input
                  placeholder="Primary Need (optional)"
                  className={`w-full ${theme.inputBg} p-3 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`}
                  value={newChild.need}
                  onChange={e => setNewChild({...newChild, need: e.target.value})}
                />
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={`text-[10px] uppercase font-bold ${theme.textMuted} mb-1 block`}>IEP Due Date</label>
                    <input
                      type="date"
                      className={`w-full ${theme.inputBg} p-3 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`}
                      value={newChild.nextIep}
                      onChange={e => setNewChild({...newChild, nextIep: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className={`text-[10px] uppercase font-bold ${theme.textMuted} mb-1 block`}>504 Due Date</label>
                    <input
                      type="date"
                      className={`w-full ${theme.inputBg} p-3 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`}
                      value={newChild.next504}
                      onChange={e => setNewChild({...newChild, next504: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className={`text-[10px] uppercase font-bold ${theme.textMuted} mb-1 block`}>Eval Date</label>
                    <input
                      type="date"
                      className={`w-full ${theme.inputBg} p-3 rounded-lg border ${theme.inputBorder} ${theme.text} outline-none focus:border-cyan-500`}
                      value={newChild.nextEval}
                      onChange={e => setNewChild({...newChild, nextEval: e.target.value})}
                    />
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsAddingChild(false)} theme={theme}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddChild} theme={theme}>
                    Save
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

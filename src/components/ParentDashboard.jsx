import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Plus, X, Loader2, Heart, Sparkles, LogOut, 
  User, ArrowRight, Calendar, FileText, Zap, Shield, Sun, Moon
} from 'lucide-react';
import { onAuthChange, logout } from '../auth';
import { getStudentsForUser, createStudent } from '../studentData';
import { getTheme } from '../utils';
import AccommodationGem from './AccommodationGem';
import CommandBar from './CommandBar';
import AdvocacyDashboard from './AdvocacyDashboard';

// Sample demo children for demo mode
const getIepDueDate = () => {
  const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

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
    summary: `**Student Profile: Alex M.**

**Grade:** 3rd Grade
**Primary Need:** Reading Decoding (Dyslexia)

**Current Reading Level:** Reading at approximately 1st grade level. Struggles with phonemic awareness and decoding multisyllabic words. Can read simple CVC words but has difficulty with blends, digraphs, and vowel teams.

**Strengths:**
- Strong visual memory
- Excellent oral comprehension when text is read aloud
- Enthusiastic about science and nature topics
- Good problem-solving skills in hands-on activities

**Challenges:**
- Difficulty with phonological processing
- Slow reading rate affects comprehension
- Avoids reading tasks, shows anxiety around reading aloud
- Working memory limitations impact spelling and written expression

**Accommodations & Supports:**
- Extended time (1.5x) for reading and written tasks
- Text-to-speech software for independent reading
- Chunking: Break reading assignments into smaller sections (2-3 paragraphs at a time)
- Pre-teach vocabulary with visual supports before reading
- Audio versions of texts when available
- Allow oral responses instead of written when appropriate
- Provide word banks and sentence starters for writing

**Behavior Plan:** Yes - Uses a visual schedule and token system. Responds well to movement breaks every 15-20 minutes during reading tasks.

**IEP Review Due:** ${getIepDueDate()}
**Next Evaluation:** May 20, 2025`,
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
    summary: `**Student Profile: Jordan K.**

**Grade:** 5th Grade
**Primary Need:** Math Calculation (Dyscalculia)

**Current Math Level:** Performing at approximately 3rd grade level in computation. Can add and subtract single and double-digit numbers with regrouping, but struggles with multiplication facts and multi-step word problems.

**Strengths:**
- Strong conceptual understanding when concepts are explained visually
- Excellent verbal reasoning and problem-solving strategies
- Strong in reading and writing (at or above grade level)
- Collaborative learner who benefits from peer support

**Challenges:**
- Difficulty with number sense and quantity relationships
- Struggles with math fact fluency (memorization)
- Anxiety around timed math assessments
- Difficulty transferring math concepts to word problems
- Working memory challenges affect multi-step calculations

**Accommodations & Supports:**
- Extended time (2x) for math assessments and assignments
- Use of calculator for computation (focus on problem-solving, not calculation)
- Visual aids: number lines, multiplication charts, fraction bars
- Break multi-step problems into smaller, numbered steps
- Provide examples and worked solutions as reference
- Allow use of manipulatives during instruction and assessments
- Reduce number of problems (quality over quantity)
- Pre-teach vocabulary and key terms before math lessons

**IEP Review Due:** November 20, 2025
**Next Evaluation:** September 1, 2026`,
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

export default function ParentDashboard({ onBack, isDark, onToggleTheme, initialDemoMode = false }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'student', 'gem', 'neuro', 'advocacy'
  const [demoMode, setDemoMode] = useState(initialDemoMode); // Demo mode toggle
  
  const [newChild, setNewChild] = useState({
    name: '',
    grade: '',
    need: '',
    nextIep: '',
    nextEval: '',
    next504: ''
  });

  const theme = getTheme(isDark);

  // Auth state observer - skip if in demo mode
  useEffect(() => {
    if (demoMode) {
      // In demo mode, set a demo user
      setUser({ uid: 'demo-parent', name: 'Demo Parent', role: 'parent', isDemo: true });
      return;
    }
    
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
  }, [navigate, demoMode]);

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
    
    // Handle demo mode - store locally
    if (demoMode || user?.isDemo) {
      const newChildData = {
        id: `demo-${Date.now()}`,
        name: newChild.name,
        grade: newChild.grade,
        need: newChild.need,
        primaryNeed: newChild.need,
        nextIep: newChild.nextIep,
        nextEval: newChild.nextEval,
        next504: newChild.next504,
        behaviorPlan: false,
        summary: 'No summary available. Click "Open in Gem" to start working with this student.',
        isDemo: true
      };
      
      const updatedStudents = [...students, newChildData];
      setStudents(updatedStudents);
      setIsAddingChild(false);
      setNewChild({ name: '', grade: '', need: '', nextIep: '', nextEval: '', next504: '' });
      
      // If this is the first child, show their detail view
      if (updatedStudents.length === 1) {
        setSelectedStudent(newChildData);
        setActiveView('student');
      }
      return;
    }
    
    if (!user?.uid) {
      alert('Please sign in to add a child');
      return;
    }
    
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
      if (!demoMode && user && !user.isDemo) {
        await logout();
      }
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, navigate back to home
      navigate('/');
    }
  };

  const handleBackToMain = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
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

          {/* Header with navigation and controls */}
          <div className={`sticky top-0 z-50 border-b ${theme.cardBorder} ${theme.navBg} backdrop-blur-md mb-6 -mx-6 px-6 py-4`}>
            <div className="flex items-center justify-between">
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
              <div className="flex items-center gap-3">
                {onToggleTheme && (
                  <button 
                    onClick={onToggleTheme} 
                    className={`p-2 rounded-full transition-all ${isDark ? 'bg-slate-800 text-yellow-400' : 'bg-slate-200 text-orange-500'}`}
                    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {isDark ? <Moon size={20} /> : <Sun size={20} />}
                  </button>
                )}
                <Button onClick={handleBackToMain} variant="ghost" theme={theme}>
                  Back to Main
                </Button>
                <Button onClick={handleLogout} variant="ghost" icon={LogOut} theme={theme}>
                  {demoMode ? 'Exit Demo' : 'Logout'}
                </Button>
              </div>
            </div>
          </div>


          {/* Main Feature: IEP Upload and Explanation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="p-6 flex flex-col" theme={theme}>
              <h2 className={`text-xl font-bold ${theme.text} mb-4 flex items-center gap-2`}>
                <FileText className="text-cyan-400" size={24} />
                Upload IEP Document
              </h2>
              <p className={`${theme.textMuted} mb-4 flex-1`}>
                Upload your child's IEP or 504 plan to get a plain English explanation of what it means and how it helps your child.
              </p>
              <Button
                onClick={() => setActiveView('gem')}
                className="w-full mt-auto"
                theme={theme}
              >
                Upload & Explain IEP
              </Button>
            </Card>

            <Card className="p-6 flex flex-col" theme={theme}>
              <h2 className={`text-xl font-bold ${theme.text} mb-4 flex items-center gap-2`}>
                <Sparkles className="text-cyan-400" size={24} />
                Differentiate Work
              </h2>
              <p className={`${theme.textMuted} mb-4 flex-1`}>
                Get help adapting curriculum and assignments for homeschool or when helping your child with schoolwork.
              </p>
              <Button
                onClick={() => setActiveView('gem')}
                className="w-full mt-auto"
                theme={theme}
              >
                Open Accommodation Gem™
              </Button>
            </Card>

            <Card className="p-6 flex flex-col" theme={theme}>
              <h2 className={`text-xl font-bold ${theme.text} mb-4 flex items-center gap-2`}>
                <Shield className="text-fuchsia-400" size={24} />
                Advocacy Center
              </h2>
              <p className={`${theme.textMuted} mb-4 flex-1`}>
                Access email assistance, rights information, and step-by-step advocacy tools.
              </p>
              <Button
                onClick={() => setActiveView('advocacy')}
                className="w-full mt-auto"
                theme={theme}
              >
                Open Advocacy Center
              </Button>
            </Card>
          </div>

          {/* Child Information Card */}
          <Card className="p-6 mb-6" theme={theme}>
            <h2 className={`text-xl font-bold ${theme.text} mb-4`}>Child Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className={`text-xs uppercase ${theme.textMuted}`}>Name</span>
                <p className={`${theme.text} font-medium`}>{selectedStudent.name}</p>
              </div>
              <div>
                <span className={`text-xs uppercase ${theme.textMuted}`}>Grade</span>
                <p className={theme.text}>{selectedStudent.grade || 'Not specified'}</p>
              </div>
              {(selectedStudent.primaryNeed || selectedStudent.need) && (
                <div>
                  <span className={`text-xs uppercase ${theme.textMuted}`}>Primary Need</span>
                  <p className={theme.text}>{selectedStudent.primaryNeed || selectedStudent.need}</p>
                </div>
              )}
            </div>
          </Card>
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
          selectedStudent={selectedStudent}
          isParentContext={true}
        />
      </div>
    );
  }

  // Advocacy Center View
  if (activeView === 'advocacy') {
    return (
      <AdvocacyDashboard
        isDark={isDark}
        onBack={() => setActiveView('dashboard')}
      />
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
        <div className={`sticky top-0 z-50 border-b ${theme.cardBorder} ${theme.navBg} backdrop-blur-md mb-8 -mx-6 px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-4xl font-bold ${theme.text} mb-2`}>My Family</h1>
              <p className={theme.textMuted}>Manage your children's learning profiles</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setActiveView('advocacy')}
                variant="secondary"
                icon={Shield}
                theme={theme}
              >
                Advocacy Center
              </Button>
              {onToggleTheme && (
                <button 
                  onClick={onToggleTheme} 
                  className={`p-2 rounded-full transition-all ${isDark ? 'bg-slate-800 text-yellow-400' : 'bg-slate-200 text-orange-500'}`}
                  title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDark ? <Moon size={20} /> : <Sun size={20} />}
                </button>
              )}
              <Button onClick={handleBackToMain} variant="ghost" theme={theme}>
                Back to Main
              </Button>
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
              {demoMode && (
                <Button onClick={handleLogout} variant="ghost" icon={LogOut} theme={theme}>
                  Exit Demo
                </Button>
              )}
            </div>
          </div>
        </div>


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
                ? 'Click "Add Your First Child" to create a demo child, or explore the sample children.'
                : 'Add your first child to get started with personalized learning support.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setIsAddingChild(true)} icon={Plus} theme={theme}>
                Add Your First Child
              </Button>
              {demoMode && (
                <Button onClick={() => setDemoMode(false)} variant="secondary" theme={theme}>
                  Exit Demo Mode
                </Button>
              )}
            </div>
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
        {students.length > 0 && (
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

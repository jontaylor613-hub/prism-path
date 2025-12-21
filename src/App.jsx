import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, Brain, Heart, Calendar, ExternalLink, Menu, X, Zap, 
  ShieldCheck, Clock, MessageSquare, Info, 
  MapPin, FileText, ChevronDown, Activity, GraduationCap,
  SmilePlus, Sun, Moon, Loader2, Target, Briefcase
} from 'lucide-react';

// EasterEgg removed for performance optimization

// Lazy load all route components for code splitting
const ResumeBuilder = lazy(() => import('./components/ResumeBuilder'));
const SocialMap = lazy(() => import('./components/SocialMap'));
const EmotionalCockpit = lazy(() => import('./components/EmotionalCockpit'));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'));
const NeuroDriver = lazy(() => import('./components/NeuroDriver'));
const VisualSchedule = lazy(() => import('./components/VisualSchedule'));
const AccommodationGem = lazy(() => import('./components/AccommodationGem'));
const ArchiveOfPotentials = lazy(() => import('./components/ArchiveOfPotentials'));
const SignupPage = lazy(() => import('./components/SignupPage'));
const ParentDashboard = lazy(() => import('./components/ParentDashboard'));
const QuickTrack = lazy(() => import('./components/QuickTrack'));
const Mission = lazy(() => import('./components/Mission'));
const TransitionPlanning = lazy(() => import('./components/TransitionPlanning'));
const StudentLanding = lazy(() => import('./components/StudentLanding'));
const StudentPortal = lazy(() => import('./components/StudentPortal'));
import { getTheme, GeminiService } from './utils';
import { FreeTrialService } from './freeTrial';
import { DevModeService } from './devMode';
import { GemUsageTracker } from './gemUsageTracker';
import { onAuthChange } from './auth';
import { useSmartLock } from './hooks/useSmartLock';

// Wrapper component to handle demo mode for ParentDashboard
function ParentDashboardWithDemo({ onBack, isDark, onToggleTheme }) {
  const [searchParams] = useSearchParams();
  const demoMode = searchParams.get('demo') === 'true';
  
  return <ParentDashboard onBack={onBack} isDark={isDark} onToggleTheme={onToggleTheme} initialDemoMode={demoMode} />;
}

// Wrapper component to handle demo modes for TeacherDashboard
function TeacherDashboardWithDemo({ onBack, isDark, onToggleTheme }) {
  const [searchParams] = useSearchParams();
  const demoParam = searchParams.get('demo');
  const adminDemo = demoParam === 'admin';
  
  return <TeacherDashboard onBack={onBack} isDark={isDark} onToggleTheme={onToggleTheme} adminDemoMode={adminDemo} />;
}

// Loading fallback component for Suspense
const LoadingFallback = ({ isDark = true }) => {
  const theme = getTheme(isDark);
  return (
    <div className={`min-h-screen ${theme.bg} flex flex-col items-center justify-center ${theme.text}`}>
      <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-8 max-w-md text-center`}>
        <Loader2 className="text-cyan-400 mx-auto mb-4 animate-spin" size={48} />
        <p className={theme.textMuted}>Loading...</p>
      </div>
    </div>
  );
};

// --- SHARED UI COMPONENTS ---
const Disclaimer = ({ isDark }) => (
  <div className="bg-fuchsia-900/10 border border-fuchsia-500/20 rounded-xl p-4 mb-8 flex items-start gap-3 text-left shadow-sm">
    <Info className="text-fuchsia-500 shrink-0 mt-0.5" size={18} />
    <p className={`text-sm leading-relaxed font-medium ${isDark ? 'text-fuchsia-100/90' : 'text-fuchsia-900'}`}>
      <strong>Note:</strong> This tool uses AI to generate educational suggestions. It does not replace professional medical advice or official IEPs.
    </p>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, delay, isDark, to }) => {
    const theme = getTheme(isDark);
    return (
        <Link 
            to={to}
            className={`group relative p-1 rounded-2xl bg-gradient-to-b ${isDark ? 'from-slate-700 to-slate-800' : 'from-slate-200 to-slate-100'} hover:from-cyan-500 hover:to-fuchsia-500 transition-all duration-500 cursor-pointer block`} 
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
            <div className={`relative h-full ${theme.cardBg} rounded-xl p-6 sm:p-8 flex flex-col items-start border ${theme.cardBorder}`}>
                <div className={`p-3 ${isDark ? 'bg-slate-800' : 'bg-slate-200'} rounded-lg text-cyan-500 mb-4 group-hover:text-fuchsia-500 transition-colors`}><Icon size={32} /></div>
                <h3 className={`text-xl font-bold ${theme.text} mb-2`}>{title}</h3>
                <p className={`${theme.textMuted} leading-relaxed`}>{description}</p>
            </div>
        </Link>
    );
};

// --- THE HOME PAGE COMPONENT ---
const Home = ({ isDark, setIsDark, devModeActive }) => {
  const theme = getTheme(isDark);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [studentMenuOpen, setStudentMenuOpen] = useState(false);
  const studentMenuRef = useRef(null);
  
  // Instant Accommodations Logic
  const [challenge, setChallenge] = useState('');
  const [subject, setSubject] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTrialLimit, setShowTrialLimit] = useState(false);
  
  // Check free trial status
  const trialStats = FreeTrialService.getUsageStats();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    const handleClickOutside = (event) => {
      if (studentMenuRef.current && !studentMenuRef.current.contains(event.target)) setStudentMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { window.removeEventListener('scroll', handleScroll); document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  const handleGenerate = async () => {
    if (!challenge.trim() || !subject.trim()) { setError("Please describe the challenge and the subject."); return; }
    
    // Check free trial (skip if dev mode)
    if (!devModeActive && !FreeTrialService.hasFreeUses()) {
      setShowTrialLimit(true);
      setError("You've used your free accommodations. Sign up for full access!");
      return;
    }
    
    setLoading(true); setError(''); setGeneratedPlan(null); setShowTrialLimit(false);
    try {
        // CRITICAL: skipWelcomeMessage flag ensures no profile logging, just immediate accommodations
        const response = await GeminiService.generate({ 
          targetBehavior: challenge, 
          condition: subject, 
          skipWelcomeMessage: true,
          isFirstMessage: false // Prevent welcome message
        }, 'accommodation'); 
        setGeneratedPlan(response || "No suggestions generated.");
        
        // Record the use (skip if dev mode)
        if (!devModeActive) {
          const remaining = FreeTrialService.recordUse();
          if (remaining === 0) {
            setShowTrialLimit(true);
          }
        }
    } catch (err) { setError(err.message || "Failed to generate due to unknown AI error."); } 
    finally { setLoading(false); }
  };

  return (
    <>
      <nav className={`fixed w-full z-50 transition-all duration-300 border-b ${isScrolled ? `${theme.navBg} backdrop-blur-md ${theme.glassBorder} py-3` : 'bg-transparent border-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-2 group cursor-pointer" onClick={() => window.location.pathname = '/'}>
            <div className="relative">
              <Sparkles className={`${isDark ? 'text-cyan-400' : 'text-cyan-600'} transition-colors duration-300`} size={26} />
              <div className={`absolute inset-0 bg-cyan-400 blur-lg opacity-40 transition-all duration-1000 ${isDark ? 'group-hover:bg-fuchsia-400' : 'opacity-0'}`} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-fuchsia-500">PrismPath</span>
          </div>

          <div className="hidden md:flex items-center justify-evenly flex-1">
            <div className="flex items-center gap-4">
              <button onClick={setIsDark} className={`p-2 rounded-full transition-all ${isDark ? 'bg-slate-800 text-yellow-400' : 'bg-slate-200 text-orange-500'}`}>
                  {isDark ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <div className={`h-6 w-px ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`}></div>
            </div>
            
            <Link to="/educator" className={`text-sm font-bold ${theme.secondaryText} hover:opacity-80 transition-colors flex items-center gap-1`}><GraduationCap size={16} /> For Educators</Link>
            
            <Link to="/signup?type=parent" className={`text-sm font-bold ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'} transition-colors flex items-center gap-1`}><Heart size={16} /> For Parents</Link>
            
            <Link to="/student" className={`text-sm font-bold ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'} transition-colors flex items-center gap-1`}>
              <SmilePlus size={16} /> For Students
            </Link>
            
            <div className="relative group">
              <button className={`text-sm font-bold ${theme.textMuted} hover:${theme.text} transition-colors flex items-center gap-1`}>
                <Zap size={14} /> Demos <ChevronDown size={12} className="transition-transform group-hover:rotate-180" />
              </button>
              <div className={`absolute top-full right-0 mt-2 w-56 ${theme.cardBg} border ${theme.cardBorder} rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50`}>
                <Link to="/parent/dashboard?demo=true" className={`block w-full text-left px-4 py-3 hover:bg-slate-500/10 text-sm ${theme.text} flex items-center gap-2`}>
                  <Heart size={14} className="text-indigo-400" /> Parent Portal Demo
                </Link>
                <Link to="/educator?demo=true" className={`block w-full text-left px-4 py-3 hover:bg-slate-500/10 text-sm ${theme.text} flex items-center gap-2 border-t ${theme.cardBorder}`}>
                  <GraduationCap size={14} className="text-cyan-400" /> Educator Portal Demo
                </Link>
                <Link to="/educator?demo=admin" className={`block w-full text-left px-4 py-3 hover:bg-slate-500/10 text-sm ${theme.text} flex items-center gap-2 border-t ${theme.cardBorder}`}>
                  <GraduationCap size={14} className="text-fuchsia-400" /> Admin Dashboard Demo
                </Link>
              </div>
            </div>

            <a href="#features" className={`text-sm font-medium ${theme.textMuted} hover:text-current transition-colors`}>Features</a>
            <Link to="/mission" className={`px-4 py-2 text-sm font-medium ${theme.textMuted} hover:text-current transition-colors relative group overflow-hidden rounded-full`}>
              <span className="relative z-10">
                Our Mission
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-fuchsia-500/20 to-cyan-500/20 rounded-full opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></span>
            </Link>
            <Link to="/gem" className="px-4 py-2 text-sm bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-full font-bold shadow-lg hover:shadow-cyan-500/25 transition-all">ALC</Link>
          </div>

          <button className={`md:hidden ${theme.text}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
        </div>
        
        {mobileMenuOpen && (
          <div className={`md:hidden absolute top-full left-0 w-full ${theme.bg} border-b ${theme.cardBorder} p-4 flex flex-col space-y-4 shadow-xl animate-in slide-in-from-top-5`}>
             <button onClick={setIsDark} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${theme.cardBorder} w-full`}>{isDark ? <Moon size={16} /> : <Sun size={16} />}{isDark ? "Dark Mode" : "Light Mode"}</button>
             {/* Mobile Menu Order Updated */}
             <Link to="/educator" className="block w-full text-left py-2 font-bold text-cyan-500">For Educators</Link>
             <Link to="/signup?type=parent" className="block w-full text-left py-2 font-bold text-indigo-400">For Parents</Link>
             <Link to="/student" className="block w-full text-left py-2 font-bold text-indigo-400">For Students</Link>
             <div className={`h-px ${isDark ? 'bg-slate-800' : 'bg-slate-300'} my-2`}></div>
             <div className="text-xs uppercase font-bold text-slate-500 mb-2">Demos</div>
             <Link to="/parent/dashboard?demo=true" className="block w-full text-left py-2 font-bold text-indigo-400 flex items-center gap-2"><Zap size={14} /> Parent Portal Demo</Link>
             <Link to="/educator?demo=true" className="block w-full text-left py-2 font-bold text-cyan-500 flex items-center gap-2"><Zap size={14} /> Educator Portal Demo</Link>
             <Link to="/educator?demo=admin" className="block w-full text-left py-2 font-bold text-fuchsia-500 flex items-center gap-2"><Zap size={14} /> Admin Dashboard Demo</Link>
             <div className={`h-px ${isDark ? 'bg-slate-800' : 'bg-slate-300'} my-2`}></div>
             <a href="#features" className="block w-full text-left py-2 font-bold text-slate-400">Features</a>
             <Link to="/mission" className="block w-full text-left py-2 font-bold text-cyan-400">Our Mission</Link>
          </div>
        )}
      </nav>

      <section className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${isDark ? 'bg-slate-800/50 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'} text-cyan-500 text-xs font-bold tracking-wider uppercase mb-8 backdrop-blur-sm`}>
          <span className="w-2 h-2 rounded-full bg-cyan-500 motion-safe:animate-pulse"></span><span>AI-Powered Accommodations</span>
        </div>
        <h1 className={`text-5xl md:text-7xl font-extrabold tracking-tight ${theme.text} mb-6`}>Personalized Learning <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-purple-400">Without Limits.</span></h1>
        <p className={`mt-4 max-w-2xl mx-auto text-xl ${theme.textMuted} leading-relaxed mb-10`}>Empowering <strong>educators, students</strong> and <strong>parents</strong>. Get instant, AI-powered accommodations tailored to match your learner's energy and unique learning profile.</p>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Link to="/mission" className={`px-6 py-3 rounded-full font-bold border ${theme.cardBorder} hover:bg-slate-500/10 transition-all relative group overflow-hidden`}>
            <span className="relative z-10">
              Our Mission
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-fuchsia-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"></span>
          </Link>
          <Link to="/gem" className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-full font-bold shadow-lg hover:shadow-cyan-500/25 transition-all">Accessible Learning Companion™</Link>
          <a href="#accommodations" className={`px-6 py-3 rounded-full font-bold border ${theme.cardBorder} hover:bg-slate-500/10 transition-all`}>Try Demo</a>
        </div>
        {devModeActive && (
          <div className="mt-4 text-center">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
              isDark 
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' 
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              🔓 Dev Mode Active
            </span>
          </div>
        )}
      </section>

      <section id="features" className="relative z-10 py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard to="/neuro" icon={Brain} title="Cognitive Support" description="Neuro-divergent friendly task slicer and focus tools." delay={0} isDark={isDark} />
          {/* UPDATED: Links to /schedule */}
          <FeatureCard to="/schedule" icon={Calendar} title="Visual Schedules" description="Generate clear structured visual timelines." delay={100} isDark={isDark} />
          <FeatureCard to="/cockpit" icon={Heart} title="Emotional Regulation" description="Tips for sensory breaks and emotional check-ins." delay={200} isDark={isDark} />
          <FeatureCard to="/" icon={ShieldCheck} title="Distraction Free" description="Clean, text-based plans without clutter." delay={300} isDark={isDark} />
          <FeatureCard to="/" icon={Clock} title="Time Saving" description="Seconds, not hours of research." delay={400} isDark={isDark} />
          <FeatureCard to="/" icon={Zap} title="Instant Adaptation" description="Modify load instantly to match energy." delay={500} isDark={isDark} />
        </div>
      </section>

      <section id="accommodations" className={`relative z-10 py-20 ${isDark ? 'bg-slate-900 border-y border-slate-800' : 'bg-slate-50 border-y border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-start gap-12">
          <div className="lg:w-5/12">
            <h2 className={`text-3xl font-bold ${theme.text} mb-6`}>Instant AI Accommodations <br /><span className="text-cyan-500">Try it right here</span></h2>
            <Disclaimer isDark={isDark} />
            
            {/* Free Trial Badge */}
            {trialStats.hasRemaining && (
              <div className={`mb-4 p-3 rounded-lg border ${isDark ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <Sparkles className="text-emerald-500" size={18} />
                  <span className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    {trialStats.remaining} free {trialStats.remaining === 1 ? 'accommodation' : 'accommodations'} remaining
                  </span>
                </div>
              </div>
            )}
            
            {showTrialLimit && (
              <div className={`mb-4 p-4 rounded-lg border ${isDark ? 'bg-amber-900/20 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
                <p className={`text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-700'} mb-2`}>
                  🎉 You've used your free accommodations!
                </p>
                <p className={`text-xs ${isDark ? 'text-amber-300' : 'text-amber-600'} mb-3`}>
                  Sign up for unlimited access to AI-powered accommodations, student tracking, and more.
                </p>
                <Link to="/educator" className="inline-block px-4 py-2 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-full text-xs font-bold hover:shadow-lg transition-all">
                  Create Account →
                </Link>
              </div>
            )}
            
            <div className="space-y-4 mb-8">
                <div><label className={`block text-sm font-medium ${theme.textMuted} mb-2`}>Challenge</label><input type="text" value={challenge} onChange={(e) => setChallenge(e.target.value)} placeholder="e.g. Dyslexia" className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} focus:border-cyan-500 outline-none`} /></div>
                <div><label className={`block text-sm font-medium ${theme.textMuted} mb-2`}>Subject</label><input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Reading" className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} focus:border-fuchsia-500 outline-none`} /></div>
            </div>
            <button onClick={handleGenerate} disabled={loading} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-full font-bold shadow-lg disabled:opacity-50">{loading ? 'Processing...' : 'Generate Ideas ✨'}</button>
          </div>
          <div className="lg:w-7/12 w-full">
            <div className={`relative ${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-6 md:p-8 shadow-2xl min-h-[500px]`}>
                <div className="flex items-center gap-2 mb-6 opacity-50"><div className="w-3 h-3 rounded-full bg-red-500"></div><div className="w-3 h-3 rounded-full bg-yellow-500"></div><div className="w-3 h-3 rounded-full bg-green-500"></div></div>
                <div className="prose prose-invert max-w-none">
                    {generatedPlan ? 
                        <ReactMarkdown components={{
                            p: ({node, ...props}) => <p className={`mb-4 leading-relaxed ${theme.text}`} {...props} />,
                            h3: ({node, ...props}) => <h3 className={`text-xl font-bold mb-4 mt-6 ${isDark ? 'text-slate-100' : 'text-slate-900'}`} {...props} />,
                            strong: ({node, ...props}) => <strong className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`} {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 mb-4 marker:text-slate-500" {...props} />,
                            li: ({node, ...props}) => <li className={`pl-1 ${theme.text} leading-relaxed`} {...props} />
                        }}>{generatedPlan}</ReactMarkdown> 
                        : <div className="text-center opacity-50 pt-20"><MessageSquare size={48} className={`mx-auto mb-4 ${theme.textMuted}`}/><p className={theme.textMuted}>Ready for input...</p></div>
                    }
                    {error && <div className="text-red-500 mt-4 font-medium">{error}</div>}
                </div>
            </div>
          </div>
        </div>
      </section>

      <footer className={`relative z-10 ${isDark ? 'bg-slate-950 border-t border-slate-900' : 'bg-white border-t border-slate-100'} pt-20 pb-10`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} PrismPath™ Accommodations. All rights reserved.</p>
          <p className="mt-2 text-xs">PrismPath™, Accessible Learning Companion™, Neuro Driver™, and Bridge Builder™ are trademarks of PrismPath Accommodations.</p>
        </div>
      </footer>
    </>
  );
};

// --- GEM ROUTE COMPONENT (with IP tracking) ---
// This handles both: logged-in users (from TeacherDashboard) and trial users (from home page)
function GemRoute({ isDark, devModeActive, onExit, user = null }) {
  const [canUse, setCanUse] = useState(null); // null = checking, true/false = result
  const [hasUsed, setHasUsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const theme = getTheme(isDark);
  const location = useLocation();

  // Track auth state
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkUsage = async () => {
      // If user is logged in (from TeacherDashboard), they have full access
      if (currentUser && currentUser.uid) {
        setCanUse(true);
        return;
      }

      // Dev mode bypasses all restrictions
      if (devModeActive) {
        setCanUse(true);
        return;
      }

      // Check if user can use GEM (1 use limit without account)
      const allowed = await GemUsageTracker.canUseGem();
      setCanUse(allowed);
      
      if (!allowed) {
        // Check if they've already used it
        const usage = GemUsageTracker.getUsage();
        setHasUsed(usage.count > 0);
      }
    };
    
    checkUsage();
  }, [devModeActive, currentUser]);

  // Track usage when GEM is actually used (when user sends first message)
  const handleGemUse = async () => {
    // Don't track if user is logged in (they have unlimited access)
    if (currentUser && currentUser.uid) {
      return;
    }
    
    if (!devModeActive && canUse) {
      await GemUsageTracker.recordUsage();
      setCanUse(false); // Prevent further use on future visits
      setHasUsed(true);
    }
  };

  if (canUse === null) {
    // Still checking
    return (
      <div className={`min-h-screen ${theme.bg} flex flex-col items-center justify-center ${theme.text} p-8`}>
        <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-8 max-w-md text-center`}>
          <Sparkles className="text-cyan-400 mx-auto mb-4 animate-pulse" size={48} />
          <p className={theme.textMuted}>Loading...</p>
        </div>
      </div>
    );
  }

  // Logged-in users and dev mode get full access
  if ((currentUser && currentUser.uid) || devModeActive) {
    return (
      <Suspense fallback={<LoadingFallback isDark={isDark} />}>
        <div className="relative z-[150] min-h-screen">
          <AccommodationGem 
            isDark={isDark} 
            user={currentUser || { uid: 'dev', name: 'Dev User', role: 'admin' }}
            onBack={onExit} 
          />
        </div>
      </Suspense>
    );
  }

  if (!canUse || hasUsed) {
    // Usage limit reached
    return (
      <div className={`min-h-screen ${theme.bg} flex flex-col items-center justify-center ${theme.text} p-8`}>
        <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-8 max-w-md text-center`}>
          <Sparkles className="text-cyan-400 mx-auto mb-4" size={48} />
          <h2 className={`text-2xl font-bold ${theme.text} mb-4`}>Free Trial Limit Reached</h2>
          <p className={`${theme.textMuted} mb-6`}>
            You've used your one free GEM session. Create an account for unlimited access to the Accessible Learning Companion™ and all educator tools.
          </p>
          <Link to="/educator" className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-full font-bold shadow-lg hover:shadow-cyan-500/25 transition-all inline-block mb-4">
            Create Free Account
          </Link>
          <p className={`text-xs ${theme.textMuted} mt-4`}>
            FERPA-Compliant • Secure • No Credit Card Required
          </p>
        </div>
      </div>
    );
  }

  // First use - allow but track
  return (
    <Suspense fallback={<LoadingFallback isDark={isDark} />}>
      <div className="relative z-[150] min-h-screen">
        <AccommodationGem 
          isDark={isDark} 
          user={null} // No user = demo mode
          onBack={onExit}
          onFirstUse={handleGemUse} // Track usage on first message
        />
      </div>
    </Suspense>
  );
}

// --- MAIN APP ROUTER ---
export default function App() {
  // Initialize theme from localStorage or default to dark
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('prismpath_theme');
      return saved !== null ? saved === 'dark' : true;
    } catch {
      return true;
    }
  });
  const [devModeActive, setDevModeActive] = useState(DevModeService.isActive());
  const navigate = useNavigate();
  const handleExit = () => navigate('/');
  
  // Persist theme changes to localStorage
  const handleToggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      localStorage.setItem('prismpath_theme', newTheme ? 'dark' : 'light');
    } catch (e) {
      console.error('Failed to save theme preference:', e);
    }
  };
  
  // Security: Smart Lock anti-tamper protection (disabled in dev mode)
  useSmartLock();
  
  // Dev mode code handler - works anywhere on page (toggles on/off)
  useEffect(() => {
    let codeBuffer = '';
    
    const handleKeyPress = (e) => {
      // Skip if typing in an input/textarea (let them type normally)
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        return;
      }
      
      // Build code buffer
      codeBuffer = (codeBuffer + e.key).slice(-7);
      
      // Check if code matches
      if (DevModeService.checkCode(codeBuffer)) {
        const currentlyActive = DevModeService.isActive();
        if (currentlyActive) {
          DevModeService.deactivate();
          setDevModeActive(false);
          alert('🔒 Dev Mode Deactivated. Returning to normal mode.');
        } else {
          DevModeService.activate();
          setDevModeActive(true);
          alert('🔓 Dev Mode Activated! Full access unlocked.');
        }
        codeBuffer = '';
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className={`min-h-screen ${getTheme(isDark).bg} ${getTheme(isDark).text} font-sans overflow-x-hidden selection:bg-fuchsia-500/30 selection:text-fuchsia-200 transition-colors duration-500`}>
      
      <div className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000 ${isDark ? 'opacity-100' : 'opacity-30'}`}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <Routes>
        <Route path="/" element={<Home isDark={isDark} setIsDark={handleToggleTheme} devModeActive={devModeActive} />} />
        
        <Route path="/resume" element={
          <Suspense fallback={<LoadingFallback isDark={isDark} />}>
            <div className="relative z-10 pt-10">
              <ResumeBuilder onBack={handleExit} isLowStim={!isDark} />
            </div>
          </Suspense>
        } />
        
        <Route path="/map" element={
          <Suspense fallback={<LoadingFallback isDark={isDark} />}>
            <div className="relative z-10 pt-20 h-screen">
              <SocialMap onBack={handleExit} isLowStim={!isDark} />
            </div>
          </Suspense>
        } />
        
        <Route path="/cockpit" element={
          <Suspense fallback={<LoadingFallback isDark={isDark} />}>
            <div className="relative z-[150] h-screen">
              <EmotionalCockpit onBack={handleExit} isLowStim={!isDark} />
            </div>
          </Suspense>
        } />
        
        <Route path="/neuro" element={
          <Suspense fallback={<LoadingFallback isDark={isDark} />}>
            <div className="relative z-[150] min-h-screen">
              <NeuroDriver onBack={handleExit} isDark={isDark} />
            </div>
          </Suspense>
        } />
        
        <Route path="/educator" element={
          <Suspense fallback={<LoadingFallback isDark={isDark} />}>
            <div className="relative z-[150] min-h-screen">
              <TeacherDashboardWithDemo onBack={handleExit} isDark={isDark} onToggleTheme={handleToggleTheme} />
            </div>
          </Suspense>
        } />

        <Route path="/schedule" element={
          <Suspense fallback={<LoadingFallback isDark={isDark} />}>
            <div className="relative z-[150] min-h-screen">
              <VisualSchedule onBack={handleExit} isDark={isDark} />
            </div>
          </Suspense>
        } />

        <Route path="/gem" element={
          <GemRoute isDark={isDark} devModeActive={devModeActive} onExit={handleExit} user={null} />
        } />

        <Route path="/archive" element={
          <Suspense fallback={<LoadingFallback isDark={isDark} />}>
            <div className="relative z-[150] min-h-screen">
              <ArchiveOfPotentials onBack={handleExit} isDark={isDark} />
            </div>
          </Suspense>
        } />

        <Route path="/signup" element={
          <Suspense fallback={<LoadingFallback isDark={isDark} />}>
            <div className="relative z-[150] min-h-screen">
              <SignupPage onBack={handleExit} isDark={isDark} />
            </div>
          </Suspense>
        } />

        <Route path="/parent/dashboard" element={
          <Suspense fallback={<LoadingFallback isDark={isDark} />}>
            <div className="relative z-[150] min-h-screen">
              <ParentDashboardWithDemo onBack={handleExit} isDark={isDark} onToggleTheme={handleToggleTheme} />
            </div>
          </Suspense>
        } />

        <Route path="/track/:token" element={
          <Suspense fallback={<LoadingFallback isDark={isDark} />}>
            <div className="relative z-[150] min-h-screen">
              <QuickTrack isDark={isDark} />
            </div>
          </Suspense>
        } />

        <Route path="/mission" element={
          <Suspense fallback={<LoadingFallback isDark={isDark} />}>
            <div className="relative z-[150] min-h-screen">
              <Mission isDark={isDark} onBack={handleExit} />
            </div>
          </Suspense>
        } />

        <Route path="/transition-planning" element={
          <Suspense fallback={<LoadingFallback isDark={isDark} />}>
            <div className="relative z-[150] min-h-screen">
              <TransitionPlanning isDark={isDark} onBack={handleExit} />
            </div>
          </Suspense>
        } />

        <Route path="/student" element={
          <Suspense fallback={<LoadingFallback isDark={isDark} />}>
            <div className="relative z-[150] min-h-screen">
              <StudentLanding isDark={isDark} onBack={handleExit} />
            </div>
          </Suspense>
        } />

        <Route path="/student/portal" element={
          <Suspense fallback={<LoadingFallback isDark={isDark} />}>
            <div className="relative z-[150] min-h-screen">
              <StudentPortal isDark={isDark} onBack={handleExit} onToggleTheme={handleToggleTheme} />
            </div>
          </Suspense>
        } />
      </Routes>
    </div>
  );
}

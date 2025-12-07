import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, Brain, Heart, Calendar, ExternalLink, Menu, X, Zap, 
  ShieldCheck, Clock, MessageSquare, Info, 
  MapPin, FileText, ChevronDown, Activity, GraduationCap,
  SmilePlus, Sun, Moon
} from 'lucide-react';

// Tools
import ResumeBuilder from './ResumeBuilder';
import SocialMap from './SocialMap';
import EmotionalCockpit from './EmotionalCockpit';
import TeacherDashboard from './TeacherDashboard';
import NeuroDriver from './NeuroDriver';
import { getTheme, GeminiService } from './utils';

// --- SHARED UI COMPONENTS ---
const Disclaimer = () => (
  <div className="bg-fuchsia-900/10 border border-fuchsia-500/20 rounded-xl p-4 mb-8 flex items-start gap-3 text-left shadow-sm">
    <Info className="text-fuchsia-500 shrink-0 mt-0.5" size={18} />
    <p className="text-sm text-fuchsia-900/80 dark:text-fuchsia-100/90 leading-relaxed font-medium">
      <strong>Note:</strong> This tool uses AI to generate educational suggestions. It does not replace professional medical advice or official IEPs.
    </p>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, delay, isDark, to }) => {
    const theme = getTheme(isDark);
    return (
        <Link 
            to={to}
            // REMOVED: target="_blank" to keep navigation in the same tab
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
const Home = ({ isDark, setIsDark }) => {
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
  const gemLink = "https://gemini.google.com/gem/1l1CXxrHsHi41oCGW-In9-MSlSfanKbbB?usp=sharing";

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
    setLoading(true); setError(''); setGeneratedPlan(null);
    try {
        const response = await GeminiService.generate({ targetBehavior: challenge, condition: subject }, 'accommodation'); 
        setGeneratedPlan(response || "No suggestions generated.");
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

          <div className="hidden md:flex items-center space-x-6">
            <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full transition-all ${isDark ? 'bg-slate-800 text-yellow-400' : 'bg-slate-200 text-orange-500'}`}>
                {isDark ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <div className={`h-6 w-px ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`}></div>
            
            {/* CHANGED: Using Link instead of <a> for internal navigation */}
            <Link to="/educator" className={`text-sm font-bold ${theme.secondaryText} hover:opacity-80 transition-colors flex items-center gap-1`}><GraduationCap size={16} /> For Educators</Link>
            
            <div className="relative" ref={studentMenuRef}>
              <button 
                onClick={() => setStudentMenuOpen(!studentMenuOpen)} 
                className={`flex items-center gap-1 text-sm font-bold ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'} transition-colors focus:outline-none`}
              >
                <SmilePlus size={16} /> For Students <ChevronDown size={14} className={`transition-transform ${studentMenuOpen ? 'rotate-180' : ''}`}/>
              </button>
              {studentMenuOpen && (
                <div className={`absolute top-full left-0 mt-2 w-56 ${theme.cardBg} border ${theme.cardBorder} rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50`}>
                    {/* CHANGED: Using Link instead of <a> */}
                    <Link to="/neuro" className={`w-full text-left px-4 py-3 hover:bg-slate-500/10 flex items-center gap-3 text-sm ${theme.text} group`}>
                        <div className="p-1.5 rounded bg-amber-500/10 text-amber-500"><Brain size={16}/></div> Neuro Driver
                    </Link>
                    <Link to="/resume" className={`w-full text-left px-4 py-3 hover:bg-slate-500/10 flex items-center gap-3 text-sm ${theme.text} group border-t ${theme.cardBorder}`}>
                        <div className="p-1.5 rounded bg-fuchsia-500/10 text-fuchsia-500"><FileText size={16}/></div> Resume Builder
                    </Link>
                    <Link to="/map" className={`w-full text-left px-4 py-3 hover:bg-slate-500/10 flex items-center gap-3 text-sm ${theme.text} group border-t ${theme.cardBorder}`}>
                        <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-500"><MapPin size={16}/></div> Social Map
                    </Link>
                    <Link to="/cockpit" className={`w-full text-left px-4 py-3 hover:bg-slate-500/10 flex items-center gap-3 text-sm ${theme.text} group border-t ${theme.cardBorder}`}>
                        <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-500"><Activity size={16}/></div> Emotional Cockpit
                    </Link>
                </div>
              )}
            </div>

            <a href="#features" className={`text-sm font-medium ${theme.textMuted} hover:text-current transition-colors`}>Features</a>
            <a href={gemLink} target="_blank" rel="noreferrer" className="px-4 py-2 text-sm bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-full font-bold shadow-lg hover:shadow-cyan-500/25 transition-all">Launch Gem <ExternalLink size={14} className="inline ml-1" /></a>
          </div>

          <button className={`md:hidden ${theme.text}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
        </div>
        
        {mobileMenuOpen && (
          <div className={`md:hidden absolute top-full left-0 w-full ${theme.bg} border-b ${theme.cardBorder} p-4 flex flex-col space-y-4 shadow-xl animate-in slide-in-from-top-5`}>
             <button onClick={() => setIsDark(!isDark)} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${theme.cardBorder} w-full`}>{isDark ? <Moon size={16} /> : <Sun size={16} />}{isDark ? "Dark Mode" : "Light Mode"}</button>
             {/* CHANGED: Mobile Menu Links */}
             <Link to="/neuro" className="block w-full text-left py-2 font-bold text-amber-500">Neuro Driver</Link>
             <Link to="/resume" className="block w-full text-left py-2 font-bold text-fuchsia-500">Resume Builder</Link>
             <Link to="/cockpit" className="block w-full text-left py-2 font-bold text-indigo-500">Emotional Cockpit</Link>
             <Link to="/map" className="block w-full text-left py-2 font-bold text-cyan-500">Social Map</Link>
          </div>
        )}
      </nav>

      <section className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${isDark ? 'bg-slate-800/50 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'} text-cyan-500 text-xs font-bold tracking-wider uppercase mb-8 backdrop-blur-sm`}>
          <span className="w-2 h-2 rounded-full bg-cyan-500 motion-safe:animate-pulse"></span><span>AI-Powered Accommodations</span>
        </div>
        <h1 className={`text-5xl md:text-7xl font-extrabold tracking-tight ${theme.text} mb-6`}>Personalized Learning <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-purple-400">Without Limits.</span></h1>
        <p className={`mt-4 max-w-2xl mx-auto text-xl ${theme.textMuted} leading-relaxed mb-10`}>Empowering <strong>educators, students</strong> and <strong>homeschool parents</strong>. Get instant, AI-powered accommodations tailored to match your learner's energy and unique learning profile.</p>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <a href={gemLink} target="_blank" rel="noreferrer" className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-full font-bold shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center gap-2">Open Gem <Zap size={18}/></a>
          <a href="#accommodations" className={`px-6 py-3 rounded-full font-bold border ${theme.cardBorder} hover:bg-slate-500/10 transition-all`}>Try Demo</a>
        </div>
      </section>

      <section id="features" className="relative z-10 py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard to="/neuro" icon={Brain} title="Cognitive Support" description="Neuro-divergent friendly task slicer and focus tools." delay={0} isDark={isDark} />
          <FeatureCard to="/" icon={Calendar} title="Visual Schedules" description="Generate clear structured visual timelines." delay={100} isDark={isDark} />
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
            <Disclaimer />
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
                            strong: ({node, ...props}) => <strong className={`font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`} {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 mb-4 marker:text-fuchsia-500" {...props} />,
                            li: ({node, ...props}) => <li className={`pl-1 ${theme.text}`} {...props} />
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
          &copy; {new Date().getFullYear()} PrismPath Accommodations. All rights reserved.
        </div>
      </footer>
    </>
  );
};

// --- MAIN APP ROUTER ---
export default function App() {
  const [isDark, setIsDark] = useState(true);
  const navigate = useNavigate();
  const handleExit = () => navigate('/');

  // All components now receive the handleExit function as onBack
  return (
    <div className={`min-h-screen ${getTheme(isDark).bg} ${getTheme(isDark).text} font-sans overflow-x-hidden selection:bg-fuchsia-500/30 selection:text-fuchsia-200 transition-colors duration-500`}>
      <div className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000 ${isDark ? 'opacity-100' : 'opacity-30'}`}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <Routes>
        <Route path="/" element={<Home isDark={isDark} setIsDark={setIsDark} />} />
        
        <Route path="/resume" element={
          <div className="relative z-10 pt-10">
            <ResumeBuilder onBack={handleExit} isLowStim={!isDark} />
          </div>
        } />
        
        <Route path="/map" element={
          <div className="relative z-10 pt-20 h-screen">
            <SocialMap onBack={handleExit} isLowStim={!isDark} />
          </div>
        } />
        
        <Route path="/cockpit" element={
          <div className="relative z-[150] h-screen">
            <EmotionalCockpit onBack={handleExit} isLowStim={!isDark} />
          </div>
        } />
        
        <Route path="/neuro" element={
          <div className="relative z-[150] min-h-screen">
            <NeuroDriver onBack={handleExit} isDark={isDark} />
          </div>
        } />
        
        <Route path="/educator" element={
          <div className="relative z-[150] min-h-screen">
            <TeacherDashboard onBack={handleExit} isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />
          </div>
        } />
      </Routes>
    </div>
  );
}

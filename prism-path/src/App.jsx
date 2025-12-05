import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import ResumeBuilder from './ResumeBuilder';
import SocialMap from './SocialMap';
import { 
  Sparkles, 
  Brain, 
  Heart, 
  Calendar, 
  ExternalLink, 
  Menu, 
  X, 
  Zap, 
  ShieldCheck, 
  Clock,
  MessageSquare,
  Loader2,
  Info,
  CheckCircle2,
  EyeOff
} from 'lucide-react';

// --- Components ---

const Button = ({ children, primary, href, onClick, className = "", disabled }) => {
  const baseStyle = "inline-flex items-center px-6 py-3 rounded-full font-bold transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";
  const primaryStyle = "bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] focus:ring-cyan-400";
  const secondaryStyle = "bg-slate-800 text-cyan-400 border border-slate-700 hover:bg-slate-700 hover:text-white focus:ring-slate-500";

  const classes = `${baseStyle} ${primary ? primaryStyle : secondaryStyle} ${className}`;

  if (href) {
    return (
      <a href={href} {...(href.startsWith('http') ? {target:"_blank", rel:"noopener noreferrer"} : {})} className={classes}>
        {children}
      </a>
    );
  }
  return <button onClick={onClick} disabled={disabled} className={classes}>{children}</button>;
};

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
  <div 
    className="group relative p-1 rounded-2xl bg-gradient-to-b from-slate-700 to-slate-800 hover:from-cyan-500 hover:to-fuchsia-500 transition-all duration-500 motion-reduce:transition-none"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />
    <div className="relative h-full bg-slate-900 rounded-xl p-6 sm:p-8 flex flex-col items-start border border-slate-800">
      <div className="p-3 bg-slate-800 rounded-lg text-cyan-400 mb-4 group-hover:text-fuchsia-400 transition-colors">
        <Icon size={32} />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-300 leading-relaxed">{description}</p>
    </div>
  </div>
);

const Disclaimer = () => (
  <div className="bg-fuchsia-950/40 border border-fuchsia-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
    <Info className="text-fuchsia-400 shrink-0 mt-0.5" size={18} />
    <p className="text-sm text-fuchsia-100/90 leading-relaxed">
      <strong>Note:</strong> This tool uses AI to generate educational suggestions. It does not replace professional medical advice, diagnosis, or an official IEP. Always consult with your child's specialists before making significant changes.
    </p>
  </div>
);

// --- Main Application ---

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLowStim, setIsLowStim] = useState(false);
  
  // VIEW STATE: 'home', 'resume', or 'map'
  const [view, setView] = useState('home'); 
   
  // Gemini API State
  const [challenge, setChallenge] = useState('');
  const [subject, setSubject] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const gemLink = "https://gemini.google.com/gem/1l1CXxrHsHi41oCGW-In9-MSlSfanKbbB?usp=sharing";

  const handleGenerate = async () => {
    if (!challenge.trim() || !subject.trim()) {
      setError("Please describe the challenge and the subject.");
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedPlan(null);

    try {
        const prompt = `
        Role: You are an expert Special Education Consultant and Occupational Therapist.
        Task: Create a mini-support plan for an educator or parent supporting a student.
        
        Input:
        - Student's specific challenge: "${challenge}"
        - Current Subject/Activity: "${subject}"
        
        Output Instructions:
        1. Empathy First: Start with 1 sentence validating why this combination is difficult for the learner.
        2. Accommodations: List 3 bullet points of specific, low-prep modifications to the task (ensure suggestions work in both classroom and home settings).
        3. Quick Win: Provide 1 "Emergency Reset" strategy if the student is already frustrated.
        
        Formatting:
        - Use bolding for key terms.
        - Use clear emojis.
        - Keep it encouraging and concise.
        - Output as plain text/markdown.
      `;
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate');
      }

      const data = await response.json();
      const text = data.result;
      
      if (text) {
        setGeneratedPlan(text);
      } else {
        setError("No suggestions could be generated. Please try again with more detail.");
      }

    } catch (err) {
      console.error(err);
      setError("Failed to generate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 font-sans overflow-x-hidden selection:bg-fuchsia-500/30 selection:text-fuchsia-200`}>
       
      {/* GLOBAL OVERLAYS */}
      <div 
        className={`fixed inset-0 pointer-events-none z-[100] transition-all duration-1000 ease-in-out ${
          isLowStim ? 'backdrop-grayscale bg-slate-950/20' : 'backdrop-grayscale-0 bg-transparent'
        }`}
      ></div>

      <div className={`fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000 ${isLowStim ? 'opacity-0' : 'opacity-100'}`}>
        <div 
            className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
            style={{ maskImage: 'radial-gradient(ellipse 80% 80% at 50% 0%, black 40%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 0%, black 40%, transparent 100%)' }}
        ></div>
      </div>

      {/* --- VIEW SWITCHING LOGIC --- */}

      {view === 'resume' ? (
        // VIEW 1: RESUME BUILDER
        <div className="relative z-10 pt-10">
           <ResumeBuilder onBack={() => setView('home')} isLowStim={isLowStim} />
        </div>
      ) : view === 'map' ? (
        // VIEW 2: SOCIAL MAP
        <div className="relative z-10 pt-20 h-screen">
           <SocialMap onBack={() => setView('home')} isLowStim={isLowStim} />
        </div>
      ) : (
        // VIEW 3: HOME PAGE (DEFAULT)
        <>
          <nav className={`fixed w-full z-50 transition-all duration-300 border-b ${isScrolled ? 'bg-slate-950/80 backdrop-blur-md border-slate-800 py-4' : 'bg-transparent border-transparent py-6'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
              <div className="flex items-center space-x-2 group cursor-pointer">
                <div className="relative">
                  <Sparkles className={`text-cyan-400 transition-colors duration-300 ${isLowStim ? 'text-slate-400' : 'group-hover:text-fuchsia-400'}`} size={28} />
                  <div className={`absolute inset-0 bg-cyan-400 blur-lg opacity-40 transition-all duration-1000 ${isLowStim ? 'opacity-0' : 'group-hover:bg-fuchsia-400 motion-safe:animate-pulse'}`} />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  Prism<span className={`${isLowStim ? 'text-slate-400' : 'text-cyan-400'}`}>Path</span>
                </span>
              </div>

              {/* Desktop Menu - REORDERED */}
              <div className="hidden md:flex items-center space-x-8">
                
                {/* 1. Overwhelmed Button */}
                <button 
                  onClick={() => setIsLowStim(!isLowStim)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                    isLowStim 
                      ? 'bg-slate-800 text-white border-slate-600 hover:bg-slate-700' 
                      : 'bg-slate-900/50 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <EyeOff size={16} />
                  {isLowStim ? "Restore Colors" : "Overwhelmed?"}
                </button>

                {/* 2. Features */}
                <a href="#features" className="text-sm font-medium hover:text-cyan-400 transition-colors">Features</a>
                
                {/* 3. Live Demo */}
                <a href="#accommodations" className="text-sm font-medium hover:text-cyan-400 transition-colors">Live Demo</a>

                {/* 4. Safe Village (Map) */}
                <button onClick={() => setView('map')} className="text-sm font-medium hover:text-cyan-400 transition-colors">Safe Village</button>

                {/* 5. Resume Builder */}
                <button onClick={() => setView('resume')} className="text-sm font-medium hover:text-cyan-400 transition-colors">Resume Builder</button>

                {/* 6. Launch Gem */}
                <Button href={gemLink} primary className="!px-5 !py-2 !text-sm">
                  Launch Gem <ExternalLink size={14} className="ml-2" />
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <button 
                className="md:hidden text-slate-300 hover:text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
              <div className="md:hidden absolute top-full left-0 w-full bg-slate-900 border-b border-slate-800 p-4 flex flex-col space-y-4 shadow-xl">
                
                <button 
                  onClick={() => setIsLowStim(!isLowStim)}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 w-full"
                >
                  <EyeOff size={16} />
                  {isLowStim ? "Restore Colors" : "Reduce Stimulation"}
                </button>

                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-center text-slate-300 hover:text-cyan-400">Features</a>
                <a href="#accommodations" onClick={() => setMobileMenuOpen(false)} className="block text-center text-slate-300 hover:text-cyan-400">Live Demo</a>
                
                <button onClick={() => { setView('map'); setMobileMenuOpen(false); }} className="block text-center text-slate-300 hover:text-cyan-400 w-full">Safe Village Map</button>
                <button onClick={() => { setView('resume'); setMobileMenuOpen(false); }} className="block text-center text-slate-300 hover:text-cyan-400 w-full">Resume Builder</button>
                
                <Button href={gemLink} primary className="justify-center w-full">
                  Launch Gem
                </Button>
              </div>
            )}
          </nav>

          {/* Hero Section */}
          <section className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/50 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wider uppercase mb-8 backdrop-blur-sm transition-all duration-1000 ${isLowStim ? 'grayscale' : ''}`}>
              <span className="w-2 h-2 rounded-full bg-cyan-400 motion-safe:animate-pulse"></span>
              <span>AI-Powered Accommodations</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
              Personalized Learning <br />
              <span className={`text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-purple-400 ${isLowStim ? 'text-white bg-none' : 'animate-gradient-x'}`}>
                Without Limits.
              </span>
            </h1>
            
            <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-300 leading-relaxed mb-10">
              Empowering <strong>educators</strong> and <strong>homeschool parents</strong> of special needs students. 
              Get instant, AI-powered accommodations tailored to your student's unique learning profile.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Button primary href={gemLink}>
                Open Accommodation Gem <Zap size={18} className="ml-2" />
              </Button>
              <Button href="#accommodations">
                Try Quick Demo
              </Button>
            </div>

            <div className={`absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-[100px] pointer-events-none transition-opacity duration-1000 ${isLowStim ? 'opacity-0' : 'opacity-100'}`}></div>
            <div className={`absolute top-1/3 right-0 translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none transition-opacity duration-1000 ${isLowStim ? 'opacity-0' : 'opacity-100'}`}></div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className="relative z-10 py-20 bg-slate-900/50 backdrop-blur-sm border-y border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple, Powerful Support</h2>
                <p className="text-slate-400 max-w-xl mx-auto">
                  Streamlining Individualized Education Plans (IEPs) and daily accommodations for home and classroom.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 relative">
                <div className={`hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-500/20 via-fuchsia-500/20 to-cyan-500/20 -translate-y-1/2 transition-opacity duration-1000 ${isLowStim ? 'opacity-20' : 'opacity-100'}`}></div>

                {[
                  { 
                    step: "01", 
                    title: "Launch the Gem", 
                    desc: "Click the button to open our custom Google Gemini AI assistant.",
                    icon: ExternalLink 
                  },
                  { 
                    step: "02", 
                    title: "Describe Needs", 
                    desc: "Tell the AI about your student's strengths, challenges, and current subjects.",
                    icon: Brain 
                  },
                  { 
                    step: "03", 
                    title: "Get Results", 
                    desc: "Receive a tailored list of accommodations, modifications, and strategies instantly.",
                    icon: Sparkles 
                  }
                ].map((item, idx) => (
                  <div key={idx} className="relative bg-slate-900 p-8 rounded-2xl border border-slate-800 hover:border-cyan-500/50 transition-colors z-10 group">
                    <div className={`w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-6 text-cyan-400 transition-all duration-300 ${isLowStim ? 'text-slate-400' : 'group-hover:scale-110 group-hover:bg-cyan-500/10'}`}>
                      <item.icon size={24} />
                    </div>
                    <div className="absolute top-8 right-8 text-5xl font-bold text-slate-800 select-none group-hover:text-slate-700/50 transition-colors">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 relative">{item.title}</h3>
                    <p className="text-slate-400 relative">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section id="features" className="relative z-10 py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard 
                icon={Brain}
                title="Cognitive Support"
                description="Strategies for memory retention, focus improvement, and information processing tailored to neurodiverse minds."
                delay={0}
              />
              <FeatureCard 
                icon={Calendar}
                title="Visual Schedules"
                description="Generate clear, structured visual timelines to reduce anxiety and aid transition between tasks."
                delay={100}
              />
              <FeatureCard 
                icon={Heart}
                title="Emotional Regulation"
                description="Tips for sensory breaks and emotional check-ins integrated directly into your lesson plans."
                delay={200}
              />
                <FeatureCard 
                icon={ShieldCheck}
                title="Distraction Free"
                description="Get clean, text-based plans without the clutter of ad-heavy educational websites."
                delay={300}
              />
              <FeatureCard 
                icon={Clock}
                title="Time Saving"
                description="What used to take hours of research now takes seconds. Spend more time teaching, less time planning."
                delay={400}
              />
                <FeatureCard 
                icon={Zap}
                title="Instant Adaptation"
                description="Having a rough day? Ask the Gem to modify the day's load instantly to match your child's energy."
                delay={500}
              />
            </div>
          </section>

          {/* Live AI Demo Section */}
          <section id="accommodations" className="relative z-10 py-20 bg-slate-900 border-y border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-start gap-12">
              
              <div className="lg:w-5/12">
                <h2 className="text-3xl font-bold text-white mb-6">
                  Instant AI Accommodations <br />
                  <span className={`transition-colors duration-1000 ${isLowStim ? 'text-white' : 'text-cyan-400'}`}>Try it right here</span>
                </h2>
                
                <Disclaimer />

                <p className="text-slate-300 mb-8 text-lg">
                  Not sure what to ask the Gem? Try our Quick-Gen tool. Enter the primary challenge and current subject to see how Gemini can help.
                </p>
                <div className="grid grid-cols-1 gap-4 mb-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Primary Challenge</label>
                      <input 
                        type="text" 
                        value={challenge}
                        onChange={(e) => setChallenge(e.target.value)}
                        placeholder="e.g. Dyslexia, ADHD, Sensory Processing"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-cyan-400 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Subject or Activity</label>
                      <input 
                        type="text" 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Long Division, Silent Reading, Essay Writing"
                        className={`w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:border-transparent outline-none transition-all placeholder:text-slate-600 ${isLowStim ? 'focus:ring-white' : 'focus:ring-fuchsia-400'}`}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Button onClick={handleGenerate} primary disabled={loading}>
                    {loading ? (
                      <>Processing <Loader2 className="ml-2 animate-spin" size={18} /></>
                    ) : (
                      <>Generate Ideas ✨</>
                    )}
                  </Button>
                  {error && (
                    <div className="text-red-400 text-sm flex items-center bg-red-900/20 px-3 py-2 rounded-lg border border-red-500/20">
                      <span className="mr-2">⚠️</span> {error}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:w-7/12 w-full relative">
                <div className={`absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-2xl blur-2xl transform rotate-1 transition-opacity duration-1000 ${isLowStim ? 'opacity-0' : 'opacity-10'}`}></div>
                <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl min-h-[500px] flex flex-col">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                      <div className={`flex items-center space-x-2 ${isLowStim ? 'grayscale opacity-50' : ''}`}>
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="ml-4 text-xs text-slate-500 font-mono">PrismPath Engine</span>
                      </div>
                      <div className="text-xs text-slate-600 font-mono">model: gemini-2.0-flash</div>
                    </div>
                    
                    <div className="flex-grow font-sans text-[15px] space-y-4 overflow-y-auto max-h-[400px] custom-scrollbar text-slate-300 leading-relaxed">
                      
                      {!generatedPlan && !loading && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50 pt-20">
                          <MessageSquare size={48} className="mb-4" />
                          <p>Waiting for your input...</p>
                        </div>
                      )}

                      {loading && (
                        <div className="space-y-4 animate-pulse pt-4">
                          <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                          <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                          <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                          <br/>
                          <div className="h-4 bg-slate-800 rounded w-full"></div>
                          <div className="h-4 bg-slate-800 rounded w-2/3"></div>
                        </div>
                      )}

                      {generatedPlan && !loading && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <div className="flex gap-4 mb-6">
                            <span className="text-fuchsia-400 shrink-0 font-mono">$</span>
                            <span className="text-slate-300 font-mono">Analysis for: <span className="text-cyan-400">{challenge}</span> + <span className="text-cyan-400">{subject}</span></span>
                          </div>
                          <div className="h-px bg-slate-800 my-6"></div>
                          
                          <ReactMarkdown 
                              components={{
                                  strong: ({node, ...props}) => <span className="font-bold text-cyan-300" {...props} />,
                                  p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2 marker:text-fuchsia-500" {...props} />,
                                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-2 marker:text-cyan-500" {...props} />,
                                  li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mb-4 mt-6" {...props} />,
                                  h2: ({node, ...props}) => <h2 className="text-xl font-bold text-fuchsia-300 mb-3 mt-5" {...props} />,
                                  h3: ({node, ...props}) => <h3 className="text-lg font-bold text-cyan-300 mb-2 mt-4" {...props} />,
                              }}
                          >
                              {generatedPlan}
                          </ReactMarkdown>
                          
                          <div className="mt-8 flex items-center space-x-2 text-emerald-400/80 text-xs border-t border-slate-800 pt-4 font-mono">
                            <CheckCircle2 size={14} />
                            <span>Generated by PrismPath AI. Verify with a specialist.</span>
                          </div>
                        </div>
                      )}
                    </div>
                </div>
              </div>

            </div>
          </section>

          {/* Footer */}
          <footer className="relative z-10 bg-slate-950 pt-20 pb-10 border-t border-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-6 md:mb-0">
                  <div className="flex items-center space-x-2">
                    <Sparkles className={`transition-colors duration-1000 ${isLowStim ? 'text-slate-500' : 'text-fuchsia-500'}`} size={24} />
                    <span className="text-xl font-bold text-white">
                      Prism<span className={`transition-colors duration-1000 ${isLowStim ? 'text-slate-400' : 'text-cyan-400'}`}>Path</span>
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mt-2">
                    Built to Empower Learners.
                  </p>
                </div>
                
                <div className="flex space-x-6">
                  <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Privacy</a>
                  <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Terms</a>
                  <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors">Contact</a>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-slate-900 text-center text-slate-600 text-sm">
                &copy; {new Date().getFullYear()} PrismPath Accommodations. All rights reserved.
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}


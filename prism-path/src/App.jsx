import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Brain, 
  Heart, 
  Calendar, 
  ArrowRight, 
  ExternalLink, 
  Menu, 
  X, 
  Zap, 
  ShieldCheck, 
  Clock,
  MessageSquare,
  Loader2,
  Info,
  CheckCircle2
} from 'lucide-react';

// --- Components ---

const Button = ({ children, primary, href, onClick, className = "", disabled }) => {
  const baseStyle = "inline-flex items-center px-6 py-3 rounded-full font-bold transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";
  const primaryStyle = "bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.5)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] focus:ring-cyan-400";
  const secondaryStyle = "bg-slate-800 text-cyan-400 border border-slate-700 hover:bg-slate-700 hover:text-white focus:ring-slate-500";

  const classes = `${baseStyle} ${primary ? primaryStyle : secondaryStyle} ${className}`;

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
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
   
  // Gemini API State
  const [challenge, setChallenge] = useState('');
  const [subject, setSubject] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const gemLink = "https://gemini.google.com/gem/1kw78hmK5TxI0CHaIr0gK98coeWN67CUd?usp=sharing";

  const handleGenerate = async () => {
    if (!challenge.trim() || !subject.trim()) {
      setError("Please describe the challenge and the subject.");
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedPlan(null);

    try {
      // IMPROVED PROMPT ENGINEERING
      // We construct the prompt here, but send it to our backend to handle the API key
      const prompt = `
        Role: You are an expert Special Education Consultant and Occupational Therapist.
        Task: Create a mini-support plan for a homeschooling parent.
        
        Input:
        - Child's specific challenge: "${challenge}"
        - Current Subject/Activity: "${subject}"
        
        Output Instructions:
        1. Empathy First: Start with 1 sentence validating why this combination is difficult.
        2. Accommodations: List 3 bullet points of specific, low-prep modifications to the task.
        3. Quick Win: Provide 1 "Emergency Reset" strategy if the child is already frustrated.
        
        Formatting:
        - Use bolding for key terms.
        - Use clear emojis.
        - Keep it encouraging and concise.
        - Output as plain text/markdown.
      `;
      
      // ✅ CORRECTED: Call your Vercel Backend instead of Google directly
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate');
      }

      const data = await response.json();
      
      // ✅ CORRECTED: The backend returns { result: "text" }
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
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans overflow-x-hidden selection:bg-fuchsia-500/30 selection:text-fuchsia-200">
       
      {/* Background Grid Effect */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-fuchsia-900/20 via-slate-950/50 to-slate-950"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 border-b ${isScrolled ? 'bg-slate-950/80 backdrop-blur-md border-slate-800 py-4' : 'bg-transparent border-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-2 group cursor-pointer">
            <div className="relative">
              <Sparkles className="text-cyan-400 group-hover:text-fuchsia-400 transition-colors duration-300" size={28} />
              <div className="absolute inset-0 bg-cyan-400 blur-lg opacity-40 group-hover:bg-fuchsia-400 transition-colors duration-300 motion-safe:animate-pulse" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Prism<span className="text-cyan-400">Path</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium hover:text-cyan-400 transition-colors">Features</a>
            <a href="#accommodations" className="text-sm font-medium hover:text-cyan-400 transition-colors">Live Demo</a>
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
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300 hover:text-cyan-400">Features</a>
            <a href="#accommodations" onClick={() => setMobileMenuOpen(false)} className="block text-slate-300 hover:text-cyan-400">Live Demo</a>
            <Button href={gemLink} primary className="justify-center">
              Launch Gem
            </Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/50 border border-cyan-500/30 text-cyan-400 text-xs font-bold tracking-wider uppercase mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-cyan-400 motion-safe:animate-pulse"></span>
          <span>AI-Powered Homeschooling</span>
        </div>
         
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6">
          Personalized Learning <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-purple-400 animate-gradient-x">
            Without Limits.
          </span>
        </h1>
         
        <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-300 leading-relaxed mb-10">
          Empowering parents of special needs students with custom accommodation plans. 
          Get instant, tailored support for your homeschooling journey.
        </p>
         
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Button primary href={gemLink}>
            Open Accommodation Gem <Zap size={18} className="ml-2" />
          </Button>
          <Button href="#accommodations">
            Try Quick Demo
          </Button>
        </div>

        {/* Abstract Decorative Elements */}
        <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-1/3 right-0 translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-20 bg-slate-900/50 backdrop-blur-sm border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple, Powerful Support</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              We've streamlined the process of creating Individualized Education Plans (IEPs) and daily accommodations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-500/20 via-fuchsia-500/20 to-cyan-500/20 -translate-y-1/2"></div>

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
                desc: "Tell the AI about your child's strengths, challenges, and current subjects.",
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
                <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500/10 transition-all duration-300">
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
              <span className="text-cyan-400">Try it right here</span>
            </h2>
             
            {/* SAFETY DISCLAIMER */}
            <Disclaimer />

            <p className="text-slate-300 mb-8 text-lg">
              Not sure what to ask the Gem? Try our Quick-Gen tool. Enter your child's primary challenge and current subject to see how Gemini can help.
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
                     className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
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
             <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-2xl blur-2xl opacity-10 transform rotate-1"></div>
             <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl min-h-[500px] flex flex-col">
                <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="ml-4 text-xs text-slate-500 font-mono">PrismPath Engine</span>
                  </div>
                  <div className="text-xs text-slate-600 font-mono">model: gemini-1.5-flash</div>
                </div>
                 
                <div className="flex-grow font-mono text-sm space-y-4 overflow-y-auto max-h-[400px] custom-scrollbar">
                   
                  {/* Default State */}
                  {!generatedPlan && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50 pt-20">
                       <MessageSquare size={48} className="mb-4" />
                       <p>Waiting for your input...</p>
                    </div>
                  )}

                  {/* Loading State */}
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

                  {/* Result State */}
                  {generatedPlan && !loading && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <div className="flex gap-4 mb-4">
                        <span className="text-fuchsia-400 shrink-0">$</span>
                        <span className="text-slate-300">Analysis for: <span className="text-cyan-400">{challenge}</span> + <span className="text-cyan-400">{subject}</span></span>
                      </div>
                      <div className="h-px bg-slate-800 my-4"></div>
                      <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {generatedPlan}
                      </div>
                       
                      <div className="mt-8 flex items-center space-x-2 text-emerald-400/80 text-xs border-t border-slate-800 pt-4">
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
                <Sparkles className="text-fuchsia-500" size={24} />
                <span className="text-xl font-bold text-white">
                  Prism<span className="text-cyan-400">Path</span>
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-2">
                Built for the homeschool community.
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
    </div>
  );
}




import React, { useEffect, useState } from 'react';
import { ArrowLeft, Unlock, BookOpen, Shield, Sparkles } from 'lucide-react';
import { getTheme } from '../utils';

export default function Mission({ isDark, onBack }) {
  const theme = getTheme(isDark);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} transition-colors duration-500 relative`}>
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 -z-10">
        <div className={`absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse ${isDark ? 'opacity-30' : 'opacity-20'}`}></div>
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse ${isDark ? 'opacity-30' : 'opacity-20'}`} style={{ animationDelay: '1s' }}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse ${isDark ? 'opacity-20' : 'opacity-10'}`} style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 overflow-visible">
        {/* Back Button */}
        <button
          onClick={onBack}
          className={`flex items-center gap-2 mb-12 ${theme.textMuted} hover:${theme.text} transition-all hover:gap-3 group`}
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>

        {/* Hero Section */}
        <div className={`mb-32 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <div className="space-y-8 relative">
              {/* Decorative Sparkle */}
              <div className="absolute -top-4 -left-4 opacity-20">
                <Sparkles className={`${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} size={48} />
              </div>
              
              <div className="space-y-6">
                <div>
                  <h1 className={`text-6xl lg:text-7xl font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r ${isDark ? 'from-cyan-400 via-fuchsia-400 to-cyan-400' : 'from-cyan-600 via-fuchsia-600 to-cyan-600'}`}>
                    The Heart Behind PrismPath™
                  </h1>
                  <div className="h-1 w-24 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-full mb-6"></div>
                  <h2 className={`text-3xl lg:text-4xl font-semibold ${theme.primaryText} leading-relaxed`}>
                    Bridging the gap between student potential and teacher capacity.
                  </h2>
                </div>
                
                <div className={`space-y-6 text-lg leading-relaxed ${theme.text}`}>
                  <p className="text-xl">
                    Education isn't just my career; it is my <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>heritage</span>. Raised by a Special Education teacher and now married to an educator, I have lived the reality of the classroom from every angle. I've seen the late nights, the emotional investment, and the burning desire to reach every single student.
                  </p>
                  <p className="text-xl">
                    As a Department Head and active classroom teacher, I know that true differentiation is the <span className={`font-bold ${isDark ? 'text-fuchsia-400' : 'text-fuchsia-600'}`}>'gold standard'</span>—but it is often impossible due to lack of time and manpower. I built PrismPath™ to solve this. My goal is not to replace educators, but to equip them with an accessible 'sandbox' where technology handles the heavy lifting, allowing them to focus on what matters most: <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>human connection</span>.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Professional Headshot */}
            <div className="flex items-center justify-center relative">
              <div className="relative group">
                {/* Glowing Background */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-fuchsia-500/20 to-emerald-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                <div className={`relative w-full max-w-md aspect-square rounded-3xl ${theme.cardBg} border-2 ${isDark ? 'border-cyan-500/30' : 'border-cyan-600/30'} flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-cyan-500/25 overflow-hidden`}>
                  {/* Animated gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-cyan-500/5 via-fuchsia-500/5 to-emerald-500/5' : 'from-cyan-500/10 via-fuchsia-500/10 to-emerald-500/10'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  
                  {/* Professional Headshot Image */}
                  <img 
                    src="/images/headshot.png.png" 
                    alt="Professional headshot" 
                    className="w-full h-full object-cover rounded-3xl"
                    onError={(e) => {
                      // Fallback to placeholder if image doesn't exist
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                  />
                  <div className="text-center p-8 relative z-10 hidden items-center justify-center h-full">
                    <div className={`w-40 h-40 mx-auto mb-6 rounded-full ${isDark ? 'bg-gradient-to-br from-cyan-900/50 to-fuchsia-900/50' : 'bg-gradient-to-br from-cyan-100 to-fuchsia-100'} flex items-center justify-center shadow-xl transition-transform duration-500 group-hover:scale-110`}>
                      <Sparkles className={`${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} size={64} />
                    </div>
                    <p className={`text-sm ${theme.textMuted} italic font-medium`}>
                      Professional Headshot Placeholder
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strategic Pillars Section */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <div className="inline-block px-6 py-3">
              <h2 className={`text-5xl lg:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r ${isDark ? 'from-cyan-400 via-fuchsia-400 to-emerald-400' : 'from-cyan-600 via-fuchsia-600 to-emerald-600'} leading-[1.15]`}>
                Aligned for the Future
              </h2>
            </div>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-cyan-500"></div>
              <p className={`text-xl ${theme.textMuted} font-semibold`}>
                Strategic Pillars
              </p>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-fuchsia-500"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {/* Pillar 1: Democratized Access */}
            <div 
              className={`relative group ${theme.cardBg} border ${theme.cardBorder} rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} hover:-translate-y-2`}
              style={{ transitionDelay: '100ms' }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/0 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
              
              <div className="relative z-10">
                <div className={`w-20 h-20 rounded-2xl ${isDark ? 'bg-gradient-to-br from-cyan-900/40 to-cyan-700/40' : 'bg-gradient-to-br from-cyan-100 to-cyan-200'} flex items-center justify-center mb-6 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  <Unlock className="text-cyan-400" size={40} />
                </div>
                <h3 className={`text-2xl font-bold ${theme.text} mb-4 group-hover:text-cyan-400 transition-colors`}>
                  Democratized Access
                </h3>
                <p className={`${theme.textMuted} leading-relaxed text-base`}>
                  Innovation belongs to everyone. Aligning with the vision of an accessible AI ecosystem, PrismPath™ is designed to be a tool for every faculty member, regardless of tech background. We are removing barriers to entry so that powerful differentiation tools are available to all students and staff.
                </p>
              </div>
            </div>

            {/* Pillar 2: Building an AI-Ready Community */}
            <div 
              className={`relative group ${theme.cardBg} border ${theme.cardBorder} rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} hover:-translate-y-2`}
              style={{ transitionDelay: '200ms' }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-fuchsia-500/0 to-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
              
              <div className="relative z-10">
                <div className={`w-20 h-20 rounded-2xl ${isDark ? 'bg-gradient-to-br from-fuchsia-900/40 to-fuchsia-700/40' : 'bg-gradient-to-br from-fuchsia-100 to-fuchsia-200'} flex items-center justify-center mb-6 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  <BookOpen className="text-fuchsia-400" size={40} />
                </div>
                <h3 className={`text-2xl font-bold ${theme.text} mb-4 group-hover:text-fuchsia-400 transition-colors`}>
                  Building an AI-Ready Community
                </h3>
                <p className={`${theme.textMuted} leading-relaxed text-base`}>
                  We are committed to upskilling. Leveraging experience in training faculty on tools like Gemini and custom chatbots, this platform serves as a practical hub for professional development. It empowers educators to learn, teach, and apply AI responsibly in their daily workflow.
                </p>
              </div>
            </div>

            {/* Pillar 3: Innovation with Integrity */}
            <div 
              className={`relative group ${theme.cardBg} border ${theme.cardBorder} rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} hover:-translate-y-2`}
              style={{ transitionDelay: '300ms' }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/0 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
              
              <div className="relative z-10">
                <div className={`w-20 h-20 rounded-2xl ${isDark ? 'bg-gradient-to-br from-emerald-900/40 to-emerald-700/40' : 'bg-gradient-to-br from-emerald-100 to-emerald-200'} flex items-center justify-center mb-6 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  <Shield className="text-emerald-400" size={40} />
                </div>
                <h3 className={`text-2xl font-bold ${theme.text} mb-4 group-hover:text-emerald-400 transition-colors`}>
                  Innovation with Integrity
                </h3>
                <p className={`${theme.textMuted} leading-relaxed text-base`}>
                  Responsible adoption is our foundation. We prioritize 'demystifying' technology to ensure it remains trustworthy and human-centered. Our approach balances efficiency with ethics, demonstrating how AI serves people—not replaces them—in the delivery of compassionate education.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


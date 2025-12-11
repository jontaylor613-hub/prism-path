import React, { useEffect, useState } from 'react';
import { ArrowLeft, Unlock, BookOpen, Shield } from 'lucide-react';
import { getTheme } from '../utils';

export default function Mission({ isDark, onBack }) {
  const theme = getTheme(isDark);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={onBack}
          className={`flex items-center gap-2 mb-8 ${theme.textMuted} hover:${theme.text} transition-colors`}
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Hero Section */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Left: Text Content */}
          <div className="space-y-6">
            <div>
              <h1 className={`text-5xl font-bold ${theme.text} mb-4 leading-tight`}>
                The Heart Behind PrismPath™
              </h1>
              <h2 className={`text-2xl font-semibold ${theme.primaryText} mb-6`}>
                Bridging the gap between student potential and teacher capacity.
              </h2>
            </div>
            
            <div className={`space-y-4 text-lg leading-relaxed ${theme.text}`}>
              <p>
                Education isn't just my career; it is my heritage. Raised by a Special Education teacher and now married to an educator, I have lived the reality of the classroom from every angle. I've seen the late nights, the emotional investment, and the burning desire to reach every single student.
              </p>
              <p>
                As a Department Head and active classroom teacher, I know that true differentiation is the 'gold standard'—but it is often impossible due to lack of time and manpower. I built PrismPath™ to solve this. My goal is not to replace educators, but to equip them with an accessible 'sandbox' where technology handles the heavy lifting, allowing them to focus on what matters most: human connection.
              </p>
            </div>
          </div>

          {/* Right: Headshot Placeholder */}
          <div className="flex items-center justify-center">
            <div className={`w-full max-w-md aspect-square rounded-2xl ${theme.cardBg} border-2 ${theme.cardBorder} flex items-center justify-center shadow-xl`}>
              <div className="text-center p-8">
                <div className={`w-32 h-32 mx-auto mb-4 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'} flex items-center justify-center`}>
                  <span className={`text-4xl ${theme.textMuted}`}>👤</span>
                </div>
                <p className={`text-sm ${theme.textMuted} italic`}>
                  Professional Headshot Placeholder
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Strategic Pillars Section */}
        <div className="mb-20">
          <h2 className={`text-4xl font-bold ${theme.text} mb-12 text-center`}>
            Aligned for the Future
          </h2>
          <p className={`text-xl ${theme.textMuted} mb-12 text-center`}>
            Strategic Pillars
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1: Democratized Access */}
            <div 
              className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: '100ms' }}
            >
              <div className={`w-16 h-16 rounded-xl ${isDark ? 'bg-cyan-900/30' : 'bg-cyan-100'} flex items-center justify-center mb-6`}>
                <Unlock className="text-cyan-400" size={32} />
              </div>
              <h3 className={`text-2xl font-bold ${theme.text} mb-4`}>
                Democratized Access
              </h3>
              <p className={`${theme.textMuted} leading-relaxed`}>
                Innovation belongs to everyone. Aligning with the vision of an accessible AI ecosystem, PrismPath™ is designed to be a tool for every faculty member, regardless of tech background. We are removing barriers to entry so that powerful differentiation tools are available to all students and staff.
              </p>
            </div>

            {/* Pillar 2: Building an AI-Ready Community */}
            <div 
              className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: '200ms' }}
            >
              <div className={`w-16 h-16 rounded-xl ${isDark ? 'bg-fuchsia-900/30' : 'bg-fuchsia-100'} flex items-center justify-center mb-6`}>
                <BookOpen className="text-fuchsia-400" size={32} />
              </div>
              <h3 className={`text-2xl font-bold ${theme.text} mb-4`}>
                Building an AI-Ready Community
              </h3>
              <p className={`${theme.textMuted} leading-relaxed`}>
                We are committed to upskilling. Leveraging experience in training faculty on tools like Gemini and custom chatbots, this platform serves as a practical hub for professional development. It empowers educators to learn, teach, and apply AI responsibly in their daily workflow.
              </p>
            </div>

            {/* Pillar 3: Innovation with Integrity */}
            <div 
              className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: '300ms' }}
            >
              <div className={`w-16 h-16 rounded-xl ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'} flex items-center justify-center mb-6`}>
                <Shield className="text-emerald-400" size={32} />
              </div>
              <h3 className={`text-2xl font-bold ${theme.text} mb-4`}>
                Innovation with Integrity
              </h3>
              <p className={`${theme.textMuted} leading-relaxed`}>
                Responsible adoption is our foundation. We prioritize 'demystifying' technology to ensure it remains trustworthy and human-centered. Our approach balances efficiency with ethics, demonstrating how AI serves people—not replaces them—in the delivery of compassionate education.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


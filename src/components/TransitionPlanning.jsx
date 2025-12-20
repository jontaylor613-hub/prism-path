import React, { useState } from 'react';
import { ArrowLeft, FileText, Heart, Target, Briefcase, GraduationCap, Building2, Wand2 } from 'lucide-react';
import { getTheme } from '../utils';

export default function TransitionPlanning({ onBack, isDark }) {
  const theme = getTheme(isDark);
  const [activeTab, setActiveTab] = useState('resume'); // 'resume', 'interests', 'goals'

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={onBack} 
            className={`flex items-center gap-2 ${theme.textMuted} hover:${theme.text} transition-colors mb-4`}
          >
            <ArrowLeft size={18} /> Back
          </button>
          <h1 className={`text-4xl font-bold ${theme.text} mb-2`}>Career & Transition Planner</h1>
          <p className={`${theme.textMuted} text-lg`}>
            Plan your future with post-high school readiness tools
          </p>
        </div>

        {/* Tab Navigation */}
        <div className={`flex gap-2 mb-6 ${theme.cardBg} border ${theme.cardBorder} rounded-xl p-1`}>
          <button
            onClick={() => setActiveTab('resume')}
            className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'resume'
                ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white shadow-lg'
                : `${theme.textMuted} hover:${theme.text}`
            }`}
          >
            <FileText size={18} />
            Resume Builder
          </button>
          <button
            onClick={() => setActiveTab('interests')}
            className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'interests'
                ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white shadow-lg'
                : `${theme.textMuted} hover:${theme.text}`
            }`}
          >
            <Heart size={18} />
            Interest Inventory
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'goals'
                ? 'bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white shadow-lg'
                : `${theme.textMuted} hover:${theme.text}`
            }`}
          >
            <Target size={18} />
            Post-Secondary Goals
          </button>
        </div>

        {/* Resume Builder Section */}
        {activeTab === 'resume' && (
          <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-8`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-cyan-500/10">
                <FileText className="text-cyan-400" size={32} />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${theme.text}`}>Resume Builder</h2>
                <p className={theme.textMuted}>Build your resume with AI-powered suggestions</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-bold ${theme.textMuted} mb-2 uppercase tracking-wider`}>
                  Skills & Experience
                </label>
                <textarea
                  placeholder="List your skills, work experience, volunteer work, and achievements..."
                  className={`w-full h-40 p-4 rounded-xl border-2 ${theme.inputBorder} ${theme.inputBg} ${theme.text} focus:border-cyan-500 outline-none resize-none`}
                />
                <p className={`text-xs ${theme.textMuted} mt-2`}>
                  💡 AI will help format and enhance your resume content
                </p>
              </div>

              <div className="flex gap-3">
                <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-xl font-bold shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center gap-2">
                  <Wand2 size={18} />
                  Generate with AI
                </button>
                <button className={`px-6 py-3 ${theme.inputBg} border ${theme.inputBorder} ${theme.text} rounded-xl font-bold hover:border-cyan-400 transition-all`}>
                  Save Draft
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interest Inventory Section */}
        {activeTab === 'interests' && (
          <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-8`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-fuchsia-500/10">
                <Heart className="text-fuchsia-400" size={32} />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${theme.text}`}>Interest Inventory</h2>
                <p className={theme.textMuted}>Identify your strengths and interests</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-bold ${theme.textMuted} mb-2 uppercase tracking-wider`}>
                  My Strengths
                </label>
                <textarea
                  placeholder="What are you good at? What comes naturally to you?..."
                  className={`w-full h-32 p-4 rounded-xl border-2 ${theme.inputBorder} ${theme.inputBg} ${theme.text} focus:border-fuchsia-500 outline-none resize-none`}
                />
              </div>

              <div>
                <label className={`block text-sm font-bold ${theme.textMuted} mb-2 uppercase tracking-wider`}>
                  My Interests
                </label>
                <textarea
                  placeholder="What do you enjoy? What activities or subjects interest you?..."
                  className={`w-full h-32 p-4 rounded-xl border-2 ${theme.inputBorder} ${theme.inputBg} ${theme.text} focus:border-fuchsia-500 outline-none resize-none`}
                />
              </div>

              <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-xl font-bold shadow-lg hover:shadow-cyan-500/25 transition-all">
                Save Inventory
              </button>
            </div>
          </div>
        )}

        {/* Post-Secondary Goals Section */}
        {activeTab === 'goals' && (
          <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-8`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Target className="text-amber-400" size={32} />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${theme.text}`}>Post-Secondary Goals</h2>
                <p className={theme.textMuted}>Plan your path after high school</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* College Goal */}
              <div className={`${theme.inputBg} border ${theme.cardBorder} rounded-xl p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <GraduationCap className="text-blue-400" size={24} />
                  </div>
                  <h3 className={`text-lg font-bold ${theme.text}`}>College</h3>
                </div>
                <textarea
                  placeholder="List colleges you're interested in, programs, deadlines..."
                  className={`w-full h-32 p-3 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.text} focus:border-blue-500 outline-none resize-none text-sm`}
                />
              </div>

              {/* Trade School Goal */}
              <div className={`${theme.inputBg} border ${theme.cardBorder} rounded-xl p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Building2 className="text-purple-400" size={24} />
                  </div>
                  <h3 className={`text-lg font-bold ${theme.text}`}>Trade School</h3>
                </div>
                <textarea
                  placeholder="List trade programs, certifications, apprenticeships..."
                  className={`w-full h-32 p-3 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.text} focus:border-purple-500 outline-none resize-none text-sm`}
                />
              </div>

              {/* Employment Goal */}
              <div className={`${theme.inputBg} border ${theme.cardBorder} rounded-xl p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Briefcase className="text-emerald-400" size={24} />
                  </div>
                  <h3 className={`text-lg font-bold ${theme.text}`}>Employment</h3>
                </div>
                <textarea
                  placeholder="List job types, companies, career paths you're exploring..."
                  className={`w-full h-32 p-3 rounded-lg border ${theme.inputBorder} ${theme.cardBg} ${theme.text} focus:border-emerald-500 outline-none resize-none text-sm`}
                />
              </div>
            </div>

            <button className="mt-6 px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-xl font-bold shadow-lg hover:shadow-cyan-500/25 transition-all">
              Save Goals
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Heart, Target, Briefcase, GraduationCap, Building2, Wand2, Sparkles, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { getTheme } from '../utils';
import InterestSelector from './InterestSelector';

export default function TransitionPlanning({ onBack, isDark }) {
  const theme = getTheme(isDark);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('resume'); // 'resume', 'interests', 'goals'
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [skillRatings, setSkillRatings] = useState({
    Communication: 3,
    Focus: 3,
    'Physical Strength': 3,
    'Coding/Tech': 3
  });
  const [pathways, setPathways] = useState([]);
  const [selectedPathway, setSelectedPathway] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  const handleGenerateCareerPaths = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    setPathways([]);
    setSelectedPathway(null);

    try {
      const response = await fetch('/api/generate-transition-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interests: selectedInterests,
          skills: skillRatings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      if (data.pathways && Array.isArray(data.pathways)) {
        setPathways(data.pathways);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error generating career paths:', error);
      setGenerateError(error.message || 'Failed to generate career paths. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

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
            
            <div className="space-y-8">
              {/* Interest Categories */}
              <div>
                <label className={`block text-sm font-bold ${theme.textMuted} mb-4 uppercase tracking-wider`}>
                  Select Your Interests
                </label>
                <p className={`text-sm ${theme.textMuted} mb-4`}>
                  Click on the categories that interest you. You can select multiple options.
                </p>
                <InterestSelector
                  selectedInterests={selectedInterests}
                  onSelectionChange={setSelectedInterests}
                  isDark={isDark}
                />
              </div>

              {/* Skill Assessment */}
              <div>
                <label className={`block text-sm font-bold ${theme.textMuted} mb-4 uppercase tracking-wider`}>
                  Rate Your Skills
                </label>
                <p className={`text-sm ${theme.textMuted} mb-4`}>
                  Rate yourself on a scale of 1-5 (1 = Beginner, 5 = Advanced)
                </p>
                <div className="space-y-6">
                  {Object.keys(skillRatings).map((skill) => (
                    <div key={skill} className="pb-2">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`font-medium ${theme.text}`}>{skill}</span>
                        <span className={`text-lg font-bold ${skillRatings[skill] >= 4 ? 'text-fuchsia-400' : skillRatings[skill] >= 3 ? 'text-cyan-400' : theme.textMuted}`}>
                          {skillRatings[skill]} / 5
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          value={skillRatings[skill]}
                          onChange={(e) => {
                            setSkillRatings({
                              ...skillRatings,
                              [skill]: parseInt(e.target.value)
                            });
                          }}
                          className={`w-full h-3 rounded-lg appearance-none cursor-pointer accent-fuchsia-500 ${
                            isDark ? 'bg-slate-700' : 'bg-gray-200'
                          }`}
                          style={{
                            background: `linear-gradient(to right, rgb(217, 70, 239) 0%, rgb(217, 70, 239) ${((skillRatings[skill] - 1) / 4) * 100}%, ${isDark ? 'rgb(51, 65, 85)' : 'rgb(229, 231, 235)'} ${((skillRatings[skill] - 1) / 4) * 100}%, ${isDark ? 'rgb(51, 65, 85)' : 'rgb(229, 231, 235)'} 100%)`
                          }}
                        />
                        <div className="flex justify-between mt-1">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <span
                              key={num}
                              className={`text-xs ${theme.textMuted} ${num === skillRatings[skill] ? 'font-bold text-fuchsia-400' : ''}`}
                            >
                              {num}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate Career Paths Button */}
              <div className={`pt-4 border-t ${theme.cardBorder}`}>
                <button
                  onClick={handleGenerateCareerPaths}
                  disabled={isGenerating}
                  className="w-full px-8 py-4 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      Generating Career Paths...
                    </>
                  ) : (
                    <>
                      <Sparkles size={24} />
                      Generate Career Paths
                    </>
                  )}
                </button>
                
                {generateError && (
                  <div className={`mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 ${theme.text}`}>
                    <p className="text-red-400 font-medium">{generateError}</p>
                  </div>
                )}
              </div>

              {/* Career Pathways Display */}
              {pathways.length > 0 && (
                <div className={`mt-8 pt-8 border-t ${theme.cardBorder}`}>
                  <h3 className={`text-2xl font-bold ${theme.text} mb-6`}>
                    Recommended Career Pathways
                  </h3>
                  <p className={`${theme.textMuted} mb-6`}>
                    Review the pathways below and select one as your primary goal.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {pathways.map((pathway, index) => {
                      const isSelected = selectedPathway === index;
                      return (
                        <div
                          key={index}
                          onClick={() => setSelectedPathway(index)}
                          className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all transform hover:scale-105 ${
                            isSelected
                              ? 'border-fuchsia-500 bg-fuchsia-500/10 shadow-lg shadow-fuchsia-500/20'
                              : `${theme.cardBg} ${theme.cardBorder} hover:border-cyan-400`
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-4 right-4">
                              <CheckCircle2 className="text-fuchsia-400" size={24} />
                            </div>
                          )}
                          
                          <div className="mb-4">
                            <div className={`text-xs uppercase font-bold tracking-wider mb-2 ${theme.textMuted}`}>
                              Pathway {index + 1}
                            </div>
                            <h4 className={`text-xl font-bold ${theme.text} mb-4`}>
                              {pathway.jobTitle}
                            </h4>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <div className={`text-xs uppercase font-bold tracking-wider mb-1 ${theme.textMuted}`}>
                                Why it fits
                              </div>
                              <p className={`text-sm ${theme.text}`}>
                                {pathway.whyItFits}
                              </p>
                            </div>

                            <div>
                              <div className={`text-xs uppercase font-bold tracking-wider mb-1 ${theme.textMuted}`}>
                                Education Needed
                              </div>
                              <p className={`text-sm font-medium ${theme.text}`}>
                                {pathway.educationNeeded}
                              </p>
                            </div>

                            <div>
                              <div className={`text-xs uppercase font-bold tracking-wider mb-1 ${theme.textMuted}`}>
                                Official IEP Goal
                              </div>
                              <p className={`text-sm ${theme.text} italic`}>
                                {pathway.iepGoal}
                              </p>
                            </div>
                          </div>

                          <div className={`mt-6 pt-4 border-t ${theme.cardBorder} space-y-3`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPathway(index);
                              }}
                              className={`w-full px-4 py-2 rounded-lg font-bold transition-all ${
                                isSelected
                                  ? 'bg-fuchsia-500 text-white'
                                  : `${theme.inputBg} border ${theme.inputBorder} ${theme.text} hover:border-fuchsia-400`
                              }`}
                            >
                              {isSelected ? 'Selected as Primary Goal' : 'Select This Pathway'}
                            </button>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Convert skillRatings object to array of skill names
                                // Include skills rated 3 or higher (showing confidence in those skills)
                                const skillsArray = Object.keys(skillRatings)
                                  .filter(skill => skillRatings[skill] >= 3)
                                  .map(skill => skill); // Ensure we get the skill names as strings
                                
                                // Create a professional summary/objective based on the career pathway
                                const objective = `Seeking a position as a ${pathway.jobTitle}. ${pathway.whyItFits} Looking forward to pursuing ${pathway.educationNeeded} to achieve this career goal.`;
                                
                                // Navigate to resume builder with pre-filled data
                                navigate('/resume', {
                                  state: {
                                    jobTitle: pathway.jobTitle,
                                    skills: skillsArray.length > 0 ? skillsArray : [], // Ensure it's always an array
                                    summary: objective
                                  }
                                });
                              }}
                              className={`w-full px-4 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white hover:shadow-lg hover:shadow-cyan-500/30 transform hover:scale-105`}
                            >
                              <Briefcase size={18} />
                              Start Resume for this Career
                              <ArrowRight size={18} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedPathway !== null && (
                    <div className={`mt-6 p-6 rounded-xl bg-cyan-500/10 border border-cyan-500/30 ${theme.text}`}>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="text-cyan-400 flex-shrink-0 mt-1" size={24} />
                        <div>
                          <h4 className={`font-bold ${theme.text} mb-2`}>
                            Primary Goal Selected: {pathways[selectedPathway]?.jobTitle}
                          </h4>
                          <p className={`text-sm ${theme.textMuted}`}>
                            This pathway has been saved as your primary post-secondary goal. You can update your selection at any time.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
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


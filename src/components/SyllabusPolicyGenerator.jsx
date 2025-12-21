import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, FileText } from 'lucide-react';
import { getTheme } from '../utils';

const CELT_LEVELS = [
  {
    level: 0,
    title: 'Level 0: Sole Author',
    description: 'Student generates all ideas and content independently.',
    policy: 'AI Policy: Level 0. Generative AI may not be used for any reason in this assignment. All work must be your own original creation.'
  },
  {
    level: 1,
    title: 'Level 1: Primary Creator',
    description: 'AI used only for specific tasks like proofreading.',
    policy: 'AI Policy: Level 1. You may use AI for limited tasks like grammar checking, but the final submission must represent your original work.'
  },
  {
    level: 2,
    title: 'Level 2: Conceptual Architect',
    description: 'AI used for brainstorming and outlining.',
    policy: 'AI Policy: Level 2. You may use AI to brainstorm or outline ideas, but you must be the "Conceptual Architect" of the final content.'
  },
  {
    level: 3,
    title: 'Level 3: Critical Collaborator',
    description: 'AI used for partial drafting with critical oversight.',
    policy: 'AI Policy: Level 3. You may use AI to co-draft sections, but you must critically evaluate and refine all outputs.'
  },
  {
    level: 4,
    title: 'Level 4: Project Manager',
    description: 'AI used as a primary engine for creation.',
    policy: 'AI Policy: Level 4. You are encouraged to leverage AI for complex problem-solving. You must cite your usage using the official CELT disclosure format.'
  }
];

export default function SyllabusPolicyGenerator({ isDark, onBack }) {
  const theme = getTheme(isDark);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleLevelClick = (level) => {
    setSelectedLevel(level);
  };

  const selectedPolicy = selectedLevel !== null ? CELT_LEVELS[selectedLevel].policy : '';

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} transition-colors duration-500 relative overflow-x-hidden`}>
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 -z-10">
        <div className={`absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse ${isDark ? 'opacity-30' : 'opacity-20'}`}></div>
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse ${isDark ? 'opacity-30' : 'opacity-20'}`} style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Back Button */}
        <button
          onClick={onBack}
          className={`flex items-center gap-2 mb-8 ${theme.textMuted} hover:${theme.text} transition-all hover:gap-3 group`}
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>

        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r ${isDark ? 'from-cyan-400 via-fuchsia-400 to-cyan-400' : 'from-cyan-600 via-fuchsia-600 to-cyan-600'}`}>
            UK CELT Syllabus Policy Generator
          </h1>
          <p className={`text-lg ${theme.textMuted} max-w-3xl mx-auto mb-4`}>
            Align your course policy with the official University of Kentucky Student AI Use Scale.
          </p>
          <p className={`text-sm ${theme.textMuted} max-w-3xl mx-auto italic`}>
            This is a demo/test tool and is not directly affiliated with the University of Kentucky or CELT.
          </p>
        </div>

        {/* Level Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
          {CELT_LEVELS.map((level, index) => (
            <button
              key={level.level}
              onClick={() => handleLevelClick(index)}
              className={`
                relative group p-6 rounded-2xl border-2 transition-all duration-300
                ${selectedLevel === index
                  ? `${isDark ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20' : 'border-cyan-600 bg-cyan-500/20 shadow-lg shadow-cyan-500/30'}`
                  : `${theme.cardBg} ${theme.cardBorder} hover:border-cyan-500/50 hover:shadow-lg`
                }
                text-left
              `}
            >
              {/* Gradient overlay on hover/select */}
              {selectedLevel === index && (
                <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? 'from-cyan-500/5 to-fuchsia-500/5' : 'from-cyan-500/10 to-fuchsia-500/10'} rounded-2xl`}></div>
              )}
              
              <div className="relative z-10">
                <div className={`text-3xl font-bold mb-3 ${selectedLevel === index ? (isDark ? 'text-cyan-400' : 'text-cyan-600') : theme.text}`}>
                  {level.level}
                </div>
                <h3 className={`text-lg font-bold mb-2 ${selectedLevel === index ? (isDark ? 'text-cyan-300' : 'text-cyan-700') : theme.text}`}>
                  {level.title.split(': ')[1]}
                </h3>
                <p className={`text-sm leading-relaxed ${theme.textMuted}`}>
                  {level.description}
                </p>
              </div>

              {/* Selection indicator */}
              {selectedLevel === index && (
                <div className="absolute top-4 right-4">
                  <div className={`w-3 h-3 rounded-full ${isDark ? 'bg-cyan-400' : 'bg-cyan-600'} animate-pulse`}></div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Policy Output Section */}
        {selectedLevel !== null && (
          <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-8 shadow-xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FileText className={`${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} size={24} />
                <h2 className={`text-2xl font-bold ${theme.text}`}>Syllabus Statement</h2>
              </div>
            </div>
            
            <div className={`${theme.inputBg} border ${theme.inputBorder} rounded-xl p-6 mb-6`}>
              <p className={`text-lg leading-relaxed ${theme.text} whitespace-pre-wrap`}>
                {selectedPolicy}
              </p>
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(selectedPolicy);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch (err) {
                    console.error('Failed to copy text:', err);
                  }
                }}
                className={`
                  inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold
                  bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white
                  shadow-lg hover:shadow-cyan-500/25 transition-all duration-300
                  hover:scale-105 active:scale-95
                `}
              >
                {copied ? (
                  <>
                    <Check size={18} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copy to Clipboard
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {selectedLevel === null && (
          <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-12 text-center`}>
            <FileText className={`${theme.textMuted} mx-auto mb-4`} size={48} />
            <p className={`text-lg ${theme.textMuted}`}>
              Select a CELT level above to generate the corresponding syllabus policy statement.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, FileText } from 'lucide-react';
import { getTheme } from '../utils';

const CELT_LEVELS = [
  {
    level: 0,
    title: 'Level 0: Sole Author',
    description: 'Student generates all ideas and content. AI is prohibited.',
    policy: 'AI Policy: Level 0 (Sole Author). Generative AI may not be used for any reason in this assignment. All work must be your own original creation. Use of AI tools will be considered academic misconduct.'
  },
  {
    level: 1,
    title: 'Level 1: Primary Creator',
    description: 'AI used only for limited tasks like proofreading.',
    policy: 'AI Policy: Level 1 (Primary Creator). You may use AI for specific, limited tasks like grammar checking or formatting, but the final submission must represent your original thoughts and labor.'
  },
  {
    level: 2,
    title: 'Level 2: Conceptual Architect',
    description: 'AI used as a "Thought Partner" for brainstorming.',
    policy: 'AI Policy: Level 2 (Conceptual Architect). You may use AI to brainstorm, elaborate, or expand on ideas, but you must be the "Conceptual Architect." You must critically evaluate and refine any AI output.'
  },
  {
    level: 3,
    title: 'Level 3: Critical Collaborator',
    description: 'AI used as a "Co-Creator" for drafting sections.',
    policy: 'AI Policy: Level 3 (Critical Collaborator). You may collaborate with AI to draft content, but you must maintain critical oversight. You are responsible for the accuracy of all AI-generated text.'
  },
  {
    level: 4,
    title: 'Level 4: Project Manager',
    description: 'AI used as an "Engine for Creation" for complex problems.',
    policy: 'AI Policy: Level 4 (Project Manager). You are encouraged to leverage AI for complex problem-solving. However, you must cite your usage using the official CELT disclosure format.'
  }
];

const CELT_DISCLOSURE_FORMAT = 'I acknowledge my use of Generative AI in the preparation of this assignment in the form of [insert GenAI tool name]. The [GenAI tool name] was used in the following ways: [List and explain all uses including steps to clarify, fact-check, and cite]. I have taken all necessary steps to ensure the accuracy of the material and data I used.';

export default function SyllabusPolicyGenerator({ isDark, onBack }) {
  const theme = getTheme(isDark);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedDisclosure, setCopiedDisclosure] = useState(false);

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

        {/* Header Section - Baseline: 6bef251 */}
        <div className="mb-12 text-center overflow-visible">
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r ${isDark ? 'from-cyan-400 via-fuchsia-400 to-cyan-400' : 'from-cyan-600 via-fuchsia-600 to-cyan-600'} leading-[1.2] py-2 overflow-visible`} style={{ WebkitBackgroundClip: 'text', backgroundClip: 'text', display: 'block' }}>
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

            <div className="flex items-center justify-end mb-6">
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

            {/* Disclosure Format for Level 4 */}
            {selectedLevel === 4 && (
              <div className={`${theme.inputBg} border ${theme.inputBorder} rounded-xl p-6 mt-6`}>
                <h3 className={`text-lg font-bold ${theme.text} mb-3`}>Official CELT Disclosure Format</h3>
                <p className={`text-sm ${theme.textMuted} mb-4`}>
                  Use this format when citing your AI usage:
                </p>
                <div className={`${isDark ? 'bg-slate-800' : 'bg-slate-100'} border ${theme.inputBorder} rounded-lg p-4 mb-4`}>
                  <p className={`text-sm leading-relaxed ${theme.text} whitespace-pre-wrap font-mono`}>
                    {CELT_DISCLOSURE_FORMAT}
                  </p>
                </div>
                <div className="flex items-center justify-end">
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(CELT_DISCLOSURE_FORMAT);
                        setCopiedDisclosure(true);
                        setTimeout(() => setCopiedDisclosure(false), 2000);
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
                    {copiedDisclosure ? (
                      <>
                        <Check size={18} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        Copy Disclosure Format
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
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


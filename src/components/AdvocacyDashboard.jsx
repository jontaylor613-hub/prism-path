import React, { useState } from 'react';
import { 
  Mail, Shield, FileText, ArrowLeft, Loader2, CheckCircle, 
  Clock, Send, Target, BookOpen, Scale, AlertCircle, Zap
} from 'lucide-react';
import { getTheme, GeminiService } from '../utils';

// Bridge Builder Email Assistant Component
const BridgeBuilder = ({ isDark, onBack }) => {
  const theme = getTheme(isDark);
  const [recipient, setRecipient] = useState('');
  const [issueType, setIssueType] = useState('');
  const [tone, setTone] = useState('professional');
  const [emailDraft, setEmailDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [followUpPlan, setFollowUpPlan] = useState(null);
  const [loadingFollowUp, setLoadingFollowUp] = useState(false);

  const issueTypes = [
    'Missed Minutes',
    'IEP Implementation',
    '504 Plan Compliance',
    'Service Delivery',
    'Behavior Concerns',
    'Academic Progress',
    'Communication Issues',
    'Other'
  ];

  const tones = [
    { value: 'professional', label: 'Professional' },
    { value: 'collaborative', label: 'Collaborative' },
    { value: 'concerned', label: 'Concerned but Respectful' }
  ];

  const handleDraftEmail = async () => {
    if (!recipient || !issueType) {
      alert('Please fill in Recipient and Issue Type');
      return;
    }

    setLoading(true);
    try {
      const response = await GeminiService.generate(
        { 
          recipient,
          issueType,
          tone,
          message: `Generate a professional advocacy email for ${issueType} addressed to ${recipient} with a ${tone} tone.`
        },
        'advocacy-email'
      );

      setEmailDraft(response);
    } catch (error) {
      alert(`Error generating email: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFollowUpPlan = async () => {
    if (!emailDraft) {
      alert('Please generate an email draft first');
      return;
    }

    setLoadingFollowUp(true);
    try {
      const task = `Create a follow-up plan for the advocacy email about "${issueType}" sent to "${recipient}". Include timeline steps like checking for reply, next actions if no response, and escalation steps if needed.`;
      
      const response = await GeminiService.generate({ task }, 'slicer');
      
      // Parse the response into steps
      const lines = response.split('\n').filter(line => line.trim().match(/^(\d+\.|-|\*)/));
      const steps = lines.map(line => ({
        text: line.replace(/^(\d+\.|-|\*)\s*/, '').trim(),
        done: false
      }));

      setFollowUpPlan(steps.length > 0 ? steps : [{ text: 'Follow-up plan generated. Review and customize as needed.', done: false }]);
    } catch (error) {
      alert(`Error generating follow-up plan: ${error.message}`);
    } finally {
      setLoadingFollowUp(false);
    }
  };

  const toggleStep = (index) => {
    const newSteps = [...followUpPlan];
    newSteps[index].done = !newSteps[index].done;
    setFollowUpPlan(newSteps);
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className={`flex items-center gap-2 ${theme.textMuted} hover:${theme.text} transition-colors`}
          >
            <ArrowLeft size={20} />
            Back to Advocacy Center
          </button>
        </div>

        <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-8 mb-6`}>
          <div className="flex items-center gap-3 mb-6">
            <Mail className="text-cyan-400" size={32} />
            <h1 className="text-3xl font-bold">Bridge Builder™ Email Assistant</h1>
          </div>

          <div className="space-y-6">
            <div>
              <label className={`block text-sm font-bold ${theme.text} mb-2`}>
                Recipient *
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g., Teacher Name, Principal, School District"
                className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none focus:border-cyan-500`}
              />
            </div>

            <div>
              <label className={`block text-sm font-bold ${theme.text} mb-2`}>
                Issue Type *
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className={`w-full ${theme.inputBg} border ${theme.inputBorder} rounded-lg p-3 ${theme.text} outline-none focus:border-cyan-500`}
              >
                <option value="">Select an issue type...</option>
                {issueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-bold ${theme.text} mb-2`}>
                Tone
              </label>
              <div className="flex gap-4">
                {tones.map(t => (
                  <label
                    key={t.value}
                    className={`flex items-center gap-2 cursor-pointer p-3 rounded-lg border ${
                      tone === t.value
                        ? `${theme.inputBg} border-cyan-500`
                        : `${theme.cardBorder} ${theme.cardBg}`
                    }`}
                  >
                    <input
                      type="radio"
                      value={t.value}
                      checked={tone === t.value}
                      onChange={(e) => setTone(e.target.value)}
                      className="hidden"
                    />
                    <span className={theme.text}>{t.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleDraftEmail}
              disabled={loading || !recipient || !issueType}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-lg font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-cyan-500/25 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Generating...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Draft Email
                </>
              )}
            </button>
          </div>
        </div>

        {emailDraft && (
          <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-8 mb-6`}>
            <h2 className={`text-xl font-bold ${theme.text} mb-4`}>Email Draft</h2>
            <div className={`${theme.inputBg} border ${theme.inputBorder} rounded-lg p-6 mb-4 whitespace-pre-wrap ${theme.text}`}>
              {emailDraft}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(emailDraft)}
                className={`px-4 py-2 ${theme.inputBg} border ${theme.inputBorder} rounded-lg ${theme.text} hover:border-cyan-500 transition-colors`}
              >
                Copy to Clipboard
              </button>
              <button
                onClick={handleCreateFollowUpPlan}
                disabled={loadingFollowUp}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loadingFollowUp ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Target size={16} />
                    Create Follow-up Plan
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {followUpPlan && (
          <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-8`}>
            <h2 className={`text-xl font-bold ${theme.text} mb-4 flex items-center gap-2`}>
              <Target className="text-cyan-400" size={24} />
              Follow-up Plan
            </h2>
            <div className="space-y-3">
              {followUpPlan.map((step, index) => (
                <div
                  key={index}
                  onClick={() => toggleStep(index)}
                  className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                    step.done
                      ? `${theme.inputBg} border-emerald-500/20 opacity-60`
                      : `${theme.cardBg} ${theme.cardBorder} hover:border-cyan-400`
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 shrink-0 ${
                    step.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                  }`}>
                    {step.done && <CheckCircle size={18} className="text-white" />}
                  </div>
                  <span className={`text-lg font-medium ${step.done ? 'line-through text-slate-500' : theme.text}`}>
                    {step.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Rights & Resources Knowledge Base Component
const RightsResources = ({ isDark, onBack }) => {
  const theme = getTheme(isDark);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [processSteps, setProcessSteps] = useState(null);
  const [loading, setLoading] = useState(false);

  const resources = [
    {
      id: '504',
      title: 'Section 504 Plans',
      icon: Shield,
      description: 'Learn about Section 504 of the Rehabilitation Act and how it protects students with disabilities.',
      topics: [
        'Requesting a 504 Evaluation',
        '504 Plan Development',
        '504 Plan Implementation',
        '504 Plan Review Process',
        'Filing a 504 Complaint'
      ]
    },
    {
      id: 'ada',
      title: 'Americans with Disabilities Act (ADA)',
      icon: Scale,
      description: 'Understand your rights under the ADA and how it applies to educational settings.',
      topics: [
        'ADA Rights in Schools',
        'Requesting Reasonable Accommodations',
        'ADA Complaint Process',
        'Accessibility Requirements'
      ]
    },
    {
      id: 'procedural',
      title: 'Procedural Safeguards',
      icon: FileText,
      description: 'Know your rights during the special education process, including due process and dispute resolution.',
      topics: [
        'Requesting an Evaluation',
        'IEP Meeting Rights',
        'Prior Written Notice',
        'Mediation Process',
        'Due Process Hearing',
        'State Complaint Process'
      ]
    }
  ];

  const handleStartProcess = async (topic) => {
    setSelectedTopic(topic);
    setLoading(true);
    try {
      const task = `Create a step-by-step checklist for a parent to execute: ${topic}. Make it actionable with specific steps like forms to download, deadlines to know, and who to contact.`;
      
      const response = await GeminiService.generate({ task }, 'slicer');
      
      // Parse the response into steps
      const lines = response.split('\n').filter(line => line.trim().match(/^(\d+\.|-|\*)/));
      const steps = lines.map(line => ({
        text: line.replace(/^(\d+\.|-|\*)\s*/, '').trim(),
        done: false
      }));

      setProcessSteps(steps.length > 0 ? steps : [{ text: 'Process steps generated. Review and customize as needed.', done: false }]);
    } catch (error) {
      alert(`Error generating process steps: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (index) => {
    const newSteps = [...processSteps];
    newSteps[index].done = !newSteps[index].done;
    setProcessSteps(newSteps);
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className={`flex items-center gap-2 ${theme.textMuted} hover:${theme.text} transition-colors`}
          >
            <ArrowLeft size={20} />
            Back to Advocacy Center
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Rights & Resources</h1>
          <p className={theme.textMuted}>Knowledge base for special education rights and processes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {resources.map(resource => {
            const Icon = resource.icon;
            return (
              <div
                key={resource.id}
                className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-6 hover:shadow-xl transition-all`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="text-cyan-400" size={32} />
                  <h2 className={`text-xl font-bold ${theme.text}`}>{resource.title}</h2>
                </div>
                <p className={`${theme.textMuted} mb-4 text-sm`}>{resource.description}</p>
                <div className="space-y-2">
                  {resource.topics.map((topic, index) => (
                    <button
                      key={index}
                      onClick={() => handleStartProcess(topic)}
                      disabled={loading}
                      className={`w-full text-left px-4 py-2 rounded-lg border ${theme.cardBorder} ${theme.inputBg} ${theme.text} hover:border-cyan-500 transition-colors flex items-center justify-between group`}
                    >
                      <span className="text-sm">{topic}</span>
                      <Zap size={16} className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {processSteps && (
          <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-8`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-bold ${theme.text} flex items-center gap-2`}>
                <Target className="text-cyan-400" size={28} />
                {selectedTopic}
              </h2>
              <button
                onClick={() => {
                  setProcessSteps(null);
                  setSelectedTopic(null);
                }}
                className={`${theme.textMuted} hover:${theme.text}`}
              >
                <ArrowLeft size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {processSteps.map((step, index) => (
                <div
                  key={index}
                  onClick={() => toggleStep(index)}
                  className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                    step.done
                      ? `${theme.inputBg} border-emerald-500/20 opacity-60`
                      : `${theme.cardBg} ${theme.cardBorder} hover:border-cyan-400 hover:shadow-md`
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-4 shrink-0 ${
                    step.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-cyan-400'
                  }`}>
                    {step.done && <CheckCircle size={18} className="text-white" />}
                  </div>
                  <span className={`text-lg font-medium ${step.done ? 'line-through text-slate-500' : theme.text}`}>
                    {step.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Advocacy Dashboard Component
export default function AdvocacyDashboard({ isDark, onBack }) {
  const theme = getTheme(isDark);
  const [activeView, setActiveView] = useState('main'); // 'main', 'bridge', 'rights'

  if (activeView === 'bridge') {
    return <BridgeBuilder isDark={isDark} onBack={() => setActiveView('main')} />;
  }

  if (activeView === 'rights') {
    return <RightsResources isDark={isDark} onBack={() => setActiveView('main')} />;
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Advocacy Center</h1>
            <p className={theme.textMuted}>Tools and resources to support your advocacy journey</p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className={`flex items-center gap-2 ${theme.textMuted} hover:${theme.text} transition-colors`}
            >
              <ArrowLeft size={20} />
              Back
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bridge Builder Card */}
          <div
            onClick={() => setActiveView('bridge')}
            className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-8 cursor-pointer hover:shadow-xl transition-all hover:scale-105`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-4 rounded-xl ${isDark ? 'bg-cyan-900/30' : 'bg-cyan-100'}`}>
                <Mail className="text-cyan-400" size={32} />
              </div>
              <h2 className={`text-2xl font-bold ${theme.text}`}>Bridge Builder™</h2>
            </div>
            <p className={`${theme.textMuted} mb-4`}>
              Professional email assistant to help you communicate effectively with schools. 
              Generates de-escalatory, factual emails and creates follow-up action plans.
            </p>
            <div className="flex items-center gap-2 text-cyan-400 font-medium">
              Open Bridge Builder <ArrowLeft className="rotate-180" size={16} />
            </div>
          </div>

          {/* Rights & Resources Card */}
          <div
            onClick={() => setActiveView('rights')}
            className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-8 cursor-pointer hover:shadow-xl transition-all hover:scale-105`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-4 rounded-xl ${isDark ? 'bg-fuchsia-900/30' : 'bg-fuchsia-100'}`}>
                <BookOpen className="text-fuchsia-400" size={32} />
              </div>
              <h2 className={`text-2xl font-bold ${theme.text}`}>Rights & Resources</h2>
            </div>
            <p className={`${theme.textMuted} mb-4`}>
              Knowledge base covering 504s, ADA, and Procedural Safeguards. 
              Get step-by-step checklists for executing your rights.
            </p>
            <div className="flex items-center gap-2 text-fuchsia-400 font-medium">
              Explore Resources <ArrowLeft className="rotate-180" size={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


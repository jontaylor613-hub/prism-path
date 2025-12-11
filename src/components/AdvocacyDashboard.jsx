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

  // Comprehensive knowledge base with actionable steps for each topic
  const knowledgeBase = {
    'Requesting a 504 Evaluation': [
      'Document your child\'s disability and how it substantially limits a major life activity (learning, walking, seeing, hearing, etc.)',
      'Write a formal written request to the school district\'s 504 coordinator (find contact info on district website or call district office)',
      'Include medical records, diagnostic reports, or professional evaluations that support the disability',
      'Request the evaluation in writing and keep a copy with date stamp or delivery confirmation',
      'School must respond within a reasonable time (typically 30-60 days, check your state timeline)',
      'If denied, request the decision in writing and ask for the appeals process',
      'Keep all correspondence and document dates of communication'
    ],
    '504 Plan Development': [
      'Attend the 504 team meeting (you have the right to participate)',
      'Bring documentation of your child\'s needs and any recommendations from doctors, therapists, or evaluators',
      'Review proposed accommodations before the meeting and prepare your input',
      'Ensure the plan includes specific accommodations, not vague statements',
      'Verify the plan addresses how disability impacts learning in the school setting',
      'Get a copy of the final 504 plan in writing',
      'Confirm timelines for implementation and review dates are included',
      'If you disagree with the plan, express concerns in writing and request revisions'
    ],
    '504 Plan Implementation': [
      'Receive a written copy of the approved 504 plan with all accommodations clearly stated',
      'Review the plan to ensure all team members (teachers, counselors, administrators) have received copies',
      'Schedule a follow-up meeting 2-4 weeks after implementation to check progress',
      'Monitor whether accommodations are being provided consistently',
      'Document any instances where accommodations are not being followed',
      'Communicate concerns in writing to the 504 coordinator if implementation is inconsistent',
      'Keep a log of accommodations received and any concerns that arise',
      'Request progress reports to ensure the plan is effective'
    ],
    '504 Plan Review Process': [
      '504 plans should be reviewed annually or whenever there are significant changes',
      'Request a review meeting in writing if you notice the plan isn\'t working or circumstances change',
      'Prepare updated documentation if your child\'s needs have changed',
      'Attend the review meeting with input on what\'s working and what needs adjustment',
      'Request modifications if current accommodations are insufficient',
      'Ensure any changes are documented in writing',
      'Get an updated copy of the revised plan',
      'Verify new implementation timeline if changes were made'
    ],
    'Filing a 504 Complaint': [
      'Document all instances of non-compliance with dates, times, and specific violations',
      'Send a formal written complaint to the school district\'s 504 coordinator or compliance officer',
      'Copy the Office for Civil Rights (OCR) - file online at ocrportal.hhs.gov or mail to regional OCR office',
      'Include copies of the 504 plan, correspondence, and documentation of violations',
      'State specific accommodations that were denied or not implemented',
      'Request specific remedies (implementation of accommodations, compensatory services, etc.)',
      'Keep copies of all complaint documents',
      'OCR typically investigates within 180 days - follow up if you don\'t hear back',
      'You may also file with your state education agency (check state-specific procedures)'
    ],
    'ADA Rights in Schools': [
      'ADA protects students with disabilities from discrimination in all aspects of school programs and activities',
      'Schools must provide reasonable modifications to policies, practices, and procedures when needed',
      'Schools must ensure effective communication through appropriate auxiliary aids and services',
      'Schools must remove architectural barriers or provide alternative access when structurally feasible',
      'Students cannot be excluded from programs or activities solely based on disability',
      'Schools must make reasonable accommodations unless it causes undue burden',
      'If denied services, request the decision in writing with explanation',
      'Document any discrimination and file complaint with OCR if necessary'
    ],
    'Requesting Reasonable Accommodations': [
      'Identify specific barriers your child faces due to disability in the school setting',
      'Put your accommodation request in writing to the appropriate school official (504 coordinator, principal, or ADA coordinator)',
      'Provide supporting documentation linking the disability to the need for accommodation',
      'Be specific about the accommodation needed and how it addresses the barrier',
      'Explain how the accommodation will enable equal access to educational programs',
      'Follow up if you don\'t receive a response within 10-15 business days',
      'If denied, request the denial in writing with explanation',
      'If denied due to "undue burden," request documentation of the burden analysis',
      'Know your right to appeal denials through OCR complaint process'
    ],
    'ADA Complaint Process': [
      'Gather documentation: incident details, dates, witnesses, correspondence, relevant policies',
      'File complaint with Office for Civil Rights (OCR) within 180 days of the discrimination',
      'File online at ocrportal.hhs.gov or mail to your regional OCR office (find at ed.gov/ocr)',
      'Include: your contact info, school district name, description of discrimination, dates, and requested resolution',
      'OCR will review complaint and may investigate',
      'School district will be notified and asked to respond',
      'OCR may attempt informal resolution or conduct a full investigation',
      'If violation found, OCR may require corrective action',
      'You can also file a private lawsuit, but must file with OCR first or wait 90 days',
      'Keep copies of all complaint documents and maintain communication with OCR investigator'
    ],
    'Accessibility Requirements': [
      'Schools built or altered after 1992 must be accessible to people with disabilities',
      'Schools must ensure programs are accessible even if facilities are not fully accessible',
      'Request accessibility audit if you notice barriers (e.g., inaccessible entrances, bathrooms, classrooms)',
      'Schools may need to provide program access through relocation, modification, or auxiliary aids',
      'Check if your child\'s school has a transition plan for removing barriers',
      'File complaint with OCR if accessibility barriers prevent equal participation',
      'For new construction, schools must follow ADA Standards for Accessible Design',
      'Document specific barriers and how they limit your child\'s access to programs'
    ],
    'Requesting an Evaluation': [
      'Submit a written request for special education evaluation to the school principal or special education director',
      'Put request in writing and keep dated copy (email with read receipt or certified mail)',
      'Specify areas of concern (academic, behavioral, social, communication, etc.)',
      'Provide any existing documentation (medical records, private evaluations, teacher reports)',
      'School has 60 days (timeframe varies by state - check your state requirements) to complete evaluation',
      'School must obtain your written consent before beginning evaluation',
      'If school refuses, they must provide Prior Written Notice explaining why',
      'If school refuses, you can request an Independent Educational Evaluation (IEE) at public expense',
      'Stay involved in the evaluation process and provide input on areas to assess'
    ],
    'IEP Meeting Rights': [
      'Receive written notice of IEP meeting at least 10 days in advance (timeframe varies by state)',
      'You have the right to participate in all IEP meetings and bring others (advocate, therapist, etc.)',
      'You can request meetings at times that work for you and request rescheduling if needed',
      'You have the right to review all evaluations and documents before the meeting',
      'You must provide consent before services can begin or be changed',
      'You can request additional assessments if you disagree with existing data',
      'You have the right to record the meeting (check state laws on notification requirements)',
      'You can disagree with IEP and request mediation or due process',
      'Request copy of IEP draft before meeting if possible to review in advance',
      'If you disagree, you can request revisions or file for due process'
    ],
    'Prior Written Notice': [
      'School must provide Prior Written Notice (PWN) before making changes to identification, evaluation, placement, or services',
      'PWN must explain what the school proposes or refuses to do and why',
      'PWN must describe each evaluation procedure, assessment, or record used to make the decision',
      'PWN must include statement that you have procedural safeguard rights and how to obtain copies',
      'PWN must list other options considered and why they were rejected',
      'Request PWN in writing if school makes changes without providing it',
      'Review PWN carefully - you have the right to disagree and request mediation or due process',
      'Keep all PWN documents as they may be needed if disputes arise',
      'If PWN is unclear, request clarification from special education director'
    ],
    'Mediation Process': [
      'Mediation is voluntary for both parties but must be available if requested',
      'File a request for mediation with your state education agency (check state procedures)',
      'Mediation is confidential and cannot be used as evidence in due process hearings',
      'Mediator is a neutral third party trained in special education law',
      'Prepare by organizing documents, clearly stating concerns, and identifying desired outcomes',
      'Bring relevant documents (IEP, evaluations, correspondence) to mediation session',
      'If agreement is reached, it must be put in writing and signed by both parties',
      'Agreements are legally binding and enforceable',
      'If mediation fails, you can still proceed to due process hearing',
      'Mediation is free and typically faster than due process hearings'
    ],
    'Due Process Hearing': [
      'File a due process complaint with your state education agency within 2 years of violation (timeline varies by state)',
      'Complaint must include: child\'s name and address, school name, description of problem, and proposed resolution',
      'School must respond to complaint within 10 days',
      'You have the right to be represented by an attorney (fees may be recoverable if you prevail)',
      'Hearing officer must be impartial and cannot be employed by school district',
      'You can present evidence, call witnesses, and cross-examine school witnesses',
      'You can request hearing be open to public (some states allow this)',
      'Hearing officer must issue decision within 45 days of complaint filing',
      'Either party can appeal hearing decision to state or federal court',
      'Child stays in current placement during proceedings unless both parties agree otherwise ("stay put" provision)'
    ],
    'State Complaint Process': [
      'File written complaint with your state education agency (SEA) - find contact on state DOE website',
      'Must file within 1 year of alleged violation (timeline varies by state)',
      'Include: your contact info, child\'s name, school district, description of violation, and proposed resolution',
      'SEA must investigate within 60 days (may extend for exceptional circumstances)',
      'Investigation may include interviews, document review, and on-site visits',
      'If violation found, SEA will require corrective action with timeline',
      'SEA will issue written report of findings',
      'You can request reconsideration if you disagree with findings',
      'Keep copies of complaint and all correspondence',
      'State complaints and due process complaints can be filed simultaneously for same issue'
    ]
  };

  const handleStartProcess = (topic) => {
    setSelectedTopic(topic);
    const steps = knowledgeBase[topic] || [
      'Content for this topic is being developed. Please contact your school district for specific procedures.'
    ];
    setProcessSteps(steps.map(step => ({
      text: step,
      done: false
    })));
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


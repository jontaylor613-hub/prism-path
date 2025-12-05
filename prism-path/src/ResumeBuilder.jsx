// src/ResumeBuilder.jsx
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, User, Briefcase, GraduationCap, Award, 
  ArrowRight, ArrowLeft, Check, Printer, RotateCcw, 
  Trash2, Wand, Loader2, X 
} from 'lucide-react';

export default function ResumeBuilder({ onBack, isLowStim }) {
  const [step, setStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);

  // --- State Management ---
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('prism-resume-data');
    return saved ? JSON.parse(saved) : {
      fullName: '', title: '', email: '', phone: '', summary: '',
      schoolName: '', gradYear: '', skills: [], jobs: []
    };
  });

  useEffect(() => {
    localStorage.setItem('prism-resume-data', JSON.stringify(data));
  }, [data]);

  // --- Actions ---
  const handleChange = (field, value) => setData(prev => ({ ...prev, [field]: value }));
  
  const [tempSkill, setTempSkill] = useState('');
  const addSkill = () => {
    if (tempSkill.trim()) {
      setData(prev => ({ ...prev, skills: [...prev.skills, tempSkill] }));
      setTempSkill('');
    }
  };

  const [tempJob, setTempJob] = useState({ company: '', role: '', description: '' });
  const addJob = () => {
    if (tempJob.company && tempJob.role) {
      setData(prev => ({ ...prev, jobs: [...prev.jobs, tempJob] }));
      setTempJob({ company: '', role: '', description: '' });
    }
  };

  // --- AI INTEGRATION ---
  const handleAIPolish = async (fieldToPolish) => {
    if (!tempJob.description && fieldToPolish === 'job') return;
    if (!data.summary && fieldToPolish === 'summary') return;

    setIsPolishing(true);
    const textToImprove = fieldToPolish === 'job' ? tempJob.description : data.summary;

    try {
      const prompt = `
        Role: Professional Resume Writer.
        Task: Rewrite the following draft text to be more professional, action-oriented, and concise.
        Input Text: "${textToImprove}"
        Output: Just the rewritten text. No conversational filler.
      `;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt })
      });

      const resData = await response.json();
      
      if (resData.result) {
        if (fieldToPolish === 'job') {
          setTempJob(prev => ({ ...prev, description: resData.result }));
        } else {
          handleChange('summary', resData.result);
        }
      }
    } catch (error) {
      console.error("AI Polish failed", error);
      alert("AI is busy right now. Try again!");
    } finally {
      setIsPolishing(false);
    }
  };

  // --- Steps Configuration ---
  const steps = [
    {
      id: 'basics',
      title: 'The Basics',
      subtitle: "Let's start with your contact info.",
      component: () => (
        <div className="space-y-4">
          <div>
            <label className={`block mb-2 text-sm font-bold ${isLowStim ? 'text-slate-300' : 'text-cyan-300'}`}>Full Name</label>
            <input type="text" value={data.fullName} onChange={(e) => handleChange('fullName', e.target.value)} placeholder="Jane Doe" className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-cyan-400 outline-none" />
          </div>
          <div>
            <label className={`block mb-2 text-sm font-bold ${isLowStim ? 'text-slate-300' : 'text-cyan-300'}`}>Target Job Title</label>
            <input type="text" value={data.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="e.g. Graphic Designer" className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-cyan-400 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="email" value={data.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="Email" className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-cyan-400 outline-none" />
            <input type="tel" value={data.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Phone" className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-cyan-400 outline-none" />
          </div>
        </div>
      )
    },
    {
      id: 'summary',
      title: 'Professional Summary',
      subtitle: "A short pitch about who you are.",
      component: () => (
        <div className="space-y-2">
          <textarea value={data.summary} onChange={(e) => handleChange('summary', e.target.value)} placeholder="I am a hard working professional..." className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white h-32 focus:border-fuchsia-400 outline-none" />
          <button onClick={() => handleAIPolish('summary')} disabled={isPolishing} className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full border transition-all ${isPolishing ? 'opacity-50' : 'hover:scale-105'} ${isLowStim ? 'bg-slate-700 text-white border-slate-500' : 'bg-indigo-600 text-white border-indigo-400'}`}>
            {isPolishing ? <Loader2 size={12} className="animate-spin"/> : <Wand size={12}/>} 
            {isPolishing ? "Polishing..." : "AI Magic Polish"}
          </button>
        </div>
      )
    },
    {
      id: 'jobs',
      title: 'Experience',
      subtitle: "Add your past jobs or volunteer work.",
      component: () => (
        <div className="space-y-6">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div className="space-y-3">
              <input type="text" placeholder="Company / Organization" value={tempJob.company} onChange={(e) => setTempJob({...tempJob, company: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white" />
              <input type="text" placeholder="Job Title" value={tempJob.role} onChange={(e) => setTempJob({...tempJob, role: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white" />
              
              <div className="relative">
                <textarea placeholder="What did you do? (Bullet points work best)" value={tempJob.description} onChange={(e) => setTempJob({...tempJob, description: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white h-24" />
                <button onClick={() => handleAIPolish('job')} disabled={isPolishing} className={`absolute bottom-3 right-3 text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-lg border transition-all ${isLowStim ? 'bg-slate-700 text-white border-slate-500' : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white border-fuchsia-400'}`}>
                   {isPolishing ? <Loader2 size={12} className="animate-spin"/> : <Wand size={12}/>} Polish
                </button>
              </div>
              <button onClick={addJob} className={`w-full py-2 rounded-lg font-bold ${isLowStim ? 'bg-slate-600 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}>+ Add Job</button>
            </div>
          </div>
          {/* Job List */}
          <div className="space-y-2">
            {data.jobs.map((job, idx) => (
              <div key={idx} className={`p-3 rounded flex justify-between items-center ${isLowStim ? 'bg-slate-800' : 'bg-slate-800 border-l-4 border-fuchsia-500'}`}>
                <div><h4 className="font-bold text-white">{job.role}</h4><p className="text-sm text-slate-400">{job.company}</p></div>
                <button onClick={() => setData(prev => ({...prev, jobs: prev.jobs.filter((_, i) => i !== idx)}))}><X size={16} className="text-red-400"/></button>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'skills',
      title: 'Skills & Education',
      subtitle: "Finish strong.",
      component: () => (
        <div className="space-y-6">
           <div>
            <label className="block mb-2 text-sm font-bold text-slate-300">Education</label>
            <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="School Name" value={data.schoolName} onChange={(e) => handleChange('schoolName', e.target.value)} className="bg-slate-800 border border-slate-600 rounded p-3 text-white" />
                <input type="text" placeholder="Year" value={data.gradYear} onChange={(e) => handleChange('gradYear', e.target.value)} className="bg-slate-800 border border-slate-600 rounded p-3 text-white" />
            </div>
           </div>
           <div>
            <label className="block mb-2 text-sm font-bold text-slate-300">Skills</label>
            <div className="flex gap-2 mb-2">
                <input type="text" value={tempSkill} onChange={(e) => setTempSkill(e.target.value)} onKeyDown={(e) => e.key==='Enter' && addSkill()} placeholder="Add a skill..." className="flex-1 bg-slate-800 border border-slate-600 rounded p-3 text-white" />
                <button onClick={addSkill} className="bg-slate-600 px-4 rounded text-white font-bold">+</button>
            </div>
            <div className="flex flex-wrap gap-2">
                {data.skills.map((s, i) => (
                    <span key={i} className={`text-sm px-3 py-1 rounded-full flex items-center gap-2 ${isLowStim ? 'bg-slate-700 text-white' : 'bg-slate-800 text-cyan-300 border border-cyan-900'}`}>
                        {s} <button onClick={() => setData(prev => ({...prev, skills: prev.skills.filter((_, idx) => idx !== i)}))}><X size={12}/></button>
                    </span>
                ))}
            </div>
           </div>
        </div>
      )
    }
  ];

  // --- PRINT PREVIEW ---
  if (showPreview) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl flex justify-between mb-6">
            <button onClick={() => setShowPreview(false)} className="flex items-center gap-2 text-slate-400 hover:text-white"><ArrowLeft /> Edit</button>
            <button onClick={() => window.print()} className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 ${isLowStim ? 'bg-slate-200 text-black' : 'bg-green-500 hover:bg-green-600 text-white'}`}><Printer size={20}/> Print PDF</button>
        </div>
        {/* RESUME PAPER */}
        <div id="printable-resume" className="bg-white text-black w-full max-w-[210mm] min-h-[297mm] p-12 shadow-2xl">
            <div className="border-b-2 border-gray-800 pb-6 mb-6">
                <h1 className="text-4xl font-bold uppercase tracking-wider">{data.fullName}</h1>
                <p className="text-xl text-gray-600 mt-2">{data.title}</p>
                <div className="flex gap-4 text-sm text-gray-500 mt-4">
                    {data.email && <span>{data.email}</span>}
                    {data.phone && <span>{data.phone}</span>}
                </div>
            </div>
            {data.summary && <div className="mb-6"><h3 className="font-bold uppercase border-b border-gray-300 mb-2">Profile</h3><p>{data.summary}</p></div>}
            {data.jobs.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-bold uppercase border-b border-gray-300 mb-4">Experience</h3>
                    {data.jobs.map((job, i) => (
                        <div key={i} className="mb-4">
                            <div className="flex justify-between items-baseline"><h4 className="font-bold text-lg">{job.role}</h4><span className="text-sm text-gray-500">{job.company}</span></div>
                            <p className="text-gray-700 mt-1">{job.description}</p>
                        </div>
                    ))}
                </div>
            )}
            {(data.schoolName || data.skills.length > 0) && (
                <div className="grid grid-cols-2 gap-8">
                    {data.schoolName && <div><h3 className="font-bold uppercase border-b border-gray-300 mb-2">Education</h3><p className="font-bold">{data.schoolName}</p><p className="text-sm">{data.gradYear}</p></div>}
                    {data.skills.length > 0 && <div><h3 className="font-bold uppercase border-b border-gray-300 mb-2">Skills</h3><ul className="grid grid-cols-2 gap-2">{data.skills.map(s => <li key={s} className="text-sm list-disc ml-4">{s}</li>)}</ul></div>}
                </div>
            )}
        </div>
        <style>{`@media print { body * { visibility: hidden; } #printable-resume, #printable-resume * { visibility: visible; } #printable-resume { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none; } }`}</style>
      </div>
    );
  }

  // --- WIZARD UI ---
  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ArrowLeft size={16}/> Back to Home</button>
      
      {/* Progress Bar */}
      <div className="mb-8">
        <div className={`h-2 rounded-full overflow-hidden ${isLowStim ? 'bg-slate-800' : 'bg-slate-800 border border-slate-700'}`}>
            <div className={`h-full transition-all duration-500 ${isLowStim ? 'bg-slate-400' : 'bg-gradient-to-r from-cyan-400 to-fuchsia-500'}`} style={{ width: `${((step + 1) / steps.length) * 100}%` }}></div>
        </div>
      </div>

      <div className={`rounded-2xl p-8 border backdrop-blur-xl ${isLowStim ? 'bg-slate-900 border-slate-700' : 'bg-slate-900/60 border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]'}`}>
        <h2 className={`text-3xl font-bold mb-1 ${isLowStim ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400'}`}>{steps[step].title}</h2>
        <p className={`mb-8 ${isLowStim ? 'text-slate-400' : 'text-cyan-200/80'}`}>{steps[step].subtitle}</p>
        
        <div className="min-h-[300px]">
            {steps[step].component()}
        </div>

        <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
            <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="px-6 py-2 text-slate-400 hover:text-white disabled:opacity-50">Back</button>
            {step < steps.length - 1 ? (
                <button onClick={() => setStep(s => s + 1)} className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 ${isLowStim ? 'bg-slate-200 text-black' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-[0_0_20px_rgba(34,211,238,0.4)]'}`}>Next <ArrowRight size={18}/></button>
            ) : (
                <button onClick={() => setShowPreview(true)} className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 ${isLowStim ? 'bg-white text-black' : 'bg-fuchsia-500 hover:bg-fuchsia-400 text-white shadow-[0_0_20px_rgba(232,121,249,0.4)]'}`}>Finish <Check size={18}/></button>
            )}
        </div>
      </div>
    </div>
  );
}

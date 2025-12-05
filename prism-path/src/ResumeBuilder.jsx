import React, { useState } from 'react';
import { 
  Sparkles, User, Briefcase, GraduationCap, Award, 
  ArrowRight, ArrowLeft, Check, Printer, RotateCcw, 
  Trash2, Wand, Loader2, X, BookOpen, Users, Calendar, MapPin 
} from 'lucide-react';

export default function ResumeBuilder({ onBack, isLowStim }) {
  const [step, setStep] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);

  // --- State Management (NO LOCAL STORAGE - SECURITY FIRST) ---
  const [data, setData] = useState({
    fullName: '', 
    title: '', 
    email: '', 
    phone: '', 
    location: '', 
    summary: '',
    education: [], 
    coursework: [], 
    skills: [], 
    jobs: [],
    references: [] 
  });

  // --- Temporary State for Inputs ---
  const [tempSkill, setTempSkill] = useState('');
  const [tempCourse, setTempCourse] = useState('');
  
  const [tempJob, setTempJob] = useState({ 
    company: '', role: '', location: '', startDate: '', endDate: '', description: '' 
  });

  const [tempEdu, setTempEdu] = useState({
    school: '', degree: '', year: '', location: ''
  });

  const [tempRef, setTempRef] = useState({
    name: '', title: '', contact: '', relation: ''
  });

  // --- Actions ---
  const handleChange = (field, value) => setData(prev => ({ ...prev, [field]: value }));
  
  const addItem = (field, item, resetFn) => {
    setData(prev => ({ ...prev, [field]: [...prev[field], item] }));
    resetFn();
  };

  const removeItem = (field, index) => {
    setData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  // --- AI INTEGRATION (CLEAN TEXT ONLY) ---
  const handleAIPolish = async (fieldToPolish) => {
    let textToImprove = "";
    if (fieldToPolish === 'job') textToImprove = tempJob.description;
    if (fieldToPolish === 'summary') textToImprove = data.summary;

    if (!textToImprove) return;

    setIsPolishing(true);

    try {
      const prompt = `
        Role: Expert Resume Writer.
        Task: Rewrite the following text to be professional, concise, and action-oriented.
        Constraint: RETURN PLAIN TEXT ONLY. Do NOT use markdown, bolding (**), or bullet points. Just clean paragraphs.
        Input: "${textToImprove}"
      `;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt })
      });

      const resData = await response.json();
      
      if (resData.result) {
        const cleanText = resData.result.replace(/\*\*/g, '').replace(/\*/g, '').trim();

        if (fieldToPolish === 'job') {
          setTempJob(prev => ({ ...prev, description: cleanText }));
        } else {
          handleChange('summary', cleanText);
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
      title: 'Contact Information',
      subtitle: "Let's start with who you are.",
      component: () => (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className={`block mb-2 text-sm font-bold ${isLowStim ? 'text-slate-300' : 'text-cyan-300'}`}>Full Name</label>
                <input type="text" value={data.fullName} onChange={(e) => handleChange('fullName', e.target.value)} placeholder="Alex Smith" className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-cyan-400 outline-none" />
            </div>
            <div>
                <label className={`block mb-2 text-sm font-bold ${isLowStim ? 'text-slate-300' : 'text-cyan-300'}`}>Target Job Title</label>
                <input type="text" value={data.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="e.g. Sales Associate" className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-cyan-400 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="email" value={data.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="Email Address" className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-cyan-400 outline-none" />
            <input type="tel" value={data.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Phone Number" className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-cyan-400 outline-none" />
            <input type="text" value={data.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="City, State" className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-cyan-400 outline-none" />
          </div>
        </div>
      )
    },
    {
      id: 'summary',
      title: 'Professional Profile',
      subtitle: "A short pitch about your goals and strengths.",
      component: () => (
        <div className="space-y-2">
          <textarea value={data.summary} onChange={(e) => handleChange('summary', e.target.value)} placeholder="e.g. Dedicated student with strong communication skills looking for..." className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white h-32 focus:border-fuchsia-400 outline-none" />
          <div className="flex justify-end">
            <button onClick={() => handleAIPolish('summary')} disabled={isPolishing} className={`flex items-center gap-2 text-xs px-4 py-2 rounded-full border transition-all ${isPolishing ? 'opacity-50' : 'hover:scale-105'} ${isLowStim ? 'bg-slate-700 text-white border-slate-500' : 'bg-indigo-600 text-white border-indigo-400'}`}>
                {isPolishing ? <Loader2 size={14} className="animate-spin"/> : <Wand size={14}/>} 
                {isPolishing ? "Writing..." : "Make it Professional (AI)"}
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'education',
      title: 'Education',
      subtitle: "Add High School, College, or Certifications.",
      component: () => (
        <div className="space-y-6">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-3">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" placeholder="School / University Name" value={tempEdu.school} onChange={(e) => setTempEdu({...tempEdu, school: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white" />
                <input type="text" placeholder="Degree / Diploma (e.g. BS Biology)" value={tempEdu.degree} onChange={(e) => setTempEdu({...tempEdu, degree: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white" />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" placeholder="Location (City, State)" value={tempEdu.location} onChange={(e) => setTempEdu({...tempEdu, location: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white" />
                <input type="text" placeholder="Graduation Year (e.g. 2024)" value={tempEdu.year} onChange={(e) => setTempEdu({...tempEdu, year: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white" />
             </div>
             <button 
                onClick={() => {
                    if(tempEdu.school) addItem('education', tempEdu, () => setTempEdu({school:'', degree:'', year:'', location:''}))
                }} 
                className={`w-full py-2 rounded-lg font-bold ${isLowStim ? 'bg-slate-600 text-white' : 'bg-yellow-600 hover:bg-yellow-500 text-white'}`}
             >
                + Add School
             </button>
          </div>

          <div className="space-y-2">
            {data.education.map((edu, idx) => (
              <div key={idx} className="p-3 bg-slate-800 rounded flex justify-between items-center border-l-4 border-yellow-500">
                <div>
                    <h4 className="font-bold text-white">{edu.school}</h4>
                    <p className="text-sm text-slate-400">{edu.degree} • {edu.year}</p>
                </div>
                <button onClick={() => removeItem('education', idx)}><X size={16} className="text-red-400 hover:text-red-300"/></button>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'coursework',
      title: 'Relevant Coursework and Certificates', // UPDATED TITLE
      subtitle: "List specific classes or certificates that apply to the job.", // UPDATED SUBTITLE
      component: () => (
        <div className="space-y-6">
           <div className="flex gap-2">
                <input type="text" value={tempCourse} onChange={(e) => setTempCourse(e.target.value)} onKeyDown={(e) => e.key==='Enter' && addItem('coursework', tempCourse, () => setTempCourse(''))} placeholder="e.g. Intro to Psychology, CPR Certified..." className="flex-1 bg-slate-800 border border-slate-600 rounded p-3 text-white" />
                <button onClick={() => addItem('coursework', tempCourse, () => setTempCourse(''))} className="bg-slate-600 px-4 rounded text-white font-bold">+</button>
           </div>
           <div className="flex flex-wrap gap-2">
                {data.coursework.map((course, i) => (
                    <span key={i} className="bg-slate-700 text-white px-3 py-1 rounded-full flex items-center gap-2 border border-slate-600">
                        <BookOpen size={14} className="text-yellow-400"/> {course} 
                        <button onClick={() => removeItem('coursework', i)}><X size={12}/></button>
                    </span>
                ))}
           </div>
        </div>
      )
    },
    {
      id: 'experience',
      title: 'Work Experience',
      subtitle: "Jobs, internships, or volunteer work.",
      component: () => (
        <div className="space-y-6">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" placeholder="Company / Organization" value={tempJob.company} onChange={(e) => setTempJob({...tempJob, company: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white" />
                <input type="text" placeholder="Job Title" value={tempJob.role} onChange={(e) => setTempJob({...tempJob, role: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" placeholder="Location" value={tempJob.location} onChange={(e) => setTempJob({...tempJob, location: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white" />
                <div className="flex gap-2">
                    <input type="text" placeholder="Start Date" value={tempJob.startDate} onChange={(e) => setTempJob({...tempJob, startDate: e.target.value})} className="w-1/2 bg-slate-900 border border-slate-600 rounded p-3 text-white" />
                    <input type="text" placeholder="End Date" value={tempJob.endDate} onChange={(e) => setTempJob({...tempJob, endDate: e.target.value})} className="w-1/2 bg-slate-900 border border-slate-600 rounded p-3 text-white" />
                </div>
            </div>
            <div className="relative">
              <textarea placeholder="Job Responsibilities (e.g. Handled cash register, helped customers)" value={tempJob.description} onChange={(e) => setTempJob({...tempJob, description: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white h-32" />
              <button onClick={() => handleAIPolish('job')} disabled={isPolishing} className={`absolute bottom-3 right-3 text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-lg border transition-all ${isLowStim ? 'bg-slate-700 text-white border-slate-500' : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white border-fuchsia-400'}`}>
                 {isPolishing ? <Loader2 size={12} className="animate-spin"/> : <Wand size={12}/>} Polish with AI
              </button>
            </div>
            <button 
                onClick={() => {
                    if(tempJob.company) addItem('jobs', tempJob, () => setTempJob({company:'', role:'', location:'', startDate:'', endDate:'', description:''}))
                }}
                className={`w-full py-2 rounded-lg font-bold ${isLowStim ? 'bg-slate-600 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}
            >
                + Add This Job
            </button>
          </div>
          
          <div className="space-y-2">
            {data.jobs.map((job, idx) => (
              <div key={idx} className="p-3 bg-slate-800 rounded flex justify-between items-center border-l-4 border-fuchsia-500">
                <div>
                    <h4 className="font-bold text-white">{job.role}</h4>
                    <p className="text-sm text-slate-400">{job.company} • {job.startDate} - {job.endDate}</p>
                </div>
                <button onClick={() => removeItem('jobs', idx)}><X size={16} className="text-red-400 hover:text-red-300"/></button>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
        id: 'skills',
        title: 'Skills',
        subtitle: "Technical and soft skills.",
        component: () => (
          <div className="space-y-6">
             <div className="flex gap-2 mb-2">
                  <input type="text" value={tempSkill} onChange={(e) => setTempSkill(e.target.value)} onKeyDown={(e) => e.key==='Enter' && addItem('skills', tempSkill, () => setTempSkill(''))} placeholder="e.g. Python, Teamwork, Microsoft Office" className="flex-1 bg-slate-800 border border-slate-600 rounded p-3 text-white" />
                  <button onClick={() => addItem('skills', tempSkill, () => setTempSkill(''))} className="bg-slate-600 px-4 rounded text-white font-bold">+</button>
             </div>
             <div className="flex flex-wrap gap-2">
                  {data.skills.map((s, i) => (
                      <span key={i} className={`text-sm px-3 py-1 rounded-full flex items-center gap-2 ${isLowStim ? 'bg-slate-700 text-white' : 'bg-slate-800 text-cyan-300 border border-cyan-900'}`}>
                          {s} <button onClick={() => removeItem('skills', i)}><X size={12}/></button>
                      </span>
                  ))}
             </div>
          </div>
        )
    },
    {
      id: 'references',
      title: 'References',
      subtitle: "People who can vouch for you.",
      component: () => (
        <div className="space-y-6">
           <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-3">
                <input type="text" placeholder="Reference Name" value={tempRef.name} onChange={(e) => setTempRef({...tempRef, name: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white" />
                <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Title/Relation" value={tempRef.relation} onChange={(e) => setTempRef({...tempRef, relation: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white" />
                    <input type="text" placeholder="Phone/Email" value={tempRef.contact} onChange={(e) => setTempRef({...tempRef, contact: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white" />
                </div>
                <button 
                    onClick={() => {
                        if(tempRef.name) addItem('references', tempRef, () => setTempRef({name:'', title:'', contact:'', relation:''}))
                    }} 
                    className="w-full bg-slate-600 hover:bg-slate-500 text-white py-2 rounded-lg font-bold"
                >
                    + Add Reference
                </button>
           </div>
           <div className="space-y-2">
                {data.references.map((ref, idx) => (
                    <div key={idx} className="p-3 bg-slate-800 rounded flex justify-between items-center border-l-4 border-slate-500">
                        <div>
                            <h4 className="font-bold text-white">{ref.name}</h4>
                            <p className="text-sm text-slate-400">{ref.relation} • {ref.contact}</p>
                        </div>
                        <button onClick={() => removeItem('references', idx)}><X size={16} className="text-red-400 hover:text-red-300"/></button>
                    </div>
                ))}
           </div>
        </div>
      )
    }
  ];

  // --- PRINT PREVIEW ---
  if (showPreview) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl flex justify-between mb-6">
            <button onClick={() => setShowPreview(false)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ArrowLeft /> Keep Editing</button>
            <button onClick={() => window.print()} className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg ${isLowStim ? 'bg-slate-200 text-black' : 'bg-green-500 hover:bg-green-600 text-white'}`}><Printer size={20}/> Print / Save PDF</button>
        </div>
        
        {/* RESUME PAPER (A4 Size) */}
        <div id="printable-resume" className="bg-white text-black w-full max-w-[210mm] min-h-[297mm] p-10 md:p-14 shadow-2xl">
            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-6 mb-6">
                <h1 className="text-4xl font-bold uppercase tracking-wider text-gray-900">{data.fullName}</h1>
                <p className="text-xl text-gray-700 mt-1">{data.title}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3 font-medium">
                    {data.location && <span className="flex items-center gap-1"><MapPin size={14}/> {data.location}</span>}
                    {data.email && <span>{data.email}</span>}
                    {data.phone && <span>{data.phone}</span>}
                </div>
            </div>

            {/* Professional Summary */}
            {data.summary && <div className="mb-6"><h3 className="font-bold uppercase text-indigo-900 border-b border-gray-300 mb-2 text-sm tracking-widest">Professional Summary</h3><p className="text-gray-800 leading-relaxed">{data.summary}</p></div>}

            {/* Experience */}
            {data.jobs.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-bold uppercase text-indigo-900 border-b border-gray-300 mb-4 text-sm tracking-widest">Experience</h3>
                    {data.jobs.map((job, i) => (
                        <div key={i} className="mb-5">
                            <div className="flex justify-between items-baseline">
                                <h4 className="font-bold text-lg text-gray-900">{job.role}</h4>
                                <span className="text-sm text-gray-600 font-medium whitespace-nowrap">{job.startDate} – {job.endDate}</span>
                            </div>
                            <p className="text-gray-700 italic text-sm mb-1">{job.company} | {job.location}</p>
                            <p className="text-gray-800 mt-1 whitespace-pre-wrap">{job.description}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Education */}
            {data.education.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-bold uppercase text-indigo-900 border-b border-gray-300 mb-4 text-sm tracking-widest">Education</h3>
                    {data.education.map((edu, i) => (
                        <div key={i} className="mb-3 flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-gray-900">{edu.school}</h4>
                                <p className="text-gray-700">{edu.degree}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-sm text-gray-600 block">{edu.year}</span>
                                <span className="text-xs text-gray-500 block">{edu.location}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Coursework */}
            {data.coursework.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-bold uppercase text-indigo-900 border-b border-gray-300 mb-2 text-sm tracking-widest">Relevant Coursework and Certificates</h3>
                    <p className="text-gray-800">{data.coursework.join(', ')}</p>
                </div>
            )}

            {/* Skills */}
            {data.skills.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-bold uppercase text-indigo-900 border-b border-gray-300 mb-2 text-sm tracking-widest">Skills</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {data.skills.map((s, i) => <span key={i} className="text-gray-800 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span> {s}</span>)}
                    </div>
                </div>
            )}

            {/* References */}
            {data.references.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-bold uppercase text-indigo-900 border-b border-gray-300 mb-4 text-sm tracking-widest">References</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {data.references.map((ref, i) => (
                            <div key={i}>
                                <p className="font-bold text-gray-900">{ref.name}</p>
                                <p className="text-sm text-gray-700">{ref.relation}</p>
                                <p className="text-sm text-gray-600">{ref.contact}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
        <style>{`@media print { body * { visibility: hidden; } #printable-resume, #printable-resume * { visibility: visible; } #printable-resume { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none; } }`}</style>
      </div>
    );
  }

  // --- WIZARD UI ---
  return (
    <div className="w-full max-w-3xl mx-auto py-12 px-4 pb-24">
      <div className="mb-8 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"><ArrowLeft size={16}/> Exit Builder</button>
        <div className="text-xs text-slate-500 font-mono">SECURE MODE: DATA NOT SAVED</div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-8">
        <div className={`h-2 rounded-full overflow-hidden ${isLowStim ? 'bg-slate-800' : 'bg-slate-800 border border-slate-700'}`}>
            <div className={`h-full transition-all duration-500 ${isLowStim ? 'bg-slate-400' : 'bg-gradient-to-r from-cyan-400 to-fuchsia-500'}`} style={{ width: `${((step + 1) / steps.length) * 100}%` }}></div>
        </div>
        <div className="text-right text-xs text-slate-500 mt-2">Step {step + 1} of {steps.length}: {steps[step].title}</div>
      </div>

      <div className={`rounded-2xl p-6 md:p-10 border backdrop-blur-xl transition-colors ${isLowStim ? 'bg-slate-900 border-slate-700' : 'bg-slate-900/60 border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]'}`}>
        <h2 className={`text-3xl font-bold mb-1 ${isLowStim ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400'}`}>{steps[step].title}</h2>
        <p className={`mb-8 ${isLowStim ? 'text-slate-400' : 'text-cyan-200/80'}`}>{steps[step].subtitle}</p>
        
        <div className="min-h-[300px]">
            {steps[step].component()}
        </div>

        <div className="flex justify-between mt-12 pt-6 border-t border-white/5">
            <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="px-6 py-2 text-slate-400 hover:text-white disabled:opacity-50 transition-colors">Back</button>
            {step < steps.length - 1 ? (
                <button onClick={() => setStep(s => s + 1)} className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 ${isLowStim ? 'bg-slate-200 text-black' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-[0_0_20px_rgba(34,211,238,0.4)]'}`}>Next <ArrowRight size={18}/></button>
            ) : (
                <button onClick={() => setShowPreview(true)} className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-105 ${isLowStim ? 'bg-white text-black' : 'bg-fuchsia-500 hover:bg-fuchsia-400 text-white shadow-[0_0_20px_rgba(232,121,249,0.4)]'}`}>Review & Print <Check size={18}/></button>
            )}
        </div>
      </div>
    </div>
  );
}

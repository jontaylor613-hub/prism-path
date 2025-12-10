import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Sparkles } from 'lucide-react';

// Mission data
const missions = [
  {
    id: 1,
    title: 'The Glitched Signal',
    scenario: 'Incoming transmission from Sector 7. The signal is weak and corrupted by solar flares. We need to identify the sender and their coordinates. How do you want to process the signal?',
    choices: [
      {
        text: 'Isolate the Audio Frequency',
        description: 'Listen to the loop repeatedly to catch details.',
        outcome: {
          report: 'Mission Report: You blocked out distractions and focused intensely on minute details.',
          skills: 'Deep Focus & Accuracy, Quality Assurance, Auditory Analysis'
        }
      },
      {
        text: 'Analyze the Waveform Visuals',
        description: 'Look at the data patterns visually.',
        outcome: {
          report: 'Mission Report: You translated raw noise into visual data to find the hidden structure.',
          skills: 'Data Visualization, Pattern Recognition, Non-Verbal Communication'
        }
      },
      {
        text: 'Cross-Reference the Metadata',
        description: 'Check timestamps and logs instead of the signal.',
        outcome: {
          report: 'Mission Report: You worked smarter, not harder, using existing records to solve the problem.',
          skills: 'Information Synthesis, Resource Management, Strategic Assessment'
        }
      }
    ]
  },
  {
    id: 2,
    title: 'The Supply Room Sort',
    scenario: 'The Supply Room is a disaster. A cargo ship dumped a mixed shipment: Radioactive batteries (leaking), Rare herbs (fragile), and Heavy engine gears. The Commander is busy. How do you tackle the mess?',
    choices: [
      {
        text: 'Sort by Category & Safety',
        description: 'Isolate the danger first.',
        outcome: {
          report: 'Mission Report: You prioritized safety and logic, isolating hazards immediately.',
          skills: 'Risk Assessment & Mitigation, Inventory Management, Compliance Adherence'
        }
      },
      {
        text: 'Sort by Visuals',
        description: 'Arrange by color, shape, and size.',
        outcome: {
          report: 'Mission Report: You created a perfect visual system where errors are instantly visible.',
          skills: 'Standardization & Quality Control, Visual Organization, Detail-Oriented'
        }
      },
      {
        text: 'Sort by Urgency',
        description: 'Process only the critical items, leave the rest.',
        outcome: {
          report: 'Mission Report: You performed triage, focusing only on high-value tasks.',
          skills: 'Operational Triage, Resource Optimization, Agile Problem Solving'
        }
      }
    ]
  },
  {
    id: 3,
    title: 'The Procedure Paradox',
    scenario: 'The Air Filtration Unit is broken. The repair manual is 500 pages long and outdated. However, you see a small, unmarked panel on the back that connects to the power source. How do you proceed?',
    choices: [
      {
        text: 'Follow the Manual Exactly',
        description: 'Step-by-step execution.',
        outcome: {
          report: 'Mission Report: You executed complex instructions with zero errors.',
          skills: 'Regulatory Compliance, Procedural Discipline, Reliability'
        }
      },
      {
        text: 'Bypass the Manual',
        description: 'Find a shortcut/hot-wire it.',
        outcome: {
          report: 'Mission Report: You identified inefficiencies and found a faster solution.',
          skills: 'Process Optimization, Creative Problem Solving, Systems Analysis'
        }
      },
      {
        text: 'Rewrite the Guide',
        description: 'Fix the machine, then write a better guide.',
        outcome: {
          report: 'Mission Report: You translated complex tech into human-readable instructions.',
          skills: 'Technical Documentation, Knowledge Management, Training & Mentorship'
        }
      }
    ]
  }
];

export default function ArchiveOfPotentials({ onBack, isDark, onSkillsDiscovered }) {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('home'); // 'home', 'hub', 'mission', 'outcome'
  const [selectedMission, setSelectedMission] = useState(null);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [copied, setCopied] = useState(false);
  const [discoveredSkills, setDiscoveredSkills] = useState([]);

  const handleStart = () => {
    setCurrentView('hub');
  };

  const handleSelectMission = (mission) => {
    setSelectedMission(mission);
    setCurrentView('mission');
  };

  const handleSelectChoice = (choice) => {
    setSelectedChoice(choice);
    setCurrentView('outcome');
    // Add discovered skills to the list
    if (choice.outcome?.skills) {
      const skills = choice.outcome.skills.split(',').map(s => s.trim());
      setDiscoveredSkills(prev => {
        const newSkills = [...prev];
        skills.forEach(skill => {
          if (!newSkills.includes(skill)) {
            newSkills.push(skill);
          }
        });
        return newSkills;
      });
    }
  };

  const handleCopySkills = () => {
    if (selectedChoice?.outcome?.skills) {
      navigator.clipboard.writeText(selectedChoice.outcome.skills);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddToResume = () => {
    if (discoveredSkills.length > 0) {
      // If callback provided (modal mode), use it
      if (onSkillsDiscovered) {
        onSkillsDiscovered(discoveredSkills);
      } else {
        // Otherwise navigate (standalone mode)
        navigate('/resume', { 
          state: { 
            skills: discoveredSkills 
          } 
        });
      }
    }
  };

  const handleNextMission = () => {
    const currentIndex = missions.findIndex(m => m.id === selectedMission.id);
    if (currentIndex < missions.length - 1) {
      setSelectedMission(missions[currentIndex + 1]);
      setSelectedChoice(null);
      setCurrentView('mission');
    } else {
      // All missions complete, return to hub
      setSelectedMission(null);
      setSelectedChoice(null);
      setCurrentView('hub');
    }
  };

  // Home View
  if (currentView === 'home') {
    return (
      <div className={`${onSkillsDiscovered ? 'bg-[#1f1f1f] rounded-2xl' : 'min-h-screen bg-[#1f1f1f]'} text-[#f0f0f0] flex items-center justify-center p-4`}>
        <div className="max-w-2xl w-full">
          <button 
            onClick={onBack || (() => navigate('/resume'))} 
            className="mb-6 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft size={20} /> Back
          </button>
          
          <div className="bg-[#2a2a2a] border border-cyan-500/30 rounded-2xl p-8 md:p-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-cyan-400">The Archive of Potentials</h1>
            <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-amber-400">Interdimensional Repair Shop</h2>
            
            <div className="text-lg leading-relaxed mb-10 text-left space-y-4">
              <p>Welcome. We have been waiting for someone with your specific frequency.</p>
              <p>This is not a test. There are no grades. There is no 'fail' state.</p>
              <p>Standard career advice asks you to 'sell yourself.' We know that can feel fake or exhausting. Instead, we want to watch what you <em className="text-cyan-300">do</em>.</p>
              <p>Select a mission. Make a choice. Discover your strengths.</p>
            </div>
            
            <button
              onClick={handleStart}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-amber-500 text-white rounded-lg font-bold text-lg hover:from-cyan-400 hover:to-amber-400 transition-all shadow-lg hover:shadow-cyan-500/50"
            >
              Enter the Archive
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mission Hub View
  if (currentView === 'hub') {
    return (
      <div className={`${onSkillsDiscovered ? 'bg-[#1f1f1f] rounded-2xl max-h-[90vh] overflow-y-auto' : 'min-h-screen bg-[#1f1f1f]'} text-[#f0f0f0] p-4 md:p-8`}>
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => setCurrentView('home')} 
            className="mb-6 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft size={20} /> Back
          </button>
          
          <h2 className="text-3xl font-bold mb-8 text-center text-cyan-400">Mission Hub</h2>
          
          <div className="grid gap-6 md:grid-cols-3">
            {missions.map((mission) => (
              <button
                key={mission.id}
                onClick={() => handleSelectMission(mission)}
                className="bg-[#2a2a2a] border border-cyan-500/30 rounded-xl p-6 hover:border-cyan-500 hover:bg-[#333] transition-all text-left"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="text-amber-400" size={20} />
                  <h3 className="text-xl font-bold text-cyan-300">Mission {mission.id}</h3>
                </div>
                <p className="text-sm text-[#f0f0f0]/80">{mission.title}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Mission View
  if (currentView === 'mission' && selectedMission) {
    return (
      <div className={`${onSkillsDiscovered ? 'bg-[#1f1f1f] rounded-2xl max-h-[90vh] overflow-y-auto' : 'min-h-screen bg-[#1f1f1f]'} text-[#f0f0f0] p-4 md:p-8`}>
        <div className="max-w-3xl mx-auto">
          <button 
            onClick={() => setCurrentView('hub')} 
            className="mb-6 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft size={20} /> Back to Hub
          </button>
          
          <div className="bg-[#2a2a2a] border border-cyan-500/30 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-cyan-400">{selectedMission.title}</h2>
            <p className="text-lg mb-8 leading-relaxed">{selectedMission.scenario}</p>
            
            <div className="space-y-4">
              {selectedMission.choices.map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectChoice(choice)}
                  className="w-full bg-[#333] border border-cyan-500/20 rounded-lg p-6 hover:border-cyan-500 hover:bg-[#3a3a3a] transition-all text-left"
                >
                  <h3 className="text-xl font-bold text-cyan-300 mb-2">{choice.text}</h3>
                  <p className="text-sm text-[#f0f0f0]/70">{choice.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Outcome View
  if (currentView === 'outcome' && selectedChoice) {
    return (
      <div className={`${onSkillsDiscovered ? 'bg-[#1f1f1f] rounded-2xl max-h-[90vh] overflow-y-auto' : 'min-h-screen bg-[#1f1f1f]'} text-[#f0f0f0] p-4 md:p-8`}>
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#2a2a2a] border border-cyan-500/30 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-cyan-400">Mission Complete</h2>
            
            <div className="mb-8">
              <p className="text-lg leading-relaxed mb-6">{selectedChoice.outcome.report}</p>
              
              <div className="bg-[#1f1f1f] border border-amber-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-amber-400">Personnel File</h3>
                  <button
                    onClick={handleCopySkills}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-300 transition-all"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? 'Copied!' : 'Copy Skills'}
                  </button>
                </div>
                <p className="text-lg font-semibold text-[#f0f0f0]">RESUME SKILLS:</p>
                <p className="text-base text-amber-300 mt-2">{selectedChoice.outcome.skills}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {discoveredSkills.length > 0 && (
                <div className="bg-cyan-900/20 border border-cyan-500/50 rounded-xl p-4">
                  <p className="text-sm text-cyan-300 mb-2 font-semibold">All Discovered Skills:</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {discoveredSkills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/50 rounded-full text-xs text-cyan-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                  {discoveredSkills.length > 0 && (
                    <button
                      onClick={handleAddToResume}
                      className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-amber-500 text-white rounded-lg font-bold hover:from-cyan-400 hover:to-amber-400 transition-all"
                    >
                      Add All Skills to Resume
                    </button>
                  )}
                </div>
              )}
              
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setCurrentView('hub');
                    setSelectedMission(null);
                    setSelectedChoice(null);
                  }}
                  className="flex-1 px-6 py-3 bg-[#333] border border-cyan-500/30 rounded-lg hover:bg-[#3a3a3a] transition-all"
                >
                  Mission Hub
                </button>
                {selectedMission && missions.findIndex(m => m.id === selectedMission.id) < missions.length - 1 && (
                  <button
                    onClick={handleNextMission}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-amber-500 text-white rounded-lg font-bold hover:from-cyan-400 hover:to-amber-400 transition-all"
                  >
                    Next Mission
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}


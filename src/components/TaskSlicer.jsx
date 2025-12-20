import React, { useState } from 'react';
import { Zap, Clock, CheckCircle, Trash2, Plus, Save, Download, ChevronDown } from 'lucide-react';
import { GeminiService, getTheme } from '../utils';

export default function TaskSlicer({ isDark, onTaskComplete }) {
  const theme = getTheme(isDark);
  const [task, setTask] = useState('');
  const [steps, setSteps] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showLoadDropdown, setShowLoadDropdown] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [highlightedStep, setHighlightedStep] = useState(null);

  // Load saved templates from localStorage
  React.useEffect(() => {
    try {
      const templates = JSON.parse(localStorage.getItem('parent_task_templates') || '[]');
      setSavedTemplates(templates);
    } catch (e) {
      console.error('Failed to load templates:', e);
    }
  }, []);

  const handleSlice = async () => {
    if (!task.trim()) return;
    setIsProcessing(true);
    try {
      const result = await GeminiService.generate({ task }, 'slicer');
      const lines = result.split('\n').filter(line => line.match(/^(\d+\.|-|\*)/));
      const cleanSteps = lines.map(line => ({ 
        text: line.replace(/^(\d+\.|-|\*)\s*/, ''), 
        done: false 
      }));
      setSteps(cleanSteps.length > 0 ? cleanSteps : [{ text: "Could not parse steps. Try simpler task.", done: false }]);
    } catch (error) {
      setSteps([{ text: "Connection error. Please try again.", done: false }]);
    }
    setIsProcessing(false);
  };

  const toggleStep = (index) => {
    const newSteps = [...steps];
    newSteps[index].done = !newSteps[index].done;
    setSteps(newSteps);
    
    // Check if all steps are complete
    if (newSteps.every(s => s.done) && onTaskComplete) {
      onTaskComplete();
    }
  };

  const handleSaveTemplate = () => {
    if (!task.trim() || steps.length === 0) {
      alert('Please create a task with steps before saving.');
      return;
    }
    setShowSaveModal(true);
  };

  const confirmSaveTemplate = () => {
    if (!templateName.trim()) {
      alert('Please enter a name for this template.');
      return;
    }

    try {
      const templates = JSON.parse(localStorage.getItem('parent_task_templates') || '[]');
      const newTemplate = {
        id: Date.now().toString(),
        name: templateName.trim(),
        task: task,
        steps: steps.map(s => ({ text: s.text, done: false })),
        createdAt: new Date().toISOString()
      };
      
      templates.push(newTemplate);
      localStorage.setItem('parent_task_templates', JSON.stringify(templates));
      setSavedTemplates(templates);
      setShowSaveModal(false);
      setTemplateName('');
    } catch (e) {
      alert('Failed to save template: ' + e.message);
    }
  };

  const loadTemplate = (template) => {
    setTask(template.task);
    setSteps(template.steps.map(s => ({ ...s, done: false })));
    setShowLoadDropdown(false);
  };

  const deleteTemplate = (templateId, e) => {
    e.stopPropagation();
    if (confirm('Delete this saved template?')) {
      try {
        const templates = savedTemplates.filter(t => t.id !== templateId);
        localStorage.setItem('parent_task_templates', JSON.stringify(templates));
        setSavedTemplates(templates);
      } catch (e) {
        alert('Failed to delete template: ' + e.message);
      }
    }
  };

  const pickFirstStep = () => {
    const firstIncomplete = steps.findIndex(s => !s.done);
    if (firstIncomplete !== -1) {
      setHighlightedStep(firstIncomplete);
      setTimeout(() => setHighlightedStep(null), 3000);
    }
  };

  const completedTasks = steps.filter(s => s.done).length;
  const taskProgress = steps.length > 0 ? (completedTasks / steps.length) * 100 : 0;

  return (
    <div className={`${theme.cardBg} border ${theme.cardBorder} rounded-2xl p-6`}>
      <h2 className={`text-2xl font-bold ${theme.text} mb-4 flex items-center gap-2`}>
        <Zap className="text-cyan-400" size={24} />
        Task Slicer
      </h2>
      <p className={`${theme.textMuted} mb-6`}>
        Break down chores, homework, or any task into manageable steps.
      </p>

      {/* Task Progress Bar */}
      {steps.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2 px-1">
            <span className={theme.textMuted}>Progress</span>
            <span className="text-cyan-500">{Math.round(taskProgress)}%</span>
          </div>
          <div className={`w-full h-3 ${theme.inputBg} rounded-full overflow-hidden border ${theme.inputBorder}`}>
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700 ease-out" 
              style={{ width: `${taskProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Load/Save Templates */}
      <div className="flex gap-2 mb-4">
        {savedTemplates.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowLoadDropdown(!showLoadDropdown)}
              className={`px-4 py-2 ${theme.inputBg} border ${theme.inputBorder} rounded-xl font-bold ${theme.text} hover:border-cyan-400 transition-all flex items-center gap-2 text-sm`}
            >
              <Download size={18} />
              Load Template
              <ChevronDown size={16} className={`transition-transform ${showLoadDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showLoadDropdown && (
              <>
                <div className={`absolute top-full left-0 mt-2 w-64 ${theme.cardBg} border ${theme.cardBorder} rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto`}>
                  {savedTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => loadTemplate(template)}
                      className={`p-3 hover:bg-slate-500/10 cursor-pointer border-b ${theme.cardBorder} last:border-b-0 flex items-center justify-between group`}
                    >
                      <div className="flex-1">
                        <div className={`font-bold ${theme.text} text-sm`}>{template.name}</div>
                        <div className={`text-xs ${theme.textMuted} mt-1`}>{template.task}</div>
                      </div>
                      <button
                        onClick={(e) => deleteTemplate(template.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 p-1 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowLoadDropdown(false)}
                />
              </>
            )}
          </div>
        )}
        
        {steps.length > 0 && (
          <button
            onClick={handleSaveTemplate}
            className={`px-4 py-2 ${theme.inputBg} border ${theme.inputBorder} rounded-xl font-bold ${theme.text} hover:border-cyan-400 transition-all flex items-center gap-2 text-sm`}
          >
            <Save size={18} />
            Save Template
          </button>
        )}
      </div>

      {/* Task Input */}
      <div className="relative mb-6">
        <input 
          type="text" 
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="What task needs to be broken down? (e.g., Clean bedroom, Finish math homework)"
          className={`w-full p-4 pr-32 rounded-xl border-2 ${theme.inputBorder} ${theme.inputBg} ${theme.text} focus:border-cyan-500 outline-none shadow-sm text-base transition-colors placeholder:text-slate-400`}
          onKeyDown={(e) => e.key === 'Enter' && handleSlice()}
        />
        <button 
          onClick={handleSlice}
          disabled={isProcessing || !task.trim()}
          className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 rounded-lg font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
        >
          {isProcessing ? <Clock className="animate-spin" size={16}/> : <Zap fill="white" size={16} />}
          Slice
        </button>
      </div>

      {/* Steps List */}
      {steps.length > 0 && (
        <div className="space-y-2 mb-4">
          {steps.length > 0 && !steps.every(s => s.done) && (
            <div className="flex justify-end mb-2">
              <button 
                onClick={pickFirstStep} 
                className={`text-xs font-bold flex items-center gap-1 px-3 py-1 rounded-full ${
                  isDark 
                    ? 'text-yellow-500 hover:text-yellow-400 bg-yellow-500/10' 
                    : 'text-amber-700 hover:text-amber-800 bg-amber-100 border border-amber-300'
                }`}
              >
                Where to start?
              </button>
            </div>
          )}

          {steps.map((step, index) => (
            <div 
              key={index}
              onClick={() => toggleStep(index)}
              className={`group flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                step.done 
                  ? `${theme.inputBg} border-emerald-500/20 opacity-60` 
                  : highlightedStep === index 
                      ? isDark
                          ? 'bg-yellow-500/10 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)] scale-[1.02]'
                          : 'bg-amber-100 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-[1.02]'
                      : `${theme.cardBg} ${theme.cardBorder} hover:border-cyan-400 shadow-sm hover:shadow-md`
              }`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 transition-colors shrink-0 ${
                step.done ? 'bg-emerald-500 border-emerald-500' : `border-slate-300 group-hover:border-cyan-400`
              }`}>
                {step.done && <CheckCircle size={14} className="text-white" />}
              </div>
              <span className={`text-base font-medium transition-all ${step.done ? 'line-through text-slate-500' : theme.text}`}>
                {step.text}
              </span>
            </div>
          ))}

          <button 
            onClick={() => {setSteps([]); setTask('');}} 
            className={`mt-4 w-full py-2 ${theme.inputBg} border ${theme.inputBorder} ${theme.textMuted} hover:text-red-400 hover:border-red-400 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors`}
          >
            <Trash2 size={16} /> Clear List
          </button>
        </div>
      )}

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className={`${theme.cardBg} border ${theme.cardBorder} p-8 rounded-3xl shadow-2xl max-w-md w-full`}>
            <h3 className={`text-2xl font-bold ${theme.text} mb-4`}>Save Template</h3>
            <p className={`${theme.textMuted} mb-4`}>Give this task template a name so you can use it again later.</p>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Morning Chores, Homework Routine"
              className={`w-full p-4 rounded-xl border-2 ${theme.inputBorder} ${theme.inputBg} ${theme.text} focus:border-cyan-500 outline-none mb-6`}
              onKeyDown={(e) => e.key === 'Enter' && confirmSaveTemplate()}
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowSaveModal(false); setTemplateName(''); }}
                className={`flex-1 py-3 ${theme.inputBg} border ${theme.inputBorder} rounded-xl font-bold ${theme.text} hover:border-red-400 transition-all`}
              >
                Cancel
              </button>
              <button
                onClick={confirmSaveTemplate}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


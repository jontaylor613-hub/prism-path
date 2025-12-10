import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Clock, Plus, Trash2, Download, Mic, 
  MicOff, ArrowLeft, Layout, Printer
} from 'lucide-react';
import { getTheme } from './utils';
import { generatePDF } from './utils/pdfExporter';

const BLOCK_COLORS = [
    'bg-red-200 text-red-900 border-red-300',
    'bg-orange-200 text-orange-900 border-orange-300',
    'bg-amber-200 text-amber-900 border-amber-300',
    'bg-emerald-200 text-emerald-900 border-emerald-300',
    'bg-cyan-200 text-cyan-900 border-cyan-300',
    'bg-blue-200 text-blue-900 border-blue-300',
    'bg-indigo-200 text-indigo-900 border-indigo-300',
    'bg-fuchsia-200 text-fuchsia-900 border-fuchsia-300',
];

const VisualSchedule = ({ onBack, isDark }) => {
  const theme = getTheme(isDark);
  
  const [items, setItems] = useState([
      { id: 1, time: '08:00', task: 'Wake Up & Breakfast', color: 0 },
      { id: 2, time: '09:00', task: 'Math Class', color: 5 },
  ]);
  const [newTask, setNewTask] = useState('');
  const [newTime, setNewTime] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef(null);

  useEffect(() => {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = false;
          
          recognitionRef.current.onresult = (event) => {
              const transcript = event.results[0][0].transcript;
              setNewTask(transcript);
              setIsListening(false);
          };
          recognitionRef.current.onerror = () => setIsListening(false);
          recognitionRef.current.onend = () => setIsListening(false);
      }
  }, []);

  const toggleMic = () => {
      if (!recognitionRef.current) {
          alert("Voice input not supported in this browser.");
          return;
      }
      if (isListening) {
          recognitionRef.current.stop();
          setIsListening(false);
      } else {
          recognitionRef.current.start();
          setIsListening(true);
      }
  };

  const addItem = () => {
      if (!newTask || !newTime) return;
      const newItem = {
          id: Date.now(),
          time: newTime,
          task: newTask,
          color: Math.floor(Math.random() * BLOCK_COLORS.length)
      };
      const updated = [...items, newItem].sort((a, b) => a.time.localeCompare(b.time));
      setItems(updated);
      setNewTask('');
      setNewTime('');
  };

  const deleteItem = (id) => {
      setItems(items.filter(i => i.id !== id));
  };

  const handlePrint = () => {
      window.print();
  };

  const handleExportPDF = async () => {
    try {
      // Format schedule content for PDF
      let scheduleContent = `# Daily Schedule\n\n`;
      scheduleContent += `**Date:** ${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}\n\n`;
      scheduleContent += `## Schedule\n\n`;
      
      const sortedItems = [...items].sort((a, b) => a.time.localeCompare(b.time));
      sortedItems.forEach((item, index) => {
        scheduleContent += `${index + 1}. **${item.time}** - ${item.task}\n`;
      });
      
      await generatePDF('Daily Schedule', scheduleContent, '', 'PrismPath');
    } catch (error) {
      alert('Failed to generate PDF: ' + error.message);
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} p-4 md:p-8 flex flex-col items-center transition-colors duration-500`}>
      <div className="w-full max-w-4xl flex items-center justify-between mb-8 print:hidden">
          <button onClick={onBack} className={`flex items-center gap-2 ${theme.textMuted} hover:${theme.text} transition-colors`}>
              <ArrowLeft /> Back
          </button>
          <div className="flex items-center gap-2">
              <Calendar className="text-fuchsia-500" />
              <span className="font-bold text-xl tracking-tight">Visual Schedule</span>
          </div>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* INPUT FORM */}
          <div className={`lg:col-span-1 ${theme.cardBg} border ${theme.cardBorder} p-6 rounded-2xl shadow-lg h-fit print:hidden`}>
              <h2 className={`font-bold text-lg mb-4 ${theme.text}`}>Add Event</h2>
              <div className="space-y-4">
                  <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${theme.textMuted}`}>Time</label>
                      <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className={`w-full p-3 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.text} outline-none focus:border-fuchsia-500`} />
                  </div>
                  <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${theme.textMuted}`}>Activity</label>
                      <div className="relative">
                          <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="e.g. History Class" className={`w-full p-3 pr-12 rounded-xl border ${theme.inputBorder} ${theme.inputBg} ${theme.text} outline-none focus:border-fuchsia-500`} onKeyDown={(e) => e.key === 'Enter' && addItem()} />
                          <button onClick={toggleMic} className={`absolute right-2 top-2 p-1.5 rounded-lg transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-fuchsia-500'}`}>
                              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                          </button>
                      </div>
                  </div>
                  <button onClick={addItem} disabled={!newTask || !newTime} className="w-full py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                      <Plus size={20} /> Add
                  </button>
                  <div className="pt-6 border-t border-slate-500/10 mt-6 space-y-2">
                      <button onClick={handlePrint} className={`w-full py-3 border ${theme.inputBorder} ${theme.inputBg} ${theme.text} font-bold rounded-xl hover:bg-slate-500/5 transition-all flex items-center justify-center gap-2`}>
                          <Printer size={18} /> Print
                      </button>
                      <button onClick={handleExportPDF} className={`w-full py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2`}>
                          <Download size={18} /> Export PDF
                      </button>
                  </div>
              </div>
          </div>

          {/* SCHEDULE PREVIEW */}
          <div className="lg:col-span-2 print:col-span-3 print:w-full">
              <div className={`${theme.cardBg} border ${theme.cardBorder} p-8 rounded-3xl shadow-xl min-h-[600px] print:shadow-none print:border-none print:p-0`}>
                  <div className="flex justify-between items-end mb-8 border-b border-slate-500/10 pb-4">
                      <div>
                          <h1 className={`text-3xl font-black ${theme.text} mb-1`}>Daily Schedule</h1>
                          <p className={theme.textMuted}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                      </div>
                  </div>
                  <div className="space-y-4">
                      {items.map((item, index) => (
                          <div key={item.id} className="flex gap-4 group">
                              <div className="flex flex-col items-center">
                                  <div className={`w-3 h-3 rounded-full mt-2 ${isDark ? 'bg-slate-600' : 'bg-slate-300'}`}></div>
                                  {index !== items.length - 1 && <div className={`w-0.5 h-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'} my-1`}></div>}
                              </div>
                              <div className={`flex-1 flex items-center p-4 rounded-xl border-l-4 shadow-sm ${BLOCK_COLORS[item.color]} mb-2`}>
                                  <div className="w-20 font-mono font-bold text-lg opacity-70 shrink-0">{item.time}</div>
                                  <div className="flex-1 font-bold text-lg">{item.task}</div>
                                  <button onClick={() => deleteItem(item.id)} className="opacity-0 group-hover:opacity-100 print:hidden p-2 text-red-800/50 hover:text-red-900 transition-opacity"><Trash2 size={18} /></button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default VisualSchedule;

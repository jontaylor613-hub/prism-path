// src/utils.js
import { CheckCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';

// --- CONFIGURATION ---
export const getGoogleApiKey = () => {
  if (import.meta.env && import.meta.env.VITE_GOOGLE_API_KEY) {
      return import.meta.env.VITE_GOOGLE_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
      return process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  }
  return ""; 
};

export const GOOGLE_API_KEY = getGoogleApiKey();

// --- THEME ENGINE ---
export const getTheme = (isDark) => ({
    bg: isDark ? "bg-slate-950" : "bg-slate-50",
    text: isDark ? "text-slate-200" : "text-slate-800",
    textMuted: isDark ? "text-slate-400" : "text-slate-500",
    cardBg: isDark ? "bg-slate-900/60 backdrop-blur-xl" : "bg-white/80 backdrop-blur-xl shadow-lg",
    cardBorder: isDark ? "border-slate-700/50" : "border-slate-200",
    inputBg: isDark ? "bg-slate-950" : "bg-white",
    inputBorder: isDark ? "border-slate-700" : "border-slate-300",
    primaryText: isDark ? "text-cyan-400" : "text-cyan-600",
    secondaryText: isDark ? "text-fuchsia-400" : "text-fuchsia-600",
    navBg: isDark ? "bg-slate-900/90" : "bg-white/90",
    glassBorder: isDark ? "border-white/10" : "border-black/5"
});

// --- HELPERS ---
export const formatAIResponse = (text) => {
  if (!text) return "";
  let clean = text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/#/g, "");
  clean = clean.replace(/\.([A-Z])/g, ". $1");
  clean = clean.replace(/^(Here are|Sure|Here's|As an expert).*?:/gim, "");
  return clean.trim();
};

export const ComplianceService = {
  getStatus: (dateString) => {
    if (!dateString) return { color: 'bg-slate-600', text: 'No Date', icon: Clock };
    const today = new Date();
    const target = new Date(dateString); 
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { color: 'bg-red-500 animate-pulse', text: 'OVERDUE', icon: AlertTriangle };
    if (diffDays <= 30) return { color: 'bg-red-500', text: '< 1 Month', icon: Clock };
    if (diffDays <= 90) return { color: 'bg-orange-500', text: '< 3 Months', icon: Clock };
    if (diffDays <= 180) return { color: 'bg-yellow-500', text: '< 6 Months', icon: Calendar };
    return { color: 'bg-emerald-500', text: 'Compliant', icon: CheckCircle };
  }
};

export const GeminiService = {
  // --- CACHING HELPERS ---
  getCacheKey: (data, type) => {
    try {
      const inputString = JSON.stringify(data);
      return `${type}_${btoa(inputString).slice(0, 30)}`;
    } catch { return null; }
  },
  getCache: (key) => {
    if (!key) return null;
    return localStorage.getItem(key);
  },
  setCache: (key, result) => {
    if (!key || !result) return;
    localStorage.setItem(key, result);
  },
  // ------------------------------------

  generate: async (data, type) => {
    if (!GOOGLE_API_KEY) {
      return "Error: API Key Missing. Check VITE_GOOGLE_API_KEY settings.";
    }

    const cacheKey = GeminiService.getCacheKey(data, type);
    const cachedResult = GeminiService.getCache(cacheKey);
    if (cachedResult) { return cachedResult; } // Cache Hit!

    let systemInstruction = "";
    let userPrompt = "";

    // 1. Define Prompts
    if (type === 'accommodation') {
        systemInstruction = `Role: "The Accessible Learning Companion," an expert Special Education Instructional Designer. Constraint: Do NOT introduce yourself. Start directly with the strategies. Task: Provide specific accommodations for the student.`;
        userPrompt = `Student Challenge: ${data.targetBehavior}. Subject: ${data.condition}. Provide 3-5 specific accommodations.`;
    }
    else if (type === 'behavior') {
        systemInstruction = `You are an expert Board Certified Behavior Analyst (BCBA). Constraint: Do NOT use introductory phrases. Constraint: Start your response IMMEDIATELY with the header: "Behavior Log Analysis of [Student Name]".`;
        userPrompt = `Analyze logs: ${JSON.stringify(data.logs)}. Target Behavior: ${data.targetBehavior}.`;
    } 
    else if (type === 'slicer') {
        systemInstruction = "You are a helpful assistant for students. Break the requested task into 5-7 simple, direct steps. Use very plain language. Just list the steps.";
        userPrompt = `Task: ${data.task}`;
    }
    else if (type === 'email') {
        systemInstruction = "You are a professional Special Education Teacher. Write a polite email to a parent. No markdown.";
        userPrompt = data.feedbackAreas 
            ? `Email for student ${data.student} preparing for IEP. Ask for feedback on: ${data.feedbackAreas.join(', ')}.`
            : `Positive update for ${data.student} regarding ${data.topic}.`;
    } 
    else if (type === 'goal') {
        systemInstruction = "Write a SMART IEP goal. Specific, Measurable, Achievable, Relevant, Time-bound. No markdown.";
        userPrompt = `Student: ${data.student}, Grade: ${data.grade}. Condition: ${data.condition}. Behavior: ${data.behavior}.`;
    } 
    else if (type === 'plaafp') {
        systemInstruction = "Write a PLAAFP statement connecting strengths, needs, and impact. No markdown.";
        userPrompt = `Student: ${data.student}. Strengths: ${data.strengths}. Needs: ${data.needs}. Impact: ${data.impact}.`;
    }
    else if (type === 'resume') {
        systemInstruction = "You are an expert Resume Writer. Rewrite the input text to be professional, action-oriented, and concise. Do NOT use markdown. Just return the clean, polished paragraph.";
        userPrompt = `Rewrite this ${data.section} to sound more professional: "${data.text}"`;
    }

    // Safety check for empty prompt fields (prevents 400s)
    if (!userPrompt.trim()) return "Error: Prompt content cannot be empty. Please fill in the input fields.";

    // --- 2. SINGLE API CALL (Efficiency) ---
    try {
        const payload = { contents: [{ parts: [{ text: systemInstruction + "\n\n" + userPrompt }] }] };
        
        // Using the most stable alias which consistently works across projects
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            if (response.status === 429 || response.status === 403) throw new Error("Key/Quota Blocked");
            // If 404/400 persists, the key/model setup is incorrect
            throw new Error(`AI Status ${response.status} (Model Access Issue)`);
        }

        const resultData = await response.json();
        const finalResult = formatAIResponse(resultData.candidates?.[0]?.content?.parts?.[0]?.text);
        
        // Cache the good result
        GeminiService.setCache(cacheKey, finalResult); 

        return finalResult;
        
    } catch (error) { 
        return "Error: AI System Busy (Rate Limit or Restricted Key). Please try regenerating your key and trying again in 30 seconds."; 
    }
  }
};


// --- AUDIO UTILS (Exported for NeuroDriver) ---
export const AudioEngine = { 
    ctx: null,
    
    init: () => {
        // Fix: Ensure AudioContext is initialized before use
        if (!AudioEngine.ctx) AudioEngine.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (AudioEngine.ctx.state === 'suspended') AudioEngine.ctx.resume();
    },

    toggleBrownNoise: (play) => {
        AudioEngine.init();
        console.log(`Toggling Brown Noise: ${play}`);
        // NOTE: Full toggle logic (creating nodes) is assumed to be in NeuroDriver.
    },

    playVictory: () => {
        AudioEngine.init();
        const now = AudioEngine.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = AudioEngine.ctx.createOscillator();
            const gain = AudioEngine.ctx.createGain();
            osc.connect(gain);
            gain.connect(AudioEngine.ctx.destination);
            osc.frequency.value = freq;
            osc.type = 'triangle';
            gain.gain.setValueAtTime(0, now + i*0.1);
            gain.gain.linearRampToValueAtTime(0.1, now + i*0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i*0.1 + 0.6);
            osc.start(now + i*0.1);
            osc.stop(now + i*0.1 + 0.7);
        });
    },
    
    playChime: () => {
        AudioEngine.init();
        const osc = AudioEngine.ctx.createOscillator();
        const gain = AudioEngine.ctx.createGain();
        osc.connect(gain);
        gain.connect(AudioEngine.ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, AudioEngine.ctx.currentTime); 
        gain.gain.setValueAtTime(0.1, AudioEngine.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, AudioEngine.ctx.currentTime + 1.0);
        osc.start();
        // Fix: Use AudioContext time for stopping the sound
        osc.stop(AudioEngine.ctx.currentTime + 1.0); 
    }
};

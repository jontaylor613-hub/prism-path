// src/utils.js
import { CheckCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';

// --- CONFIGURATION ---
// NOTE: API keys are now handled server-side via /api/generate endpoint
// This keeps your API key secure and works with Vercel's serverless functions
// No need for VITE_GOOGLE_API_KEY in the frontend anymore!

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

  // --- SECURE API CALL (Uses serverless endpoint to keep API key safe) ---
  fetchWithFallback: async (prompt) => {
      try {
          // Use the secure serverless API endpoint (works on Vercel and locally with vercel dev)
          const response = await fetch('/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt })
          });

          if (!response.ok) {
              let errorMessage = `Server error: ${response.status}`;
              try {
                  const errorData = await response.json();
                  errorMessage = errorData.error || errorMessage;
              } catch {
                  // If JSON parsing fails, use default message
              }
              
              // Provide helpful error messages
              if (response.status === 500) {
                  throw new Error("API server is not running. Please start the API server with 'vercel dev' in a separate terminal, or check your API configuration.");
              }
              throw new Error(errorMessage);
          }

          const data = await response.json();
          return { candidates: [{ content: { parts: [{ text: data.result }] } }] };
      } catch (e) {
          // Check if it's a network error (API server not running)
          if (!e.message || e.message.includes('Failed to fetch') || e.message.includes('NetworkError') || e.message.includes('ERR_CONNECTION_REFUSED') || e.message.includes('fetch')) {
              throw new Error("API server is not running. Please start the API server with 'vercel dev' in a separate terminal.");
          }
          throw new Error(e.message || "API request failed");
      }
  },

  generate: async (data, type) => {
    // 1. Check Cache (Zero Cost)
    const cacheKey = GeminiService.getCacheKey(data, type);
    const cachedResult = GeminiService.getCache(cacheKey);
    if (cachedResult) return cachedResult; 

    let systemInstruction = "";
    let userPrompt = "";

    // 2. Define Prompts (Strict No-Intro)
    if (type === 'accommodation') {
        // Full Accessible Learning Companion prompt
        systemInstruction = `# Role & Persona

You are "**The Accessible Learning Companion**," an expert Special Education Instructional Designer and supportive homeschool assistant. You function as a bridge between high-level curriculum and a student's unique cognitive profile.

Your theoretical framework is built on **Universal Design for Learning (UDL)** and the **Social-Ecological Model of Disability**. Your goal is never to "dumb down" the learning, but to scaffold the environment so the student can access it.

**Tone:** Patient, encouraging, highly structured, and non-judgmental.

# Operational Procedure

## Phase 1: Onboarding (The Profile)

In the very first interaction, you must establish the **{Student_Profile}**.

* **If user pastes an IEP/504:** Parse it to extract accommodations (e.g., "Extended time," "Chunking," "Read Aloud").
* **If user gives manual input:** Ask for Grade Level, Reading Level, and Specific Challenges.
* **Constraint:** You must refer to this profile before generating *any* output. If a student has Dyslexia, you *automatically* apply visual spacing and phonics support to every subsequent message without being asked again.

## Phase 2: Core Capabilities (The Action)

When the user uploads content (text, worksheets, assignment prompts), apply the following based on the profile:

### 1. Presentation & Content Differentiation
* **Re-leveling (Tiered Instruction):** Rewrite text to the student's specific reading level. Keep the VERB (the thinking) but change the NOUN (the vocabulary). Do not make mature content sound "babyish."
* **The "Glass Box" Method:** Before the text, pull out complex vocabulary. Provide a bolded word, a simple definition, and a phonetic guide.
* **Visual Chunking:** Break text walls into bullet points. Bold key terms. Double-space between ideas.

### 2. Process Differentiation
* **Micro-Tasking:** Convert paragraph instructions into a numbered checklist of micro-steps.
* **Executive Scaffolding:** For ADHD profiles, add time estimates to tasks (e.g., "This step should take 5 minutes").

### 3. Product Differentiation
* **Response Accommodation:** Suggest alternative ways to demonstrate mastery based on the user's constraints.

## Phase 3: Export Formatting (Docs Integration)

If the user asks for a "file," "document," "worksheet," or "download," format for export using Markdown headers (\`#\`), distinct bullet points, and check-boxes. End with: *👇 **To save this for your student:** Click the 'Share & Export' button below this chat and select **'Export to Docs'**.*

# INTERNAL KNOWLEDGE BASE

## A. The "If/Then" Strategy Matrix

**IF Student has DYSLEXIA:**
* Formatting: Use Sans-serif fonts (Arial/Verdana style). Increase line spacing to 1.5. **Bol**d **th**e **fir**st **3** **lett**ers of words (Bionic reading simulation).
* Accommodation: Provide audio/TTS prep. Avoid "timed" reading.
* Differentiation: Focus on oral comprehension rather than decoding speed.

**IF Student has ADHD (Inattentive):**
* Formatting: Use "Chunking." Never have paragraphs longer than 3 sentences. Use bold text for instructions.
* Accommodation: Suggest "Movement Breaks" (remind student to move every 15 mins).
* Differentiation: Provide a checklist of steps. Remove "fluff" or decorative images.

**IF Student has SLOW PROCESSING SPEED:**
* Formatting: Reduce the number of problems per page (reduce visual clutter).
* Accommodation: Calculate "Double Time" (2.0x) for tasks.
* Differentiation: Grade on quality not quantity (e.g., "Do the even numbers only").

**IF Student has DYSGRAPHIA (Writing issues):**
* Formatting: Provide large spaces for writing or digital fillable formats.
* Accommodation: Allow Speech-to-Text (Dictation) or Typing.
* Differentiation: Allow "Scribe" (parent writes what student says) or create "Fill-in-the-blank" notes.

**IF Student has AUTISM (ASD):**
* Formatting: Use literal, concrete language. Avoid idioms. Use visual icons.
* Differentiation: Incorporate special interests (e.g., if they love trains, use train examples for math).

## B. Bloom's Taxonomy "Simplification" Guide
* **Keep the VERB:** Do not change high-level verbs like *Analyze, Compare, Synthesize*.
* **Change the NOUN/ADJECTIVE:** Change complex words to simpler synonyms.

## C. Command Library (Shortcuts)
* **/simplify:** Drop reading level by 2 grades immediately.
* **/visual:** Apply heavy visual formatting (emojis, bolding, bullet points).
* **/dyslexia:** Apply the Dyslexia formatting rules (spacing + bionic bolding).
* **/tts-prep:** Clean text for Text-to-Speech readers (remove sidebars/captions).

# THE FIRST MESSAGE

If this is the first interaction, output this welcome message:

Welcome to your Accessible Learning Companion! 🍎

I am here to take the stress out of adapting curriculum for your learner. To give you the best support, I need to understand your child's unique learning profile.

**Please start by choosing one of the options below:**

**Option A: Paste an IEP/504 Summary**

You can paste the "Accommodations" or "Present Levels" section of their IEP here.

*(Privacy Tip: Please remove the child's real name and address before pasting! You can refer to them as "The Student" or use a nickname.)*

**Option B: Tell me about them manually**

If you don't have paperwork handy, just tell me:

1. **Current Grade/Age:**
2. **Actual Reading Level:** (e.g., "Reads at a 2nd-grade level")
3. **Specific Challenges:** (e.g., Dyslexia, ADHD, poor working memory, gets overwhelmed by text walls)
4. **What helps them?** (e.g., Bullet points, bold text, definitions provided first)

Once you provide this, I will lock it in and adapt all future requests to fit these needs!`;

        // Build user prompt with context
        let promptText = '';
        if (data.targetBehavior && data.condition) {
            promptText = `Student Challenge: ${data.targetBehavior}. Subject: ${data.condition}.`;
        } else if (data.prompt) {
            promptText = data.prompt;
        } else {
            promptText = data.message || 'Please help me with accommodations.';
        }
        
        // Add file context if provided
        if (data.files && data.files.length > 0) {
            promptText += '\n\nUploaded files:';
            data.files.forEach(file => {
                if (file.type === 'text' && file.content) {
                    promptText += `\n- ${file.name}: ${file.content.substring(0, 2000)}`;
                } else if (file.type === 'image') {
                    promptText += `\n- ${file.name} (image of student work)`;
                } else {
                    promptText += `\n- ${file.name} (${file.type} file)`;
                }
            });
        }
        
        userPrompt = promptText;
        
        // If this is the first message and no profile exists, trigger welcome message
        if (data.isFirstMessage && !data.studentProfile) {
            userPrompt = 'This is the first message. Please provide the welcome message and ask for student profile information.';
        }
    }
    else if (type === 'behavior') {
        systemInstruction = `You are an expert BCBA. Constraint: No intro. Start response IMMEDIATELY with the header: "Behavior Log Analysis of [Student Name]".`;
        userPrompt = `Analyze logs: ${JSON.stringify(data.logs)}. Target Behavior: ${data.targetBehavior}.`;
    } 
    else if (type === 'slicer') {
        systemInstruction = "You are a helpful buddy for a student. Break the task into 5-7 tiny, easy steps. Use simple words. No intro. No outro. Just the list.";
        userPrompt = `Task: ${data.task}`;
    }
    else if (type === 'email') {
        systemInstruction = "Professional Special Education Teacher. Write a polite email. No markdown.";
        userPrompt = data.feedbackAreas ? `Email for student ${data.student}. Ask feedback on: ${data.feedbackAreas.join(', ')}.` : `Update for ${data.student} regarding ${data.topic}.`;
    } 
    else if (type === 'goal') {
        systemInstruction = "Write a SMART IEP goal. No markdown.";
        userPrompt = `Student: ${data.student}, Grade: ${data.grade}. Condition: ${data.condition}. Behavior: ${data.behavior}.`;
    } 
    else if (type === 'plaafp') {
        systemInstruction = "Write a PLAAFP statement. No markdown.";
        userPrompt = `Student: ${data.student}. Strengths: ${data.strengths}. Needs: ${data.needs}. Impact: ${data.impact}.`;
    }
    else if (type === 'resume') {
        systemInstruction = "Expert Resume Writer. Rewrite to be professional and concise. No markdown.";
        userPrompt = `Rewrite this ${data.section}: "${data.text}"`;
    }

    if (!userPrompt.trim()) return "Error: Prompt content cannot be empty.";

    // 3. API Call (now uses secure serverless endpoint)
    try {
      // For accommodation type, combine system instruction and user prompt
      // The system instruction contains the full role and instructions
      // The user prompt contains the actual request
      const fullPrompt = type === 'accommodation' 
        ? `${systemInstruction}\n\n---\n\nUser Request:\n${userPrompt}`
        : systemInstruction + "\n\n" + userPrompt;
      
      const resultData = await GeminiService.fetchWithFallback(fullPrompt);
      
      // Don't format AI response for accommodation type - let it use its own formatting
      const rawResult = resultData.candidates?.[0]?.content?.parts?.[0]?.text;
      const finalResult = type === 'accommodation' ? rawResult : formatAIResponse(rawResult);
      GeminiService.setCache(cacheKey, finalResult); 
      return finalResult;
      
    } catch (error) { 
        return `Error: ${error.message || "AI System Busy. Please try again in 30 seconds."}`; 
    }
  }
};

// --- AUDIO UTILS ---
export const AudioEngine = { 
    ctx: null,
    init: () => {
        if (!AudioEngine.ctx) AudioEngine.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (AudioEngine.ctx.state === 'suspended') AudioEngine.ctx.resume();
    },
    toggleBrownNoise: (play) => { AudioEngine.init(); console.log(`Brown Noise: ${play}`); },
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
        osc.stop(AudioEngine.ctx.currentTime + 1.0);
    }
};

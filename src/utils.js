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
  fetchWithFallback: async (prompt, files = []) => {
      try {
          // Prepare files for API (only send necessary data)
          const filesForAPI = files.map(file => {
            if (file.type === 'image' && file.data) {
              return {
                type: 'image',
                data: file.data,
                name: file.name
              };
            } else if (file.type === 'pdf' && file.content) {
              return {
                type: 'pdf',
                content: file.content,
                name: file.name
              };
            } else if (file.content) {
              return {
                type: file.type || 'text',
                content: file.content,
                name: file.name
              };
            }
            return null;
          }).filter(f => f !== null);

          // Use the secure serverless API endpoint (works on Vercel and locally with vercel dev)
          const response = await fetch('/api/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt, files: filesForAPI })
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
    // 1. Check Cache (Zero Cost) - Skip cache for email type to allow regeneration
    if (type !== 'email') {
      const cacheKey = GeminiService.getCacheKey(data, type);
      const cachedResult = GeminiService.getCache(cacheKey);
      if (cachedResult) return cachedResult;
    } 

    let systemInstruction = "";
    let userPrompt = "";

    // 2. Define Prompts (Strict No-Intro)
    if (type === 'accommodation') {
        // Full Accessible Learning Companion prompt - matches Gemini GEM logic exactly
        systemInstruction = `# Role & Persona

You are "**The Accessible Learning Companion**," an expert Special Education Instructional Designer and supportive homeschool assistant. You function as a bridge between high-level curriculum and a student's unique cognitive profile.

Your theoretical framework is built on **Universal Design for Learning (UDL)** and the **Social-Ecological Model of Disability**. Your goal is never to "dumb down" the learning, but to scaffold the environment so the student can access it.

**Tone:** Patient, encouraging, highly structured, and non-judgmental.

---

# Operational Procedure

## Phase 1: Onboarding (The Profile)

In the very first interaction, you must establish the **{Student_Profile}**.

* **If user pastes an IEP/504:** Parse it to extract accommodations (e.g., "Extended time," "Chunking," "Read Aloud").
* **If user gives manual input:** Ask for Grade Level, Reading Level, and Specific Challenges.
* **Constraint:** You must refer to this profile before generating *any* output. If a student has Dyslexia, you *automatically* apply visual spacing and phonics support to every subsequent message without being asked again.

## Phase 2: Core Capabilities (The Action)

When the user uploads content (text, worksheets, assignment prompts), apply the following based on the profile:

### 1. Presentation & Content Differentiation

* **Re-leveling (Tiered Instruction):** Rewrite text to the student's specific reading level.

    * *Rule:* Keep the VERB (the thinking) but change the NOUN (the vocabulary). Do not make mature content sound "babyish."

* **The "Glass Box" Method:** Before the text, pull out complex vocabulary. Provide a bolded word, a simple definition, and a phonetic guide.

* **Visual Chunking:** Break text walls into bullet points. Bold key terms. Double-space between ideas.

### 2. Process Differentiation

* **Micro-Tasking:** Convert paragraph instructions into a numbered checklist of micro-steps.

    * *Example:* Turn "Write an essay" into "1. Pick a topic. 2. Write the first sentence."

* **Executive Scaffolding:** For ADHD profiles, add time estimates to tasks (e.g., "This step should take 5 minutes").

### 3. Product Differentiation

* **Response Accommodation:** Suggest alternative ways to demonstrate mastery based on the user's constraints (e.g., "Instead of writing, record a voice note").

## Phase 3: Export Formatting (Docs Integration)

If the user asks for a "file," "document," "worksheet," or "download," you must:

1.  **Format for Export:** Ensure the output uses clear Markdown headers (\`#\`), distinct bullet points, and check-boxes (using \`[ ]\` for unchecked and \`[x]\` for checked) so they render correctly when exported.

2.  **Instruction:** End your response with this footer message:

    > *👇 **To save this for your student:** Click the 'Share & Export' button below this chat and select **'Export to Docs'**. This will create a Google Doc you can print or share with them immediately.*

---

# INTERNAL KNOWLEDGE BASE (The "Brain")

## A. The "If/Then" Strategy Matrix

Use this to determine exactly how to modify text based on the diagnosis.

**IF Student has DYSLEXIA:**

* **Formatting:** Use Sans-serif fonts (Arial/Verdana style). Increase line spacing to 1.5. **Bol**d **th**e **fir**st **3** **lett**ers of words (Bionic reading simulation).

* **Accommodation:** Provide audio/TTS prep. Avoid "timed" reading.

* **Differentiation:** Focus on oral comprehension rather than decoding speed.

**IF Student has ADHD (Inattentive):**

* **Formatting:** Use "Chunking." Never have paragraphs longer than 3 sentences. Use bold text for instructions.

* **Accommodation:** Suggest "Movement Breaks" (remind student to move every 15 mins).

* **Differentiation:** Provide a checklist of steps. Remove "fluff" or decorative images.

**IF Student has SLOW PROCESSING SPEED:**

* **Formatting:** Reduce the number of problems per page (reduce visual clutter).

* **Accommodation:** Calculate "Double Time" (2.0x) for tasks.

* **Differentiation:** Grade on quality not quantity (e.g., "Do the even numbers only").

**IF Student has DYSGRAPHIA (Writing issues):**

* **Formatting:** Provide large spaces for writing or digital fillable formats.

* **Accommodation:** Allow Speech-to-Text (Dictation) or Typing.

* **Differentiation:** Allow "Scribe" (parent writes what student says) or create "Fill-in-the-blank" notes.

**IF Student has AUTISM (ASD):**

* **Formatting:** Use literal, concrete language. Avoid idioms (e.g., don't say "It's raining cats and dogs"). Use visual icons.

* **Differentiation:** Incorporate special interests (e.g., if they love trains, use train examples for math).

## B. Bloom's Taxonomy "Simplification" Guide

* **Keep the VERB:** Do not change high-level verbs like *Analyze, Compare, Synthesize*.

* **Change the NOUN/ADJECTIVE:** Change complex words to simpler synonyms.

    * *Example:* Instead of "Analyze the catastrophic implications," write "Analyze the bad results."

## C. Command Library (Shortcuts)

* **/simplify:** Drop reading level by 2 grades immediately.

* **/visual:** Apply heavy visual formatting (emojis, bolding, bullet points).

* **/dyslexia:** Apply the Dyslexia formatting rules (spacing + bionic bolding).

* **/tts-prep:** Clean text for Text-to-Speech readers (remove sidebars/captions).

---

# THE FIRST MESSAGE (Prompt Starter)

*(If the user says "Hello" or starts a new chat, output this exactly)*

Welcome to your Accessible Learning Companion! 🍎

I am here to take the stress out of adapting curriculum for your learner. To give you the best support, I need to understand your child's unique learning profile.

**Please start by choosing one of the options below:**

**Option A: Paste an IEP/504 Summary**

You can paste the "Accommodations" or "Present Levels" section of their IEP here.

*(Privacy Tip: Please remove the child's real name and address before pasting! You can refer to them as "The Student" or use a nickname.)*

**Option B: Tell me about them manually**

If you don't have paperwork handy, just tell me:

1.  **Current Grade/Age:**

2.  **Actual Reading Level:** (e.g., "Reads at a 2nd-grade level")

3.  **Specific Challenges:** (e.g., Dyslexia, ADHD, poor working memory, gets overwhelmed by text walls)

4.  **What helps them?** (e.g., Bullet points, bold text, definitions provided first)

Once you provide this, I will lock it in and adapt all future requests to fit these needs!

---

# CRITICAL RULES

1. **NEVER repeat the welcome message** after it has been sent once. If you see conversation history or a student profile exists, do NOT send the welcome message again.

2. **If a student profile exists**, immediately use it to adapt your response. Do not ask for profile information again.

3. **After the first message, NEVER introduce yourself again.** Do NOT say "I am the Accessible Learning Companion" or similar introductions. Simply respond to the user's request directly without any self-introduction or greeting.

4. **CRITICAL: NEVER say "I've logged the student profile" or similar logging messages.** The user interface handles profile storage. Your job is to provide accommodations, not to confirm logging.

5. **CRITICAL: Document Analysis Requests** - When a user uploads a document (PDF, image, etc.) and asks you to analyze it:
   - IMMEDIATELY analyze the document content
   - Provide specific accommodations and differentiation techniques based on the document
   - Do NOT treat document uploads as profile setup requests
   - Do NOT say "I've logged" or "I've saved" anything - just provide the accommodations
   - Start immediately with your analysis and accommodation recommendations
   - If a student profile exists, use it to inform your accommodations silently (don't mention it)
   - Focus on: content differentiation, process differentiation, and product differentiation

6. **CRITICAL: Demo Requests** - When you see "skipWelcomeMessage" flag or "This is a demo request" in the user prompt:
   - Do NOT log this as a learner profile
   - Do NOT show welcome messages
   - Do NOT ask for profile information
   - Do NOT say "I've logged" anything
   - Provide accommodations immediately based on the challenge and subject provided
   - Start directly with specific accommodation strategies
   - This is a one-time demo, not a profile setup

7. **NO LOOPS**: If you see the same request repeated, provide a different angle or ask a clarifying question. Never repeat the exact same response.

8. **QUALITY RESPONSES**: Always provide specific, actionable accommodations. Use the If/Then Strategy Matrix. Apply UDL principles. Give concrete examples, not vague suggestions.`;

        // Build user prompt with context and conversation history
        let promptText = '';
        
        // Add conversation history if available (limit to last 10 messages to prevent token bloat)
        if (data.conversationHistory && data.conversationHistory.length > 0) {
            const recentHistory = data.conversationHistory.slice(-10);
            promptText += '---\nRECENT CONVERSATION HISTORY:\n';
            recentHistory.forEach(msg => {
                const content = msg.content.length > 500 ? msg.content.substring(0, 500) + '...' : msg.content;
                promptText += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${content}\n\n`;
            });
            promptText += '---\nCURRENT REQUEST:\n';
        }
        
        // Add student profile context if it exists (silently, don't make AI mention it)
        if (data.studentProfile) {
            promptText += `\n[Background context - use this to inform accommodations but DO NOT mention logging or saving]: ${data.studentProfile}\n\n`;
        }
        
        // Build the actual user request
        if (data.targetBehavior && data.condition) {
            promptText += `Student Challenge: ${data.targetBehavior}. Subject: ${data.condition}.`;
        } else if (data.prompt) {
            promptText += data.prompt;
        } else {
            promptText += data.message || '';
        }
        
        // Add file context if provided - THIS IS CRITICAL FOR DOCUMENT ANALYSIS
        if (data.files && data.files.length > 0) {
            promptText += '\n\n---\nUPLOADED DOCUMENT(S) TO ANALYZE AND DIFFERENTIATE:\n';
            data.files.forEach(file => {
                if (file.type === 'text' && file.content) {
                    const textContent = file.content.length > 10000 ? file.content.substring(0, 10000) + '\n[Content truncated - showing first 10k chars]' : file.content;
                    promptText += `\n\n${file.name} (Text Document):\n${textContent}`;
                } else if (file.type === 'image') {
                    promptText += `\n\n${file.name} (Image - analyze visual content and provide accommodations)`;
                } else if (file.type === 'pdf') {
                    // For PDFs, if content was extracted, include it (up to 100k chars for comprehensive analysis)
                    if (file.content) {
                        const pdfContent = file.content.length > 100000 ? file.content.substring(0, 100000) + '\n[Content truncated - document is very long, showing first 100k chars]' : file.content;
                        promptText += `\n\n${file.name} (PDF Document):\n${pdfContent}`;
                    } else {
                        promptText += `\n\n${file.name} (PDF document - analyze this document and provide accommodations)`;
                    }
                } else if (file.type === 'word') {
                    if (file.content) {
                        const wordContent = file.content.length > 10000 ? file.content.substring(0, 10000) + '\n[Content truncated]' : file.content;
                        promptText += `\n\n${file.name} (Word Document):\n${wordContent}`;
                    } else {
                        promptText += `\n\n${file.name} (Word document - analyze and provide accommodations)`;
                    }
                } else {
                    promptText += `\n\n${file.name} (${file.type} file - analyze and provide accommodations)`;
                }
            });
            promptText += '\n\n---\n\nCRITICAL INSTRUCTIONS FOR DOCUMENT ANALYSIS:\n';
            promptText += '1. IMMEDIATELY analyze the document content above\n';
            promptText += '2. Provide specific accommodations using the If/Then Strategy Matrix\n';
            promptText += '3. Apply Presentation, Process, and Product differentiation\n';
            promptText += '4. Give concrete examples from the document\n';
            promptText += '5. Do NOT say "I\'ve logged" or "I\'ve saved" anything\n';
            promptText += '6. Do NOT ask for profile information - just provide accommodations\n';
            promptText += '7. Start immediately with: "Here are accommodations for this document:"\n';
            promptText += '8. If a student profile exists in context, use it silently to inform your accommodations\n';
        }
        
        userPrompt = promptText;
        
        // If this is a file analysis request, add extra emphasis
        if (data.isFileAnalysisRequest) {
          userPrompt = `DOCUMENT ANALYSIS REQUEST - START IMMEDIATELY WITH ACCOMMODATIONS:

${userPrompt}

Remember: No profile logging, no confirmations, just immediate accommodation strategies based on the document content.`;
        }
        // If skipWelcomeMessage flag is set (for front page Instant AI Accommodations)
        else if (data.skipWelcomeMessage) {
          userPrompt = `IMMEDIATE ACCOMMODATION REQUEST - NO PROFILE LOGGING:

Challenge: ${data.targetBehavior || 'Not specified'}
Subject: ${data.condition || 'Not specified'}

Provide immediate, actionable differentiation techniques and accommodations. Start directly with specific accommodation strategies. Do NOT mention logging, saving, or profile creation. Just provide the accommodations.

Structure your response:
1. **Presentation Accommodations** (how to present the content)
2. **Process Accommodations** (how to structure the learning process)
3. **Product Accommodations** (alternative ways to demonstrate learning)

Be specific and actionable. Use the If/Then Strategy Matrix.`;
        }
        // If this is the first message and no profile exists, check if user provided info
        else if (data.isFirstMessage && !data.studentProfile) {
            const profileKeywords = ['grade', 'reading level', 'dyslexia', 'adhd', 'iep', '504', 'challenge', 'age', 'autism', 'dysgraphia'];
            const hasProfileInfo = data.message && profileKeywords.some(keyword => 
                data.message.toLowerCase().includes(keyword)
            );
            
            // If user hasn't provided profile info, trigger welcome message
            if (!hasProfileInfo) {
                userPrompt = 'Hello';
            }
        }
    }
    else if (type === 'behavior') {
        systemInstruction = `You are an expert BCBA. Constraint: No intro. No outro. Start response IMMEDIATELY with the header: "Behavior Log Analysis of [Student Name]". Provide specific, actionable recommendations based on the behavior log data.`;
        const studentName = data.student || data.targetBehavior || 'Student';
        userPrompt = `Analyze these behavior logs: ${JSON.stringify(data.logs || [])}. Target Behavior: ${data.targetBehavior || 'General'}. Student: ${studentName}.`;
    } 
    else if (type === 'slicer') {
        systemInstruction = "You are a helpful buddy for a student. Break the task into 5-7 tiny, easy steps. Use simple words. No intro. No outro. Just the numbered list. Each step should be actionable and clear.";
        userPrompt = `Task: ${data.task || ''}`;
    }
    else if (type === 'email') {
        systemInstruction = "Professional Special Education Teacher. Write a polite email addressed to the PARENTS/GUARDIANS of the student. The email should be professional, warm, and parent-focused. Do NOT address the email to the student/learner. Address it to 'Dear [Parent/Guardian Name]' or 'Dear Parents'. No markdown. No intro. Just the email.";
        const studentName = data.student || 'the student';
        userPrompt = data.feedbackAreas ? `Write an email to the PARENTS of ${studentName} asking for their feedback on: ${data.feedbackAreas.join(', ')}.` : `Write an email to the PARENTS of ${studentName} regarding ${data.topic || 'their child'}.`;
    } 
    else if (type === 'goal') {
        systemInstruction = "Write a SMART IEP goal. No markdown. No intro. Just the goal statement.";
        const studentName = data.student || 'Student';
        const grade = data.grade || 'Not specified';
        userPrompt = `Student: ${studentName}, Grade: ${grade}. Condition: ${data.condition || 'Not specified'}. Behavior: ${data.behavior || 'Not specified'}.`;
    } 
    else if (type === 'plaafp') {
        systemInstruction = "Write a PLAAFP (Present Levels of Academic Achievement and Functional Performance) statement. No markdown. No intro. Just the PLAAFP statement.";
        const studentName = data.student || 'Student';
        userPrompt = `Student: ${studentName}. Strengths: ${data.strengths || 'Not specified'}. Needs: ${data.needs || 'Not specified'}. Impact: ${data.impact || 'Not specified'}.`;
    }
    else if (type === 'resume') {
        systemInstruction = "Expert Resume Writer. Rewrite to be professional and concise. No markdown. No intro. Just the improved text.";
        userPrompt = `Rewrite this ${data.section || 'section'}: "${data.text || data.textToImprove || ''}"`;
    }
    else if (type === 'translator') {
        systemInstruction = `You are a professional translator. Translate the provided text accurately to ${data.targetLanguage || 'Spanish'}. Maintain the same tone, formality level, and structure as the original. If the text is an email or formal communication, preserve the formatting and salutations. Return ONLY the translated text, no explanations, no markdown.`;
        userPrompt = `Translate this text to ${data.targetLanguage || 'Spanish'}:\n\n${data.text || ''}`;
    }
    else if (type === 'tone') {
        systemInstruction = `You are a professional communication coach. Analyze the provided text for hostility, frustration, or non-objective language. Return ONLY a valid JSON object with this exact structure:
{
  "score": <number 1-10 where 1=safe, 10=very risky>,
  "flaggedPhrases": [<array of problematic phrases>],
  "betterAlternatives": [<array of suggested improvements>]
}

Be objective and professional. Only flag truly problematic language.`;
        userPrompt = `Analyze this text for tone issues:\n\n${data.text || ''}`;
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
      
      // Extract files from data for multimodal support
      const files = data.files || [];
      const resultData = await GeminiService.fetchWithFallback(fullPrompt, files);
      
      // Don't format AI response for accommodation type - let it use its own formatting
      const rawResult = resultData.candidates?.[0]?.content?.parts?.[0]?.text;
      const finalResult = type === 'accommodation' ? rawResult : formatAIResponse(rawResult);
      
      // Only cache if not email type (emails should regenerate each time)
      if (type !== 'email') {
        const cacheKey = GeminiService.getCacheKey(data, type);
        GeminiService.setCache(cacheKey, finalResult);
      }
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

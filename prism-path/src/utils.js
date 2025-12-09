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
        // Full Accessible Learning Companion prompt
        systemInstruction = `# Role & Persona

You are "**The Accessible Learning Companion**," an expert Special Education Instructional Designer and supportive homeschool assistant. You function as a bridge between high-level curriculum and a student's unique cognitive profile.

Your theoretical framework is built on **Universal Design for Learning (UDL)** and the **Social-Ecological Model of Disability**. Your goal is never to "dumb down" the learning, but to scaffold the environment so the student can access it.

**Tone:** Patient, encouraging, highly structured, and non-judgmental.

**CRITICAL FORMATTING RULES:**
- NEVER use asterisks (*) for emphasis. Use **bold** text instead.
- Use different colors and bold text to organize information clearly.
- Keep responses clean and well-structured with clear visual hierarchy.
- Use bold for headings, key terms, and important information.
- Use color coding when appropriate (but avoid asterisks entirely).

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

# CRITICAL: NEVER SHOW WELCOME MESSAGE

**IMPORTANT:** The welcome message is displayed in the user interface BEFORE the user sends their first message. You should NEVER output the welcome message in your responses. 

If the user has sent you a message, they have already seen the welcome message in the UI. Your job is to:
1. If they provide student profile information (IEP, grade level, challenges, etc.), acknowledge it ONCE by saying something like: "Thank you! I've saved this profile. I'll use this information to adapt all future content. How can I help you today?" Then wait for their next request.
2. If they ask for accommodations or help, provide it immediately based on their profile
3. NEVER repeat the welcome message or ask them to choose between options - they've already seen that
4. NEVER say "Please start by choosing one of the options below" - that's already been shown in the UI

# CRITICAL: NO REPEATED INTRODUCTIONS

NEVER introduce yourself. Do NOT say "I am the Accessible Learning Companion" or similar introductions. Simply respond to the user's request directly without any self-introduction or greeting.

# STUDENT PROFILE ACKNOWLEDGMENT

When a student profile is established, you should acknowledge it by saying: "Okay, I've logged the [Student Name] profile. From now on, I will keep in mind that the student:" followed by a brief summary of key accommodations or needs. This acknowledgment should only happen ONCE when the profile is first established, not on every message.

# CRITICAL: COMPLETING ACCOMMODATION REQUESTS

**IMPORTANT:** If you previously asked for student profile information to provide better accommodations for an uploaded document, and the user now provides that profile information, you MUST:

1. Acknowledge the profile briefly (one sentence)
2. IMMEDIATELY provide the differentiated accommodations for the document that was already uploaded
3. DO NOT ask "How can I help you today?" - the user has already told you what they need (accommodations for the uploaded document)
4. DO NOT ask for the content again - you already have it from the previous message

The user's request is to get accommodations for the document they uploaded, and providing their profile is completing that request, not starting a new conversation.`;

        // Build user prompt with context
        let promptText = '';
        if (data.targetBehavior && data.condition) {
            promptText = `Student Challenge: ${data.targetBehavior}. Subject: ${data.condition}.`;
        } else if (data.prompt) {
            promptText = data.prompt;
        } else {
            promptText = data.message || 'Please help me with accommodations.';
        }
        
        // CRITICAL: Check for file uploads FIRST - files mean content analysis, NOT profile creation
        const hasFiles = data.files && data.files.length > 0;
        const isFileAnalysisRequest = hasFiles || 
            promptText.toLowerCase().includes('uploaded') ||
            promptText.toLowerCase().includes('analyze') ||
            promptText.toLowerCase().includes('document');
        
        // Add file context if provided - THIS IS FOR CONTENT ANALYSIS
        if (hasFiles) {
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
                        promptText += `\n\n${file.name} (Word document - analyze this document and provide accommodations)`;
                    }
                } else {
                    promptText += `\n\n${file.name} (${file.type} file - analyze and provide accommodations)`;
                }
            });
        }
        
        userPrompt = promptText;
        
        // Extract student name from selectedStudent if available
        let studentName = null;
        if (data.selectedStudent && data.selectedStudent.name) {
            studentName = data.selectedStudent.name;
        } else if (data.studentProfile) {
            // Try to extract name from profile
            if (typeof data.studentProfile === 'object' && data.studentProfile.name) {
                studentName = data.studentProfile.name;
            } else if (typeof data.studentProfile === 'string') {
                const nameMatch = data.studentProfile.match(/Student:\s*([^\n]+)/i) || 
                                 data.studentProfile.match(/Name:\s*([^\n]+)/i);
                if (nameMatch) {
                    studentName = nameMatch[1].trim();
                }
            }
        }
        
        // CRITICAL: NEVER show welcome message if user has already sent a message
        // The welcome message should ONLY be shown in the UI, never by the AI after user interaction
        // If isFirstMessage is true here, it means the user hasn't sent a message yet (shouldn't happen in normal flow)
        // But if it does, we still don't want the AI to return the welcome message - it's already shown in the UI
        
        // PRIORITY 1: If files are present OR completing an accommodation request, this is a CONTENT ANALYSIS request
        if (isFileAnalysisRequest || data.isCompletingAccommodationRequest) {
            // This is a content analysis request - analyze the uploaded content and provide accommodations
            // If a profile exists, use it for context, but the primary task is analyzing the content
            const profileText = data.studentProfile ? (typeof data.studentProfile === 'object' 
                ? (data.studentProfile.profileText || JSON.stringify(data.studentProfile))
                : data.studentProfile) : null;
            
            if (data.isCompletingAccommodationRequest) {
                // User provided profile info to complete an accommodation request
                // CRITICAL: Provide accommodations NOW, don't ask "How can I help you today?"
                const newProfileText = typeof data.studentProfile === 'object' 
                    ? (data.studentProfile.profileText || JSON.stringify(data.studentProfile))
                    : (data.studentProfile || userPrompt);
                
                // Build context about what happened before
                const contextNote = data.hasExistingMessages 
                    ? "Note: You previously analyzed the uploaded document and asked for student profile information. The user has now provided that information below." 
                    : "The user previously uploaded content for analysis and has now provided their student profile information.";
                
                if (studentName) {
                    userPrompt = `${contextNote}\n\nStudent Profile for ${studentName}:\n${newProfileText}\n\n---\n\nCOMPLETE ACCOMMODATION REQUEST:\nYou MUST provide differentiated accommodations for the uploaded document(s) based on this profile IMMEDIATELY. Do NOT ask "How can I help you today?" - provide the accommodations now. The document content is included below.\n\n${userPrompt}`;
                } else {
                    userPrompt = `${contextNote}\n\nStudent Profile:\n${newProfileText}\n\n---\n\nCOMPLETE ACCOMMODATION REQUEST:\nYou MUST provide differentiated accommodations for the uploaded document(s) based on this profile IMMEDIATELY. Do NOT ask "How can I help you today?" - provide the accommodations now. The document content is included below.\n\n${userPrompt}`;
                }
            } else if (profileText) {
                if (studentName) {
                    userPrompt = `Student Profile for ${studentName}:\n${profileText}\n\n---\n\nCRITICAL: CONTENT ANALYSIS REQUEST\n\nThe user has uploaded document(s) to analyze. You MUST:\n1. Read and analyze the ACTUAL content of the uploaded document(s) below\n2. Extract SPECIFIC information from the document (not generic templates)\n3. Provide differentiated accommodations based on BOTH the student's profile AND the actual document content\n4. Do NOT provide generic instructions or templates - analyze the actual document content provided\n\nThe document content is included below. Analyze it now:\n\n${userPrompt}`;
                } else {
                    userPrompt = `Student Profile:\n${profileText}\n\n---\n\nCRITICAL: CONTENT ANALYSIS REQUEST\n\nThe user has uploaded document(s) to analyze. You MUST:\n1. Read and analyze the ACTUAL content of the uploaded document(s) below\n2. Extract SPECIFIC information from the document (not generic templates)\n3. Provide differentiated accommodations based on BOTH the student's profile AND the actual document content\n4. Do NOT provide generic instructions or templates - analyze the actual document content provided\n\nThe document content is included below. Analyze it now:\n\n${userPrompt}`;
                }
            } else {
                // No profile yet, but user wants to analyze content - analyze it and provide general accommodations
                userPrompt = `CRITICAL: CONTENT ANALYSIS REQUEST\n\nThe user has uploaded document(s) to analyze. You MUST:\n1. Read and analyze the ACTUAL content of the uploaded document(s) below\n2. Extract SPECIFIC information from the document (not generic templates or instructions)\n3. Provide differentiated accommodations based on the actual document content\n4. Do NOT provide generic instructions or templates - analyze the actual document content provided\n\nIf you need student profile information to provide better accommodations, you can ask for it after providing initial analysis based on the document.\n\nThe document content is included below. Analyze it now:\n\n${userPrompt}`;
            }
        }
        // PRIORITY 2: If skipWelcomeMessage flag is set, ensure we never show welcome message and process request directly
        else if (data.skipWelcomeMessage) {
          // For Instant AI Accommodations - just process the request directly without any profile/welcome logic
          // The user prompt already contains the challenge and subject, so we can use it as-is
          // Add instruction to provide differentiation techniques immediately
          userPrompt = `The user is requesting differentiation techniques and accommodations. Provide immediate, actionable suggestions based on the challenge and subject provided. Do NOT show any welcome message or ask for profile information - just provide the accommodations.\n\n${userPrompt}`;
        } 
        // PRIORITY 3: If student profile exists, include it in context
        else if (data.studentProfile) {
            // If student profile exists, include it in the context with name
            const profileText = typeof data.studentProfile === 'object' 
                ? (data.studentProfile.profileText || JSON.stringify(data.studentProfile))
                : data.studentProfile;
            
            if (studentName) {
                userPrompt = `Student Profile for ${studentName}:\n${profileText}\n\n---\n\nUser Request: ${userPrompt}`;
            } else {
                userPrompt = `Student Profile:\n${profileText}\n\n---\n\nUser Request: ${userPrompt}`;
            }
        } 
        // PRIORITY 4: Check if this looks like profile information (only if no files and no existing messages)
        else if (!data.hasExistingMessages) {
            const profileKeywords = ['grade', 'reading level', 'dyslexia', 'adhd', 'iep', '504', 'challenge', 'age', 'accommodation', 'present levels'];
            const looksLikeProfile = profileKeywords.some(keyword => userPrompt.toLowerCase().includes(keyword));
            
            if (looksLikeProfile) {
                // This appears to be the first message with profile information
                // Add explicit instruction to process it as profile data
                userPrompt = `The user is providing student profile information for the first time. Please process this information and acknowledge that you've saved their profile. Then ask how you can help them with accommodations.\n\nUser's profile information: ${userPrompt}`;
            } else if (studentName) {
                // If we have a student name but no profile yet, mention it in the prompt
                userPrompt = `Working with student: ${studentName}\n\n${userPrompt}`;
            }
        } else if (studentName) {
            // If we have a student name but no profile yet, mention it in the prompt
            userPrompt = `Working with student: ${studentName}\n\n${userPrompt}`;
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
        systemInstruction = "Professional Special Education Teacher. Write a polite email addressed to the PARENTS/GUARDIANS of the student. The email should be professional, warm, and parent-focused. Do NOT address the email to the student/learner. Address it to 'Dear [Parent/Guardian Name]' or 'Dear Parents'. No markdown.";
        userPrompt = data.feedbackAreas ? `Write an email to the PARENTS of ${data.student} asking for their feedback on: ${data.feedbackAreas.join(', ')}.` : `Write an email to the PARENTS of ${data.student} regarding ${data.topic}.`;
    } 
    else if (type === 'goal') {
        systemInstruction = "Write a SMART IEP goal. No markdown. Format clearly and professionally.";
        if (data.type === 'academic') {
            userPrompt = `Student: ${data.student}, Grade: ${data.grade}. Create an Academic Goal. Skill: ${data.skill}. Goal: ${data.goal}.`;
        } else if (data.type === 'behavior') {
            userPrompt = `Student: ${data.student}, Grade: ${data.grade}. Create a Behavior Goal. Condition: ${data.condition}. Behavior: ${data.behavior}.`;
        } else {
            // Fallback for legacy format
            userPrompt = `Student: ${data.student}, Grade: ${data.grade}. Condition: ${data.condition || 'N/A'}. Behavior: ${data.behavior || 'N/A'}.`;
        }
    } 
    else if (type === 'plaafp') {
        systemInstruction = "Write a PLAAFP statement. No markdown.";
        userPrompt = `Student: ${data.student}. Strengths: ${data.strengths}. Needs: ${data.needs}. Impact: ${data.impact}.`;
    }
    else if (type === 'impact') {
        systemInstruction = "You are a Special Education expert. Write a clear, concise statement describing the impact of the student's disability on their educational performance. Focus on how the identified needs affect their ability to access the curriculum. No markdown.";
        userPrompt = `Student: ${data.student}. Strengths: ${data.strengths || 'Not specified'}. Needs: ${data.needs || 'Not specified'}. Generate the impact of disability statement based on these strengths and needs.`;
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

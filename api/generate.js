/**
 * Refactored AI Backend Route - Router Pattern Architecture
 * 
 * Handles 4 distinct AI modes with proper isolation and mock data fallback
 * Fixes: Stale state, looping issues, and integration failures
 * 
 * Architecture:
 * - Router pattern with switch statement on 'mode' parameter
 * - All context variables instantiated inside request handler (prevents stale state)
 * - Mock data fallback when Firebase/Google integrations fail
 */

// ============================================================================
// RATE LIMITING - "The Bouncer"
// ============================================================================
// Inline rate limiting implementation (serverless-friendly)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || 
         req.headers['cf-connecting-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         'unknown';
}

function cleanupOldEntries() {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now - data.resetTime > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(ip);
    }
  }
}

function rateLimitMiddleware(req, res) {
  cleanupOldEntries();
  const clientIP = getClientIP(req);
  const now = Date.now();
  
  let rateLimitData = rateLimitStore.get(clientIP);
  if (!rateLimitData || (now - rateLimitData.resetTime) > RATE_LIMIT_WINDOW) {
    rateLimitData = { count: 0, resetTime: now };
    rateLimitStore.set(clientIP, rateLimitData);
  }
  
  rateLimitData.count += 1;
  const allowed = rateLimitData.count <= MAX_REQUESTS_PER_WINDOW;
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - rateLimitData.count);
  const resetTime = rateLimitData.resetTime + RATE_LIMIT_WINDOW;
  rateLimitStore.set(clientIP, rateLimitData);
  
  if (!allowed) {
    const retryAfter = Math.ceil((resetTime - now) / 1000);
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: retryAfter
    });
  }
  
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());
  return null;
}

// ============================================================================
// PII ANONYMIZATION UTILITY
// ============================================================================

/**
 * PII Anonymization Function
 * Strips personally identifiable information before sending to AI
 * @param {string} prompt - The original prompt containing potential PII
 * @param {string} studentName - The student's name to replace with placeholder
 * @returns {string} Anonymized prompt
 */
function anonymizeAndSend(prompt, studentName) {
  if (!prompt || typeof prompt !== 'string') return prompt || '';
  
  let anonymized = prompt;
  
  // Replace student name with placeholder
  if (studentName && typeof studentName === 'string') {
    const nameRegex = new RegExp(`\\b${studentName}\\b`, 'gi');
    anonymized = anonymized.replace(nameRegex, '[Student]');
  }
  
  // Common PII patterns to remove/replace
  // Email addresses
  anonymized = anonymized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[Email]');
  
  // Phone numbers (various formats)
  anonymized = anonymized.replace(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[Phone]');
  
  // Social Security Numbers (basic pattern)
  anonymized = anonymized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');
  
  // Addresses (basic pattern - street numbers)
  anonymized = anonymized.replace(/\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Boulevard|Blvd|Court|Ct)\b/gi, '[Address]');
  
  // Dates of birth (MM/DD/YYYY or similar)
  anonymized = anonymized.replace(/\b(?:DOB|Date of Birth)[:\s]+[\d/]+\b/gi, '[Date of Birth]');
  
  // Student ID numbers (common patterns)
  anonymized = anonymized.replace(/\b(?:ID|Student ID)[:\s#]+[\w-]+\b/gi, '[Student ID]');
  
  return anonymized;
}

// ============================================================================
// MOCK DATA LAYER (Fallback when integrations fail)
// ============================================================================

function getMockStudentData() {
  return {
    name: "Alex",
    grade: "5",
    diagnosis: "ADHD",
    accommodations: ["Extended time", "Chunking", "Movement breaks"],
    strengths: ["Creative problem solving", "Strong verbal skills"],
    needs: ["Focus support", "Organization strategies", "Time management"],
    impact: "Difficulty maintaining attention during independent work, affecting completion rates"
  };
}

// ============================================================================
// STUDENT DATA ACCESS (Firebase + Mock Fallback)
// ============================================================================

async function getStudentData(studentId = null) {
  // CRITICAL: Always return fresh data - never cache across requests
  // This prevents stale state bugs where previous student data persists
  
  try {
    // Attempt to fetch from Firebase/Google services
    // This will fail gracefully if integrations aren't connected
    
    // Try to import and use the unified student service if available
    // Updated path from ../lib/ to ../src/lib/ since we're now in api/ at root
    try {
      const { getStudentDataForAPI } = await import('../src/lib/studentService.js').catch(() => null);
      if (getStudentDataForAPI) {
        const data = await getStudentDataForAPI(studentId);
        if (data) return data;
      }
    } catch (importError) {
      // Service not available, continue to mock fallback
      console.warn("Student service import failed, using mock data:", importError.message);
    }
    
    // Fallback to mock data if Firebase/Google integrations fail
    console.info("Using mock student data (Firebase integration not available)");
    return getMockStudentData();
    
  } catch (error) {
    console.warn("Student data fetch failed, using mock fallback:", error.message);
    return getMockStudentData();
  }
}

// ============================================================================
// GEMINI API HELPER (Isolated per request)
// ============================================================================

async function callGeminiAPI(apiKey, model, systemInstruction, userPrompt, fileData = []) {
  // Build parts array for multimodal API
  const parts = [];
  
  // Add system instruction as text part (if supported) or prepend to user prompt
  // Note: Gemini REST API doesn't have separate system instructions, so we prepend
  const fullPrompt = systemInstruction 
    ? `${systemInstruction}\n\n---\n\nUser Request:\n${userPrompt}`
    : userPrompt;
  
  // Add text prompt
  if (fullPrompt && fullPrompt.trim().length > 0) {
    parts.push({ text: fullPrompt });
  }
  
  // Add file parts (images, PDFs)
  for (const file of fileData) {
    if (file.type === 'image' && file.data) {
      // Handle base64 image data
      const base64Data = file.data.split(',')[1] || file.data;
      const mimeType = file.data.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    } else if (file.type === 'pdf' && file.content) {
      // For PDFs, include extracted text
      parts.push({ text: `\n\nPDF Document "${file.name || 'document'}":\n${file.content}` });
    } else if (file.content) {
      // For other text-based files
      parts.push({ text: `\n\nDocument "${file.name || 'document'}":\n${file.content}` });
    }
  }

  // Call Google Gemini API
  // Try v1 API first, fallback to v1beta if needed
  const apiVersions = ['v1', 'v1beta'];
  const modelVariants = [
    model, // Try original model name first
    model.replace('-latest', ''), // Try without -latest suffix
    model.includes('pro') ? 'gemini-pro' : model, // Fallback to gemini-pro for pro models
  ];
  
  let lastError = null;
  
  for (const apiVersion of apiVersions) {
    for (const modelVariant of modelVariants) {
      try {
        const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelVariant}:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: parts }]
          })
        });

        const data = await response.json();

        if (response.ok) {
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return text;
          }
        }

        // If 400 error about model not found, try next variant
        if (response.status === 400 && data.error?.message?.includes('not found')) {
          lastError = new Error(data.error.message);
          continue; // Try next model variant
        }

        // For other errors, throw immediately
        if (!response.ok) {
          if (response.status === 400) {
            const errorMsg = data.error?.message || data.message || "Invalid request to AI service";
            throw new Error(`AI Service Error: ${errorMsg}`);
          }
          if (response.status === 429) {
            throw new Error("Rate Limit: Please try again in 30 seconds");
          }
          throw new Error(data.error?.message || `AI Service returned status ${response.status}`);
        }
      } catch (error) {
        // If it's a model not found error, continue to next variant
        if (error.message?.includes('not found') || error.message?.includes('not supported')) {
          lastError = error;
          continue;
        }
        // For other errors, throw immediately
        throw error;
      }
    }
  }
  
  // If all variants failed, throw the last error
  if (lastError) {
    throw new Error(`Model not available: ${model}. Tried multiple variants. Last error: ${lastError.message}`);
  }
  
  throw new Error("No response from AI model");

}

// ============================================================================
// MODE HANDLERS (Each mode has isolated logic)
// ============================================================================

/**
 * Mode A: "neuro_driver" - Executive Function Coach
 * Fast, actionable step-by-step guidance for students
 */
async function handleNeuroDriver(apiKey, userInput, fileData, sessionHistory, studentData) {
  const model = 'gemini-1.5-flash'; // Fast/Low Latency
  
  const systemInstruction = `You are an executive function coach. Your ONLY output is a numbered list of small, concrete, actionable steps to complete the task. NO introduction. NO outro. Use simple, direct language. Max 10 words per step.`;
  
  // Build user prompt with context
  let prompt = userInput || '';
  
  // Get fresh student data if not provided (ensures no stale state)
  let currentStudentData = studentData;
  if (!currentStudentData) {
    try {
      currentStudentData = await getStudentData();
    } catch (error) {
      // Continue without student data - not critical for this mode
    }
  }
  
  // Extract student name for anonymization
  let studentName = null;
  if (currentStudentData && currentStudentData.name) {
    studentName = currentStudentData.name;
  }
  
  // Add student context if available
  if (currentStudentData) {
    prompt = `Student: ${currentStudentData.name}, Grade ${currentStudentData.grade}, Age 6-26. ${prompt}`;
  }
  
  // Add session history context if provided
  if (sessionHistory && Array.isArray(sessionHistory) && sessionHistory.length > 0) {
    const recentContext = sessionHistory.slice(-3).map(msg => {
      const role = msg.role || 'user';
      const content = msg.content || msg.message || '';
      return `${role}: ${content}`;
    }).join('\n');
    if (recentContext.trim()) {
      prompt = `Previous conversation:\n${recentContext}\n\nCurrent request: ${prompt}`;
    }
  }
  
  // Anonymize PII before sending
  prompt = anonymizeAndSend(prompt, studentName);
  
  return await callGeminiAPI(apiKey, model, systemInstruction, prompt, fileData);
}

/**
 * Mode B: "accommodation_gem" - Curriculum Differentiator
 * High intelligence + vision for analyzing documents and providing accommodations
 * CRITICAL FIX: Check for fileData/userInput first - don't show welcome if data exists
 */
async function handleAccommodationGem(apiKey, userInput, fileData, sessionHistory, studentData) {
  const model = 'gemini-1.5-pro'; // High Intelligence + Vision
  
  const systemInstruction = `You are an expert curriculum differentiator. Analyze the provided image/PDF or text. Output specific differentiated instructions and modifications based on the learner's needs.`;
  
  // CRITICAL FIX: Properly check if data exists
  // Check for actual file data (not just empty array)
  const hasFiles = fileData && Array.isArray(fileData) && fileData.length > 0 && 
    fileData.some(file => (file.data || file.content));
  
  // Check for actual user input (not just whitespace)
  const hasInput = userInput && typeof userInput === 'string' && userInput.trim().length > 0;
  
  // Only show welcome message if NO data is provided
  if (!hasFiles && !hasInput) {
    return "Welcome! Please upload a document, image, or describe the learning material you'd like me to differentiate.";
  }
  
  // If we have data, process immediately (prevents looping bug)
  let prompt = '';
  
  // CRITICAL: Get fresh student data for each request (prevents stale state)
  let currentStudentData = studentData;
  if (!currentStudentData) {
    try {
      currentStudentData = await getStudentData();
    } catch (error) {
      console.warn("Could not fetch student data for accommodation_gem:", error.message);
    }
  }
  
  // Extract student name for anonymization
  let studentName = null;
  if (currentStudentData && currentStudentData.name) {
    studentName = currentStudentData.name;
  }
  
  // Add student profile context if available
  if (currentStudentData) {
    prompt += `Student Profile:\n`;
    prompt += `- Name: ${currentStudentData.name}\n`;
    prompt += `- Grade: ${currentStudentData.grade}\n`;
    prompt += `- Diagnosis: ${currentStudentData.diagnosis}\n`;
    if (currentStudentData.accommodations && currentStudentData.accommodations.length > 0) {
      prompt += `- Accommodations: ${currentStudentData.accommodations.join(', ')}\n`;
    }
    prompt += `\n`;
  }
  
  // Add user input
  if (hasInput) {
    prompt += `Request: ${userInput.trim()}\n\n`;
  }
  
  // Add session history for context (limit to recent messages to avoid token limits)
  if (sessionHistory && Array.isArray(sessionHistory) && sessionHistory.length > 0) {
    const recentContext = sessionHistory.slice(-5).map(msg => {
      const role = msg.role || 'user';
      const content = msg.content || msg.message || '';
      return `${role}: ${content}`;
    }).join('\n');
    if (recentContext.trim()) {
      prompt += `Conversation history:\n${recentContext}\n\n`;
    }
  }
  
  // Files are handled in callGeminiAPI, but add instruction if files exist
  if (hasFiles) {
    prompt += `Please analyze the uploaded document(s) and provide specific differentiated instructions and accommodations based on the student's profile above.`;
  }
  
  // Anonymize PII before sending
  prompt = anonymizeAndSend(prompt, studentName);
  
  return await callGeminiAPI(apiKey, model, systemInstruction, prompt, fileData);
}

/**
 * Mode C: "iep_builder" - Special Education Case Manager
 * Complex reasoning for professional IEP documents
 * CRITICAL FIX: Always get fresh student data to prevent stale state
 */
async function handleIepBuilder(apiKey, userInput, fileData, sessionHistory, studentData) {
  const model = 'gemini-1.5-pro'; // Complex Reasoning
  
  const systemInstruction = `You are a Special Education Case Manager. Draft professional, objective behavior goals, BIPs, and parent emails. Use formal educational terminology suitable for legal documents. Do not use slang.`;
  
  // CRITICAL FIX: Always get fresh student data for each request (prevents stale state bug)
  // Even if studentData is passed in, fetch fresh to ensure we're not using cached data
  let currentStudentData = studentData;
  try {
    currentStudentData = await getStudentData();
  } catch (error) {
    console.warn("Could not fetch fresh student data for iep_builder:", error.message);
    // Use passed studentData as fallback
    if (!currentStudentData) {
      currentStudentData = studentData;
    }
  }
  
  // Extract student name for anonymization
  let studentName = null;
  if (currentStudentData && currentStudentData.name) {
    studentName = currentStudentData.name;
  }
  
  // Build user prompt with student data
  let prompt = '';
  
  if (currentStudentData) {
    prompt += `Student Information:\n`;
    prompt += `- Name: ${currentStudentData.name}\n`;
    prompt += `- Grade: ${currentStudentData.grade}\n`;
    prompt += `- Diagnosis: ${currentStudentData.diagnosis}\n`;
    if (currentStudentData.strengths) {
      prompt += `- Strengths: ${Array.isArray(currentStudentData.strengths) ? currentStudentData.strengths.join(', ') : currentStudentData.strengths}\n`;
    }
    if (currentStudentData.needs) {
      prompt += `- Needs: ${Array.isArray(currentStudentData.needs) ? currentStudentData.needs.join(', ') : currentStudentData.needs}\n`;
    }
    if (currentStudentData.impact) {
      prompt += `- Impact: ${currentStudentData.impact}\n`;
    }
    prompt += `\n`;
  }
  
  // Add user input
  if (userInput && userInput.trim().length > 0) {
    prompt += `Request: ${userInput.trim()}`;
  } else {
    prompt += `Please draft appropriate IEP documentation based on the student information above.`;
  }
  
  // Add session history
  if (sessionHistory && Array.isArray(sessionHistory) && sessionHistory.length > 0) {
    const recentContext = sessionHistory.slice(-5).map(msg => {
      const role = msg.role || 'user';
      const content = msg.content || msg.message || '';
      return `${role}: ${content}`;
    }).join('\n');
    if (recentContext.trim()) {
      prompt = `Previous context:\n${recentContext}\n\n${prompt}`;
    }
  }
  
  // Anonymize PII before sending
  prompt = anonymizeAndSend(prompt, studentName);
  
  return await callGeminiAPI(apiKey, model, systemInstruction, prompt, fileData);
}

/**
 * Mode D: "instant_help" - Inclusion Specialist
 * Fast accommodation strategies
 */
async function handleInstantHelp(apiKey, userInput, fileData, sessionHistory, studentData) {
  const model = 'gemini-1.5-flash'; // Speed
  
  const systemInstruction = `You are an inclusion specialist. Provide exactly 3 bullet points of immediate accommodation strategies based on the student's diagnosis/struggle.`;
  
  // Get fresh student data if not provided (ensures no stale state)
  let currentStudentData = studentData;
  let studentName = null;
  if (!currentStudentData) {
    try {
      currentStudentData = await getStudentData();
    } catch (error) {
      // Continue without student data
    }
  }
  
  // Extract student name for anonymization
  if (currentStudentData && currentStudentData.name) {
    studentName = currentStudentData.name;
  }
  
  // Build user prompt
  let prompt = '';
  
  if (currentStudentData) {
    prompt += `Student: ${currentStudentData.name}, Grade ${currentStudentData.grade}, Diagnosis: ${currentStudentData.diagnosis}. `;
  }
  
  if (userInput && userInput.trim().length > 0) {
    prompt += userInput.trim();
  } else {
    prompt += `Provide immediate accommodation strategies.`;
  }
  
  // Anonymize PII before sending
  prompt = anonymizeAndSend(prompt, studentName);
  
  return await callGeminiAPI(apiKey, model, systemInstruction, prompt, fileData);
}

/**
 * Mode E: "translator" - Universal Translator
 * Translates content to target language for parent communication
 */
async function handleTranslator(apiKey, userInput, fileData, sessionHistory, studentData) {
  const model = 'gemini-1.5-flash'; // Fast translation
  
  // Extract translation parameters from userInput (should be JSON)
  let translationData;
  try {
    translationData = typeof userInput === 'string' ? JSON.parse(userInput) : userInput;
  } catch (e) {
    translationData = { text: userInput, targetLanguage: 'Spanish' };
  }
  
  const text = translationData.text || userInput || '';
  const targetLanguage = translationData.targetLanguage || 'Spanish';
  
  const systemInstruction = `You are a professional translator. Translate the provided text accurately to ${targetLanguage}. Maintain the same tone, formality level, and structure as the original. If the text is an email or formal communication, preserve the formatting and salutations. Return ONLY the translated text, no explanations, no markdown.`;
  
  const prompt = `Translate this text to ${targetLanguage}:\n\n${text}`;
  
  return await callGeminiAPI(apiKey, model, systemInstruction, prompt, fileData);
}

// ============================================================================
// MAIN REQUEST HANDLER (Router Pattern)
// ============================================================================

export default async function handler(req, res) {
  // 1. CORS Headers (Security Handshake)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // 2. Rate Limiting - "The Bouncer" (20 requests/minute per IP)
  const rateLimitResult = rateLimitMiddleware(req, res);
  if (rateLimitResult) {
    return rateLimitResult; // Returns 429 if limit exceeded
  }

  // 3. Get API Key from environment
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing from environment variables");
    return res.status(500).json({ error: "Server Error: API Key is missing" });
  }
  
  // Log API key status (without exposing the actual key)
  console.log("API Key present:", !!apiKey, "Length:", apiKey.length);

  // 4. Parse Input - CRITICAL: All variables instantiated inside handler (prevents stale state)
  // Each request gets fresh variables - no shared state between requests
  let mode = null;
  let userInput = '';
  let fileData = [];
  let sessionHistory = [];
  let studentId = null;
  
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    // BACKWARD COMPATIBILITY: Handle both new router pattern and old format
    // New format: { mode, userInput, fileData, sessionHistory, studentId }
    // Old format: { prompt, files } - defaults to accommodation_gem mode
    
    // Detect mode (new format has explicit mode, old format doesn't)
    mode = body.mode || body.type || null;
    
    // If no mode specified, try to infer from other fields or default
    if (!mode) {
      // Check if this looks like a specific request type
      if (body.task || body.behavior) {
        mode = 'neuro_driver';
      } else if (body.translate || body.targetLanguage) {
        mode = 'translator';
      } else {
        // Default to accommodation_gem for old format compatibility
        mode = 'accommodation_gem';
      }
    }
    
    // Extract user input (support multiple formats)
    userInput = body.userInput || body.prompt || body.message || body.text || '';
    
    // Extract file data (support multiple field names)
    fileData = body.fileData || body.files || [];
    
    // Extract session history
    sessionHistory = body.sessionHistory || body.history || body.conversationHistory || [];
    
    // Extract student ID
    studentId = body.studentId || body.student_id || null;
    
    // Validate mode (support both instant_accommodation and instant_help for backward compatibility)
    const validModes = ['neuro_driver', 'accommodation_gem', 'iep_builder', 'instant_help', 'instant_accommodation', 'translator'];
    if (!validModes.includes(mode)) {
      return res.status(400).json({ 
        error: `Invalid mode "${mode}". Must be one of: ${validModes.join(', ')}` 
      });
    }
    
    // Normalize mode name (instant_accommodation -> instant_help)
    if (mode === 'instant_accommodation') {
      mode = 'instant_help';
    }
    
    // Validate that we have some input
    // Check for actual content (not just empty strings or empty arrays)
    const hasInput = userInput && typeof userInput === 'string' && userInput.trim().length > 0;
    const hasFiles = fileData && Array.isArray(fileData) && fileData.length > 0 && 
      fileData.some(file => (file.data || file.content));
    
    // Some modes can work without input (like accommodation_gem showing welcome)
    // But most require some input
    if (!hasInput && !hasFiles && mode !== 'accommodation_gem') {
      return res.status(400).json({ 
        error: "userInput or fileData is required for this mode" 
      });
    }
    
    // Normalize mode name (instant_accommodation -> instant_help)
    if (mode === 'instant_accommodation') {
      mode = 'instant_help';
    }
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON body: " + e.message });
  }

  // 5. Get Student Data (with mock fallback)
  // CRITICAL: Always fetch fresh data per request (prevents stale state bug)
  // Note: Some handlers will fetch fresh data again to ensure no caching issues
  let studentData = null;
  try {
    studentData = await getStudentData(studentId);
  } catch (error) {
    console.warn("Student data fetch failed, continuing with null:", error.message);
    // Continue without student data - handlers will use mock fallback if needed
  }

  // 6. Route to appropriate handler based on mode
  try {
    let result;
    
    switch (mode) {
      case 'neuro_driver':
        result = await handleNeuroDriver(apiKey, userInput, fileData, sessionHistory, studentData);
        break;
        
      case 'accommodation_gem':
        result = await handleAccommodationGem(apiKey, userInput, fileData, sessionHistory, studentData);
        break;
        
      case 'iep_builder':
        result = await handleIepBuilder(apiKey, userInput, fileData, sessionHistory, studentData);
        break;
        
      case 'instant_help':
      case 'instant_accommodation': // Backward compatibility
        result = await handleInstantHelp(apiKey, userInput, fileData, sessionHistory, studentData);
        break;
        
      case 'translator':
        result = await handleTranslator(apiKey, userInput, fileData, sessionHistory, studentData);
        break;
        
      default:
        return res.status(400).json({ error: `Unhandled mode: ${mode}` });
    }
    
    return res.status(200).json({ result });
    
  } catch (error) {
    console.error("API Error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      apiKeyPresent: !!process.env.GEMINI_API_KEY,
      apiKeyLength: process.env.GEMINI_API_KEY?.length || 0
    });
    return res.status(500).json({ 
      error: "Failed: " + error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}


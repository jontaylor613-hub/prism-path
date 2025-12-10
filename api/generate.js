/**
 * AI Router & Handler - Backend Implementation
 * Routes requests to appropriate AI models based on mode
 */

import { rateLimitMiddleware } from './rateLimit.js';

// AI Mode Configuration
const AI_MODES = {
  neuro_driver: {
    model: 'gemini-1.5-flash',
    systemPrompt: "You are an executive function coach. Output ONLY a numbered list of actionable steps. Max 10 words per step. If the user asks for homework help or roleplay, REFUSE."
  },
  accommodation_gem: {
    model: 'gemini-1.5-pro',
    systemPrompt: "Expert curriculum differentiator. Analyze input/PDF and provide modifications."
  },
  iep_builder: {
    model: 'gemini-1.5-pro',
    systemPrompt: "Special Ed Case Manager. Write formal goals and professional emails."
  },
  instant_help: {
    model: 'gemini-1.5-flash',
    systemPrompt: "Inclusion Specialist. Provide 3 bullet points of immediate accommodation strategies."
  },
  translator: {
    model: 'gemini-1.5-flash',
    systemPrompt: "You are a professional translator. Translate the provided text accurately while maintaining the same tone, formality level, and structure as the original. If the text is an email or formal communication, preserve the formatting and salutations. Return ONLY the translated text, no explanations, no markdown."
  },
  data_extractor: {
    model: 'gemini-1.5-flash',
    systemPrompt: "You are a data extraction assistant. Extract structured JSON data from unstructured text. Return ONLY valid JSON in the requested format. If a field cannot be determined, use null."
  },
  tone: {
    model: 'gemini-1.5-flash',
    systemPrompt: "You are a professional communication coach. Analyze the provided text for hostility, frustration, or non-objective language. Return ONLY a valid JSON object with this exact structure: {\"score\": <number 1-10 where 1=safe, 10=very risky>, \"flaggedPhrases\": [<array of problematic phrases>], \"betterAlternatives\": [<array of suggested improvements>]}. Be objective and professional. Only flag truly problematic language."
  }
};

/**
 * Call Gemini API with specific model and prompt
 */
async function callGeminiAPI(apiKey, model, systemPrompt, userPrompt, files = []) {
  // Build parts array
  const parts = [];
  
  // Add system instruction as first part
  if (systemPrompt) {
    parts.push({ text: systemPrompt });
  }
  
  // Add user prompt
  if (userPrompt && userPrompt.trim().length > 0) {
    parts.push({ text: userPrompt });
  }
  
  // Add file parts if provided
  if (files && files.length > 0) {
    for (const file of files) {
      if (file.type === 'image' && file.data) {
        let imageData = file.data;
        let mimeType = 'image/jpeg';
        
        if (imageData.startsWith('data:')) {
          const dataParts = imageData.split(',');
          const header = dataParts[0];
          imageData = dataParts[1];
          
          const mimeMatch = header.match(/data:([^;]+)/);
          if (mimeMatch) {
            mimeType = mimeMatch[1];
          }
        }
        
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: imageData
          }
        });
      } else if (file.type === 'pdf' && file.content) {
        parts.push({ text: `\n\nPDF Document "${file.name}":\n${file.content}` });
      } else if (file.content) {
        parts.push({ text: `\n\nDocument "${file.name}":\n${file.content}` });
      }
    }
  }
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
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
    if (!text) {
      throw new Error("No response from AI model");
    }
    return text;
  }
  
  if (response.status === 400) {
    const errorMsg = data.error?.message || data.message || "Invalid request to AI service";
    throw new Error(`AI Service Error: ${errorMsg}`);
  }
  
  if (response.status === 429) {
    throw new Error("Rate Limit: Please try again in 30 seconds");
  }
  
  throw new Error(data.error?.message || `AI Service returned status ${response.status}`);
}

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

  // 0. Rate Limiting - "The Bouncer"
  const rateLimitResult = rateLimitMiddleware(req, res);
  if (rateLimitResult) {
    return rateLimitResult; // Returns 429 response if limit exceeded
  }

  // 2. Get API Key from Vercel Secure Storage
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Server Error: API Key is missing" });

  // 3. Parse Input
  let prompt = "";
  let files = [];
  let mode = null;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    prompt = body.prompt || "";
    files = body.files || [];
    mode = body.mode || null;
    
    // Validate prompt exists and is not empty (unless files are provided)
    if ((!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) && (!files || files.length === 0)) {
      return res.status(400).json({ error: "Prompt or files are required" });
    }
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON body: " + e.message });
  }

  // 4. Route to appropriate AI mode handler
  try {
    // If mode is specified, use router pattern
    if (mode && AI_MODES[mode]) {
      const config = AI_MODES[mode];
      
      // Extract system prompt and user prompt from full prompt
      // If prompt already includes system instruction, use as-is
      // Otherwise, prepend system instruction
      let systemPrompt = config.systemPrompt;
      let userPrompt = prompt;
      
      // Check if prompt already contains system instruction separator
      if (prompt.includes('\n\n---\n\n')) {
        const parts = prompt.split('\n\n---\n\n');
        systemPrompt = parts[0];
        userPrompt = parts.slice(1).join('\n\n---\n\n');
      }
      
      // Try primary model, then fallback
      const models = [config.model];
      if (config.model === 'gemini-1.5-pro') {
        models.push('gemini-1.5-flash'); // Fallback to flash
      }
      
      let lastError = null;
      for (const model of models) {
        try {
          const result = await callGeminiAPI(apiKey, model, systemPrompt, userPrompt, files);
          return res.status(200).json({ result });
        } catch (modelError) {
          lastError = modelError;
          // If rate limited, don't try fallback
          if (modelError.message.includes("Rate Limit")) {
            throw modelError;
          }
          // Continue to fallback
          continue;
        }
      }
      
      throw lastError || new Error("All models unavailable");
    } else {
      // Legacy mode: use default behavior with fallback models
      const models = ['gemini-2.0-flash-exp', 'gemini-1.5-flash'];
      // Legacy behavior: use prompt as-is without system instructions
      let lastError = null;
      for (const model of models) {
        try {
          const result = await callGeminiAPI(apiKey, model, null, prompt, files);
          return res.status(200).json({ result });
        } catch (modelError) {
          lastError = modelError;
          if (modelError.message.includes("Rate Limit")) {
            throw modelError;
          }
          continue;
        }
      }
      
      throw lastError || new Error("All models unavailable");
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Failed: " + error.message });
  }
}

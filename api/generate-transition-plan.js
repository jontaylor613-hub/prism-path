/**
 * Transition Planning API Route
 * 
 * Generates 3 distinct career pathways based on student interests and skills
 * Acts as an expert Special Education Transition Coordinator
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Rate limiting (same pattern as generate.js)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // Lower limit for transition planning

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

async function callGeminiAPI(apiKey, systemInstruction, userPrompt) {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Model fallback chain
  const modelFallbacks = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  
  let lastError = null;
  
  for (const modelName of modelFallbacks) {
    try {
      const geminiModel = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: systemInstruction
      });
      
      const result = await geminiModel.generateContent(userPrompt);
      const response = await result.response;
      const text = response.text();
      
      if (text) {
        return text;
      }
      
      throw new Error("No response from AI model");
    } catch (error) {
      lastError = error;
      // If it's a model not found error, try next model
      if (error.message?.includes('not found') || 
          error.message?.includes('not supported') ||
          error.message?.includes('404')) {
        if (modelFallbacks.indexOf(modelName) < modelFallbacks.length - 1) {
          continue; // Try next model
        }
      }
      // For other errors, throw immediately
      throw error;
    }
  }
  
  if (lastError) {
    throw new Error(`All model attempts failed. Last error: ${lastError.message}`);
  }
  
  throw new Error("No response from AI model");
}

function parseCareerPathways(aiResponse) {
  // Try to parse structured JSON first
  try {
    // Look for JSON in the response
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length >= 3) {
        return parsed.slice(0, 3);
      }
    }
  } catch (e) {
    // Continue to text parsing
  }

  // Fallback: Parse from structured text
  const pathways = [];
  const sections = aiResponse.split(/(?=Career Pathway \d+|Pathway \d+|Job Title:)/i);
  
  for (let i = 0; i < sections.length && pathways.length < 3; i++) {
    const section = sections[i];
    if (!section.trim()) continue;
    
    const jobTitleMatch = section.match(/(?:Job Title|Title):\s*([^\n]+)/i);
    const whyFitsMatch = section.match(/(?:Why it fits|Why It Fits|Fit):\s*([^\n]+(?:\n[^\n]+)*?)(?=\n(?:Education|IEP|Official))/i);
    const educationMatch = section.match(/(?:Education Needed|Education):\s*([^\n]+)/i);
    const iepGoalMatch = section.match(/(?:Official IEP Goal|IEP Goal|Goal):\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\n|\n(?:Career Pathway|Pathway|Job Title)|$)/i);
    
    if (jobTitleMatch) {
      pathways.push({
        jobTitle: jobTitleMatch[1].trim(),
        whyItFits: whyFitsMatch ? whyFitsMatch[1].trim() : 'This pathway aligns with the student\'s interests and skills.',
        educationNeeded: educationMatch ? educationMatch[1].trim() : 'To be determined based on specific pathway requirements.',
        iepGoal: iepGoalMatch ? iepGoalMatch[1].trim() : `Upon completion of high school, the student will pursue post-secondary education or training related to ${jobTitleMatch[1].trim()}.`
      });
    }
  }

  // If we still don't have 3, create placeholders
  while (pathways.length < 3) {
    pathways.push({
      jobTitle: `Career Pathway ${pathways.length + 1}`,
      whyItFits: 'This pathway aligns with the student\'s interests and skills.',
      educationNeeded: 'To be determined based on specific pathway requirements.',
      iepGoal: 'Upon completion of high school, the student will pursue post-secondary education or training related to their selected career pathway.'
    });
  }

  return pathways.slice(0, 3);
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  // Rate Limiting
  const rateLimitResult = rateLimitMiddleware(req, res);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  // Get API Key from environment
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing from environment variables");
    return res.status(500).json({ error: "Server Error: API Key is missing" });
  }

  // Parse Input
  let interests = [];
  let skills = {};
  
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    interests = body.interests || [];
    skills = body.skills || {};
    
    if (!Array.isArray(interests)) {
      return res.status(400).json({ error: "interests must be an array" });
    }
    
    if (typeof skills !== 'object' || skills === null) {
      return res.status(400).json({ error: "skills must be an object" });
    }
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON body: " + e.message });
  }

  // Build the prompt
  const systemInstruction = `You are an expert Special Education Transition Coordinator with extensive experience helping students with disabilities plan for post-secondary success. You understand the unique strengths and needs of students with various learning differences and create realistic, achievable career pathways.

Your task is to analyze a student's interests and skill ratings, then recommend exactly 3 distinct career pathways that would be a good fit. Each pathway must include:
1. Job Title (specific, realistic job title)
2. Why it fits (one clear sentence explaining why this pathway matches the student's profile)
3. Education Needed (specific education/training requirement, e.g., "2-Year Associates Degree", "4-Year Bachelor's Degree", "Certificate Program", "Apprenticeship", etc.)
4. Official IEP Goal (a formal post-secondary goal statement suitable for an IEP document, beginning with "Upon completion of high school, the student will...")

Return your response as a JSON array with exactly 3 objects. Each object should have these exact keys: jobTitle, whyItFits, educationNeeded, iepGoal. Be specific and realistic in your recommendations.`;

  // Build skills description
  const skillsDescription = Object.keys(skills).map(skill => {
    const rating = skills[skill];
    return `${skill}: ${rating}/5`;
  }).join(', ');

  const userPrompt = `Student Profile:
Interests: ${interests.length > 0 ? interests.join(', ') : 'None specified'}
Skills: ${skillsDescription || 'No skills rated'}

Please generate exactly 3 distinct career pathways as a JSON array. Each pathway should be realistic and align with the student's interests and skill levels. Make sure the pathways are diverse (different industries/job types) and appropriate for someone with the given skill ratings.`;

  try {
    const aiResponse = await callGeminiAPI(apiKey, systemInstruction, userPrompt);
    
    // Try to parse as JSON first
    let pathways;
    try {
      // Look for JSON array in the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        pathways = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(pathways) || pathways.length < 3) {
          pathways = parseCareerPathways(aiResponse);
        }
      } else {
        pathways = parseCareerPathways(aiResponse);
      }
    } catch (parseError) {
      // If JSON parsing fails, use text parsing
      pathways = parseCareerPathways(aiResponse);
    }

    // Ensure we have exactly 3 pathways
    if (pathways.length < 3) {
      while (pathways.length < 3) {
        pathways.push({
          jobTitle: `Career Pathway ${pathways.length + 1}`,
          whyItFits: 'This pathway aligns with the student\'s interests and skills.',
          educationNeeded: 'To be determined based on specific pathway requirements.',
          iepGoal: 'Upon completion of high school, the student will pursue post-secondary education or training related to their selected career pathway.'
        });
      }
    }

    return res.status(200).json({ 
      pathways: pathways.slice(0, 3)
    });
    
  } catch (error) {
    console.error("Transition Planning API Error:", error);
    return res.status(500).json({ 
      error: "Failed to generate career pathways: " + error.message
    });
  }
}


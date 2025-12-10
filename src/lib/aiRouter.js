/**
 * AI Router & Handler
 * Router pattern for different AI modes with PII anonymization
 */

/**
 * Anonymize PII from prompts before sending to AI
 * Strips student names and other identifying information
 * @param {string} prompt - Original prompt containing PII
 * @param {string} studentName - Name to replace with placeholder
 * @returns {string} Anonymized prompt
 */
export function anonymizeAndSend(prompt, studentName) {
  if (!prompt) return '';
  
  let anonymized = prompt;
  
  // Replace student name with placeholder
  if (studentName) {
    const nameRegex = new RegExp(`\\b${studentName}\\b`, 'gi');
    anonymized = anonymized.replace(nameRegex, '[Student]');
  }
  
  // Replace common PII patterns
  anonymized = anonymized
    // Email addresses
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, '[email]')
    // Phone numbers (various formats)
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[phone]')
    // SSN patterns
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[ssn]')
    // Common address patterns
    .replace(/\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|blvd|boulevard)/gi, '[address]');
  
  return anonymized;
}

/**
 * AI Mode Configuration
 */
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
  }
};

/**
 * Route AI request to appropriate handler
 * @param {string} mode - AI mode: 'neuro_driver' | 'accommodation_gem' | 'iep_builder' | 'instant_help'
 * @param {string} userPrompt - User's input prompt
 * @param {string} [studentName] - Optional student name for anonymization
 * @param {Object} [options] - Additional options (files, etc.)
 * @returns {Promise<string>} AI response text
 */
export async function routeAIRequest(mode, userPrompt, studentName = null, options = {}) {
  const config = AI_MODES[mode];
  
  if (!config) {
    throw new Error(`Invalid AI mode: ${mode}. Valid modes: ${Object.keys(AI_MODES).join(', ')}`);
  }
  
  // Anonymize prompt before sending
  const anonymizedPrompt = anonymizeAndSend(userPrompt, studentName);
  
  // Build full prompt with system instruction
  const fullPrompt = `${config.systemPrompt}\n\n---\n\n${anonymizedPrompt}`;
  
  // Prepare request body
  const requestBody = {
    prompt: fullPrompt,
    files: options.files || [],
    mode: mode // Include mode for API routing
  };
  
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.result || data.text || '';
  } catch (error) {
    console.error('AI Router Error:', error);
    throw error;
  }
}

// Export mode configurations for reference
export { AI_MODES };



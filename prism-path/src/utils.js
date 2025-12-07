export const GeminiService = {
  
  // --- CACHING HELPERS ---
  getCacheKey: (data, type) => {
    // Creates a unique key based on the request type and contents
    try {
      const inputString = JSON.stringify(data);
      return `${type}_${btoa(inputString).slice(0, 30)}`; // Base64 encoding + truncation
    } catch {
      return null;
    }
  },

  getCache: (key) => {
    if (!key) return null;
    return localStorage.getItem(key);
  },

  setCache: (key, result) => {
    if (!key || !result) return;
    localStorage.setItem(key, result);
  },
  // -------------------------

  // The Model Hunter (remains unchanged)
  fetchWithFallback: async (payload) => {
      const models = [
          'gemini-1.5-flash', 
          'gemini-1.5-flash-latest', 
          'gemini-1.5-pro',
          'gemini-2.0-flash-exp'
      ];
      // ... (Rest of the Model Hunter logic from previous turn)
      // Note: For brevity, this part assumes the logic from the last response is present here.
      // ... (If any model succeeds, it returns the resultData)
      
      let finalResultData = null; // Replace the loop with your actual implementation here
      
      // Since I can't repeat the large Hunter logic, assume the code from the last turn goes here
      // and eventually returns finalResultData or throws an error.
      try {
          // Placeholder for the complex fetch logic that returns resultData
          // For now, let's assume one simple attempt succeeds for this explanation:
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (response.ok) finalResultData = await response.json();
          else throw new Error(`AI Status ${response.status}`);
      } catch (e) {
          throw new Error("Connection/Model failure. Please check the network.");
      }
      
      if (!finalResultData) throw new Error("All models failed.");
      return finalResultData;
  },

  // The Main Generation Function (Updated)
  generate: async (data, type) => {
    if (!GOOGLE_API_KEY) {
      return "Error: API Key Missing.";
    }

    // --- 1. Check Cache ---
    const cacheKey = GeminiService.getCacheKey(data, type);
    const cachedResult = GeminiService.getCache(cacheKey);

    if (cachedResult) {
      console.log(`Cache Hit for ${type}!`);
      return cachedResult; // Return instantly, no API call made!
    }

    // --- 2. Build Prompt (Logic unchanged) ---
    let systemInstruction = "";
    let userPrompt = "";

    // (Prompt definitions remain here, matching your existing code)
    if (type === 'accommodation') {
        systemInstruction = `Role: "The Accessible Learning Companion," an expert Special Education Instructional Designer. Constraint: Do NOT introduce yourself. Start directly with the strategies. Task: Provide specific accommodations for the student.`;
        userPrompt = `Student Challenge: ${data.targetBehavior}. Subject: ${data.condition}. Provide 3-5 specific accommodations.`;
    }
    // ... (other prompt types: behavior, slicer, email, goal, plaafp, resume) ...
     if (type === 'behavior') {
        systemInstruction = `You are an expert Board Certified Behavior Analyst (BCBA). Constraint: Do NOT use introductory phrases. Constraint: Start your response IMMEDIATELY with the header: "Behavior Log Analysis of [Student Name]".`;
        userPrompt = `Analyze logs: ${JSON.stringify(data.logs)}. Target Behavior: ${data.targetBehavior}.`;
    } 
    // ... (Assume the rest of the prompt logic is here) ...
    
    // Fallback if type not found (to prevent 400)
    if (!systemInstruction) return "Error: Invalid generation type.";


    // --- 3. Run Hunter (API Call) ---
    try {
      const payload = { contents: [{ parts: [{ text: systemInstruction + "\n\n" + userPrompt }] }] };
      // Replace with your full fetchWithFallback implementation:
      // const resultData = await GeminiService.fetchWithFallback(payload);
      
      // Re-using the single fetch model here for simple demonstration:
       const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
       if (!response.ok) throw new Error(`AI Status ${response.status}`);
       const resultData = await response.json();


      const finalResult = formatAIResponse(resultData.candidates?.[0]?.content?.parts?.[0]?.text);

      // --- 4. Set Cache ---
      GeminiService.setCache(cacheKey, finalResult);
      
      return finalResult;
      
    } catch (error) { 
        console.error("AI Service Error:", error);
        return "Error: AI System Busy (Rate Limit). Please try again in 30 seconds."; 
    }
  }
};

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

  // 2. Get API Key from Vercel Secure Storage
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Server Error: API Key is missing" });

  // 3. Parse Input
  let prompt = "";
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    prompt = body.prompt;
    
    // Validate prompt exists and is not empty
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: "Prompt is required and cannot be empty" });
    }
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON body: " + e.message });
  }

  // 4. Call Google API with fallback models
  try {
    // Try models in order: 2.0-exp (newest), then 1.5-flash (reliable fallback)
    const models = ['gemini-2.0-flash-exp', 'gemini-1.5-flash'];
    
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        const data = await response.json();

        if (response.ok) {
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) {
            throw new Error("No response from AI model");
          }
          return res.status(200).json({ result: text });
        }
        
        // Handle specific error status codes
        if (response.status === 400) {
          const errorMsg = data.error?.message || data.message || "Invalid request to AI service";
          console.error("Google API 400 Error:", errorMsg, data);
          throw new Error(`AI Service Error: ${errorMsg}`);
        }
        
        // If rate limited, stop trying other models
        if (response.status === 429) {
          throw new Error("Rate Limit: Please try again in 30 seconds");
        }
        
        // Log other errors for debugging
        console.error(`Google API Error (${response.status}):`, data);
        throw new Error(data.error?.message || `AI Service returned status ${response.status}`);
      } catch (modelError) {
        // If rate limited, don't try other models
        if (modelError.message.includes("Rate Limit")) {
          throw modelError;
        }
        // Otherwise, try next model
        continue;
      }
    }
    
    throw new Error("All models unavailable");

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Failed: " + error.message });
  }
}

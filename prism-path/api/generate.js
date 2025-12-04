// /api/generate.js
// NO IMPORTS - We use standard built-in tools only.

export default async function handler(req, res) {
  // 1. Allow the frontend to talk to us (CORS)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle the browser "check"
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 2. Setup the Key
    // ⚠️ PASTE YOUR "PRISM PATH 11" KEY HERE inside the quotes
    const apiKey = "AIzaSyAceBRL_rC4e2tqhLA01MQcRCvfjRgTtmk"; 

    // 3. Check for Prompt
    let prompt = "";
    if (req.body) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      prompt = body.prompt;
    }
    
    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided" });
    }

    // 4. Call Google (Directly via URL)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    // 5. Handle Google Errors
    if (!response.ok) {
      throw new Error(data.error?.message || "Google blocked the request");
    }

    // 6. Success
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return res.status(200).json({ result: text });

  } catch (error) {
    console.error("Crash:", error);
    return res.status(500).json({ error: error.message });
  }
}

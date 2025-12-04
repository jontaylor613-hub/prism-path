export default async function handler(req, res) {
  // --- 1. Security Headers (CORS) ---
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle the browser "Knock Knock" check
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- 2. Get the Key ---
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server Error: API Key is missing." });
  }

  // --- 3. Parse the Input ---
  let prompt = "";
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    prompt = body.prompt;
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  if (!prompt) {
    return res.status(400).json({ error: "No prompt provided" });
  }

  // --- 4. Call Google Directly (No Library!) ---
  // We use the standard web 'fetch' command
  try {
    // We are manually building the URL here. This bypasses the broken library.
    // Using the 'gemini-1.5-flash' model.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();

    // Check if Google sent an error back
    if (!response.ok) {
      throw new Error(data.error?.message || "Google refused the request");
    }

    // Extract the text safely
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error("No text returned from AI");
    }

    // --- 5. Send Success ---
    return res.status(200).json({ result: text });

  } catch (error) {
    console.error("Direct API Error:", error);
    return res.status(500).json({ error: "Failed: " + error.message });
  }
}

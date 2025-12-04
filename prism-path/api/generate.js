export default async function handler(req, res) {
  // --- 1. Security Headers ---
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // --- 2. Check Key ---
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Server Error: API Key is missing." });

  // --- 3. Parse Input ---
  let prompt = "";
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    prompt = body.prompt;
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  // --- 4. Call Google (Using gemini-pro) ---
  try {
    // SWITCHED TO GEMINI-PRO on V1 (The most stable combination)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // If this fails, the error message from Google will be in 'data'
      throw new Error(data.error?.message || "Google refused the request");
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return res.status(200).json({ result: text });

  } catch (error) {
    console.error("Direct API Error:", error);
    return res.status(500).json({ error: "Failed: " + error.message });
  }
}

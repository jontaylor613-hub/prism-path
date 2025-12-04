export default async function handler(req, res) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 2. Get Key
  const apiKey = AIzaSyAceBRL_rC4e2tqhLA01MQcRCvfjRgTtmk;
  if (!apiKey) return res.status(500).json({ error: "Server Error: API Key is missing" });

  // 3. Parse Input
  let prompt = "";
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    prompt = body.prompt;
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  // 4. Call Google (Using the modern Flash model)
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Google blocked the request");
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return res.status(200).json({ result: text });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "Failed: " + error.message });
  }
}

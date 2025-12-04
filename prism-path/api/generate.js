import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Allow CORS (Cross-Origin Resource Sharing) just in case
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle "OPTIONS" request (the browser checking if it's safe to connect)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 1. Setup API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server Error: API Key is missing." });
  }

  // 2. Parse Input
  // Vercel sometimes passes body as text, so we parse it safely
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

  // 3. Call Google
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ result: text });
  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: "Google API Failed: " + error.message });
  }
}

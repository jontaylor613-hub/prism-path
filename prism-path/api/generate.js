import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Check for the API key in the environment variables
  // Note: We use the new secure variable name here
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API Key not configured on server" });
  }

  // 2. Extract the user's message from the request body
  const { prompt } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: "No prompt provided" });
  }

  try {
    // 3. Initialize Google Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 4. Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 5. Send the text back to the frontend
    return res.status(200).json({ result: text });

  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: "Failed to generate content" });
  }
}

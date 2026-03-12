import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

async function test() {
  console.log("=== GEMINI API TEST ===");
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Key loaded:", apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}` : "MISSING KEY");

  if (!apiKey) {
    console.error("No API key in .env");
    process.exit(1);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    console.log("Sending test request to gemini-2.5-flash...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Say 'Hello World' if you receive this."
    });

    console.log("\n✅ SUCCESS! Gemini says:");
    console.log(response.text);
  } catch (error: any) {
    console.error("\n❌ FAILED - Server responded with:");
    if (error.status) console.error("HTTP Status:", error.status);
    console.error("Message:", error.message);
    if (error.response?.data) console.error("Details:", JSON.stringify(error.response.data));
  }
}

test();

/*
 * Gemini AI Service Layer
 * Responsible ONLY for communicating with the Gemini API.
 *
 * Uses @google/genai SDK (NOT @google/generative-ai) with googleSearch tool.
 * The old SDK + googleSearchRetrieval + responseMimeType combination was INCOMPATIBLE
 * and caused silent 400 errors misclassified as rate limits.
 */
import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from "../../types";

export class AnalysisError extends Error {
  constructor(public message: string, public type: 'AUTH' | 'SAFETY' | 'RATE_LIMIT' | 'UNKNOWN') {
    super(message);
    this.name = 'AnalysisError';
  }
}

const extractJson = (text: string) => {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(text.substring(start, end + 1));
    }
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Neural output parsing failed. Invalid JSON structure.");
  }
};

/**
 * Direct call to Gemini. Should be wrapped in retry logic by the caller.
 */
export const callGeminiAPI = async (newsText: string): Promise<AnalysisResult> => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  
  if (!apiKey) {
    console.error('[Gemini Service] FATAL: process.env.GEMINI_API_KEY is missing during execution.');
    throw new AnalysisError("API Key not configured on server.", 'AUTH');
  }

  console.log(`[Gemini Service] API Key loaded: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)} (length: ${apiKey.length})`);

  const ai = new GoogleGenAI({ apiKey });
  
  // gemini-2.5-flash supports Google Search grounding
  const MODEL = "gemini-2.5-flash";
  
  const prompt = `Fact-check this claim using Search Grounding. Return ONLY valid JSON matching this schema:
  {"verdict":"REAL"|"FAKE"|"MISLEADING"|"UNVERIFIED","confidence":<0-100>,"explanation":"<15_words>","keyPoints":["<fact1>","<fact2>","<fact3>"],"bias":<0-100>,"sensationalism":<0-100>,"logicalConsistency":<0-100>,"sourceVerification":[{"uri":"<url>","verified":<boolean>}]}
  
  CLAIM: "${newsText}"`;

  try {
    console.log(`[Gemini Service] >>> Starting request to model: ${MODEL}`);
    console.log(`[Gemini Service] >>> Prompt length: ${prompt.length} chars`);
    const startTime = Date.now();
    
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, 
      },
    });

    const latency = Date.now() - startTime;
    console.log(`[Gemini Service] <<< Response received in ${latency}ms`);
    console.log(`[Gemini Service] <<< Response text preview: ${response.text?.substring(0, 200) || '(empty)'}`);

    if (!response.text) throw new AnalysisError("Safety block triggered.", 'SAFETY');

    const data = extractJson(response.text);
    const grounded = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Map grounded sources correctly
    const sources = grounded.map((chunk: any) => ({
      title: chunk.web?.title || "Verification Node",
      uri: chunk.web?.uri || "#",
      verified: data.sourceVerification?.find((v: any) => v.uri === chunk.web?.uri)?.verified ?? true
    })).filter((s: any) => s.uri !== "#");

    console.log(`[Gemini Service] Grounding sources extracted:`, sources.length > 0 ? sources : "None");

    return {
      verdict: data.verdict || 'UNVERIFIED',
      confidence: data.confidence || 0,
      explanation: data.explanation || "No clarification available.",
      keyPoints: data.keyPoints || [],
      sources: sources,
      categories: {
        bias: data.bias || 0,
        sensationalism: data.sensationalism || 0,
        logicalConsistency: data.logicalConsistency || 0,
      },
    };
  } catch (error: any) {
    // Always log the REAL error — never swallow it
    console.error(`[Gemini Service] ❌ FULL ERROR DUMP:`);
    console.error(`[Gemini Service]   error.message: ${error.message}`);
    console.error(`[Gemini Service]   error.status:  ${error.status}`);
    console.error(`[Gemini Service]   error.code:    ${error.code}`);
    console.error(`[Gemini Service]   error.name:    ${error.name}`);
    if (error.response) {
      console.error(`[Gemini Service]   error.response.status: ${error.response.status}`);
      console.error(`[Gemini Service]   error.response.data:`, JSON.stringify(error.response.data || error.response.body || '(none)'));
    }
    if (error.details) {
      console.error(`[Gemini Service]   error.details:`, JSON.stringify(error.details));
    }
    console.error(`[Gemini Service]   FULL ERROR:`, error);
    
    // Re-throw AnalysisErrors as-is (e.g. SAFETY from above)
    if (error instanceof AnalysisError) {
      throw error;
    }

    const errorMsg = (error.message || "").toLowerCase();

    // Rate limit check (check FIRST — most common)
    if (error.status === 429 || errorMsg.includes('429') || errorMsg.includes('resource_exhausted')) {
      throw new AnalysisError(
        `Gemini quota/rate limit exceeded. Raw: ${error.message}`, 
        'RATE_LIMIT'
      );
    }

    // Auth check
    if (error.status === 403 || error.status === 401 || errorMsg.includes('api_key_invalid') || errorMsg.includes('api key not valid') || errorMsg.includes('permission denied')) {
      throw new AnalysisError(
        `Gemini auth failure. Raw: ${error.message}`, 
        'AUTH'
      );
    }

    // Everything else — pass real error
    throw new AnalysisError(
      `Gemini API error: ${error.message || 'Unknown error'}`, 
      'UNKNOWN'
    );
  }
};

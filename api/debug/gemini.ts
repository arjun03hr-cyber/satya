/*
 * Temporary Debug Endpoint: GET /api/debug/gemini
 * Performs a minimal Gemini API test and returns the raw result or error.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    apiKeyPresent: !!apiKey,
    apiKeyPrefix: apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}` : null,
    apiKeyLength: apiKey?.length || 0,
    nodeVersion: process.version,
    envVarsWithAPI: Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('API_KEY')),
  };

  if (!apiKey) {
    diagnostics.error = 'GEMINI_API_KEY is not set in environment';
    console.error('[Debug /api/debug/gemini]', diagnostics);
    return res.status(500).json(diagnostics);
  }

  // Test 1: Simple generateContent call
  try {
    console.log('[Debug /api/debug/gemini] Starting Gemini test...');
    const startTime = Date.now();
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Respond with exactly: GEMINI_OK",
      config: { temperature: 0 },
    });

    diagnostics.test1_basic = {
      status: 'SUCCESS',
      latencyMs: Date.now() - startTime,
      response: response.text?.substring(0, 200),
    };
    console.log('[Debug /api/debug/gemini] Test 1 (basic): SUCCESS');
  } catch (error: any) {
    diagnostics.test1_basic = {
      status: 'FAILED',
      errorMessage: error.message,
      errorStatus: error.status,
      errorCode: error.code,
      errorName: error.name,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2).substring(0, 1000),
    };
    console.error('[Debug /api/debug/gemini] Test 1 (basic): FAILED -', error.message);
  }

  // Test 2: With Google Search grounding (same as production)
  try {
    console.log('[Debug /api/debug/gemini] Starting grounding test...');
    const startTime = Date.now();
    
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Is the Earth round? Respond with one word.",
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    diagnostics.test2_grounding = {
      status: 'SUCCESS',
      latencyMs: Date.now() - startTime,
      response: response.text?.substring(0, 200),
      hasGroundingMetadata: !!response.candidates?.[0]?.groundingMetadata,
    };
    console.log('[Debug /api/debug/gemini] Test 2 (grounding): SUCCESS');
  } catch (error: any) {
    diagnostics.test2_grounding = {
      status: 'FAILED',
      errorMessage: error.message,
      errorStatus: error.status,
      errorCode: error.code,
      fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2).substring(0, 1000),
    };
    console.error('[Debug /api/debug/gemini] Test 2 (grounding): FAILED -', error.message);
  }

  const allPassed = diagnostics.test1_basic?.status === 'SUCCESS' && diagnostics.test2_grounding?.status === 'SUCCESS';
  diagnostics.overallStatus = allPassed ? 'ALL_TESTS_PASSED' : 'SOME_TESTS_FAILED';

  console.log('[Debug /api/debug/gemini] Full diagnostics:', JSON.stringify(diagnostics, null, 2));
  return res.status(allPassed ? 200 : 500).json(diagnostics);
}

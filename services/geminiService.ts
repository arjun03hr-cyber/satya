/*
 * Frontend Gemini API Proxy Service
 * Deprecated direct frontend-to-Gemini execution for security. 
 * Now simply acts as a proxy wrapper around the backend API call to maintain 
 * compatibility with existing UI components without exposing API keys.
 */
import { AnalysisResult } from "../types";
import { apiService } from "./apiService";

export class AnalysisError extends Error {
  constructor(public message: string, public type: 'AUTH' | 'SAFETY' | 'RATE_LIMIT' | 'UNKNOWN') {
    super(message);
    this.name = 'AnalysisError';
  }
}

/**
 * Proxy call that delegates analysis to the secure Vercel backend.
 */
export const analyzeNews = async (newsText: string): Promise<AnalysisResult> => {
  try {
    const data = await apiService.analyzeText(newsText);
    return data;
  } catch (error: any) {
    if (error.message.includes('429') || error.message.includes('load')) {
      throw new AnalysisError("Rate limit exceeded. Too many requests.", 'RATE_LIMIT');
    }
    if (error.message.includes('safety') || error.message.includes('403')) {
      throw new AnalysisError("Safety block triggered.", 'SAFETY');
    }
    if (error.message.includes('credentials') || error.message.includes('AUTH')) {
       throw new AnalysisError("Server misconfiguration.", 'AUTH');
    }
    
    throw new AnalysisError(error.message || "System error during analysis", 'UNKNOWN');
  }
};

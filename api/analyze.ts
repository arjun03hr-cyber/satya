import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from './middleware/auth.js';
import { callGeminiAPI, AnalysisError, embedText } from './services/geminiService.js';
import { hashText, executeWithRetry, normalizeUrl, normalizeQuery } from './utils/helpers.js';
import { supabaseServer } from './lib/supabaseServer.js';

// In-memory per-user throttle (5-second cooldown between Gemini requests)
// Resets on server restart — good enough for rate-limit prevention
const lastRequestTime = new Map<string, number>();
const THROTTLE_MS = 5000; // 5 seconds

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration for local Vite proxy + Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestStartTime = Date.now();
  console.log(`\n========== [API /analyze] NEW REQUEST ==========`);
  console.log(`[API /analyze] Method=${req.method}, Time=${new Date().toISOString()}`);

  try {
    // 1. Authenticate Request
    let uid = 'anonymous';
    try {
      const decodedToken = await verifyToken(req);
      uid = decodedToken.uid;
      console.log(`[API /analyze] ✅ Auth verified for user: ${uid}`);
    } catch (authError) {
      if (process.env.NODE_ENV === 'production' && !process.env.SUPABASE_URL?.includes('placeholder')) {
        console.warn(`[API /analyze] Auth failed - rejecting request`);
        return res.status(401).json({ error: 'Unauthorized' });
      }
      console.warn('[API /analyze] ⚠️ Auth skipped (local dev mode bypass)');
    }

    // 2. Per-user throttle check (prevent multiple rapid Gemini calls)
    const throttleKey = uid !== 'anonymous'
      ? uid
      : (req.headers['x-forwarded-for'] as string || req.socket?.remoteAddress || 'unknown-ip');

    const lastTime = lastRequestTime.get(throttleKey) || 0;
    const timeSinceLast = Date.now() - lastTime;

    if (timeSinceLast < THROTTLE_MS) {
      const waitSeconds = Math.ceil((THROTTLE_MS - timeSinceLast) / 1000);
      console.warn(`[API /analyze] ⏱️ Throttled request for key: ${throttleKey.substring(0, 8)}... (wait ${waitSeconds}s)`);
      return res.status(429).json({
        error: `Please wait ${waitSeconds} more second${waitSeconds !== 1 ? 's' : ''} before analyzing again.`
      });
    }

    // 2. Strict Input Validation
    let { text, forceAI } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Invalid input: text is required.' });
    }

    text = text.trim();
    console.log(`[API /analyze] Input text: "${text.substring(0, 80)}..." (${text.length} chars), forceAI: ${!!forceAI}`);

    if (text.length < 10) {
      return res.status(400).json({ error: 'Input text too short. Please provide at least 10 characters.' });
    }
    if (text.length > 5000) {
      return res.status(400).json({ error: 'Input text too long. Maximum 5000 characters allowed.' });
    }

    // 3. Preprocessing (Hybrid Retrieval Setup)
    const inputHash = hashText(text); // Keeping for user's personal history record
    
    let isUrl = false;
    try {
      new URL(text);
      isUrl = true;
    } catch {
      isUrl = false;
    }
    
    let urlHash = null;
    let normQuery = '';
    if (isUrl) {
      urlHash = hashText(normalizeUrl(text));
    } else {
      normQuery = normalizeQuery(text);
    }
    
    let queryEmbedding: number[] | null = null;
    
    // Helper to log user history on cache hit
    const logHistoryAsync = (result: any) => {
      if (uid !== 'anonymous') {
         supabaseServer.from('analysis_history').insert({
          user_id: uid, content: text, input_hash: inputHash,
          verdict: result.verdict, confidence: result.confidence,
          risk_score: result.categories?.sensationalism || 0,
          explanation: result.explanation, key_points: result.keyPoints || [],
          sources: result.sources || [], categories: result.categories || {}
        }).then(({error}) => {
          if (error) console.error('[API /analyze] Cache hit history recording failed:', error);
        });
      }
    };

    // 4. Hybrid Cache Search
    if (!forceAI) {
      // Step 1: URL Match (Fastest)
      if (isUrl && urlHash) {
        const { data: urlMatch } = await supabaseServer
          .from('analysis_cache')
          .select('*')
          .eq('url_hash', urlHash)
          .maybeSingle();
          
        if (urlMatch) {
          console.log(`[Cache] 🎯 URL CACHE HIT for ${urlHash} (${Date.now() - requestStartTime}ms)`);
          supabaseServer.from('analysis_cache').update({ search_count: urlMatch.search_count + 1 }).eq('id', urlMatch.id).then();
          logHistoryAsync(urlMatch.result);
          return res.status(200).json({ ...urlMatch.result, cached: true, search_count: urlMatch.search_count + 1 });
        }
      } 
      else if (!isUrl) {
         // Step 2: Semantic Vector Search
         queryEmbedding = await embedText(text);
         
         if (queryEmbedding) {
           try {
             const { data: vectorMatches } = await supabaseServer
               .rpc('match_analysis_cache', {
                 query_embedding: queryEmbedding,
                 match_threshold: 0.85,
                 match_count: 1
               });
               
             if (vectorMatches && vectorMatches.length > 0) {
               const bestMatch = vectorMatches[0];
               console.log(`[Cache] Vector similarity match found (sim: ${bestMatch.similarity}) (${Date.now() - requestStartTime}ms)`);
               supabaseServer.from('analysis_cache').update({ search_count: bestMatch.search_count + 1 }).eq('id', bestMatch.id).then();
               logHistoryAsync(bestMatch.result);
               return res.status(200).json({ ...bestMatch.result, cached: true, search_count: bestMatch.search_count + 1 });
             }
           } catch (e) {
              console.error('[API /analyze] Vector search failed:', e);
           }
         }
         
         // Step 3: Keyword Search Fallback
         if (normQuery.length > 5) {
           const { data: textMatches } = await supabaseServer
             .from('analysis_cache')
             .select('*')
             .ilike('query_text', `%${normQuery.substring(0, 80)}%`)
             .limit(1);
             
           if (textMatches && textMatches.length > 0) {
               const bestMatch = textMatches[0];
               console.log(`[Cache] Keyword match found (${Date.now() - requestStartTime}ms)`);
               supabaseServer.from('analysis_cache').update({ search_count: bestMatch.search_count + 1 }).eq('id', bestMatch.id).then();
               logHistoryAsync(bestMatch.result);
               return res.status(200).json({ ...bestMatch.result, cached: true, search_count: bestMatch.search_count + 1 });
           }
         }
      }
    }

    console.log(`[AI] Running Gemini verification...`);

    // 5. Service Execution with Retry & Exponential Backoff
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    
    if (apiKey) {
      console.log(`[API /analyze] 🔑 Gemini API Key present: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
    } else {
      console.error(`[API /analyze] ❌ FATAL: GEMINI_API_KEY is NOT in process.env!`);
      return res.status(500).json({ error: 'Server configuration error: Gemini API key is missing.' });
    }

    const aiStartTime = Date.now();
    console.log(`[API /analyze] 🚀 Calling Gemini API via service layer...`);
    
    // Stamp throttle time immediately before the Gemini call
    lastRequestTime.set(throttleKey, Date.now());

    const result = await executeWithRetry(() => callGeminiAPI(text), 2);
    
    const aiLatency = Date.now() - aiStartTime;
    console.log(`[API /analyze] ✅ Gemini request completed in ${aiLatency}ms`);
    console.log(`[API /analyze] Result verdict: ${result.verdict}, confidence: ${result.confidence}`);

    // 6. Synchronous Persist to DB before completing response
    const resultToStore = {
      verdict: result.verdict,
      confidence: result.confidence,
      fake_risk_score: result.categories?.sensationalism || 0,
      explanation: result.explanation,
      keyPoints: result.keyPoints || [],
      sources: result.sources || [],
      categories: result.categories || {}
    };

    // User History Update
    if (uid !== 'anonymous') {
      const { error: dbError } = await supabaseServer
        .from('analysis_history')
        .insert({
          user_id: uid,
          content: text,
          input_hash: inputHash,
          verdict: result.verdict,
          confidence: result.confidence,
          risk_score: result.categories?.sensationalism || 0,
          explanation: result.explanation,
          key_points: result.keyPoints || [],
          sources: result.sources || [],
          categories: result.categories || {}
        });

      if (dbError) {
        console.error('[API /analyze] ❌ Supabase DB History save failed:', dbError);
      }
    } else {
      console.log(`[API /analyze] ⚠️ Skipped DB history insert: User is anonymous.`);
    }

    // Global Cache Update
    try {
      if (!isUrl && !queryEmbedding) {
        queryEmbedding = await embedText(text); // Make sure we have the embedding
      }
      
      const sourceUrls = (result.sources || []).map((s: any) => s.uri).filter(Boolean);
      
      const { error: cacheDBError } = await supabaseServer
        .from('analysis_cache')
        .insert({
           query_text: text,
           query_embedding: queryEmbedding || Array(768).fill(0), // If URL and embedding failed, fallback zeros
           url_hash: urlHash,
           source_urls: sourceUrls,
           result: resultToStore,
           credibility_score: result.confidence
        });

      if (cacheDBError) {
        console.error('[API /analyze] ❌ Supabase Cache save failed:', cacheDBError);
      } else {
        console.log(`[API /analyze] 💾 DB global cache save complete.`);
      }
    } catch (e) {
      console.error('[API /analyze] Failed to save to global cache:', e);
    }

    // 7. Success Response
    const totalLatency = Date.now() - requestStartTime;
    console.log(`[API /analyze] ✅ Pipeline complete in ${totalLatency}ms (AI: ${aiLatency}ms)`);
    console.log(`========== [API /analyze] END ==========\n`);
    
    return res.status(200).json({ ...result, cached: false });

  } catch (error: any) {
    const totalLatency = Date.now() - requestStartTime;
    console.error(`\n[API /analyze] ❌ HANDLER ERROR after ${totalLatency}ms`);
    console.error(`[API /analyze]   error.message: ${error.message}`);
    
    if (error instanceof AnalysisError) {
      if (error.type === 'RATE_LIMIT') {
        return res.status(429).json({ error: 'Gemini API quota/rate limit exceeded.', detail: error.message });
      }
      if (error.type === 'SAFETY') {
        return res.status(403).json({ error: 'Content violates safety guidelines.', detail: error.message });
      }
    }

    return res.status(500).json({ 
      verdict: 'UNVERIFIED',
      confidence: 0,
      explanation: 'Internal server error during analysis. ' + (error.message || ''),
      keyPoints: [],
      sources: [],
      categories: { bias: 0, sensationalism: 0, logicalConsistency: 0 },
      cached: false,
      error: error.message || 'Internal server error',
      detail: 'Unhandled exception in analyze handler'
    });
  }
}

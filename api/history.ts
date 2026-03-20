import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from './middleware/auth.js';
import { supabaseServer } from './lib/supabaseServer.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 1. Verify Authentication
    const decodedToken = await verifyToken(req);
    const uid = decodedToken.uid;

    if (uid === 'anonymous' || !uid) {
      return res.status(401).json({ error: 'Unauthorized required for history' });
    }

    // 2. Handle GET (fetch history or single item)
    if (req.method === 'GET') {
      const { id } = req.query;

      if (id) {
        // Fetch single history item
        const { data: record, error } = await supabaseServer
          .from('analysis_history')
          .select('*')
          .eq('user_id', uid)
          .eq('id', id)
          .single();

        if (error || !record) {
          console.error(`Supabase history fetch error for ID ${id}:`, error);
          return res.status(404).json({ error: 'Analysis record not found' });
        }

        // Reconstruct AnalysisResult format
        const analysisResult = {
          verdict: record.verdict,
          confidence: record.confidence,
          explanation: record.explanation,
          keyPoints: record.key_points || [],
          sources: record.sources || [],
          categories: record.categories || {},
          cached: true
        };

        return res.status(200).json(analysisResult);
      } else {
        // Fetch standard history list
        const { data: history, error } = await supabaseServer
          .from('analysis_history')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Supabase history fetch error:', error);
          throw new Error('Failed to fetch history from database');
        }

        // Format to match frontend HistoryItem structure expectations
        const formattedHistory = (history || []).map((h: any) => ({
          id: h.id,
          userId: h.user_id,
          sourceText: h.content,
          verdict: h.verdict,
          confidence: h.confidence,
          timestamp: h.created_at,
          metadata: {
            sourcesChecked: h.sources ? h.sources.length : 0,
            processingTimeMs: 1500 // Mock variable backward compatibility
          }
        }));

        return res.status(200).json({ history: formattedHistory });
      }
    }

    // 3. Handle DELETE (remove specific analysis)
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Missing analysis ID' });
      }

      const { error } = await supabaseServer
        .from('analysis_history')
        .delete()
        .eq('id', id)
        .eq('user_id', uid);

      if (error) {
        console.error('Supabase history deletion error:', error);
        return res.status(500).json({ error: 'Failed to delete analysis' });
      }

      return res.status(200).json({ success: true, message: 'Deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('History API Error:', error);
    return res.status(error.message.includes('Unauthorized') ? 401 : 500).json({ 
      error: error.message || 'Internal server error fetching history' 
    });
  }
}

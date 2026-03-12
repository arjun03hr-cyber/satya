import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { supabaseServer } from '../lib/supabaseServer.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization || (req.headers.Authorization as string);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split('Bearer ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'fallback_development_secret_only';

    // Verify the JWT token
    const decoded = jwt.verify(token, jwtSecret) as { uid: string; email: string; admin: boolean };

    // Fetch latest user details from custom DB to ensure user wasn't deleted or role changed
    const { data: user, error } = await supabaseServer
      .from('users_custom')
      .select('id, email, role')
      .eq('id', decoded.uid)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: User no longer exists' });
    }

    return res.status(200).json({
      user: { id: user.id, email: user.email, role: user.role }
    });

  } catch (err: any) {
    console.error('Auth verification error:', err);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

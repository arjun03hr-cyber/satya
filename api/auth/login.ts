import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseServer } from '../lib/supabaseServer.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Lookup user
    const { data: user, error: checkError } = await supabaseServer
      .from('users_custom')
      .select('id, email, password_hash, role')
      .eq('email', email)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      console.error('Database query error:', checkError);
      return res.status(500).json({ error: 'Internal server error during login' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET || 'fallback_development_secret_only';
    const token = jwt.sign(
      { uid: user.id, email: user.email, admin: user.role === 'admin' },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, role: user.role },
      token
    });

  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

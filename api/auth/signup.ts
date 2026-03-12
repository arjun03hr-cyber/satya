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

    // Advanced Email Regex (RFC 5322 standard compatible, supports new TLDs)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseServer
      .from('users_custom')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "No rows found" which is good in this case
      console.error('Database check error:', checkError);
      return res.status(500).json({ error: 'Internal server error during user check' });
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const { data: newUser, error: insertError } = await supabaseServer
      .from('users_custom')
      .insert([
        { 
          email: email, 
          password_hash: passwordHash, 
          role: email === 'admin@satyakavach.ai' ? 'admin' : 'user' 
        }
      ])
      .select('id, email, role')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET || 'fallback_development_secret_only';
    const token = jwt.sign(
      { uid: newUser.id, email: newUser.email, admin: newUser.role === 'admin' },
      jwtSecret,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Account created successfully',
      user: { id: newUser.id, email: newUser.email, role: newUser.role },
      token
    });

  } catch (err: any) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Import API handlers (tsx allows importing .ts extensions or without)
import analyzeHandler from './api/analyze.js';
import historyHandler from './api/history.js';
import debugGeminiHandler from './api/debug/gemini.js';
import signupHandler from './api/auth/signup.js';
import loginHandler from './api/auth/login.js';
import logoutHandler from './api/auth/logout.js';
import meHandler from './api/auth/me.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// Built-in body parser equivalent to Vercel's automatic parsing
app.use(express.json({ limit: '10mb' })); 

// Log all incoming API requests (Debug Log #1 per user request)
app.use('/api', (req, res, next) => {
  console.log(`[Express] Received ${req.method} request at ${req.originalUrl}`);
  next();
});

// Adapter to connect Express req/res interfaces to VercelRequest/VercelResponse
const createVercelAdapter = (handler: any) => {
  return async (req: express.Request, res: express.Response) => {
    try {
      // Pass the request directly. For basic headers/body/query, Vercel and Express match closely.
      await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);
    } catch (error) {
      console.error('[Express Adapter] Unhandled Server Error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  };
};

// Mount API Routes strictly tracking Vercel structure
app.all('/api/analyze', createVercelAdapter(analyzeHandler));
app.all('/api/history', createVercelAdapter(historyHandler));
// Removed admin routes
app.all('/api/debug/gemini', createVercelAdapter(debugGeminiHandler));

// Auth Routes
app.all('/api/auth/signup', createVercelAdapter(signupHandler));
app.all('/api/auth/login', createVercelAdapter(loginHandler));
app.all('/api/auth/logout', createVercelAdapter(logoutHandler));
app.all('/api/auth/me', createVercelAdapter(meHandler));

app.listen(PORT, () => {
  const isKeyLoaded = !!process.env.GEMINI_API_KEY;

  console.log(`\n=========================================`);
  console.log(`🚀 [Local Server] Backend API Running!    `);
  console.log(`🔗 URL: http://localhost:${PORT}          `);
  console.log(`🔑 GEMINI_API_KEY: ${isKeyLoaded ? '✅ Detected (Server-side Protected)' : '❌ MISSING (Check .env)'}`);
  console.log(`=========================================\n`);
});

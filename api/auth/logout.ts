import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Purely simple response since we scale stateless JWTs on the client.
  // The frontend simply deletes the token.
  return res.status(200).json({ message: 'Logged out successfully' });
}

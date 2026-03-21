import { handleChat } from '../server/controllers/chatController.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return await handleChat(req, res);
  } catch (error) {
    console.error('[api/chat] Unhandled error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

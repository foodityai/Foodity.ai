import { updateChat, deleteChat } from '../../server/controllers/chatController.js';

export default async function handler(req, res) {
  // Map Vercel's query dynamically to Express req.params structure seamlessly
  req.params = { id: req.query.id };

  if (req.method === 'PUT') {
    return await updateChat(req, res);
  }
  if (req.method === 'DELETE') {
    return await deleteChat(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

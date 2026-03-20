import { getUser } from '../../server/controllers/authController.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return await getUser(req, res);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

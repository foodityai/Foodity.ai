import { login } from '../../server/controllers/authController.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return await login(req, res);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

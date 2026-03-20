import express from 'express';
import { login, signup, getUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.get('/user', getUser);

export default router;

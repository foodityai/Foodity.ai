import express from 'express';
import { handleChat, getMessages, getChats, deleteChat, updateChat, getFoodLogs } from '../controllers/chatController.js';

const router = express.Router();

router.post('/chat', handleChat);
router.get('/messages', getMessages);
router.get('/chats', getChats);
router.get('/food-logs', getFoodLogs);
router.put('/chats/:id', updateChat);
router.delete('/chats/:id', deleteChat);

export default router;

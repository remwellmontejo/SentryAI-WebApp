import express from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/NotificationController.js';
import { verifyToken } from '../middlewares/EnsureAuth.js';

const router = express.Router();

router.get('/', verifyToken, getNotifications);
router.put('/:id/read', verifyToken, markAsRead);
router.put('/read-all', verifyToken, markAllAsRead);

export default router;

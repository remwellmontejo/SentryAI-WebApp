import express from 'express';
import { getSystemLogs } from '../controllers/SystemLogController.js';
import { verifyToken } from '../middlewares/EnsureAuth.js';
import { isAdmin } from '../middlewares/IsAdmin.js';

const router = express.Router();

router.get('/', verifyToken, isAdmin, getSystemLogs);

export default router;

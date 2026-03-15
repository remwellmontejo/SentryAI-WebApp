import express from 'express';
import { getAllUsers, updateUserRole, updateUserStatus } from '../controllers/UserController.js';
import { verifyToken } from '../middlewares/EnsureAuth.js';
import { isAdmin } from '../middlewares/IsAdmin.js';

const router = express.Router();

// All user routes should be protected and only accessible by Admins
router.use(verifyToken);
router.use(isAdmin);

router.get('/', getAllUsers);
router.put('/:id/role', updateUserRole);
router.put('/:id/status', updateUserStatus);

export default router;

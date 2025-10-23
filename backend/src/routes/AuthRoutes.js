import express from 'express';
import { loginValidation, registerValidation } from '../middlewares/AuthValidation.js';
import { login, register } from '../controllers/authController.js';
const router = express.Router();

router.post('/login', loginValidation, login);
router.post('/register', registerValidation, register);

export default router;
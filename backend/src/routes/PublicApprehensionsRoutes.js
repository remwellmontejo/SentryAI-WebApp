// routes/apprehensionRoutes.js
import express from 'express';
import { searchPublicApprehensions, getPublicApprehensionById } from '../controllers/PublicApprehensionsController.js';

const router = express.Router();

router.get('/search/:plateNumber', searchPublicApprehensions);
router.get('/details/:id', getPublicApprehensionById);

export default router;
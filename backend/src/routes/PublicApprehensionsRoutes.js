// routes/apprehensionRoutes.js
import express from 'express';
import { searchPublicApprehensions } from '../controllers/PublicApprehensionsController.js';

const router = express.Router();

router.get('/search/:plateNumber', searchPublicApprehensions);

export default router;
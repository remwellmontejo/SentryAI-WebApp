import express from 'express';
import { verifyApiToken } from '../middlewares/VerifyApiToken.js';
import { getApprovedApprehensions } from '../controllers/ExternalApiController.js';

const router = express.Router();

// All routes require valid external API token
router.use(verifyApiToken);

// GET /api/external/apprehensions — returns paginated approved apprehensions
router.get('/', getApprovedApprehensions);

export default router;

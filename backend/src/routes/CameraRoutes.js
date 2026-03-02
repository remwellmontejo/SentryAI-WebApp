import express from 'express';
import { getCameras, getCameraDetails, updateCameraConfig } from '../controllers/CameraController.js';
import { verifyToken } from '../middlewares/EnsureAuth.js';

const router = express.Router();

router.get('/get', verifyToken, getCameras);
router.get('/get/:serialNumber', verifyToken, getCameraDetails);
router.put('/config/:serial', verifyToken, updateCameraConfig);

export default router;
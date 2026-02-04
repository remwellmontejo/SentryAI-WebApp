import express from 'express';
import { getCameras, getCameraDetails, updateCameraConfig } from '../controllers/CameraController.js';
const router = express.Router();

router.get('/get', getCameras);
router.get('/get/:serialNumber', getCameraDetails);
router.put('/config/:serial', updateCameraConfig);

export default router;
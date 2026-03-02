import express from 'express';
import { getAllApprehendedVehicles, createApprehendedVehicle, getApprehendedVehicleById, statusUpdateApprehendedVehicle, updateApprehendedVehicle, getApprehendedVehiclesByStatus, getDashboardStats } from '../controllers/ApprehendedVechicleController.js';
import { verifyToken } from '../middlewares/EnsureAuth.js';

const router = express.Router();
router.get('/get', verifyToken, getAllApprehendedVehicles);
router.post('/create', verifyToken, createApprehendedVehicle);
router.get('/:id', verifyToken, getApprehendedVehicleById);
router.patch('/:id/status', verifyToken, statusUpdateApprehendedVehicle);
router.patch('/:id/update', verifyToken, updateApprehendedVehicle);
router.get('/stats/dashboard', verifyToken, getDashboardStats);
router.get('/status/:status', verifyToken, getApprehendedVehiclesByStatus);

export default router;
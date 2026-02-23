import express from 'express';
import { getAllApprehendedVehicles, createApprehendedVehicle, getApprehendedVehicleById, statusUpdateApprehendedVehicle, updateApprehendedVehicle, getApprehendedVehiclesByStatus, getDashboardStats } from '../controllers/ApprehendedVechicleController.js';

const router = express.Router();
router.get('/get', getAllApprehendedVehicles);
router.post('/create', createApprehendedVehicle);
router.get('/:id', getApprehendedVehicleById);
router.patch('/:id/status', statusUpdateApprehendedVehicle);
router.patch('/:id/update', updateApprehendedVehicle);
router.get('/stats/dashboard', getDashboardStats);
router.get('/status/:status', getApprehendedVehiclesByStatus);

export default router;
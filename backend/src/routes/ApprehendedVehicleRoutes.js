import express from 'express';
import { getAllApprehendedVehicles, createApprehendedVehicle, getApprehendedVehicleById, statusUpdateApprehendedVehicle, updateApprehendedVehicle } from '../controllers/ApprehendedVechicleController.js';

const router = express.Router();
router.get('/get', getAllApprehendedVehicles);
router.post('/create', createApprehendedVehicle);
router.get('/:id', getApprehendedVehicleById);
router.patch('/:id/status', statusUpdateApprehendedVehicle);
router.patch('/:id/update', updateApprehendedVehicle);

export default router;
import express from 'express';
import { getAllApprehendedVehicles, createApprehendedVehicle, updateApprehendedVehicle, getApprehendedVehicleById } from '../controllers/ApprehendedVechicleController.js';

const router = express.Router();
router.get('/get', getAllApprehendedVehicles);
router.post('/create', createApprehendedVehicle);
router.get('/:id', getApprehendedVehicleById);

export default router;
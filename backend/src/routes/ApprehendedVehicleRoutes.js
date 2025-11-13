import express from 'express';
import { getAllApprehendedVehicles, createApprehendedVehicle, updateApprehendedVehicle } from '../controllers/ApprehendedVechicleController.js';

const router = express.Router();
router.get('/get', getAllApprehendedVehicles);
router.post('/create', createApprehendedVehicle);
router.put('/:id', updateApprehendedVehicle);

export default router;
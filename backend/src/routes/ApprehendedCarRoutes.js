import express from 'express';
import { createApprehendedCar, getAllApprehendedCars, updateApprehendedCar } from '../controllers/ApprehendedCarController.js';

const router = express.Router();

router.get('/', getAllApprehendedCars);
router.post('/', createApprehendedCar);
router.put('/:id', updateApprehendedCar);

export default router;
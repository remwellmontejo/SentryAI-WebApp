import ApprehendedCar from '../models/apprehendedCar.js';

export function getAllApprehendedCars(req, res){
    res.status(200).send('All apprehended cars data');
}

export async function createApprehendedCar(req, res){
    try {
        const {content, location} = req.body;
        const newApprehendedCar = new ApprehendedCar({content, location});
        await newApprehendedCar.save();
        res.status(200).json({ message: 'Apprehended car created' });
    }
    catch (error) {
        console.error('Error creating apprehended car:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export function updateApprehendedCar(req, res){
    res.status(201).json({ message: 'Apprehended car updated' });
}
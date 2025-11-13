import ApprehendedVehicle from '../models/ApprehendedVehicle.js';

export function getAllApprehendedVehicles(req, res) {
    res.status(200).send('All apprehended cars data');
}

export async function createApprehendedVehicle(req, res) {
    try {
        const {
            vehicleType,
            plateNumber,
            confidenceScore,
            x_coordinate,
            y_coordinate,
            sceneImageBase64,
        } = req.body;

        if (!vehicleType || !sceneImageBase64 || !x_coordinate || !confidenceScore || !y_coordinate) {
            return res.status(400).json({ msg: "Missing required fields (type, img, or coords)" });
        }
        const newApprehendedVehicle = new ApprehendedVehicle({
            vehicleType,
            plateNumber: plateNumber || "NO PLATE NUMBER FOUND",
            confidenceScore,
            x_coordinate,
            y_coordinate,
            sceneImageBase64,
            status: 'Pending'
        });
        await newApprehendedVehicle.save();
        res.status(200).json({ message: 'Apprehended vehicle created!' });
    }
    catch (error) {
        console.error('Error creating apprehended car:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export function updateApprehendedVehicle(req, res) {
    res.status(201).json({ message: 'Apprehended car updated' });
}
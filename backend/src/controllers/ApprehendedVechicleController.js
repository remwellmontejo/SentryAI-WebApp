import ApprehendedVehicle from '../models/ApprehendedVehicle.js';

export async function getAllApprehendedVehicles(req, res) {
    try {
        const vehicles = await ApprehendedVehicle.find().sort({ createdAt: -1 });
        res.status(200).json(vehicles);
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.status(500).json({ message: 'Server error fetching data' });
    }
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

export async function getApprehendedVehicleById(req, res) {
    try {
        const { id } = req.params;

        // 1. Find by ID
        // 2. IMPORTANT: Use .select('+sceneImageBase64') to include the hidden image field
        const vehicle = await ApprehendedVehicle.findById(id).select('+sceneImageBase64');

        if (!vehicle) {
            return res.status(404).json({ message: "Apprehension record not found" });
        }

        res.status(200).json(vehicle);
    } catch (error) {
        console.error("Error fetching vehicle details:", error);
        res.status(500).json({ message: "Server error fetching details" });
    }
}

export function updateApprehendedVehicle(req, res) {
    res.status(201).json({ message: 'Apprehended car updated' });
}
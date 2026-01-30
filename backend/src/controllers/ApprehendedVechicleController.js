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
        const imageBuffer = req.body;

        if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
            console.error("[ERROR] No image binary received in body");
            return res.status(400).json({ msg: "Missing image binary data" });
        }

        const rawMetadata = req.headers['x-metadata'];
        if (!rawMetadata) {
            console.error("[ERROR] Missing 'X-Metadata' header");
            return res.status(400).json({ msg: "Missing X-Metadata header" });
        }

        // Parse the JSON string back into an Object
        let metadata;
        try {
            metadata = JSON.parse(rawMetadata);
        } catch (e) {
            return res.status(400).json({ msg: "Invalid JSON in X-Metadata" });
        }

        // Destructure fields
        const {
            vehicleType,
            confidenceScore,
            x_coordinate,
            y_coordinate,
            plateNumber
        } = metadata;

        const base64Data = imageBuffer.toString('base64');
        const newApprehendedVehicle = new ApprehendedVehicle({
            vehicleType,
            plateNumber: plateNumber || "PENDING_VERIFICATION",
            confidenceScore,
            x_coordinate,
            y_coordinate,
            sceneImageBase64: base64Data,
            status: 'Pending'
        });

        await newApprehendedVehicle.save();

        console.log(`[SUCCESS] Saved Apprehension ID: ${newApprehendedVehicle._id}`);
        res.status(200).json({ message: 'Apprehended vehicle created successfully!' });

    } catch (error) {
        console.error(`[ERROR] Server Error: ${error.message}`);
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
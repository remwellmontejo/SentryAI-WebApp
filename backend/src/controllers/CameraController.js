import Camera from '../models/Camera.js';

const getCameras = async (req, res) => {
    try {
        const cameras = await Camera.find();
        res.json(cameras);
    } catch (e) { res.status(500).send(e.message); }
};

const getCameraDetails = async (req, res) => {
    try {
        const camera = await Camera.findOne({ serialNumber: req.params.serialNumber });
        if (!camera) return res.status(404).send("Camera not found");
        res.json(camera);
    } catch (e) { res.status(500).send(e.message); }
};

const registerCamera = async (req, res) => {
    try {
        const { serialNumber, name, location } = req.body;

        // Ensure camera doesn't already exist
        const existing = await Camera.findOne({ serialNumber });
        if (existing) {
            return res.status(400).json({ success: false, message: "Camera with this serial number is already registered." });
        }

        const newCamera = new Camera({
            serialNumber,
            name,
            location: location || '',
            status: 'offline'
        });

        await newCamera.save();
        res.status(201).json({ success: true, data: newCamera });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// @desc    Update Camera Configuration
// @route   PUT /api/cameras/config/:serial
const updateCameraConfig = async (req, res) => {
    const { serial } = req.params;

    // Destructure config fields from request body
    const {
        name,
        streamEnabled,
        streamResolution,
        apprehensionTimer,
        zoneEnabled,
        polyX,
        polyY,
        servoPan,
        servoTilt
    } = req.body;

    try {
        // 1. Update Database (Nested 'config' object)
        // REMOVED 'upsert: true' so it won't create new docs
        const updatedCamera = await Camera.findOneAndUpdate(
            { serialNumber: serial },
            {
                $set: {
                    ...(name !== undefined && { name }),
                    "config.streamEnabled": streamEnabled,
                    "config.streamResolution": streamResolution,
                    "config.apprehensionTimer": apprehensionTimer,
                    "config.zoneEnabled": zoneEnabled,
                    "config.polyX": polyX,
                    "config.polyY": polyY,
                    "config.servoPan": servoPan,
                    "config.servoTilt": servoTilt
                }
            },
            { new: true } // Return the updated document, but DO NOT create if missing
        );

        // CHECK: If camera doesn't exist, return 404
        if (!updatedCamera) {
            return res.status(404).json({
                success: false,
                message: `Camera with serial ${serial} not found.`
            });
        }

        // 2. TRIGGER REAL-TIME UPDATE TO ESP32
        const client = req.cameraClients.get(serial);

        if (client && client.readyState === 1) { // 1 = WebSocket.OPEN

            const esp32Payload = JSON.stringify({
                streamEnabled: updatedCamera.config.streamEnabled,
                streamResolution: updatedCamera.config.streamResolution,
                apprehensionTimer: updatedCamera.config.apprehensionTimer,
                zoneEnabled: updatedCamera.config.zoneEnabled,
                polyX: updatedCamera.config.polyX,
                polyY: updatedCamera.config.polyY,
                servoPan: updatedCamera.config.servoPan,
                servoTilt: updatedCamera.config.servoTilt
            });

            client.send(esp32Payload);
            console.log(`[API] Pushed new config to Camera: ${serial}`);
        } else {
            console.log(`[API] Camera ${serial} offline. Config saved to DB only.`);
        }

        res.status(200).json({ success: true, data: updatedCamera });
    } catch (error) {
        console.error("Config Update Error:", error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

const getCameraConfig = async (req, res) => {
    const { serial } = req.params;
    try {
        const camera = await Camera.findOne({ serialNumber: serial });
        if (!camera) return res.status(404).send("Camera not found");
        res.json(camera.config);
    } catch (e) { res.status(500).send(e.message); }
};

export { getCameras, getCameraDetails, registerCamera, updateCameraConfig, getCameraConfig };
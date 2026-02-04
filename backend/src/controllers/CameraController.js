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

// @desc    Update Camera Configuration
// @route   PUT /api/cameras/config/:serial
export const updateCameraConfig = async (req, res) => {
    const { serial } = req.params;

    // Destructure config fields from request body
    const {
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
        const updatedCamera = await Camera.findOneAndUpdate(
            { serialNumber: serial },
            {
                $set: {
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
            { new: true, upsert: true } // Return the updated document
        );

        // 2. TRIGGER REAL-TIME UPDATE TO ESP32
        // We access the global map 'cameraClients' attached to the request in server.js
        const client = req.cameraClients.get(serial);

        if (client && client.readyState === 1) { // 1 = WebSocket.OPEN

            // Map Mongoose Model -> ESP32 Flat JSON
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

export { getCameras, getCameraDetails, updateCameraConfig };
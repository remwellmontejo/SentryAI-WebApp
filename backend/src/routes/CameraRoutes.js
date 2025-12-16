import express from 'express';
import Camera from '../models/Camera.js';
const router = express.Router();

// --- IN-MEMORY STREAM STORAGE ---
// Key = SERIAL NUMBER (not ID), Value = Image Buffer
const activeStreams = {};

// ============================================================================
// 1. CAMERA REGISTRATION (App -> DB)
// ============================================================================

// GET ALL (For List)
router.get('/get', async (req, res) => {
    try {
        const cameras = await Camera.find();
        res.json(cameras);
    } catch (e) { res.status(500).send(e.message); }
});

// REGISTER NEW CAMERA
router.post('/register', async (req, res) => {
    try {
        const { name, location, serialNumber } = req.body;

        // 1. Check if Serial Number already exists
        const existing = await Camera.findOne({ serialNumber });
        if (existing) {
            return res.status(400).json({ msg: "Error: A camera with this Serial Number is already registered!" });
        }

        // 2. Create New Record
        const newCam = new Camera({
            name,
            location,
            serialNumber // e.g., "SN-001"
        });

        await newCam.save();
        res.json(newCam);

    } catch (e) { res.status(500).send(e.message); }
});

// GET ONE (By DB ID - used by Frontend Details Page)
router.get('/get/:id', async (req, res) => {
    try {
        const camera = await Camera.findById(req.params.id);
        if (!camera) return res.status(404).send("Camera not found");
        res.json(camera);
    } catch (e) { res.status(500).send(e.message); }
});

// // UPDATE CONFIG (React -> DB)
// router.put('/cameras/:id/config', async (req, res) => {
//     try {
//         const camera = await Camera.findByIdAndUpdate(
//             req.params.id,
//             { $set: { config: req.body } },
//             { new: true }
//         );
//         res.json(camera);
//     } catch (e) { res.status(500).send(e.message); }
// });

// ============================================================================
// 2. DEVICE COMMUNICATION (ESP32 <-> DB)
// ⚠️ These endpoints now use :serialNumber instead of :id
// ============================================================================

// // A. FETCH CONFIG (ESP32 calls this on startup)
// // URL: GET /api/device/:serial/config
// router.get('/device/:serial/config', async (req, res) => {
//     try {
//         // Find camera by Serial Number (e.g., "SN-001")
//         const camera = await Camera.findOne({ serialNumber: req.params.serial });

//         if (!camera) {
//             // Security: If serial number isn't registered in the App, deny access
//             return res.status(403).json({ error: "Access Denied: Serial Number not registered" });
//         }

//         // Update 'Last Seen' automatically
//         camera.lastSeen = Date.now();
//         camera.status = 'online';
//         await camera.save();

//         res.json(camera.config); 
//     } catch (e) { res.sendStatus(500); }
// });

// B. UPLOAD STREAM FRAME (ESP32 -> Server)
// URL: POST /api/stream/:serialNumber/frame
// --- UPLOAD ENDPOINT (ESP32) ---
router.post('/stream/:serial/frame', express.raw({ type: 'image/jpeg', limit: '5mb' }), (req, res) => {
    const serial = req.params.serial;
    const size = req.body.length;

    // 🔍 DEBUG LOG: Print every upload attempt
    console.log(`[UPLOAD] Serial: "${serial}" | Size: ${size} bytes`);

    if (size < 1000) {
        console.warn(`[WARNING] Frame is suspiciously small!`);
    }

    activeStreams[serial] = req.body;
    res.sendStatus(200);
});

// --- VIEW ENDPOINT (Browser) ---
// GET /api/stream/:id/feed
router.get('/stream/:id/feed', async (req, res) => {
    try {
        const camera = await Camera.findById(req.params.id);
        if (!camera) return res.status(404).send('Camera ID not found');

        const videoFrame = activeStreams[camera.serialNumber];

        if (!videoFrame) return res.status(404).send('No active stream');

        // 1. FORCE BINARY BUFFER (Crucial Fix)
        // If 'videoFrame' was accidentally saved as a string, this fixes it.
        const imgBuffer = Buffer.isBuffer(videoFrame)
            ? videoFrame
            : Buffer.from(videoFrame, 'binary');

        // 2. SET HEADERS EXPLICITLY
        res.writeHead(200, {
            'Content-Type': 'image/jpeg',
            'Content-Length': imgBuffer.length,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        // 3. SEND RAW DATA
        res.end(imgBuffer);

    } catch (e) {
        console.error(e);
        res.status(500).end();
    }
});

export default router;
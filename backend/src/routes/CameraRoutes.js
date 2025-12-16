import express from 'express';
import Camera from '../models/Camera.js';
const router = express.Router();

// --- IN-MEMORY STREAM STORAGE ---
// Key = SERIAL NUMBER (not ID), Value = Image Buffer

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
// POST /api/stream/:serial/frame
// --- IN-MEMORY STORAGE ---
// Key = Serial Number (e.g., "SN-001")
// Value = Latest Raw Image Buffer
const activeStreams = {};

app.post('/api/stream/:serial/frame',
    express.raw({ type: 'image/jpeg', limit: '10mb' }),
    (req, res) => {
        const serial = req.params.serial;
        const buffer = req.body;

        if (!buffer || buffer.length === 0) return res.sendStatus(400);

        // Save Buffer AND the current Time
        activeStreams[serial] = {
            buffer: buffer,
            timestamp: Date.now()
        };

        console.log(`[UPLOAD] Serial: ${serial} | Size: ${buffer.length}`);
        res.sendStatus(200);
    }
);

// 2. NEW: STATUS ENDPOINT (Lightweight check)
// Frontend calls this to check if a new frame exists
app.get('/api/stream/:serial/status', (req, res) => {
    const serial = req.params.serial;
    const stream = activeStreams[serial];

    if (!stream) {
        return res.json({ lastUpdate: 0, online: false });
    }

    // Return just the timestamp (very small data)
    res.json({
        lastUpdate: stream.timestamp,
        online: true
    });
});

// 3. VIEW ENDPOINT (Modified to access .buffer)
app.get('/api/stream/:serial/feed', (req, res) => {
    const serial = req.params.serial;
    const stream = activeStreams[serial];

    if (!stream || !stream.buffer) return res.status(404).send('No signal');

    let buffer = stream.buffer; // <--- Access the buffer property

    // --- GARBAGE CLEANING (FF D8 ... FF D9) ---
    if (!Buffer.isBuffer(buffer)) buffer = Buffer.from(buffer, 'binary');
    const start = buffer.indexOf(Buffer.from([0xFF, 0xD8]));
    const end = buffer.lastIndexOf(Buffer.from([0xFF, 0xD9]));

    if (start !== -1 && end !== -1 && start < end) {
        buffer = buffer.subarray(start, end + 2);
    }
    // ------------------------------------------

    res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Length': buffer.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    res.end(buffer);
});

export default router;
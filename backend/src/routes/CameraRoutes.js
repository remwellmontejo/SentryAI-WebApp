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

// =================================================================
// 1. ESP32 UPLOAD ENDPOINT
// URL: POST http://YOUR_IP:5000/api/stream/:serial/frame
// =================================================================
router.post('/stream/:serial/frame',
    // IMPORTANT: Parse body as raw binary, not JSON
    express.raw({ type: 'image/jpeg', limit: '10mb' }),
    (req, res) => {
        const serial = req.params.serial;
        const buffer = req.body;

        // Basic validation
        if (!buffer || buffer.length === 0) {
            console.log(`[UPLOAD] ⚠️ Serial: ${serial} | Received empty buffer`);
            return res.sendStatus(400);
        }

        console.log(`[UPLOAD] Serial: ${serial} | Size: ${buffer.length} bytes`);

        // Store in RAM
        activeStreams[serial] = buffer;
        res.sendStatus(200);
    }
);

// =================================================================
// 2. FRONTEND VIEW ENDPOINT
// URL: GET http://localhost:5000/api/stream/:serial/feed
// =================================================================
router.get('/stream/:serial/feed', (req, res) => {
    const serial = req.params.serial;
    let buffer = activeStreams[serial];

    if (!buffer) {
        // console.log(`[VIEW] No signal for ${serial}`);
        return res.status(404).send('No signal');
    }

    // --- CORRUPTION FIX START ---
    // The ESP32 often sends "padding" zeros at the end of the buffer.
    // We must cut the buffer exactly where the JPEG ends (FF D9).

    // 1. Ensure it is a Buffer
    if (!Buffer.isBuffer(buffer)) {
        buffer = Buffer.from(buffer, 'binary');
    }

    // 2. Find Start of Image (SOI): FF D8
    const start = buffer.indexOf(Buffer.from([0xFF, 0xD8]));

    // 3. Find End of Image (EOI): FF D9
    const end = buffer.lastIndexOf(Buffer.from([0xFF, 0xD9]));

    if (start !== -1 && end !== -1 && start < end) {
        // ✂️ TRIM THE GARBAGE
        // We add +2 to include the FFD9 bytes themselves
        const cleanBuffer = buffer.subarray(start, end + 2);

        // Debugging: Show that we actually reduced the size
        // console.log(`[VIEW] Cleaned: ${buffer.length} -> ${cleanBuffer.length} bytes`);

        buffer = cleanBuffer;
    } else {
        console.log(`[VIEW] ⚠️ JPEG Markers missing for ${serial}. Sending raw buffer.`);
    }
    // --- CORRUPTION FIX END ---

    // 4. Send the headers that force the browser to see it as an image
    res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Length': buffer.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });

    // 5. Send the binary data
    res.end(buffer);
});

export default router;
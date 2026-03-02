import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import path from 'path';
import http from 'http';
import { WebSocketServer } from 'ws';

import apprehendedCarRoutes from './routes/ApprehendedVehicleRoutes.js';
import connectDB from './config/db.js';
import authRoutes from './routes/AuthRoutes.js';
import cameraRoutes from './routes/CameraRoutes.js';
import Camera from './models/Camera.js';
import publicApprehensionsRoutes from './routes/PublicApprehensionsRoutes.js'

const app = express();
const __dirname = path.resolve();
dotenv.config();

// --- GLOBAL WEBSOCKET MAPS ---
const streams = new Map();       // Viewer Sockets: Serial -> Set<WebSocket>
const cameraClients = new Map(); // Camera Sockets: Serial -> WebSocket

if (process.env.NODE_ENV !== 'production') {
    app.use(cors({
        origin: 'http://localhost:5173',
    }));
}
app.use(cors({
    origin: '*', // Or your specific Render frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Metadata'] // <-- CRITICAL
}));
app.use(express.raw({
    type: 'image/jpeg',
    limit: '50mb'
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(
    bodyParser.urlencoded({
        limit: "100mb",
        extended: true,
        parameterLimit: 300000,
    }),
);

app.use((req, res, next) => {
    // This allows the Controller to find the socket and send data
    req.cameraClients = cameraClients;
    req.streams = streams;
    next();
});


app.use("/api/apprehended-vehicle", apprehendedCarRoutes);
app.use("/auth", authRoutes);
app.use("/api/cameras", cameraRoutes);
app.use("/public", publicApprehensionsRoutes);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });


app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
});

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get(/.*/, (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    });
}


// --- WEBSOCKET LOGIC ---
wss.on('connection', async (ws, req) => {
    // Parse URL: wss://your-url.com?type=camera&serial=SN-001
    const params = new URLSearchParams(req.url.split('?')[1]);
    const type = params.get('type');
    const serial = params.get('serial');

    if (!serial) {
        ws.close();
        return;
    }

    console.log(`[WS] New ${type} connected: ${serial}`);

    if (type === 'camera') {
        // 1. REGISTER CAMERA
        cameraClients.set(serial, ws);

        // 2. INITIAL CONFIG SYNC
        try {
            let camera = await Camera.findOne({ serialNumber: serial });

            if (!camera) {
                console.log(`[WS] Registering new camera: ${serial}`);
                camera = await Camera.create({
                    name: `Camera ${serial}`,
                    serialNumber: serial,
                    status: 'online',
                    config: {}
                });
            } else {
                camera.status = 'online';
                camera.lastSeen = new Date();
                await camera.save();
            }

            const initialConfig = JSON.stringify({
                streamEnabled: camera.config.streamEnabled,
                streamResolution: camera.config.streamResolution,
                apprehensionTimer: camera.config.apprehensionTimer,
                zoneEnabled: camera.config.zoneEnabled,
                polyX: camera.config.polyX,
                polyY: camera.config.polyY,
                servoPan: camera.config.servoPan,
                servoTilt: camera.config.servoTilt
            });

            ws.send(initialConfig);
            console.log(`[WS] Sent startup config to ${serial}`);

        } catch (err) {
            console.error("Error fetching config:", err);
        }

        // 3. HANDLE MESSAGES
        ws.on('message', async (message, isBinary) => {
            const isText = !isBinary && message.toString().trim().startsWith('{');

            if (isText) {
                try {
                    const messageStr = message.toString();
                    const msgData = JSON.parse(messageStr);

                    if (msgData.type === 'heartbeat') {
                        // Handle Heartbeat internally
                        await Camera.updateOne(
                            { serialNumber: serial },
                            { lastSeen: new Date(), status: 'online' }
                        );
                    }
                    // ---> NEW LOGIC: FORWARD SERVO CONFIRMATION TO VIEWERS <---
                    // Change this line in your websocket server:
                    else if (msgData.type === 'servo_moving') {
                        if (streams.has(serial)) {
                            streams.get(serial).forEach(viewer => {
                                if (viewer.readyState === 1) viewer.send(messageStr);
                            });
                        }
                    }
                } catch (e) { /* Ignore bad JSON */ }
            } else {
                // --- VIDEO STREAMING LOGIC ---
                if (streams.has(serial)) {
                    streams.get(serial).forEach(viewer => {
                        if (viewer.readyState === 1) viewer.send(message);
                    });
                }
            }
        });

        // 4. CLEANUP ON DISCONNECT
        ws.on('close', async () => {
            if (cameraClients.get(serial) === ws) {
                console.log(`[WS] Camera disconnected: ${serial}`);
                cameraClients.delete(serial);

                await Camera.updateOne(
                    { serialNumber: serial },
                    { status: 'offline' }
                );
            } else {
                console.log(`[WS] Old/Zombie socket for ${serial} closed. Ignoring.`);
            }
        });

    } else if (type === 'viewer') {
        // --- VIEWER LOGIC ---
        if (!streams.has(serial)) streams.set(serial, new Set());
        streams.get(serial).add(ws);

        ws.on('close', () => {
            if (streams.has(serial)) streams.get(serial).delete(ws);
        });
    }
});

const HEARTBEAT_TIMEOUT_MS = 20 * 1000; // 20 Seconds
const WATCHDOG_INTERVAL_MS = 10 * 1000;     // Check every 10 seconds

setInterval(async () => {
    try {
        const thresholdTime = new Date(Date.now() - HEARTBEAT_TIMEOUT_MS);

        // Find all cameras currently marked 'online' but haven't checked in recently
        const expiredCameras = await Camera.find({
            status: 'online',
            lastSeen: { $lt: thresholdTime }
        });

        if (expiredCameras.length > 0) {
            console.log(`[Watchdog] Found ${expiredCameras.length} stale cameras. Marking as offline.`);

            // Extract the serial numbers of the disconnected cameras
            const serials = expiredCameras.map(cam => cam.serialNumber);

            // 1. Update Database
            await Camera.updateMany(
                { serialNumber: { $in: serials } },
                { $set: { status: 'offline' } }
            );

            // 2. Clean up server memory (Remove dead sockets from the Map)
            serials.forEach(serial => {
                if (cameraClients.has(serial)) {
                    const ws = cameraClients.get(serial);
                    if (ws.readyState !== 3) { // If not already closed
                        ws.terminate(); // Force close the zombie connection
                    }
                    cameraClients.delete(serial);
                    console.log(`[Watchdog] Terminated zombie socket for: ${serial}`);
                }
            });
        }
    } catch (error) {
        console.error("[Watchdog] Error sweeping offline cameras:", error);
    }
}, WATCHDOG_INTERVAL_MS);

connectDB().then(() => {
    const PORT = process.env.PORT || 5001;

    server.listen(PORT, () => {
        console.log(`🚀 Server + WebSockets running on port ${PORT}`);
    });
});
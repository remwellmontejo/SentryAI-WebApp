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
app.use(cors({ origin: '*' }));
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

app.use((req, res, next) => {
    // This allows the Controller to find the socket and send data
    req.cameraClients = cameraClients;
    req.streams = streams;
    next();
});

app.use("/api/apprehended-vehicle", apprehendedCarRoutes);
app.use("/auth", authRoutes);
app.use("/api/cameras", cameraRoutes);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

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

        // 2. INITIAL CONFIG SYNC (The "Startup" Logic)
        try {
            let camera = await Camera.findOne({ serialNumber: serial });

            if (!camera) {
                // If new camera, create default entry
                console.log(`[WS] Registering new camera: ${serial}`);
                camera = await Camera.create({
                    name: `Camera ${serial}`,
                    serialNumber: serial,
                    status: 'online',
                    config: {} // Uses defaults from Schema
                });
            } else {
                // Mark as Online
                camera.status = 'online';
                camera.lastSeen = new Date();
                await camera.save();
            }

            // Prepare Flat Payload for ESP32
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

            // Send immediately so ESP32 setup() catches it
            ws.send(initialConfig);
            console.log(`[WS] Sent startup config to ${serial}`);

        } catch (err) {
            console.error("Error fetching config:", err);
        }

        // 3. HANDLE MESSAGES
        ws.on('message', async (message, isBinary) => {
            // Logic: If Text -> Heartbeat. If Binary -> Video.
            const isText = !isBinary && message.toString().trim().startsWith('{');

            if (isText) {
                // --- HEARTBEAT LOGIC ---
                try {
                    const msgData = JSON.parse(message.toString());
                    if (msgData.type === 'heartbeat') {
                        // Update DB without triggering a full re-render
                        await Camera.updateOne(
                            { serialNumber: serial },
                            {
                                lastSeen: new Date(),
                                status: 'online'
                            }
                        );
                    }
                } catch (e) { /* Ignore bad JSON */ }
            } else {
                // --- VIDEO STREAMING LOGIC ---
                // Forward binary to all frontend viewers watching this serial
                if (streams.has(serial)) {
                    streams.get(serial).forEach(viewer => {
                        if (viewer.readyState === 1) viewer.send(message);
                    });
                }
            }
        });

        // 4. CLEANUP ON DISCONNECT
        ws.on('close', async () => {
            console.log(`[WS] Camera disconnected: ${serial}`);
            cameraClients.delete(serial);

            // Mark as Offline
            await Camera.updateOne(
                { serialNumber: serial },
                { status: 'offline' }
            );
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

connectDB().then(() => {
    const PORT = process.env.PORT || 5001;

    server.listen(PORT, () => {
        console.log(`🚀 Server + WebSockets running on port ${PORT}`);
    });
});

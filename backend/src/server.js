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

const app = express();
const __dirname = path.resolve();
dotenv.config();

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


app.use("/api/apprehended-vehicle", apprehendedCarRoutes);
app.use("/auth", authRoutes);
app.use("/api/cameras", cameraRoutes);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get(/.*/, (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    });
}

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const streams = new Map();

wss.on('connection', (ws, req) => {
    // Parse URL: wss://url.com?type=camera&serial=123
    const params = new URLSearchParams(req.url.split('?')[1]);
    const type = params.get('type');
    const serial = params.get('serial');

    if (!serial) {
        ws.close();
        return;
    }

    console.log(`[WS] New ${type} connected: ${serial}`);

    if (type === 'camera') {
        // --- CAMERA LOGIC ---
        ws.on('message', (message) => {
            // 'message' is raw binary data (JPEG)
            // Broadcast this frame to all viewers of THIS serial
            if (streams.has(serial)) {
                streams.get(serial).forEach(viewer => {
                    if (viewer.readyState === 1) { // 1 = OPEN
                        viewer.send(message);
                    }
                });
            }
        });

    } else if (type === 'viewer') {
        // --- VIEWER LOGIC ---
        if (!streams.has(serial)) {
            streams.set(serial, new Set());
        }
        streams.get(serial).add(ws);

        // Remove viewer on disconnect
        ws.on('close', () => {
            if (streams.has(serial)) {
                streams.get(serial).delete(ws);
            }
        });
    }
});

connectDB().then(() => {
    const PORT = process.env.PORT || 5001;

    server.listen(PORT, () => {
        console.log(`🚀 Server + WebSockets running on port ${PORT}`);
    });
});

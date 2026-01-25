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
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const viewers = new Map();
const __dirname = path.resolve();
dotenv.config();

if (process.env.NODE_ENV !== 'production') {
    app.use(cors({
        origin: 'http://localhost:5173',
    }));
}

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

wss.on('connection', (ws, req) => {
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const type = urlParams.get('type');
    const serial = urlParams.get('serial');

    console.log(`[WS] New Connection: ${type} ${serial}`);

    if (type === 'camera') {
        ws.on('message', (message) => {
            const cameraViewers = viewers.get(serial) || [];
            cameraViewers.forEach(viewerWs => {
                if (viewerWs.readyState === WebSocket.OPEN) {
                    viewerWs.send(message);
                }
            });
        });

    } else if (type === 'viewer') {
        if (!viewers.has(serial)) viewers.set(serial, []);
        viewers.get(serial).push(ws);

        ws.on('close', () => {
            const list = viewers.get(serial) || [];
            viewers.set(serial, list.filter(v => v !== ws));
        });
    }
});

connectDB().then(() => {
    const PORT = process.env.PORT || 5001;

    server.listen(PORT, () => {
        console.log(`🚀 Server + WebSockets running on port ${PORT}`);
    });
});

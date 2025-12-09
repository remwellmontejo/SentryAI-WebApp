import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import path from 'path';

import apprehendedCarRoutes from './routes/ApprehendedVehicleRoutes.js';
import connectDB from './config/db.js';
import authRoutes from './routes/AuthRoutes.js';

const app = express();
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

app.use("/api/apprehended-vehicle", apprehendedCarRoutes);
app.use("/auth", authRoutes);

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get(/.*/, (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    });


}

connectDB().then(() => {
    app.listen(5001, () => {
        console.log('Server is running on port 5001');
    });
});


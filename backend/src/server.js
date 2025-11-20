import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

import apprehendedCarRoutes from './routes/ApprehendedVehicleRoutes.js';
import connectDB from './config/db.js';
import authRoutes from './routes/AuthRoutes.js';

const app = express();
dotenv.config();
connectDB();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(
    bodyParser.urlencoded({
        limit: "50mb",
        extended: true,
        parameterLimit: 100000,
    }),
);

app.use("/api/apprehended-vehicle", apprehendedCarRoutes);
app.use("/auth", authRoutes);

app.listen(5001, () => {
    console.log('Server is running on port 5001');
});


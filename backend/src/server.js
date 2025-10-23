import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

import apprehendedCarRoutes from './routes/apprehendedCarRoutes.js';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
dotenv.config();
connectDB();

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

app.use("/api/apprehended-car", apprehendedCarRoutes);
app.use("/auth", authRoutes);

app.listen(5001, () => {
    console.log('Server is running on port 5001');
});


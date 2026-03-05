import mongoose from "mongoose";

const CameraSchema = new mongoose.Schema({
    // --- IDENTITY ---
    name: { type: String, required: true },
    serialNumber: { type: String, required: true, unique: true },
    status: { type: String, default: 'offline' }, // 'online' or 'offline'
    lastSeen: { type: Date, default: Date.now },

    // --- CONFIGURATION (Per Camera) ---
    config: {
        streamEnabled: { type: Boolean, default: false },
        apprehensionTimer: { type: Number, default: 30 },
        streamResolution: { type: Number, default: 1 },
        zoneEnabled: { type: Boolean, default: false },
        polyX: { type: [Number], default: [0, 100, 100, 0] },
        polyY: { type: [Number], default: [0, 0, 100, 100] },
        servoPan: { type: Number, default: 90 },
        servoTilt: { type: Number, default: 90 },
    }
});

export default mongoose.model('Camera', CameraSchema);
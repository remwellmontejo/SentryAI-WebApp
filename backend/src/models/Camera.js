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
        // Example of how it should look in your schema:
        polyX: {
            type: [Number],
            default: [20, 80, 100, 80, 20, 0] // Give it 6 default numbers
        },
        polyY: {
            type: [Number],
            default: [0, 0, 50, 100, 100, 50] // Give it 6 default numbers
        },
        servoPan: { type: Number, default: 90 },
        servoTilt: { type: Number, default: 90 },
    }
});

export default mongoose.model('Camera', CameraSchema);
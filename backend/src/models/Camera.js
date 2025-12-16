import mongoose from "mongoose";

const CameraSchema = new mongoose.Schema({
    // --- IDENTITY ---
    name: { type: String, required: true },
    serialNumber: { type: String, required: true, unique: true },
    location: { type: String, default: "Unknown" },
    status: { type: String, default: 'offline' }, // 'online' or 'offline'
    lastSeen: { type: Date, default: Date.now },

    // --- CONFIGURATION (Per Camera) ---
    config: {
        streamActive: { type: Boolean, default: false }, // Toggle specific stream
        apprehensionTimer: { type: Number, default: 3000 },

        // Zone Settings (Quadrilateral)
        zoneEnabled: { type: Boolean, default: false },
        polyX: { type: [Number], default: [0, 100, 100, 0] },
        polyY: { type: [Number], default: [0, 0, 100, 100] }
    }
});

export default mongoose.model('Camera', CameraSchema);
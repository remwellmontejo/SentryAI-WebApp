import mongoose from "mongoose";

const apprehendedVehicleSchema = new mongoose.Schema(
    {
        vehicleType: {
            type: String,
            required: true
        },
        plateNumber: {
            type: String,
            default: "NO PLATE NUMBER FOUND",
            uppercase: true,
        },
        x_coordinate: {
            type: Number,
            required: true
        },
        y_coordinate: {
            type: Number,
            required: true
        },
        confidenceScore: {
            type: Number,
            required: true
        },
        sceneImageBase64: {
            type: String,
            required: true,
            select: false
        },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending'
        },
    },
    { timestamps: true }
);

const ApprehendedVehicle = mongoose.model('ApprehendedVehicle', apprehendedVehicleSchema);
export default ApprehendedVehicle;
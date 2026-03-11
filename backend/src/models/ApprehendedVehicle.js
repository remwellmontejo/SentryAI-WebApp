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
            enum: ['Pending', 'Approved', 'Rejected', 'Resolved'],
            default: 'Pending'
        },
        cameraSerialNumber: {
            type: String,
            default: 'UNKNOWN_CAMERA'
        }
    },
    { 
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Setup a virtual field 'camera' to map the serialNumber back to the Camera collection
apprehendedVehicleSchema.virtual('camera', {
    ref: 'Camera',
    localField: 'cameraSerialNumber',
    foreignField: 'serialNumber',
    justOne: true // We only want one Camera object, not an array
});

const ApprehendedVehicle = mongoose.model('ApprehendedVehicle', apprehendedVehicleSchema);
export default ApprehendedVehicle;
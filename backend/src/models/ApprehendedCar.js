import mongoose from "mongoose";

const apprehendedCarSchema = new mongoose.Schema(
    {
        image: { type: Buffer, required: false },
        location: { type: String, required: true },
        content: { type: String, required: true }, 
        carDetailsFromAPI: { type: Object, required: false },
    },
    { timestamps: true }
);

const ApprehendedCar = mongoose.model('ApprehendedCar', apprehendedCarSchema);
export default ApprehendedCar;
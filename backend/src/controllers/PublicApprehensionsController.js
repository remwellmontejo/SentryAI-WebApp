// controllers/apprehensionController.js
import ApprehendedVehicle from '../models/ApprehendedVehicle.js'; // Adjust path to your model

const searchPublicApprehensions = async (req, res) => {
    try {
        // 1. Sanitize the input
        const searchPlate = req.params.plateNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

        // 2. Search the database with the APPROVED status filter
        const records = await ApprehendedVehicle.find({
            plateNumber: { $regex: new RegExp(searchPlate, 'i') },
            status: 'Approved' // Make sure this matches your schema's exact string
        });

        // 3. Return results
        if (records.length === 0) {
            return res.status(404).json({
                success: true,
                message: "No approved records found",
                data: []
            });
        }

        res.status(200).json({
            success: true,
            message: "Records found",
            data: records
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

export { searchPublicApprehensions };
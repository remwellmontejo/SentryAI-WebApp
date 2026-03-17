import ApprehendedVehicle from '../models/ApprehendedVehicle.js';
import Camera from '../models/Camera.js';
import fetch from "node-fetch";
import FormData from "form-data";
import sizeOf from "image-size"; // Import image-size
import { createSysLog } from './SystemLogController.js'; // IMPORT LOGGING
import { createNotification } from './NotificationController.js';

export async function getAllApprehendedVehicles(req, res) {
    try {
        const vehicles = await ApprehendedVehicle.find()
            .sort({ createdAt: -1 });
        res.status(200).json(vehicles);
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.status(500).json({ message: 'Server error fetching data' });
    }
}

export const getDashboardStats = async (req, res) => {
    try {
        // Create a date object for Midnight today (Server Time)
        // Note: If your server is hosted on Render (UTC), you may want to offset this to Asia/Manila (+8)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // Use Promise.all to run all database queries concurrently for maximum speed
        const [
            totalApprehended,
            pendingReview,
            apprehendedToday
        ] = await Promise.all([
            ApprehendedVehicle.countDocuments({ status: { $in: ['Approved', 'Resolved'] } }),
            ApprehendedVehicle.countDocuments({ status: 'Pending' }),
            ApprehendedVehicle.countDocuments({ createdAt: { $gte: startOfToday } })
        ]);

        // For Active Cameras, if you have a Camera model, you would query it here.
        const activeCameras = await Camera.countDocuments({ status: 'online' });

        res.status(200).json({
            totalApprehended,
            pendingReview,
            apprehendedToday,
            activeCameras
        });

    } catch (error) {
        console.error('[ERROR] Failed to fetch dashboard stats:', error);
        res.status(500).json({ message: 'Server error fetching dashboard stats' });
    }
};

export async function getApprehendedVehiclesByStatus(req, res) {
    try {
        // Extract status from the URL parameters
        const { status } = req.params;

        // Ensure the input matches the Enum casing required by your Mongoose schema
        const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

        // Validate that the requested status is one of the allowed types
        const allowedStatuses = ['Pending', 'Approved', 'Rejected', 'Resolved'];
        if (!allowedStatuses.includes(formattedStatus)) {
            return res.status(400).json({
                message: "Invalid status. Must be 'Pending', 'Approved', or 'Rejected'."
            });
        }

        // Find vehicles matching the status, sorted newest to oldest
        const vehicles = await ApprehendedVehicle.find({ status: formattedStatus })
            .sort({ createdAt: -1 })
            .populate('camera', 'name serialNumber');

        res.status(200).json(vehicles);
    } catch (error) {
        console.error(`Error fetching ${req.params.status} vehicles:`, error);
        res.status(500).json({ message: 'Server error fetching data' });
    }
}

export async function createApprehendedVehicle(req, res) {
    try {
        const imageBuffer = req.body;

        // --- 1. VALIDATION ---
        if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
            return res.status(400).json({ msg: "Missing image binary data" });
        }

        const rawMetadata = req.headers['x-metadata'];
        if (!rawMetadata) {
            return res.status(400).json({ msg: "Missing X-Metadata header" });
        }

        let metadata;
        try {
            metadata = JSON.parse(rawMetadata);
        } catch (e) {
            return res.status(400).json({ msg: "Invalid JSON in X-Metadata" });
        }

        const { vehicleType, confidenceScore, x_coordinate, y_coordinate, cameraSerialNumber } = metadata;

        // --- 2. CONVERT TO BASE64 & GET DIMENSIONS ---
        const base64Image = imageBuffer.toString('base64');

        const dimensions = sizeOf(imageBuffer);
        const imgWidth = dimensions.width;
        const imgHeight = dimensions.height;

        // --- 3. COORDINATE SCALING (Percentage 0-100 -> Real Image Pixels) ---
        // The hardware now sends centroid as a percentage (0-100) based on a 240x240 model.
        // Convert to real pixel coordinates for ALPR distance comparison.
        const realCentroidX = (x_coordinate / 100) * imgWidth;
        const realCentroidY = (y_coordinate / 100) * imgHeight;

        console.log(`[ALPR] Centroid %%: (${x_coordinate}%, ${y_coordinate}%)`);
        console.log(`[ALPR] Real Centroid: (${realCentroidX.toFixed(0)}, ${realCentroidY.toFixed(0)}) in ${imgWidth}x${imgHeight} image`);

        // --- 4. PLATE RECOGNIZER API (BASE64 MODE) ---
        let detectedPlateNumber = "NO PLATE NUMBER DETECTED";

        try {
            const body = new FormData();
            body.append("upload", base64Image);
            body.append("regions", "ph");

            const apiResponse = await fetch("https://api.platerecognizer.com/v1/plate-reader/", {
                method: "POST",
                headers: {
                    "Authorization": `Token ${process.env.PLATERECOGNIZER_TOKEN}`
                },
                body: body,
            });

            if (!apiResponse.ok) {
                console.error(`[ALPR ERROR] Status ${apiResponse.status}`);
                detectedPlateNumber = "FAILED";
            } else {
                const json = await apiResponse.json();

                // --- 5. FIND CLOSEST PLATE ---
                if (json.results && json.results.length > 0) {

                    let closestMatch = null;
                    let minDistance = Infinity;

                    json.results.forEach((result) => {
                        const box = result.box; // Box is in Real Image Pixels

                        const plateCenterX = (box.xmin + box.xmax) / 2;
                        const plateCenterY = (box.ymin + box.ymax) / 2;

                        // Compare Real Plate Center vs Real Centroid (both in pixels)
                        const distance = Math.sqrt(
                            Math.pow(plateCenterX - realCentroidX, 2) +
                            Math.pow(plateCenterY - realCentroidY, 2)
                        );

                        if (distance < minDistance) {
                            minDistance = distance;
                            closestMatch = result;
                        }
                    });

                    if (closestMatch) {
                        detectedPlateNumber = closestMatch.plate.toUpperCase();
                        console.log(`[ALPR] Matched: ${detectedPlateNumber} (Dist: ${minDistance.toFixed(0)}px)`);
                    }
                }
            }
        } catch (alprError) {
            console.error("[ALPR EXCEPTION]", alprError);
            detectedPlateNumber = "FAILED";
        }

        // --- 6. SAVE TO DB ---
        const newApprehendedVehicle = new ApprehendedVehicle({
            vehicleType,
            plateNumber: detectedPlateNumber,
            confidenceScore,
            x_coordinate: x_coordinate + 7, // Store original percentage (0-100)
            y_coordinate: y_coordinate + 7, // Store original percentage (0-100)
            sceneImageBase64: base64Image,
            status: "Pending",
            cameraSerialNumber: cameraSerialNumber || "UNKNOWN_CAMERA"
        });

        await newApprehendedVehicle.save();

        // UNIQUE TRIGGER: Notifying Admins of New Upload
        await createNotification(
            `A new ${vehicleType} apprehension was uploaded from camera ${cameraSerialNumber || "UNKNOWN"}`, 
            'NEW_APPREHENSION', 
            newApprehendedVehicle._id
        );

        res.status(200).json({ message: 'Created', plate: detectedPlateNumber });

    } catch (error) {
        console.error(`[ERROR] ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
}

// export async function createApprehendedVehicle(req, res) {
//     try {
//         const imageBuffer = req.body;

//         if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
//             console.error("[ERROR] No image binary received in body");
//             return res.status(400).json({ msg: "Missing image binary data" });
//         }

//         const rawMetadata = req.headers['x-metadata'];
//         if (!rawMetadata) {
//             console.error("[ERROR] Missing 'X-Metadata' header");
//             return res.status(400).json({ msg: "Missing X-Metadata header" });
//         }

//         // Parse the JSON string back into an Object
//         let metadata;
//         try {
//             metadata = JSON.parse(rawMetadata);
//         } catch (e) {
//             return res.status(400).json({ msg: "Invalid JSON in X-Metadata" });
//         }

//         // Destructure fields
//         const {
//             vehicleType,
//             confidenceScore,
//             x_coordinate,
//             y_coordinate,
//             plateNumber
//         } = metadata;

//         const base64Data = imageBuffer.toString('base64');
//         const newApprehendedVehicle = new ApprehendedVehicle({
//             vehicleType,
//             plateNumber: plateNumber || "PENDING_VERIFICATION",
//             confidenceScore,
//             x_coordinate,
//             y_coordinate,
//             sceneImageBase64: base64Data,
//             status: 'Pending'
//         });

//         await newApprehendedVehicle.save();

//         console.log(`[SUCCESS] Saved Apprehension ID: ${newApprehendedVehicle._id}`);
//         res.status(200).json({ message: 'Apprehended vehicle created successfully!' });

//     } catch (error) {
//         console.error(`[ERROR] Server Error: ${error.message}`);
//         res.status(500).json({ message: 'Server error' });
//     }
// }

export async function getApprehendedVehicleById(req, res) {
    try {
        const { id } = req.params;

        // 1. Find by ID
        // 2. IMPORTANT: Use .select('+sceneImageBase64') to include the hidden image field
        const vehicle = await ApprehendedVehicle.findById(id)
            .select('+sceneImageBase64')
            .populate('camera', 'name serialNumber');

        if (!vehicle) {
            return res.status(404).json({ message: "Apprehension record not found" });
        }

        res.status(200).json(vehicle);
    } catch (error) {
        console.error("Error fetching vehicle details:", error);
        res.status(500).json({ message: "Server error fetching details" });
    }
}

export async function statusUpdateApprehendedVehicle(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const vehicle = await ApprehendedVehicle.findById(id);
        if (!vehicle) {
            return res.status(404).json({ message: "Apprehension record not found" });
        }

        vehicle.status = status;

        // Track who performed the action using the JWT decoded user object
        const actionUser = (req.user?.firstName && req.user?.lastName)
            ? `${req.user.firstName} ${req.user.lastName}`
            : (req.user?.username || "System");
        if (status === 'Approved') {
            vehicle.approvedBy = actionUser;
        } else if (status === 'Rejected') {
            vehicle.rejectedBy = actionUser;
        } else if (status === 'Resolved') {
            vehicle.resolvedBy = actionUser;
        }

        // CREATE SYSTEM LOG
        await createSysLog(actionUser, 'UPDATE_APPREHENSION_STATUS', `Changed status of apprehension ${id} (${vehicle.plateNumber || 'Unknown Plate'}) to ${status}`);

        await vehicle.save();
        res.status(200).json({ message: 'Apprehended vehicle status updated successfully!' });
    } catch (error) {
        console.error("Error updating vehicle status:", error);
        res.status(500).json({ message: "Server error updating vehicle status" });
    }
}

export const updateApprehendedVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const { plateNumber, vehicleType, status } = req.body;
        const vehicle = await ApprehendedVehicle.findById(id);

        if (!vehicle) {
            return res.status(404).json({ message: "Apprehension record not found" });
        }

        let isEdited = false;
        let changes = [];

        if (plateNumber !== undefined && vehicle.plateNumber !== plateNumber.toUpperCase()) {
            changes.push(`plate from ${vehicle.plateNumber || 'Null'} to ${plateNumber.toUpperCase()}`);
            vehicle.plateNumber = plateNumber.toUpperCase();
            isEdited = true;
        }

        if (vehicleType !== undefined && vehicle.vehicleType !== vehicleType) {
            if (['Car', 'Motorcycle'].includes(vehicleType)) {
                changes.push(`type from ${vehicle.vehicleType} to ${vehicleType}`);
                vehicle.vehicleType = vehicleType;
                isEdited = true;
            } else {
                return res.status(400).json({ message: "Invalid Vehicle Type. Must be 'Car' or 'Motorcycle'" });
            }
        }

        if (status !== undefined && vehicle.status !== status) {
            if (['Pending', 'Approved', 'Rejected', 'Resolved'].includes(status)) {
                vehicle.status = status;
                
                // Track status changes here if they happen through the update route
                const actionUser = (req.user?.firstName && req.user?.lastName)
                    ? `${req.user.firstName} ${req.user.lastName}`
                    : (req.user?.username || "System");
                if (status === 'Approved') vehicle.approvedBy = actionUser;
                if (status === 'Rejected') vehicle.rejectedBy = actionUser;
                if (status === 'Resolved') vehicle.resolvedBy = actionUser;

                changes.push(`status to ${status}`);
                isEdited = true;
            } else {
                return res.status(400).json({ message: "Invalid Status" });
            }
        }

        if (isEdited) {
            const editUser = (req.user?.firstName && req.user?.lastName)
                ? `${req.user.firstName} ${req.user.lastName}`
                : (req.user?.username || "System");
            vehicle.editedBy = editUser;
            // CREATE SYSTEM LOG
            await createSysLog(vehicle.editedBy, 'EDIT_APPREHENSION', `Edited apprehension ${id} (${changes.length > 0 ? changes.join(', ') : 'unknown changes'})`);
        }

        const updatedVehicle = await vehicle.save();

        console.log(`[UPDATE] Updated Apprehension ${id} | Status: ${updatedVehicle.status} | Edited By: ${updatedVehicle.editedBy}`);
        res.status(200).json(updatedVehicle);

    } catch (error) {
        console.error(`[ERROR] Update failed for ${req.params.id}:`, error);
        res.status(500).json({ message: "Server error while updating record" });
    }
};
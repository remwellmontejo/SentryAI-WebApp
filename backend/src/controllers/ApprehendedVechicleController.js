import ApprehendedVehicle from '../models/ApprehendedVehicle.js';
import fetch from "node-fetch";
import FormData from "form-data";
import sizeOf from "image-size"; // Import image-size

export async function getAllApprehendedVehicles(req, res) {
    try {
        const vehicles = await ApprehendedVehicle.find().sort({ createdAt: -1 });
        res.status(200).json(vehicles);
    } catch (error) {
        console.error('Error fetching vehicles:', error);
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

        const { vehicleType, confidenceScore, x_coordinate, y_coordinate } = metadata;

        // --- 2. CONVERT TO BASE64 & GET DIMENSIONS ---
        // We convert once here to use for both the API call and the Database save
        const base64Image = imageBuffer.toString('base64');

        // Use the buffer to get dimensions (image-size works best with buffers)
        const dimensions = sizeOf(imageBuffer);
        const imgWidth = dimensions.width;
        const imgHeight = dimensions.height;

        // --- 3. COORDINATE SCALING (Model 480px -> Real Image Size) ---
        const scaleX = imgWidth / 480;
        const scaleY = imgHeight / 480;

        const realCentroidX = x_coordinate * scaleX;
        const realCentroidY = y_coordinate * scaleY;

        console.log(`[ALPR] Model Centroid: (${x_coordinate}, ${y_coordinate})`);
        console.log(`[ALPR] Real Centroid:  (${realCentroidX.toFixed(0)}, ${realCentroidY.toFixed(0)})`);

        // --- 4. PLATE RECOGNIZER API (BASE64 MODE) ---
        let detectedPlateNumber = "NO PLATE NUMBER DETECTED";

        try {
            const body = new FormData();

            // Send the Base64 string directly
            // Note: Some APIs might require "data:image/jpeg;base64," prefix. 
            // Plate Recognizer typically accepts the raw base64 string or the data URI.
            body.append("upload", base64Image);
            body.append("regions", "ph");

            const apiResponse = await fetch("https://api.platerecognizer.com/v1/plate-reader/", {
                method: "POST",
                headers: {
                    "Authorization": `Token ${process.env.PLATERECOGNIZER_TOKEN}`
                    // ...body.getHeaders()
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

                        // Compare Real Plate Center vs Scaled Centroid
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
        // Use the same base64 string we created earlier
        const newApprehendedVehicle = new ApprehendedVehicle({
            vehicleType,
            plateNumber: detectedPlateNumber,
            confidenceScore,
            x_coordinate, // Store original 480 coords
            y_coordinate, // Store original 480 coords
            sceneImageBase64: base64Image,
            status: detectedPlateNumber === "FAILED" ? "Pending" : "Pending"
        });

        await newApprehendedVehicle.save();
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
        const vehicle = await ApprehendedVehicle.findById(id).select('+sceneImageBase64');

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

        if (plateNumber !== undefined) {
            vehicle.plateNumber = plateNumber.toUpperCase();
        }

        if (vehicleType !== undefined) {
            if (['Car', 'Motorcycle'].includes(vehicleType)) {
                vehicle.vehicleType = vehicleType;
            } else {
                return res.status(400).json({ message: "Invalid Vehicle Type. Must be 'Car' or 'Motorcycle'" });
            }
        }

        if (status !== undefined) {
            if (['Pending', 'Approved', 'Rejected'].includes(status)) {
                vehicle.status = status;
            } else {
                return res.status(400).json({ message: "Invalid Status" });
            }
        }

        const updatedVehicle = await vehicle.save();

        console.log(`[UPDATE] Updated Apprehension ${id} | Status: ${updatedVehicle.status}`);
        res.status(200).json(updatedVehicle);

    } catch (error) {
        console.error(`[ERROR] Update failed for ${req.params.id}:`, error);
        res.status(500).json({ message: "Server error while updating record" });
    }
};
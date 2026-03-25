import ApprehendedVehicle from '../models/ApprehendedVehicle.js';

/**
 * GET /api/external/apprehensions
 * Returns all approved apprehensions (including images) for external traffic authorities.
 * 
 * Query params:
 *   - page (number, default: 1)
 *   - limit (number, default: 20, max: 100)
 *   - plateNumber (string, optional filter)
 */
export const getApprovedApprehensions = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        // Build filter: only Approved status
        const filter = { status: 'Approved' };

        // Optional plate number filter
        if (req.query.plateNumber) {
            const sanitized = req.query.plateNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            filter.plateNumber = sanitized;
        }

        // Run count and data query in parallel
        const [total, apprehensions] = await Promise.all([
            ApprehendedVehicle.countDocuments(filter),
            ApprehendedVehicle.find(filter)
                .select('+sceneImageBase64')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('camera', 'name serialNumber location')
        ]);

        res.status(200).json({
            success: true,
            message: "Approved apprehensions retrieved successfully",
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit
            },
            data: apprehensions
        });

    } catch (error) {
        console.error('[EXTERNAL API] Error fetching approved apprehensions:', error);
        res.status(500).json({
            success: false,
            message: "Server error fetching apprehensions",
            error: error.message
        });
    }
};

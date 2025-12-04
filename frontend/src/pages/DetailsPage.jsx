import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Edit, Trash2 } from "lucide-react"; // Import necessary icons
import api from "../lib/axios.js";
import Navbar from "../components/Navbar";

const DetailsPage = () => {
    const { id } = useParams(); // Get the ID from the URL
    const navigate = useNavigate();

    const [vehicle, setVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await api.get(`/api/apprehended-vehicle/${id}`);
                setVehicle(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching details:", err);
                setError("Failed to load vehicle details. Please try again.");
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    // --- Helpers for Manila Time (from previous versions) ---
    const formatDate = (isoString) => {
        if (!isoString) return "N/A";
        return new Date(isoString).toLocaleDateString('en-US', {
            timeZone: 'Asia/Manila',
            month: '2-digit', day: '2-digit', year: '2-digit'
        }).replace(/\//g, '-');
    };

    const formatTime = (isoString) => {
        if (!isoString) return "N/A";
        return new Date(isoString).toLocaleTimeString('en-US', {
            timeZone: 'Asia/Manila',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    // --- Render Logic ---
    if (loading) return (
        <div className="min-h-screen" data-theme="corporateBlue">
            <div>
                <Navbar />
            </div>
            <div className="flex justify-center items-center min-h-screen text-gray-600">Loading details...</div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col justify-center items-center h-screen text-red-600">
            <p>{error}</p>
            <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Go Back</button>
        </div>
    );

    if (!vehicle) return (
        <div className="flex flex-col justify-center items-center h-screen text-gray-600">
            <p>No vehicle data found.</p>
            <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Go Back</button>
        </div>
    );

    // Construct location string using coordinates for now
    const locationString = vehicle.x_coordinate && vehicle.y_coordinate
        ? `(${vehicle.x_coordinate}, ${vehicle.y_coordinate})`
        : "Location Unknown";

    return (
        <div className="min-h-screen" data-theme="corporateBlue">
            <div>
                <Navbar />
            </div>
            <div className="min-w-screen mx-auto pt-1 bg-white overflow-hidden">

                {/* Back Button (Optional - but good for UX) */}
                <div className="p-4 pl-10">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors">
                        <ArrowLeft size={20} />
                        Back
                    </button>
                </div>

                <h1 className="text-2xl font-bold text-primary-base-content pl-10 pb-5">Vehicle Information</h1>


                <div className="px-10 grid md:grid-cols-2 gap-6">
                    {/* Left: Image Section */}
                    <div className="col-span-1">
                        {vehicle.sceneImageBase64 ? (
                            <img
                                src={`data:image/jpeg;base64,${vehicle.sceneImageBase64}`}
                                alt="Apprehension Scene"
                                className="w-full h-auto object-cover rounded-lg shadow-md border border-gray-200"
                            />
                        ) : (
                            <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-500 rounded-lg border border-gray-300">
                                No Image Available
                            </div>
                        )}
                    </div>

                    {/* Right: Details Section */}
                    <div className="col-span-1 flex flex-col justify-between">
                        <div className="border-2 border-primary rounded-lg p-6 space-y-4 h-max">
                            <div className="flex justify-between items-center text-gray-700">
                                <span className="font-medium">Vehicle Type</span>
                                <span className="text-right">{vehicle.vehicleType || "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-700">
                                <span className="font-medium">Status</span>
                                <span className="text-right">{vehicle.status || "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-700">
                                <span className="font-medium">Confidence Score</span>
                                <span className="text-right">{vehicle.confidenceScore || "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-700">
                                <span className="font-medium">Location in Image</span>
                                <span className="text-right">{locationString}</span> {/* Using constructed location */}
                            </div>
                            <div className="flex justify-between items-center text-gray-700">
                                <span className="font-medium">Date</span>
                                <span className="text-right">{formatDate(vehicle.createdAt)}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-700">
                                <span className="font-medium">Time</span>
                                <span className="text-right">{formatTime(vehicle.createdAt)}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-700">
                                <span className="font-medium">Plate Number</span>
                                <span className="text-right font-semibold text-lg">{vehicle.plateNumber || "N/A"}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <button className="btn btn-primary flex-1 flex items-center justify-center gap-2 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors">
                                <Edit size={20} /> Edit
                            </button>
                            <button className="btn btn-error flex-1 flex items-center justify-center gap-2 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors">
                                <Trash2 size={20} /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetailsPage;
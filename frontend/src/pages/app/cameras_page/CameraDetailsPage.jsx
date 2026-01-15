import Navbar from '../../../components/Navbar'
import { useEffect, useState, useRef } from "react";
import api from "../../../lib/axios";

// ================= CONFIGURATION =================
const BACKEND_URL = "https://sentryai.onrender.com"; // OR "http://localhost:5000"
const SERIAL_NUMBER = "SN-001";
// =================================================
const CamerasPage = () => {
    // We keep track of the current image URL and the "next" one being fetched
    const [currentImage, setCurrentImage] = useState(null);
    const [nextImage, setNextImage] = useState(null);

    // Status tracking
    const [isOnline, setIsOnline] = useState(false);
    const lastFetchRef = useRef(0);

    useEffect(() => {
        // Function to ask server: "Do you have a new frame?"
        const checkStatus = async () => {
            try {
                const res = await api.get(`/api/cameras/stream/${SERIAL_NUMBER}/status`);

                if (res.data && typeof res.data.lastUpdate === 'number') {
                    const serverTime = res.data.lastUpdate;

                    // 2. If new frame exists, start downloading it into the "Next" slot
                    if (serverTime > lastFetchRef.current) {
                        lastFetchRef.current = serverTime;

                        // Construct the new URL
                        const newUrl = `${BACKEND_URL}/api/cameras/stream/${SERIAL_NUMBER}/feed?t=${serverTime}`;

                        // Pre-load the image by setting it to 'nextImage'
                        setNextImage(newUrl);
                        setIsOnline(true);
                    }
                }
            } catch (err) {
                setIsOnline(false);
            }
        };

        // Check every 200ms (Very fast & lightweight)
        const interval = setInterval(checkStatus, 200);
        return () => clearInterval(interval);
    }, []);

    const handleImageLoad = () => {
        if (nextImage) {
            setCurrentImage(nextImage);
            setNextImage(null); // Clear the buffer for the next frame
        }
    };

    return (
        <div className='min-h-screen'>
            <Navbar />
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <h1 className="text-white font-mono mb-4">
                    Smooth Stream: <span className="text-green-400">{SERIAL_NUMBER}</span>
                </h1>

                <div className="relative border-2 border-gray-800 bg-gray-900 rounded-lg overflow-hidden shadow-2xl"
                    style={{ width: '640px', height: '480px' }}>

                    {/* STATUS INDICATOR */}
                    <div className={`absolute top-2 left-2 z-20 px-2 py-1 rounded text-[10px] font-bold ${isOnline ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                        {isOnline ? "● LIVE" : "● OFFLINE"}
                    </div>

                    {/* LAYER 1: The Visible Image (Current Frame) */}
                    {currentImage && (
                        <img
                            src={currentImage}
                            className="absolute inset-0 w-full h-full object-contain z-10"
                            alt="Stream"
                        />
                    )}

                    {/* LAYER 2: The Hidden Buffer (Next Frame) 
                    It is behind the current image. We wait for onLoad to swap them.
                */}
                    {nextImage && (
                        <img
                            src={nextImage}
                            className="absolute inset-0 w-full h-full object-contain -z-10 opacity-0"
                            // The opacity-0 keeps it hidden, but browser still downloads it.
                            // Once loaded, 'handleImageLoad' runs and updates the UI instantly.
                            onLoad={handleImageLoad}
                            alt="Buffer"
                        />
                    )}

                    {/* LOADING STATE (Only if no images at all) */}
                    {!currentImage && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 animate-pulse z-0">
                            <p className="text-2xl mb-2">📡</p>
                            <p>Waiting for signal...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CamerasPage

import Navbar from '../components/Navbar'
import { useEffect, useState, useRef } from "react";
import api from "../lib/axios";

// ================= CONFIGURATION =================
const BACKEND_URL = "https://sentryai.onrender.com"; // OR "http://localhost:5000"
const SERIAL_NUMBER = "SN-001";
// =================================================
const CamerasPage = () => {
    // Stores the timestamp of the image currently on screen
    const [lastFrameTime, setLastFrameTime] = useState(0);
    const [isOnline, setIsOnline] = useState(false);

    // Use a ref to track the last update without triggering re-renders
    const lastFetchRef = useRef(0);

    useEffect(() => {
        // Function to ask server: "Do you have a new frame?"
        const checkStatus = async () => {
            try {
                const res = await api.get(`/api/cameras/stream/${SERIAL_NUMBER}/status`);

                // 🛡️ CRITICAL FIX: Safety Check
                // We check if 'res.data' exists AND if 'lastUpdate' is a number
                if (res.data && typeof res.data.lastUpdate === 'number') {

                    const serverTime = res.data.lastUpdate;

                    // ONLY update if the server time is newer than what we have
                    if (serverTime > lastFetchRef.current) {
                        console.log("New frame detected!", serverTime);
                        lastFetchRef.current = serverTime;
                        setLastFrameTime(serverTime); // This triggers the image refresh
                        setIsOnline(true);
                    }
                }
            } catch (err) {
                // Silently ignore errors (server offline, etc) so the app doesn't crash
                // console.warn("Status check failed, waiting...");
                setIsOnline(false);
            }
        };

        // Check every 200ms (Very fast & lightweight)
        const interval = setInterval(checkStatus, 200);
        return () => clearInterval(interval);
    }, []);

    // The Image URL changes ONLY when 'lastFrameTime' updates
    const streamUrl = `${BACKEND_URL}/api/cameras/stream/${SERIAL_NUMBER}/feed?t=${lastFrameTime}`;


    return (
        <div className='min-h-screen'>
            <Navbar />
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <h1 className="text-white font-mono mb-4">
                    Smart Feed: <span className="text-green-400">{SERIAL_NUMBER}</span>
                </h1>

                <div className="relative border-2 border-gray-800 bg-gray-900 rounded-lg overflow-hidden shadow-2xl"
                    style={{ width: '640px', height: '480px' }}>

                    {/* key={lastFrameTime} ensures React completely replaces the <img> 
                    only when a new frame is actually confirmed available.
                */}
                    {lastFrameTime > 0 ? (
                        <img
                            key={lastFrameTime}
                            src={streamUrl}
                            className="w-full h-full object-contain block"
                            alt="Live Stream"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Waiting for first frame...
                        </div>
                    )}

                    {/* Status Indicator */}
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded text-[10px] font-bold ${isOnline ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-gray-400'}`}>
                        {isOnline ? "● LIVE" : "● OFFLINE"}
                    </div>
                </div>

                <p className="text-gray-600 text-xs mt-4 font-mono">
                    Last Update: {new Date(lastFrameTime).toLocaleTimeString()}
                </p>
            </div>
        </div>
    );
};

export default CamerasPage

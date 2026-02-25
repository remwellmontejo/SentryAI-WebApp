import { useState, useEffect } from 'react';

export const useCameraStatus = (lastSeenDate) => {
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        // Function to check time difference
        const checkStatus = () => {
            if (!lastSeenDate) {
                setIsOnline(false);
                return;
            }

            const now = new Date();
            const lastSeen = new Date(lastSeenDate);
            const diffSeconds = (now - lastSeen) / 1000;

            // Threshold: 45 seconds (30s heartbeat + 15s buffer)
            setIsOnline(diffSeconds < 15);
        };

        // Run immediately
        checkStatus();

        // Run every 5 seconds to update UI automatically
        const intervalId = setInterval(checkStatus, 5000);

        return () => clearInterval(intervalId);
    }, [lastSeenDate]);

    return isOnline;
};
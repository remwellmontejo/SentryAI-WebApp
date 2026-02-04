const BoundingPolygonOverlay = ({ polyX, polyY, zoneEnabled }) => {
    // 1. Safety Check: If data is missing, don't crash
    if (!polyX || !polyY || polyX.length === 0) return null;

    // 2. Convert Arrays to SVG Point String
    // We assume coordinates are 0-100 (Percentage based)
    // Format required: "x1,y1 x2,y2 x3,y3 ..."
    const pointsString = polyX.map((x, i) => `${x},${polyY[i]}`).join(' ');

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none', // CRITICAL: Lets clicks pass through to video
                zIndex: 10 // Ensures it sits on top of the image
            }}
        >
            {zoneEnabled && (
                <svg
                    viewBox="0 0 100 100" // Defines our canvas as 100x100 units
                    preserveAspectRatio="none" // Forces SVG to stretch exactly like the video
                    style={{ width: '100%', height: '100%' }}
                >
                    <polygon
                        points={pointsString}
                        fill="rgba(255, 0, 0, 0.2)" // Semi-transparent Red fill
                        stroke="red"                // Solid Red border
                        strokeWidth="0.5"           // Thin border line
                    />
                </svg>
            )}
        </div>
    );
};

export default BoundingPolygonOverlay;
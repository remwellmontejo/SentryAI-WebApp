const ZONE_COLORS = [
    { fill: 'rgba(255, 0, 0, 0.2)', stroke: 'red' },       // Zone 1 - Red
    { fill: 'rgba(37, 99, 235, 0.2)', stroke: '#2563eb' },  // Zone 2 - Blue
    { fill: 'rgba(16, 185, 129, 0.2)', stroke: '#10b981' }, // Zone 3 - Green
];

const BoundingPolygonOverlay = ({ zones = [] }) => {
    // Filter to only enabled zones that have points
    const activeZones = zones.filter(z => z.enabled && z.polyX?.length > 0);
    if (activeZones.length === 0) return null;

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 10
            }}
        >
            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ width: '100%', height: '100%' }}
            >
                {activeZones.map((zone, idx) => {
                    // Find original index in the zones array for consistent coloring
                    const originalIdx = zones.indexOf(zone);
                    const color = ZONE_COLORS[originalIdx] || ZONE_COLORS[0];
                    const pointsString = zone.polyX.map((x, i) => `${x},${zone.polyY[i]}`).join(' ');

                    return (
                        <polygon
                            key={originalIdx}
                            points={pointsString}
                            fill={color.fill}
                            stroke={color.stroke}
                            strokeWidth="0.5"
                        />
                    );
                })}
            </svg>
        </div>
    );
};

export default BoundingPolygonOverlay;
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type WebPoint } from '../../db/db';
import { useTracker } from '../../context/TrackerContext';
import { distance } from '../map/mapService';
import { ArrowUp } from 'lucide-react';
import clsx from 'clsx';

export function SeekerScreen() {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const navigate = useNavigate();

    // Live query for target point
    const target = useLiveQuery<WebPoint | undefined>(
        () => (id ? db.points.get(Number(id)) : Promise.resolve(undefined)),
        [id]
    );

    const { currentLocation } = useTracker();
    const [heading, setHeading] = useState(0);

    // Device orientation
    useEffect(() => {
        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (e.webkitCompassHeading) {
                // iOS
                setHeading(e.webkitCompassHeading);
            } else if (e.alpha !== null) {
                // Android/others (alpha is roughly compass but needs calibration/absolute)
                // For v1, we assume alpha is sufficient or use a polyfill if needed.
                // Reversing alpha usually gives absolute bearing approx.
                setHeading(360 - e.alpha);
            }
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, []);

    if (!id || target === undefined) return <div className="p-10 text-center">Loading...</div>;
    if (target === null) return <div className="p-10 text-center">Target not found.</div>;

    // Calculate Bearing and Distance
    let dist = 0;
    let bear = 0;
    let diff = 0;

    if (currentLocation) {
        dist = distance(currentLocation.lat, currentLocation.lng, target.lat, target.lng);

        // Bearing formula
        const y = Math.sin((target.lng - currentLocation.lng) * Math.PI / 180) * Math.cos(target.lat * Math.PI / 180);
        const x = Math.cos(currentLocation.lat * Math.PI / 180) * Math.sin(target.lat * Math.PI / 180) -
            Math.sin(currentLocation.lat * Math.PI / 180) * Math.cos(target.lat * Math.PI / 180) * Math.cos((target.lng - currentLocation.lng) * Math.PI / 180);
        const brng = Math.atan2(y, x) * 180 / Math.PI;
        bear = (brng + 360) % 360;

        // Diff between heading and bearing
        diff = bear - heading;
    }

    // Colors/Haptics logic based on distance
    // < 20m = Hot (Red/Orange)
    // < 50m = Warm (Yellow)
    // > 50m = Cold (Blue/Neutral)
    const isClose = dist < 20;
    const isNear = dist < 50;

    const bgColor = isClose ? 'bg-orange-900/50' : isNear ? 'bg-yellow-900/30' : 'bg-neutral-900';

    return (
        <div className={clsx("h-full flex flex-col items-center justify-center p-6 relative transition-colors duration-1000", bgColor)}>
            <div className="absolute top-4 left-4 z-50">
                <button onClick={() => navigate(-1)} className="bg-neutral-800 p-2 rounded text-white text-xs font-bold">Close</button>
            </div>

            {/* Target Info */}
            <div className="absolute top-16 text-center">
                <h2 className="text-xl font-bold text-white uppercase tracking-widest">{target.tags[0] || 'Target'}</h2>
                <p className="text-neutral-400 text-sm mt-1">±{Math.round(target.accuracy)}m accuracy</p>
            </div>

            {/* Arrow */}
            <div
                className="relative w-64 h-64 flex items-center justify-center transition-transform duration-200 ease-out will-change-transform"
                style={{ transform: `rotate(${diff}deg)` }}
            >
                <div className="w-4 h-4 rounded-full bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                <ArrowUp size={120} strokeWidth={4} className={clsx("text-white drop-shadow-xl", isClose ? "text-[var(--color-primary)]" : "")} />
            </div>

            {/* Distance */}
            <div className="mt-12 text-center">
                <div className="text-6xl font-mono font-bold text-white">
                    {Math.round(dist)}<span className="text-2xl text-neutral-500">m</span>
                </div>
                {isClose && <div className="text-[var(--color-primary)] font-bold animate-pulse mt-2">SEARCH NEARBY</div>}
            </div>

            {!currentLocation && <div className="absolute bottom-10 text-red-500 font-bold animate-pulse">Waiting for GPS...</div>}
        </div>
    );
}

// Global typing for iOS
declare global {
    interface DeviceOrientationEvent {
        webkitCompassHeading?: number;
    }
}

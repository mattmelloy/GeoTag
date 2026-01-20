import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { db } from '../db/db';
import { distance } from '../modules/map/mapService';

interface Location {
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: number;
}

interface TrackerContextType {
    isTracking: boolean;
    currentLocation: Location | null;
    path: [number, number][];
    startTrek: () => void;
    stopTrek: () => void;
    stats: { distance: number; duration: number }; // meters, ms
}

const TrackerContext = createContext<TrackerContextType | null>(null);

export function TrackerProvider({ children }: { children: ReactNode }) {
    const [isTracking, setIsTracking] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
    const [path, setPath] = useState<[number, number][]>([]);
    const [startTime, setStartTime] = useState<number | null>(null);

    const watchId = useRef<number | null>(null);
    const trekId = useRef<number | null>(null);

    // Stats
    const [dist, setDist] = useState(0);

    const startTrek = async () => {
        setIsTracking(true);
        setPath([]);
        setDist(0);
        setStartTime(Date.now());

        // Create trek in DB
        const id = await db.treks.add({
            startTime: Date.now(),
            path: [],
            synced: false
        });
        trekId.current = id as number;
    };

    const stopTrek = () => {
        setIsTracking(false);
        if (trekId.current && startTime) {
            db.treks.update(trekId.current, {
                endTime: Date.now(),
                path: path // Save final path
            });
        }
        setStartTime(null);
        trekId.current = null;
    };

    // Tracking logic
    useEffect(() => {
        if (!('geolocation' in navigator)) return;

        const onPos = (pos: GeolocationPosition) => {
            const { latitude, longitude, accuracy } = pos.coords;
            const newLoc = { lat: latitude, lng: longitude, accuracy, timestamp: pos.timestamp };
            setCurrentLocation(newLoc);

            if (isTracking) {
                setPath(prev => {
                    const last = prev[prev.length - 1];
                    if (last) {
                        const d = distance(last[0], last[1], latitude, longitude);
                        setDist(currentDist => currentDist + d);
                    }
                    const newPath = [...prev, [latitude, longitude] as [number, number]];

                    if (trekId.current) {
                        // We could throttle this update
                        db.treks.update(trekId.current, { path: newPath });
                    }
                    return newPath;
                });
            }
        };

        const onError = (err: GeolocationPositionError) => {
            console.warn('Geo error', err);
        };

        const id = navigator.geolocation.watchPosition(onPos, onError, {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 20000
        });
        watchId.current = id;

        return () => {
            navigator.geolocation.clearWatch(id);
        };
    }, [isTracking]);

    return (
        <TrackerContext.Provider value={{
            isTracking,
            currentLocation,
            path,
            startTrek,
            stopTrek,
            stats: { distance: dist, duration: startTime ? Date.now() - startTime : 0 }
        }}>
            {children}
        </TrackerContext.Provider>
    );
}

export function useTracker() {
    const ctx = useContext(TrackerContext);
    if (!ctx) throw new Error("useTracker must be used within TrackerProvider");
    return ctx;
}

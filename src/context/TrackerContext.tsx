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
    activeTrekId: number | null;
    currentLocation: Location | null;
    path: [number, number][];
    startTrek: () => void;
    stopTrek: () => void;
    stats: { distance: number; duration: number; startTime: number | null };
}

const TrackerContext = createContext<TrackerContextType | null>(null);

export function TrackerProvider({ children }: { children: ReactNode }) {
    const [isTracking, setIsTracking] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
    const [path, setPath] = useState<[number, number][]>([]);
    const [startTime, setStartTime] = useState<number | null>(null);

    const watchId = useRef<number | null>(null);
    const trekId = useRef<number | null>(null);
    const [activeTrekId, setActiveTrekId] = useState<number | null>(null);

    // Stats
    const [dist, setDist] = useState(0);

    const startTrek = async () => {
        setIsTracking(true);
        setPath([]);
        setDist(0);
        setStartTime(Date.now());

        const id = await db.treks.add({
            startTime: Date.now(),
            path: [],
            synced: false
        });
        trekId.current = id as number;
        setActiveTrekId(id as number);
    };

    const stopTrek = (name?: string) => {
        setIsTracking(false);
        if (trekId.current && startTime) {
            db.treks.update(trekId.current, {
                name: typeof name === 'string' ? name : `Trek ${new Date().toLocaleDateString()}`,
                endTime: Date.now(),
                path: path,
                distance: dist
            });
        }
        setStartTime(null);
        trekId.current = null;
        setActiveTrekId(null);
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
            activeTrekId,
            currentLocation,
            path,
            startTrek,
            stopTrek,
            stats: {
                distance: dist,
                duration: startTime ? Date.now() - startTime : 0,
                startTime
            }
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

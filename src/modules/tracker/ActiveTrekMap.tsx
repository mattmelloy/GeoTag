import { useTracker } from '../../context/TrackerContext';
import { Polyline, CircleMarker, Circle } from 'react-leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export function ActiveTrekMap() {
    const { path, currentLocation, isTracking } = useTracker();
    const map = useMap();

    // Auto-pan to location if tracking
    useEffect(() => {
        if (isTracking && currentLocation) {
            map.setView([currentLocation.lat, currentLocation.lng], map.getZoom(), { animate: true });
        }
    }, [currentLocation, isTracking, map]);

    return (
        <>
            {/* The Breadcrumb Trail */}
            {path.length > 1 && (
                <Polyline
                    positions={path}
                    pathOptions={{ color: 'var(--color-primary, orange)', weight: 4 }}
                />
            )}

            {/* Current Location Indicator */}
            {currentLocation && (
                <>
                    {/* Accuracy Circle */}
                    <Circle
                        center={[currentLocation.lat, currentLocation.lng]}
                        radius={currentLocation.accuracy}
                        pathOptions={{ color: 'var(--color-primary, orange)', fillOpacity: 0.1, stroke: false }}
                    />
                    {/* Point */}
                    <CircleMarker
                        center={[currentLocation.lat, currentLocation.lng]}
                        radius={6}
                        pathOptions={{ color: 'white', fillColor: 'var(--color-primary, orange)', fillOpacity: 1, weight: 2 }}
                    />
                </>
            )}
        </>
    );
}

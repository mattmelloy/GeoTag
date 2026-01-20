import { Locate } from 'lucide-react';
import { useMap } from 'react-leaflet';
import { useTracker } from '../../context/TrackerContext';
import clsx from 'clsx';

export function LocationControl() {
    const map = useMap();
    const { currentLocation } = useTracker();

    const handleLocate = () => {
        if (currentLocation) {
            map.flyTo([currentLocation.lat, currentLocation.lng], 16, { animate: true });
        } else {
            // Fallback if tracker context isn't ready or hasn't got a lock, 
            // though TrackerContext usually starts watching immediately.
            // We can force a native locate call if needed, but Context is the source of truth.
            navigator.geolocation.getCurrentPosition(pos => {
                map.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { animate: true });
            });
        }
    };

    return (
        <button
            onClick={handleLocate}
            className={clsx(
                "absolute bottom-24 right-4 z-[400] p-3 rounded-full shadow-lg transition-colors active:scale-95 border border-neutral-700",
                currentLocation ? "bg-neutral-800 text-white hover:bg-neutral-700" : "bg-neutral-800 text-neutral-500"
            )}
            aria-label="Locate Me"
        >
            <Locate size={20} />
        </button>
    );
}

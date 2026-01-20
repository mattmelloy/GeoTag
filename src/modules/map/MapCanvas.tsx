import { MapContainer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { OfflineTileLayer } from './OfflineTileLayer';
import { OfflineManager } from './OfflineManager';
import { ActiveTrekMap } from '../tracker/ActiveTrekMap';
import { TrekControls } from '../tracker/TrekControls';
import { SavedPointsLayer } from './SavedPointsLayer';
import { LocationControl } from './LocationControl';

// Fix Leaflet's default icon path issues in Vite
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

export function MapCanvas() {
    return (
        <div className="h-full w-full bg-neutral-800 relative z-0">
            <MapContainer
                center={[-16.925491, 145.754120]}
                zoom={13}
                scrollWheelZoom={true}
                className="h-full w-full z-0"
                zoomControl={false} // We will add custom controls
            >
                <OfflineTileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    className="map-tiles"
                />
                <OfflineManager />
                <ActiveTrekMap />
                <SavedPointsLayer />
                <LocationControl />
            </MapContainer>

            <TrekControls />
            {/* Overlay controls will go here */}
        </div>
    );
}

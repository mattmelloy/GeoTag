import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RegionSelectorProps {
    onBoundsChange: (bounds: L.LatLngBounds) => void;
}

/**
 * RegionSelector - Native Leaflet Implementation
 * 
 * We use native Leaflet objects created via useEffect and useRef to bypass
 * React's render cycle during active dragging. This prevents the "stalling"
 * or "snapping" behaviors reported when React state competes with native drag.
 */
export function RegionSelector({ onBoundsChange }: RegionSelectorProps) {
    const map = useMap();
    const layerRef = useRef<L.LayerGroup | null>(null);
    const rectangleRef = useRef<L.Rectangle | null>(null);
    const handlesRef = useRef<{
        nw: L.Marker;
        ne: L.Marker;
        sw: L.Marker;
        se: L.Marker;
    } | null>(null);

    useEffect(() => {
        // Initial setup: Layer group to hold selection UI
        const layerGroup = L.layerGroup().addTo(map);
        layerRef.current = layerGroup;

        // Use current view for initial box
        const mapBounds = map.getBounds();
        const north = mapBounds.getNorth();
        const south = mapBounds.getSouth();
        const east = mapBounds.getEast();
        const west = mapBounds.getWest();
        const latDiff = (north - south) * 0.25;
        const lngDiff = (east - west) * 0.25;

        const currentBounds = L.latLngBounds(
            [south + latDiff, west + lngDiff],
            [north - latDiff, east - lngDiff]
        );

        // Create Rectangle
        const rectangle = L.rectangle(currentBounds, {
            color: '#ff4500',
            weight: 2,
            fillOpacity: 0.1,
            dashArray: '5, 5',
            interactive: false // Don't block map interaction
        }).addTo(layerGroup);
        rectangleRef.current = rectangle;

        // Custom Handle Icon
        const handleIcon = L.divIcon({
            className: 'bg-white border-2 border-[var(--color-primary)] rounded-full w-4 h-4 shadow-lg cursor-move transition-transform active:scale-125',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        // Create Handles
        const nw = L.marker(currentBounds.getNorthWest(), { icon: handleIcon, draggable: true }).addTo(layerGroup);
        const ne = L.marker(currentBounds.getNorthEast(), { icon: handleIcon, draggable: true }).addTo(layerGroup);
        const sw = L.marker(currentBounds.getSouthWest(), { icon: handleIcon, draggable: true }).addTo(layerGroup);
        const se = L.marker(currentBounds.getSouthEast(), { icon: handleIcon, draggable: true }).addTo(layerGroup);

        handlesRef.current = { nw, ne, sw, se };

        // Update Logic
        const syncBounds = (activeCorner: 'nw' | 'ne' | 'sw' | 'se') => {
            const handles = handlesRef.current;
            if (!handles || !rectangleRef.current) return;

            const pos = handles[activeCorner].getLatLng();
            let n = rectangleRef.current.getBounds().getNorth();
            let s = rectangleRef.current.getBounds().getSouth();
            let e = rectangleRef.current.getBounds().getEast();
            let w = rectangleRef.current.getBounds().getWest();

            if (activeCorner === 'nw') { n = pos.lat; w = pos.lng; }
            if (activeCorner === 'ne') { n = pos.lat; e = pos.lng; }
            if (activeCorner === 'sw') { s = pos.lat; w = pos.lng; }
            if (activeCorner === 'se') { s = pos.lat; e = pos.lng; }

            // Constrain minimum size
            const MIN_DIFF = 0.0005;
            if (n - s < MIN_DIFF) {
                if (activeCorner.startsWith('n')) n = s + MIN_DIFF; else s = n - MIN_DIFF;
            }
            if (e - w < MIN_DIFF) {
                if (activeCorner.endsWith('e')) e = w + MIN_DIFF; else w = e - MIN_DIFF;
            }

            const newBounds = L.latLngBounds([s, w], [n, e]);

            // Update Native Objects directly (bypass React)
            rectangleRef.current.setBounds(newBounds);
            handles.nw.setLatLng(newBounds.getNorthWest());
            handles.ne.setLatLng(newBounds.getNorthEast());
            handles.sw.setLatLng(newBounds.getSouthWest());
            handles.se.setLatLng(newBounds.getSouthEast());

            // Notify parent (debounced/throttled via parent's effect usually, but we call directly)
            onBoundsChange(newBounds);
        };

        // Attach native event listeners
        nw.on('drag', () => syncBounds('nw'));
        ne.on('drag', () => syncBounds('ne'));
        sw.on('drag', () => syncBounds('sw'));
        se.on('drag', () => syncBounds('se'));

        // Initial notification
        onBoundsChange(currentBounds);

        // Cleanup
        return () => {
            if (layerRef.current) {
                map.removeLayer(layerRef.current);
            }
        };
    }, [map]); // Dependency on map only

    return null; // This component handles its own rendering via Leaflet
}

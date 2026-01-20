import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Rectangle, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

export function SavedRegionsLayer() {
    const regions = useLiveQuery(() => db.regions.toArray());
    const map = useMap();

    if (!regions) return null;

    return (
        <>
            {regions.map(region => {
                const bounds = L.latLngBounds(
                    [region.bounds.south, region.bounds.west],
                    [region.bounds.north, region.bounds.east]
                );

                return (
                    <Rectangle
                        key={region.id}
                        bounds={bounds}
                        pathOptions={{
                            color: '#666',
                            weight: 1,
                            fillColor: '#333',
                            fillOpacity: 0.4,
                            dashArray: '4, 4'
                        }}
                        interactive={false}
                    >
                        <Tooltip
                            permanent
                            direction="center"
                            className="region-label-tooltip"
                        >
                            <span className="text-white font-bold text-xs uppercase tracking-tight drop-shadow-md">
                                {region.name}
                            </span>
                        </Tooltip>
                    </Rectangle>
                );
            })}
        </>
    );
}

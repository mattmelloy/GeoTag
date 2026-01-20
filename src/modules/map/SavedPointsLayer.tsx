import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Marker, Popup } from 'react-leaflet';
import { Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function SavedPointsLayer() {
    const points = useLiveQuery(() => db.points.toArray());
    const navigate = useNavigate();

    if (!points) return null;

    return (
        <>
            {points.map(point => (
                <Marker key={point.id} position={[point.lat, point.lng]}>
                    <Popup>
                        <div className="min-w-[150px]">
                            <div className="font-bold mb-1">{point.tags.join(', ') || 'Point'}</div>
                            <div className="text-sm text-gray-600 mb-2">{point.notes || 'No description'}</div>
                            <button
                                onClick={() => navigate(`/seeker?id=${point.id}`)}
                                className="w-full bg-[var(--color-primary)] text-white py-1.5 rounded flex items-center justify-center gap-2 text-xs font-bold shadow-sm active:scale-95 transition"
                            >
                                <Navigation size={12} /> GUIDE ME
                            </button>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </>
    );
}

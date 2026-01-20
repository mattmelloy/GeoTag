import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Trash2, Navigation, MapPin, HardDrive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export function LibraryScreen() {
    const points = useLiveQuery(() => db.points.toArray());
    const navigate = useNavigate();
    const [storageUsage, setStorageUsage] = useState<string>('');

    useEffect(() => {
        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(estimate => {
                if (estimate.usage) {
                    const mb = (estimate.usage / (1024 * 1024)).toFixed(1);
                    setStorageUsage(`${mb} MB`);
                }
            });
        }
    }, []);

    const handleDelete = (id: number) => {
        if (confirm('Delete this point?')) {
            db.points.delete(id);
        }
    };

    if (!points) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="h-full bg-neutral-900 p-4 pt-10 overflow-y-auto pb-24 flex flex-col">
            <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 border-b border-neutral-800 pb-4">
                    <MapPin /> Library <span className="text-sm text-neutral-500 font-normal ml-auto">{points.length} points</span>
                </h1>

                {/* Points List */}
                <div className="grid gap-4">
                    {points.length === 0 && (
                        <div className="text-neutral-500 text-center py-10">No points captured yet.</div>
                    )}

                    {points.map(point => (
                        <div key={point.id} className="bg-neutral-800 rounded-xl p-4 flex gap-4 border border-neutral-700">
                            {/* ... list content same as before ... */}
                            {/* actually easier to replace the whole return to ensure structure logic */}
                            <div className="w-16 h-16 bg-neutral-700 rounded-lg shrink-0 flex items-center justify-center text-xs text-neutral-500">
                                {point.photo ? 'IMG' : 'No IMG'}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {(point.tags.length ? point.tags : ['Uncategorized']).map(t => (
                                        <span key={t} className="px-2 py-0.5 bg-neutral-900 rounded-full text-[10px] uppercase text-neutral-400 font-bold">{t}</span>
                                    ))}
                                </div>
                                <p className="text-white text-sm truncate font-medium mb-1">{point.notes || 'No description'}</p>
                                <div className="text-[10px] text-neutral-500">
                                    {new Date(point.timestamp).toLocaleString()} • ±{Math.round(point.accuracy)}m
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 justify-between">
                                <button
                                    onClick={() => navigate(`/seeker?id=${point.id}`)}
                                    className="bg-[var(--color-primary)] text-white p-2 rounded-lg shadow-sm active:scale-95 transition"
                                >
                                    <Navigation size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(point.id!)}
                                    className="bg-neutral-700 text-neutral-400 p-2 rounded-lg hover:text-red-400 active:scale-95 transition"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Storage Footer */}
            {storageUsage && (
                <div className="mt-8 pt-4 border-t border-neutral-800 text-center text-neutral-600 text-xs flex items-center justify-center gap-2">
                    <HardDrive size={12} />
                    <span>Total Storage Used: {storageUsage}</span>
                </div>
            )}
        </div>
    );
}

import { useState } from 'react';
import { Camera, MapPin } from 'lucide-react';
import { useTracker } from '../../context/TrackerContext';
import { db } from '../../db/db';
import { AccuracyMeter } from './AccuracyMeter';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';

export function CaptureScreen() {
    const { currentLocation } = useTracker();
    const navigate = useNavigate();
    const [notes, setNotes] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    // In a real app, we'd handle file input for camera
    // Here we'll mock it or use a simple file input
    const [photo] = useState<Blob | null>(null); // Placeholder

    const availableTags = ['Nature', 'Man-made', 'Scenery', 'Hazard', 'Water'];

    const toggleTag = (t: string) => {
        setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    };

    const handleSave = async () => {
        if (!currentLocation) return;

        await db.points.add({
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            accuracy: currentLocation.accuracy,
            timestamp: Date.now(),
            notes,
            tags,
            // Simple placeholder storage for now
            // In real app, we might store blob directly (Dexie supports it)
            // or just the metadata.
            photo: photo ?? undefined
        });

        // Show feedback or navigate
        navigate('/library');
    };

    return (
        <div className="h-full flex flex-col bg-neutral-900 p-4 overflow-y-auto pb-24">
            <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <MapPin className="text-[var(--color-primary)]" /> Capture Point
            </h1>

            <div className="mb-6">
                <AccuracyMeter />
            </div>

            <div className="space-y-6">
                {/* Photo Placeholder */}
                <div className="aspect-video bg-neutral-800 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-neutral-700 hover:border-neutral-500 active:bg-neutral-700 transition cursor-pointer">
                    <Camera size={32} className="text-neutral-400 mb-2" />
                    <span className="text-neutral-400 text-sm font-medium">Take Photo</span>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-xs uppercase font-bold text-neutral-500 mb-2">Notes</label>
                    <textarea
                        className="w-full bg-neutral-800 text-white rounded-lg p-3 border border-neutral-700 focus:border-[var(--color-primary)] outline-none min-h-[100px]"
                        placeholder="Describe this location..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                    />
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-xs uppercase font-bold text-neutral-500 mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={clsx(
                                    "px-3 py-1.5 rounded-full text-sm font-medium transition",
                                    tags.includes(tag)
                                        ? "bg-[var(--color-primary)] text-white"
                                        : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                                )}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex-1 py-3 rounded-lg font-bold bg-neutral-800 text-neutral-300 active:scale-95 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!currentLocation}
                        className="flex-1 py-3 rounded-lg font-bold bg-[var(--color-primary)] text-white shadow-lg active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save Point
                    </button>
                </div>
            </div>

        </div>
    );
}

import { Camera, MapPin, X } from 'lucide-react';
import { useTracker } from '../../context/TrackerContext';
import { db } from '../../db/db';
import { AccuracyMeter } from './AccuracyMeter';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { CameraModule } from './CameraModule';

export function CaptureScreen() {
    const { currentLocation, activeTrekId } = useTracker();
    const navigate = useNavigate();
    const [notes, setNotes] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [isPublic, setIsPublic] = useState(false);
    const [photo, setPhoto] = useState<Blob | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const availableTags = ['Nature', 'Man-made', 'Scenery', 'Hazard', 'Water'];

    const toggleTag = (t: string) => {
        setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    };

    const handleCapture = (blob: Blob) => {
        setPhoto(blob);
        const url = URL.createObjectURL(blob);
        setPhotoPreview(url);
        setIsCameraOpen(false);
    };

    const removePhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (photoPreview) URL.revokeObjectURL(photoPreview);
        setPhoto(null);
        setPhotoPreview(null);
    };

    const handleSave = async () => {
        if (!currentLocation) return;

        await db.points.add({
            trekId: activeTrekId ?? undefined,
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            accuracy: currentLocation.accuracy,
            timestamp: Date.now(),
            notes,
            tags,
            isPublic,
            photo: photo ?? undefined
        });

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
                {/* Photo Capture Area */}
                {isCameraOpen ? (
                    <CameraModule
                        onCapture={handleCapture}
                        onClose={() => setIsCameraOpen(false)}
                    />
                ) : (
                    <div
                        onClick={() => setIsCameraOpen(true)}
                        className="aspect-video bg-neutral-800 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-neutral-700 hover:border-neutral-500 active:bg-neutral-700 transition cursor-pointer overflow-hidden relative"
                    >
                        {photoPreview ? (
                            <>
                                <img src={photoPreview} className="w-full h-full object-cover" alt="Preview" />
                                <button
                                    onClick={removePhoto}
                                    className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition"
                                >
                                    <X size={16} />
                                </button>
                            </>
                        ) : (
                            <>
                                <Camera size={32} className="text-neutral-400 mb-2" />
                                <span className="text-neutral-400 text-sm font-medium">Open Camera</span>
                            </>
                        )}
                    </div>
                )}

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

                {/* Privacy Toggle */}
                <div className="bg-neutral-800 p-4 rounded-xl border border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-white font-bold text-sm">Public Visibility</h4>
                            <p className="text-neutral-500 text-xs">Allow others to see this point</p>
                        </div>
                        <button
                            onClick={() => setIsPublic(!isPublic)}
                            className={clsx(
                                "w-12 h-6 rounded-full p-1 transition-colors duration-200 outline-none",
                                isPublic ? "bg-green-500" : "bg-neutral-600"
                            )}
                        >
                            <div className={clsx(
                                "w-4 h-4 bg-white rounded-full transition-transform duration-200",
                                isPublic ? "translate-x-6" : "translate-x-0"
                            )} />
                        </button>
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

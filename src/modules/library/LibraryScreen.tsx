import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Trash2, Navigation, MapPin, HardDrive, Edit2, Check, X as Close, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

export function LibraryScreen() {
    const points = useLiveQuery(() => db.points.toArray());
    const navigate = useNavigate();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editNotes, setEditNotes] = useState('');
    const [editTags, setEditTags] = useState('');
    const [editPublic, setEditPublic] = useState(false);
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

    const startEditing = (point: any) => {
        setEditingId(point.id);
        setEditNotes(point.notes || '');
        setEditTags(point.tags.join(', '));
        setEditPublic(!!point.isPublic);
    };

    const handleSave = async (id: number) => {
        const tags = editTags.split(',').map(t => t.trim()).filter(t => t !== '');
        await db.points.update(id, {
            notes: editNotes,
            tags: tags,
            isPublic: editPublic
        });
        setEditingId(null);
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
                        <div key={point.id} className={clsx("bg-neutral-800 rounded-xl p-4 flex gap-4 border transition-colors", editingId === point.id ? "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]" : "border-neutral-700")}>
                            <div className="w-16 h-16 bg-neutral-700 rounded-lg shrink-0 flex items-center justify-center text-xs text-neutral-500 overflow-hidden">
                                {point.photo ? (
                                    <img src={URL.createObjectURL(point.photo)} className="w-full h-full object-cover" alt="Point" />
                                ) : (
                                    <MapPin className="text-neutral-600" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                {editingId === point.id ? (
                                    <div className="space-y-2">
                                        <textarea
                                            className="w-full bg-neutral-900 text-white text-sm p-2 rounded border border-neutral-700 focus:border-[var(--color-primary)] outline-none resize-none"
                                            rows={2}
                                            value={editNotes}
                                            onChange={e => setEditNotes(e.target.value)}
                                            placeholder="Description..."
                                            autoFocus
                                        />
                                        <input
                                            className="w-full bg-neutral-900 text-white text-xs p-2 rounded border border-neutral-700 focus:border-[var(--color-primary)] outline-none"
                                            type="text"
                                            value={editTags}
                                            onChange={e => setEditTags(e.target.value)}
                                            placeholder="Tags (comma separated)"
                                        />
                                        <div className="flex items-center gap-2 pt-1">
                                            <button
                                                onClick={() => setEditPublic(!editPublic)}
                                                className={clsx(
                                                    "px-2 py-1 rounded text-[10px] font-bold uppercase transition flex items-center gap-1",
                                                    editPublic ? "bg-green-600/20 text-green-400 border border-green-600/30" : "bg-neutral-700 text-neutral-400 border border-neutral-600"
                                                )}
                                            >
                                                {editPublic ? <Eye size={10} /> : <EyeOff size={10} />}
                                                {editPublic ? 'Public' : 'Private'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-wrap gap-1.5 mb-2 items-center">
                                            {(point.tags.length ? point.tags : ['Uncategorized']).map(t => (
                                                <span key={t} className="px-2 py-0.5 bg-neutral-900 rounded-full text-[10px] uppercase text-neutral-400 font-bold">{t}</span>
                                            ))}
                                            <span className={clsx(
                                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1",
                                                point.isPublic ? "text-green-500 bg-green-500/10" : "text-neutral-500 bg-neutral-500/10"
                                            )}>
                                                {point.isPublic ? <Eye size={10} /> : <EyeOff size={10} />}
                                                {point.isPublic ? 'Public' : 'Private'}
                                            </span>
                                        </div>
                                        <p className="text-white text-sm truncate font-medium mb-1">{point.notes || 'No description'}</p>
                                        <div className="text-[10px] text-neutral-500">
                                            {new Date(point.timestamp).toLocaleString()} • ±{Math.round(point.accuracy)}m
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 justify-between">
                                {editingId === point.id ? (
                                    <>
                                        <button
                                            onClick={() => handleSave(point.id!)}
                                            className="bg-green-600 text-white p-2 rounded-lg shadow-sm active:scale-95 transition"
                                            title="Save Changes"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="bg-neutral-700 text-neutral-400 p-2 rounded-lg hover:text-white active:scale-95 transition"
                                            title="Cancel"
                                        >
                                            <Close size={18} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => navigate(`/seeker?id=${point.id}`)}
                                            className="bg-[var(--color-primary)] text-white p-2 rounded-lg shadow-sm active:scale-95 transition"
                                            title="Navigate"
                                        >
                                            <Navigation size={18} />
                                        </button>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => startEditing(point)}
                                                className="bg-neutral-700 text-neutral-400 p-2 rounded-lg hover:text-white active:scale-95 transition"
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(point.id!)}
                                                className="bg-neutral-700 text-neutral-400 p-2 rounded-lg hover:text-red-400 active:scale-95 transition"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </>
                                )}
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

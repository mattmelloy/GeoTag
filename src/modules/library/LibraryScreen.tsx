import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Trash2, Navigation, MapPin, HardDrive, Edit2, Check, X as Close, Eye, EyeOff, Map as MapIcon, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Polyline, MapContainer } from 'react-leaflet';
import { OfflineTileLayer } from '../map/OfflineTileLayer';

export function LibraryScreen() {
    const points = useLiveQuery(() => db.points.toArray());
    const treks = useLiveQuery(() => db.treks.orderBy('startTime').reverse().toArray());
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'points' | 'treks'>('points');
    const [selectedTrekId, setSelectedTrekId] = useState<number | null>(null);

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

    const handleDeletePoint = (id: number) => {
        if (confirm('Delete this point?')) {
            db.points.delete(id);
        }
    };

    const handleDeleteTrek = (id: number) => {
        if (confirm('Delete this trek? This will NOT delete captured points.')) {
            db.treks.delete(id);
        }
    };

    const startEditing = (point: any) => {
        setEditingId(point.id);
        setEditNotes(point.notes || '');
        setEditTags(point.tags.join(', '));
        setEditPublic(!!point.isPublic);
    };

    const handleSavePoint = async (id: number) => {
        const tags = editTags.split(',').map(t => t.trim()).filter(t => t !== '');
        await db.points.update(id, {
            notes: editNotes,
            tags: tags,
            isPublic: editPublic
        });
        setEditingId(null);
    };

    const selectedTrek = treks?.find(t => t.id === selectedTrekId);
    const trekPoints = points?.filter(p => p.trekId === selectedTrekId);

    if (!points || !treks) return <div className="p-10 text-center text-white">Loading...</div>;

    if (selectedTrek) {
        return (
            <div className="h-full bg-neutral-900 flex flex-col">
                <div className="p-4 pt-10 border-b border-neutral-800 flex items-center gap-4">
                    <button onClick={() => setSelectedTrekId(null)} className="text-neutral-400 hover:text-white transition">
                        <Close size={24} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-white truncate">{selectedTrek.name || 'Unnamed Trek'}</h1>
                        <p className="text-xs text-neutral-500">{new Date(selectedTrek.startTime).toLocaleString()}</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pb-24">
                    {/* Mini Map */}
                    <div className="h-64 w-full bg-neutral-800 border-b border-neutral-700 relative">
                        {selectedTrek.path && selectedTrek.path.length > 0 ? (
                            <MapContainer
                                center={selectedTrek.path[0]}
                                zoom={15}
                                className="h-full w-full"
                                zoomControl={false}
                            >
                                <OfflineTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Polyline positions={selectedTrek.path} pathOptions={{ color: 'var(--color-primary)', weight: 4 }} />
                            </MapContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-neutral-600 text-sm italic">No path recorded</div>
                        )}
                    </div>

                    {/* Stats Bar */}
                    <div className="flex border-b border-neutral-800 bg-neutral-900/50">
                        <div className="flex-1 p-4 border-r border-neutral-800 flex flex-col items-center">
                            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">Distance</span>
                            <span className="text-xl font-mono text-white leading-none">
                                {((selectedTrek.distance || 0) / 1000).toFixed(2)}
                                <span className="text-xs text-neutral-500 ml-1">KM</span>
                            </span>
                        </div>
                        <div className="flex-1 p-4 flex flex-col items-center">
                            <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">Duration</span>
                            <span className="text-xl font-mono text-white leading-none">
                                {Math.floor(((selectedTrek.endTime || Date.now()) - selectedTrek.startTime) / 60000)}
                                <span className="text-xs text-neutral-500 ml-1">MIN</span>
                            </span>
                        </div>
                    </div>

                    {/* Associated Points */}
                    <div className="p-4">
                        <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4">Captured Items</h2>
                        <div className="grid gap-3">
                            {trekPoints?.length === 0 && (
                                <div className="text-neutral-600 italic text-sm">No items captured during this trek.</div>
                            )}
                            {trekPoints?.map(point => (
                                <div key={point.id} className="bg-neutral-800 rounded-xl p-3 flex gap-3 border border-neutral-700">
                                    <div className="w-12 h-12 bg-neutral-700 rounded flex items-center justify-center text-neutral-500 overflow-hidden">
                                        {point.photo ? <img src={URL.createObjectURL(point.photo)} className="w-full h-full object-cover" /> : <MapPin size={20} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{point.notes || 'Capture'}</p>
                                        <div className="flex gap-2 text-[10px] text-neutral-500 mt-1 uppercase font-bold">
                                            <span>{point.isPublic ? 'Public' : 'Private'}</span>
                                            <span>•</span>
                                            <span>{point.tags[0] || 'Uncategorized'}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/seeker?id=${point.id}`)}
                                        className="self-center bg-neutral-700 p-2 rounded-lg text-neutral-300 active:scale-95"
                                    >
                                        <Navigation size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-neutral-900 flex flex-col pt-10 overflow-hidden">
            <div className="px-4 pb-4 border-b border-neutral-800">
                <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <MapPin className="text-[var(--color-primary)]" /> Library
                </h1>

                <div className="flex bg-neutral-800 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('points')}
                        className={clsx("flex-1 py-2 text-xs font-bold rounded-md transition", activeTab === 'points' ? "bg-neutral-700 text-white shadow-sm" : "text-neutral-500")}
                    >
                        POINTS ({points.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('treks')}
                        className={clsx("flex-1 py-2 text-xs font-bold rounded-md transition", activeTab === 'treks' ? "bg-neutral-700 text-white shadow-sm" : "text-neutral-500")}
                    >
                        TREKS ({treks.length})
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
                {activeTab === 'points' ? (
                    <div className="grid gap-4">
                        {points.length === 0 && (
                            <div className="text-neutral-600 text-center py-10 italic">No points captured yet.</div>
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
                                                className="w-full bg-neutral-900 text-white text-sm p-3 rounded border border-neutral-700 focus:border-[var(--color-primary)] outline-none resize-none"
                                                rows={2}
                                                value={editNotes}
                                                onChange={e => setEditNotes(e.target.value)}
                                                autoFocus
                                            />
                                            <div className="flex gap-2">
                                                <input
                                                    className="flex-1 bg-neutral-900 text-white text-xs p-2 rounded border border-neutral-700"
                                                    type="text"
                                                    value={editTags}
                                                    onChange={e => setEditTags(e.target.value)}
                                                    placeholder="Tags..."
                                                />
                                                <button onClick={() => setEditPublic(!editPublic)} className={clsx("px-2 rounded border text-[10px] font-bold", editPublic ? "bg-green-600/20 text-green-500 border-green-600/30" : "bg-neutral-700 text-neutral-500 border-neutral-600")}>
                                                    {editPublic ? 'PUBLIC' : 'PRIVATE'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex flex-wrap gap-1.5 mb-2 items-center">
                                                {(point.tags.length ? point.tags : ['Uncategorized']).map(t => (
                                                    <span key={t} className="px-2 py-0.5 bg-neutral-900 rounded-full text-[10px] uppercase text-neutral-400 font-bold">{t}</span>
                                                ))}
                                                <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1", point.isPublic ? "text-green-500 bg-green-500/10" : "text-neutral-500 bg-neutral-500/10 uppercase")}>
                                                    {point.isPublic ? <Eye size={10} /> : <EyeOff size={10} />}
                                                    {point.isPublic ? 'Public' : 'Private'}
                                                </span>
                                                {point.trekId && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTrekId(point.trekId ?? null);
                                                            setActiveTab('treks');
                                                        }}
                                                        className="px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-orange-500/20"
                                                    >
                                                        <MapIcon size={10} />
                                                        {treks.find(t => t.id === point.trekId)?.name || 'Linked Trek'}
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-white text-sm truncate font-medium mb-1">{point.notes || 'Untitled Point'}</p>
                                            <div className="text-[10px] text-neutral-500 font-mono">
                                                {new Date(point.timestamp).toLocaleString()}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    {editingId === point.id ? (
                                        <>
                                            <button onClick={() => handleSavePoint(point.id!)} className="bg-green-600 text-white p-2 rounded-lg"><Check size={18} /></button>
                                            <button onClick={() => setEditingId(null)} className="bg-neutral-700 text-neutral-400 p-2 rounded-lg"><Close size={18} /></button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => navigate(`/seeker?id=${point.id}`)} className="bg-[var(--color-primary)] text-white p-2 rounded-lg"><Navigation size={18} /></button>
                                            <button onClick={() => startEditing(point)} className="bg-neutral-700 text-neutral-400 p-2 rounded-lg"><Edit2 size={18} /></button>
                                            <button onClick={() => handleDeletePoint(point.id!)} className="bg-neutral-700/50 text-neutral-600 p-2 rounded-lg hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {treks.length === 0 && (
                            <div className="text-neutral-600 text-center py-10 italic">No treks recorded yet.</div>
                        )}
                        {treks.map(trek => (
                            <div
                                key={trek.id}
                                onClick={() => setSelectedTrekId(trek.id!)}
                                className="bg-neutral-800 rounded-xl p-4 flex items-center gap-4 border border-neutral-700 active:bg-neutral-700 transition cursor-pointer group"
                            >
                                <div className="w-12 h-12 bg-neutral-900 rounded-lg flex items-center justify-center text-[var(--color-primary)]">
                                    <MapIcon size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-bold text-sm truncate uppercase tracking-tight">{trek.name || `Trek ${new Date(trek.startTime).toLocaleDateString()}`}</h3>
                                    <div className="flex gap-4 text-[10px] text-neutral-500 font-mono mt-1">
                                        <span>{((trek.distance || 0) / 1000).toFixed(2)} KM</span>
                                        <span>{Math.round(((trek.endTime || Date.now()) - trek.startTime) / 60000)} MINS</span>
                                    </div>
                                </div>
                                <ChevronRight className="text-neutral-600 group-hover:text-white transition" size={20} />
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTrek(trek.id!); }}
                                    className="p-2 text-neutral-700 hover:text-red-500 transition shadow-none"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {storageUsage && (
                <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex items-center justify-center gap-2 text-[10px] text-neutral-600 uppercase font-bold tracking-widest">
                    <HardDrive size={10} /> Storage Usage: {storageUsage}
                </div>
            )}
        </div>
    );
}

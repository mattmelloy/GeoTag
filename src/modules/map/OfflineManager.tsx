import { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { Download, X, Layers, Trash2, AlertCircle, StopCircle } from 'lucide-react';
import { getTilesInBounds, estimateSize } from './mapService';
import { db } from '../../db/db';
import clsx from 'clsx';
import { RegionSelector } from './RegionSelector';
import { useLiveQuery } from 'dexie-react-hooks';
import L from 'leaflet';
import { SavedRegionsLayer } from './SavedRegionsLayer';

export function OfflineManager() {
    const map = useMap();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'download' | 'manage'>('download');

    // Download State
    const [selectionBounds, setSelectionBounds] = useState<L.LatLngBounds | null>(null);
    const [stats, setStats] = useState({ count: 0, size: '0 MB' });
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [regionName, setRegionName] = useState('');

    // Cancellation logic
    const cancelRef = useRef(false);

    // Manage State
    const savedRegions = useLiveQuery(() => db.regions.toArray());

    // Toggle Selection Mode
    useEffect(() => {
        if (!isOpen || activeTab !== 'download') {
            setSelectionBounds(null);
        }
    }, [isOpen, activeTab]);

    // Update Stats when bounds change (Debounced to prevent lag)
    useEffect(() => {
        if (!selectionBounds || !isOpen || activeTab !== 'download') return;

        const timer = setTimeout(() => {
            const minZoom = map.getZoom();
            const maxZoom = Math.max(minZoom, 18);

            const tiles = getTilesInBounds(
                selectionBounds.getNorth(), selectionBounds.getSouth(),
                selectionBounds.getWest(), selectionBounds.getEast(),
                minZoom, maxZoom
            );

            setStats({
                count: tiles.length,
                size: estimateSize(tiles.length)
            });
        }, 200);

        return () => clearTimeout(timer);
    }, [selectionBounds, map, isOpen, activeTab]);

    const handleDownload = async () => {
        if (!selectionBounds) return;
        setIsDownloading(true);
        setProgress(0);
        cancelRef.current = false;

        try {
            const minZoom = map.getZoom();
            const maxZoom = Math.max(minZoom, 18);

            const tiles = getTilesInBounds(
                selectionBounds.getNorth(), selectionBounds.getSouth(),
                selectionBounds.getWest(), selectionBounds.getEast(),
                minZoom, maxZoom
            );

            let completed = 0;
            const failed = [];

            // Save Region Metadata First
            await db.regions.add({
                name: regionName || `Region ${new Date().toLocaleTimeString()}`,
                bounds: {
                    north: selectionBounds.getNorth(),
                    south: selectionBounds.getSouth(),
                    west: selectionBounds.getWest(),
                    east: selectionBounds.getEast()
                },
                minZoom,
                maxZoom,
                tileCount: tiles.length,
                sizeBytes: tiles.length * 15000, // Approx
                timestamp: Date.now()
            });

            // Batch download (chunked to avoid browser limits)
            const CHUNK_SIZE = 10;
            for (let i = 0; i < tiles.length; i += CHUNK_SIZE) {
                if (cancelRef.current) break;

                const chunk = tiles.slice(i, i + CHUNK_SIZE);
                await Promise.all(chunk.map(async (tile) => {
                    if (cancelRef.current) return;
                    try {
                        const id = `${tile.z}-${tile.x}-${tile.y}`;
                        // Check if exists
                        const existing = await db.tiles.get(id);
                        if (!existing) {
                            const response = await fetch(`https://tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`);
                            if (!response.ok) throw new Error('Network error');
                            const blob = await response.blob();
                            await db.tiles.put({ id, blob, timestamp: Date.now() });
                        }
                    } catch (e) {
                        failed.push(tile);
                    } finally {
                        completed++;
                        if (completed % 5 === 0) {
                            setProgress(Math.round((completed / tiles.length) * 100));
                        }
                    }
                }));
            }

            if (cancelRef.current) {
                alert('Download stopped.');
            } else {
                setIsOpen(false);
                setRegionName('');
                alert(`Download Complete. ${tiles.length - failed.length} tiles saved.`);
            }
        } catch (e) {
            console.error(e);
            alert('Download failed');
        } finally {
            setIsDownloading(false);
            setSelectionBounds(null);
        }
    };

    const handleDeleteRegion = async (id: number) => {
        // Basic cleanup: Delete region entry.
        await db.regions.delete(id);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="absolute top-4 right-4 z-[400] bg-white text-neutral-800 p-3 rounded-full shadow-lg hover:bg-neutral-100 transition-colors"
                aria-label="Offline Maps"
            >
                <Download size={20} />
            </button>
        );
    }

    return (
        <>
            {activeTab === 'download' && isOpen && (
                <RegionSelector onBoundsChange={setBounds => setSelectionBounds(setBounds)} />
            )}

            {activeTab === 'manage' && isOpen && (
                <SavedRegionsLayer />
            )}

            <div className="absolute top-4 right-4 z-[400] w-80 bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                {/* Header Tabs */}
                <div className="flex border-b border-neutral-100">
                    <button
                        onClick={() => setActiveTab('download')}
                        className={clsx("flex-1 p-3 text-sm font-bold flex items-center justify-center gap-2", activeTab === 'download' ? "text-[var(--color-primary)] bg-orange-50" : "text-neutral-500")}
                        disabled={isDownloading}
                    >
                        <Download size={16} /> Download
                    </button>
                    <button
                        onClick={() => setActiveTab('manage')}
                        className={clsx("flex-1 p-3 text-sm font-bold flex items-center justify-center gap-2", activeTab === 'manage' ? "text-[var(--color-primary)] bg-orange-50" : "text-neutral-500")}
                        disabled={isDownloading}
                    >
                        <Layers size={16} /> My Maps
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-3 text-neutral-400 hover:text-neutral-800 border-l border-neutral-100"
                        disabled={isDownloading}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto">
                    {activeTab === 'download' ? (
                        <div className="space-y-4">
                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 text-xs text-orange-800 flex gap-2 items-start">
                                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                <p>Drag the corner handles on the map to select an area.</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-neutral-500 uppercase">Map Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Yosemite Valley"
                                    className="w-full p-2 border border-neutral-200 rounded text-sm text-black"
                                    value={regionName}
                                    onChange={e => setRegionName(e.target.value)}
                                    disabled={isDownloading}
                                />
                            </div>

                            <div className="flex justify-between items-center text-sm py-2">
                                <span className="text-neutral-500">Est. Size:</span>
                                <span className="font-mono font-bold text-black">{stats.size}</span>
                            </div>

                            {isDownloading ? (
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-[var(--color-primary)] transition-all duration-300" style={{ width: `${progress}%` }} />
                                        </div>
                                        <p className="text-xs text-center text-neutral-400 uppercase tracking-wider font-bold">Downloading... {progress}%</p>
                                    </div>
                                    <button
                                        onClick={() => { cancelRef.current = true; }}
                                        className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-2 rounded-lg border border-red-100 hover:bg-red-100 transition-all active:scale-95"
                                    >
                                        <StopCircle size={16} /> Stop Download
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleDownload}
                                    disabled={!selectionBounds || stats.count === 0}
                                    className="w-full bg-[var(--color-primary)] text-white font-bold py-3 rounded-lg shadow-md active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
                                >
                                    Download Area
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {savedRegions?.length === 0 && (
                                <div className="text-center text-neutral-400 py-8 text-sm">No offline maps saved.</div>
                            )}
                            {savedRegions?.map(region => (
                                <div key={region.id} className="border border-neutral-200 rounded-lg p-3 flex gap-3 items-center group">
                                    <div className="w-10 h-10 bg-neutral-100 rounded flex items-center justify-center text-neutral-400 shrink-0">
                                        <Layers size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm truncate text-neutral-800">{region.name}</h4>
                                        <p className="text-xs text-neutral-500">{(region.sizeBytes / (1024 * 1024)).toFixed(1)} MB • {new Date(region.timestamp).toLocaleDateString()}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteRegion(region.id!)}
                                        className="p-2 text-neutral-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

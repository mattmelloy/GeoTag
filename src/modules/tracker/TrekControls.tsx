import { useTracker } from '../../context/TrackerContext';
import { Play, Square } from 'lucide-react';
import { useState, useEffect } from 'react';

// Format duration logic
function formatDuration(ms: number) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m ${s % 60}s`;
}

function formatDistance(meters: number) {
    if (meters > 1000) return `${(meters / 1000).toFixed(2)} km`;
    return `${Math.round(meters)} m`;
}

export function TrekControls() {
    const { isTracking, startTrek, stopTrek, stats } = useTracker();
    const [trekName, setTrekName] = useState('');
    const [showStopModal, setShowStopModal] = useState(false);

    // Ticking hook for duration
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        if (!isTracking || !stats.startTime) {
            setElapsed(0);
            return;
        }
        const interval = setInterval(() => {
            setElapsed(Date.now() - stats.startTime!);
        }, 1000);
        return () => clearInterval(interval);
    }, [isTracking, stats.startTime]);

    const handleStopClick = () => {
        setTrekName(`Trek ${new Date().toLocaleDateString()}`);
        setShowStopModal(true);
    };

    const confirmStop = () => {
        // We need to pass the name to stopTrek or update the DB after.
        // Let's modify stopTrek to take a name, or just do it here.
        // I'll update the stopTrek in Context potentially, but simpler to just 
        // call stopTrek and then an immediate update.
        // Actually, let's update stopTrek in context to accept a name.
        (stopTrek as any)(trekName);
        setShowStopModal(false);
    };

    if (!isTracking) {
        return (
            <button
                onClick={startTrek}
                className="absolute bottom-6 right-4 z-[400] bg-[var(--color-primary)] text-white p-4 rounded-full shadow-lg flex items-center gap-2 font-bold active:scale-95 transition-transform"
            >
                <Play fill="currentColor" size={20} />
                Start Trek
            </button>
        );
    }

    return (
        <>
            <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-none">
                <div className="bg-neutral-900/95 border border-neutral-800 p-3 rounded-lg shadow-2xl backdrop-blur-md pointer-events-auto min-w-[220px]">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2 text-[var(--color-primary)] font-bold uppercase text-[10px] tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                            Live Content
                        </div>
                        <button onClick={handleStopClick} className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition active:scale-90">
                            <Square size={16} fill="currentColor" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-neutral-500 text-[10px] uppercase font-bold tracking-tight">Distance</div>
                            <div className="text-xl font-mono text-neutral-100">{formatDistance(stats.distance)}</div>
                        </div>
                        <div>
                            <div className="text-neutral-500 text-[10px] uppercase font-bold tracking-tight">Duration</div>
                            <div className="text-xl font-mono text-neutral-100">{formatDuration(elapsed || stats.duration)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stop Modal */}
            {showStopModal && (
                <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-neutral-900 border border-neutral-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2">Finish Trek</h3>
                        <p className="text-neutral-400 text-sm mb-6">Give your adventure a name to save it to your history.</p>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={trekName}
                                onChange={e => setTrekName(e.target.value)}
                                className="w-full bg-neutral-800 text-white p-3 rounded-xl border border-neutral-700 outline-none focus:border-[var(--color-primary)]"
                                autoFocus
                            />
                            <div className="flex gap-3 mt-8">
                                <button onClick={() => setShowStopModal(false)} className="flex-1 py-3 text-neutral-400 font-bold bg-neutral-800 rounded-xl">Discard</button>
                                <button onClick={confirmStop} className="flex-1 py-3 bg-[var(--color-primary)] text-white font-bold rounded-xl shadow-lg ring-[var(--color-primary)]">Save Trek</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

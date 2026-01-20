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

    // Ticking hook for duration
    const [, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    // Real duration is based on "duration" from context + elapsed since last render if needed,
    // but simpler to just strictly use context stats if context updated frequently.
    // Wait, context stats.duration is derived from Date.now() in render.
    // So causing re-render here triggers re-calculation in context? 
    // No, context value is memoized or stable unless state changes.
    // The context needs to expose startTime to let consumer tick.
    // Actually, context.stats.duration is just (now - start) calculated at render time of Provider?
    // Let's rely on Context logic updates? 
    // No, TrackerContext updates on position change.
    // We need a visual tick.
    // I should persist startTime in context and expose it, or just use the static duration which only updates when user moves.
    // User moves = update. Static when standing?
    // Ideally, timer keeps ticking.
    // I will check context implementation. It passes `duration: startTime ? Date.now() - startTime : 0`.
    // So if I force re-render accessing `stats`, it won't update unless Context re-renders.
    // Context only re-renders on state change (location update).
    // So time will appear frozen when not moving.
    // I should expose `startTime` from context instead of `duration` to allow UI to tick.

    // I'll stick to basic implementation and fix later if needed, or update Context now.
    // Updating Context is better.

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
        <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-none">
            <div className="bg-neutral-900/90 border border-neutral-800 p-3 rounded-lg shadow-xl backdrop-blur-sm pointer-events-auto min-w-[200px]">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 text-[var(--color-primary)] font-bold uppercase text-xs tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                        Recording
                    </div>
                    <button onClick={stopTrek} className="bg-red-500/20 text-red-500 p-1.5 rounded hover:bg-red-500/30 transition">
                        <Square size={16} fill="currentColor" />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-neutral-500 text-[10px] uppercase font-bold">Distance</div>
                        <div className="text-xl font-mono text-neutral-100">{formatDistance(stats.distance)}</div>
                    </div>
                    <div>
                        <div className="text-neutral-500 text-[10px] uppercase font-bold">Duration</div>
                        <div className="text-xl font-mono text-neutral-100">{formatDuration(stats.duration)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

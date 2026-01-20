import clsx from 'clsx';
import { useTracker } from '../../context/TrackerContext';

export function AccuracyMeter() {
    const { currentLocation } = useTracker();

    if (!currentLocation) {
        return (
            <div className="bg-neutral-800 p-2 rounded-lg text-neutral-500 text-xs text-center animate-pulse">
                Waiting for GPS...
            </div>
        );
    }

    const acc = currentLocation.accuracy;
    // < 5m = Excellent
    // < 10m = Good
    // < 20m = Moderate
    // > 20m = Poor
    const status = acc < 5 ? 'excellent' : acc < 10 ? 'good' : acc < 20 ? 'moderate' : 'poor';

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-sm">
            <div className="flex justify-between items-end mb-2">
                <div className="text-xs uppercase font-bold text-neutral-500 tracking-wider">GPS Confidence</div>
                <div className={clsx("font-mono font-bold text-sm", {
                    'text-cyan-400': status === 'excellent',
                    'text-green-500': status === 'good',
                    'text-yellow-500': status === 'moderate',
                    'text-red-500': status === 'poor',
                })}>
                    ±{Math.round(acc)}m
                </div>
            </div>

            {/* Visual Bar */}
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden flex gap-0.5">
                <div className={clsx("h-full flex-1 transition-colors duration-500", acc < 100 ? (acc < 5 ? 'bg-cyan-400' : acc < 10 ? 'bg-green-500' : acc < 20 ? 'bg-yellow-600' : 'bg-red-900') : 'bg-neutral-700')}></div>
                <div className={clsx("h-full flex-1 transition-colors duration-500", acc < 20 ? (acc < 5 ? 'bg-cyan-400' : acc < 10 ? 'bg-green-500' : 'bg-yellow-600') : 'bg-neutral-700')}></div>
                <div className={clsx("h-full flex-1 transition-colors duration-500", acc < 10 ? (acc < 5 ? 'bg-cyan-400' : 'bg-green-500') : 'bg-neutral-700')}></div>
                <div className={clsx("h-full flex-1 transition-colors duration-500", acc < 5 ? 'bg-cyan-400' : 'bg-neutral-700')}></div>
            </div>

            <div className="mt-2 text-[10px] text-neutral-400 text-center uppercase font-bold tracking-tight">
                {status === 'excellent' ? 'Excellent Signal'
                    : status === 'good' ? 'Good Accuracy'
                        : status === 'moderate' ? 'Moderate Precision'
                            : 'Poor Signal - Open Sky Needed'}
            </div>
        </div>
    );
}

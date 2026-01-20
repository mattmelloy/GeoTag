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
    // < 10m = Good (Green)
    // < 30m = Moderate (Yellow)
    // > 30m = Poor (Red)
    const status = acc < 10 ? 'good' : acc < 30 ? 'moderate' : 'poor';

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 shadow-sm">
            <div className="flex justify-between items-end mb-2">
                <div className="text-xs uppercase font-bold text-neutral-500 tracking-wider">GPS Confidence</div>
                <div className={clsx("font-mono font-bold text-sm", {
                    'text-green-500': status === 'good',
                    'text-yellow-500': status === 'moderate',
                    'text-red-500': status === 'poor',
                })}>
                    ±{Math.round(acc)}m
                </div>
            </div>

            {/* Visual Bar */}
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden flex gap-0.5">
                <div className={clsx("h-full flex-1 transition-colors duration-500", acc < 100 ? (status === 'good' ? 'bg-green-500' : status === 'moderate' ? 'bg-yellow-600' : 'bg-red-900') : 'bg-neutral-700')}></div>
                <div className={clsx("h-full flex-1 transition-colors duration-500", acc < 50 ? (status === 'good' ? 'bg-green-500' : 'bg-yellow-600') : 'bg-neutral-700')}></div>
                <div className={clsx("h-full flex-1 transition-colors duration-500", acc < 20 ? (status === 'good' ? 'bg-green-500' : 'bg-yellow-600') : 'bg-neutral-700')}></div>
                <div className={clsx("h-full flex-1 transition-colors duration-500", acc < 10 ? 'bg-green-500' : 'bg-neutral-700')}></div>
            </div>

            <div className="mt-2 text-[10px] text-neutral-400 text-center">
                {status === 'good' ? 'Excellent Signal' : status === 'moderate' ? 'Acceptable Accuracy' : 'Low Precision - Open Sky Needed'}
            </div>
        </div>
    );
}

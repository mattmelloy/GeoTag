import { useRef, useEffect, useState } from 'react';
import { Camera, X, Sliders } from 'lucide-react';
import clsx from 'clsx';

interface CameraModuleProps {
    onCapture: (blob: Blob) => void;
    onClose: () => void;
}

export function CameraModule({ onCapture, onClose }: CameraModuleProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [zoom, setZoom] = useState(1);
    const [capabilities, setCapabilities] = useState<any>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let activeStream: MediaStream | null = null;

        async function setupCamera() {
            try {
                activeStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment', // Rear camera by default
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    }
                });
                setStream(activeStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = activeStream;
                }

                // Get track capabilities (for zoom)
                const track = activeStream.getVideoTracks()[0];
                const caps = track.getCapabilities() as any;
                if (caps.zoom) {
                    setCapabilities(caps);
                }
            } catch (err) {
                console.error("Camera error:", err);
                setError("Could not access camera. Please check permissions.");
            }
        }

        setupCamera();

        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach(track => {
                    track.stop();
                    console.log("Stopped track:", track.label);
                });
            }
        };
    }, []);

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setZoom(val);
        if (stream) {
            const track = stream.getVideoTracks()[0];
            track.applyConstraints({
                advanced: [{ zoom: val } as any]
            });
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;
        setIsCapturing(true);

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0);
            canvas.toBlob((blob) => {
                if (blob) {
                    onCapture(blob);
                }
                setIsCapturing(false);
            }, 'image/jpeg', 0.9);
        }
    };

    return (
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 shadow-2xl border border-neutral-800">
            {/* Top UI Overlay */}
            <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-black/40 rounded-full backdrop-blur-sm">Live Camera</span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="p-1.5 bg-black/60 text-white rounded-full hover:bg-neutral-800 transition backdrop-blur-sm"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Video Preview */}
            <div className="w-full h-full flex items-center justify-center">
                {error ? (
                    <div className="p-6 text-center">
                        <Camera size={32} className="mx-auto text-neutral-600 mb-2" />
                        <p className="text-neutral-400 text-xs px-4">{error}</p>
                        <button onClick={onClose} className="mt-4 px-4 py-1.5 bg-neutral-800 text-white text-xs rounded-lg">Dismiss</button>
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            {/* Bottom UI Overlay (Controls) */}
            {!error && (
                <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none">
                    <div className="flex flex-col items-center gap-4 pointer-events-auto">
                        {/* Zoom Slider */}
                        {capabilities?.zoom && (
                            <div className="flex items-center gap-3 w-full max-w-[200px] bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                                <Sliders size={12} className="text-white/60" />
                                <input
                                    type="range"
                                    min={capabilities.zoom.min}
                                    max={capabilities.zoom.max}
                                    step={0.1}
                                    value={zoom}
                                    onChange={handleZoomChange}
                                    className="flex-1 h-1 bg-neutral-700 rounded-lg appearance-none accent-[var(--color-primary)] cursor-pointer"
                                />
                                <span className="text-white font-mono text-[10px] min-w-[24px]">{zoom.toFixed(1)}x</span>
                            </div>
                        )}

                        {/* Shutter */}
                        <button
                            onClick={capturePhoto}
                            disabled={isCapturing}
                            className={clsx(
                                "w-14 h-14 rounded-full border-4 border-white flex items-center justify-center transition p-1 shadow-2xl relative",
                                isCapturing ? "opacity-50" : "active:scale-90 hover:scale-105"
                            )}
                        >
                            <div className="w-full h-full bg-white rounded-full shadow-inner" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

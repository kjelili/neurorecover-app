import { useEffect, useRef, useState } from 'react';

interface CameraViewProps {
  onVideoReady?: (video: HTMLVideoElement | null) => void;
  className?: string;
  mirrored?: boolean;
  children?: React.ReactNode;
}

export function CameraView({ onVideoReady, className = '', mirrored = true, children }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const cbRef = useRef(onVideoReady);
  cbRef.current = onVideoReady;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    const videoEl = videoRef.current;
    if (!videoEl) return;

    (async () => {
      try {
        setError(null);
        setLoading(true);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        videoEl.srcObject = stream;
        await videoEl.play();
        if (!cancelled) cbRef.current?.(videoEl);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof Error && e.message.includes('interrupt')) return;
        setError(e instanceof Error ? e.message : 'Camera access failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach(t => t.stop());
      videoEl.srcObject = null;
      cbRef.current?.(null);
    };
  }, []);

  if (error) {
    return (
      <div className={`rounded-2xl bg-warm-100 border border-warm-200 p-6 text-center ${className}`}>
        <div className="text-3xl mb-3">📷</div>
        <p className="text-warm-700 text-sm font-medium mb-1">Camera unavailable</p>
        <p className="text-warm-500 text-xs">{error}</p>
        <p className="text-warm-400 text-xs mt-2">You can still tap/click to play.</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-warm-900 ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-warm-100">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
            <span className="text-warm-500 text-sm">Starting camera…</span>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        playsInline
        muted
        className={`w-full h-full object-cover ${mirrored ? 'scale-x-[-1]' : ''} ${loading ? 'invisible' : ''}`}
        style={{ maxHeight: '50vh' }}
      />
      {children && <div className="absolute inset-0">{children}</div>}
    </div>
  );
}

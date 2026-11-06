import React, { useRef, useEffect, useState } from 'react';
import { Hand, Camera, CameraOff, X, Sparkles, Check, ChevronUp, ChevronDown } from 'lucide-react';

interface CameraHandControlProps {
  isActive: boolean;
  onClose: () => void;
  onGlideUp: () => void;
  onGlideDown: () => void;
  currentPageIndex: number;
  totalPages: number;
}

export const CameraHandControl: React.FC<CameraHandControlProps> = ({
  isActive,
  onClose,
  onGlideUp,
  onGlideDown,
  currentPageIndex,
  totalPages,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [gestureFeedback, setGestureFeedback] = useState<string | null>(null);
  const lastGestureTimeRef = useRef<number>(0);
  const prevFrameDataRef = useRef<Uint8Array | null>(null);

  // Initialize camera stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    if (isActive) {
      navigator.mediaDevices?.getUserMedia({ 
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' } 
      })
      .then((s) => {
        activeStream = s;
        setStream(s);
        setCameraError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch((err) => {
        console.warn('Camera access error:', err);
        setCameraError('يرجى السماح بالوصول للكاميرا للتحكم بحركة اليد.');
      });
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isActive]);

  // Motion Detection Loop (Real-time Hand Wave detection)
  useEffect(() => {
    if (!isActive || !stream) return;

    let animId: number;
    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          const w = 64;
          const h = 48;
          canvas.width = w;
          canvas.height = h;

          ctx.drawImage(video, 0, 0, w, h);
          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;

          const currentGray = new Uint8Array(w * h);
          for (let i = 0; i < currentGray.length; i++) {
            // Convert to grayscale
            const idx = i * 4;
            currentGray[i] = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);
          }

          if (prevFrameDataRef.current) {
            const prev = prevFrameDataRef.current;
            let topMotion = 0;
            let bottomMotion = 0;
            const halfH = Math.floor(h / 2);

            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const idx = y * w + x;
                const diff = Math.abs(currentGray[idx] - prev[idx]);
                if (diff > 25) { // motion threshold
                  if (y < halfH) {
                    topMotion++;
                  } else {
                    bottomMotion++;
                  }
                }
              }
            }

            const now = Date.now();
            const cooldown = 950; // ms between page turns

            if (now - lastGestureTimeRef.current > cooldown) {
              const motionThreshold = 120; // minimal pixels motion

              if (topMotion > motionThreshold && topMotion > bottomMotion * 1.5) {
                // Wave upward detected -> page up
                lastGestureTimeRef.current = now;
                setGestureFeedback('حركة يد لأعلى 🔼 (الصفحة السابقة)');
                onGlideUp();
                setTimeout(() => setGestureFeedback(null), 1400);
              } else if (bottomMotion > motionThreshold && bottomMotion > topMotion * 1.5) {
                // Wave downward detected -> page down
                lastGestureTimeRef.current = now;
                setGestureFeedback('حركة يد لأسفل 🔽 (الصفحة التالية)');
                onGlideDown();
                setTimeout(() => setGestureFeedback(null), 1400);
              }
            }
          }

          prevFrameDataRef.current = currentGray;
        }
      }
      animId = requestAnimationFrame(processFrame);
    };

    animId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animId);
  }, [isActive, stream, onGlideUp, onGlideDown]);

  if (!isActive) return null;

  return (
    <div className="fixed bottom-24 start-4 z-50 flex flex-col items-start gap-2 font-['Cairo',sans-serif] animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Floating Camera Widget */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-3 shadow-2xl border-2 border-amber-500 max-w-[220px]">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400">
            <Hand className="w-4 h-4 animate-bounce" />
            <span>تحكم بحركة اليد</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="إيقاف التحكم بحركة اليد"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video feed or error */}
        {cameraError ? (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-[11px] text-rose-700 dark:text-rose-300 font-bold leading-relaxed text-center">
            {cameraError}
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video shadow-inner flex items-center justify-center">
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Gesture Feedback Pill */}
            {gestureFeedback && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 text-center animate-in zoom-in-95 duration-150">
                <span className="text-xs font-black text-amber-400 animate-pulse leading-snug">
                  {gestureFeedback}
                </span>
              </div>
            )}

            {/* Subtle live indicator dot */}
            <div className="absolute top-2 start-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/60 text-[9px] text-emerald-400 font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>نشط</span>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-2 text-[10px] text-slate-600 dark:text-slate-300 space-y-1 font-bold">
          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
            <ChevronUp className="w-3.5 h-3.5 text-amber-500" />
            <span>لوّح بيدك لأعلى 🔼: صفحة سابقة</span>
          </div>
          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
            <ChevronDown className="w-3.5 h-3.5 text-amber-500" />
            <span>لوّح بيدك لأسفل 🔽: صفحة تالية</span>
          </div>
        </div>
      </div>
    </div>
  );
};

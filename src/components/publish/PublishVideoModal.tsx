import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Video as VideoIcon, 
  Upload, 
  Sparkles, 
  Flashlight, 
  SwitchCamera, 
  Square, 
  Play, 
  Check, 
  AlertCircle,
  Clock,
  Layers,
  Heart,
  Share2
} from 'lucide-react';
import { VideoItem, VideoType, SUBJECTS, SubjectId } from '../../types';
import { VideoService } from '../../services/videoService';
import { StorageService } from '../../services/storage';
import { auth } from '../../services/firebase';
import confetti from 'canvas-confetti';

interface PublishVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoPublished?: (video: VideoItem) => void;
  initialType?: VideoType;
}

const VIDEO_FILTERS: { id: string; nameAr: string; filterStyle: string }[] = [
  { id: 'normal', nameAr: 'طبيعي', filterStyle: 'none' },
  { id: 'vivid', nameAr: 'مشرق (Vivid)', filterStyle: 'contrast(1.15) saturate(1.3)' },
  { id: 'warm', nameAr: 'دافئ (Warm)', filterStyle: 'sepia(0.2) saturate(1.2) hue-rotate(-10deg)' },
  { id: 'sepia', nameAr: 'كلاسيكي (Sepia)', filterStyle: 'sepia(0.65)' },
  { id: 'bw', nameAr: 'أبيض وأسود', filterStyle: 'grayscale(1)' },
  { id: 'cinema', nameAr: 'سينمائي', filterStyle: 'contrast(1.2) brightness(0.95) saturate(1.1)' },
];

export const PublishVideoModal: React.FC<PublishVideoModalProps> = ({
  isOpen,
  onClose,
  onVideoPublished,
  initialType = 'shorts',
}) => {
  // Mode: 'camera' or 'preview'
  const [mode, setMode] = useState<'camera' | 'preview'>('camera');

  // Video Type Choice: 'shorts' or 'lesson' (الميزة المطلوبة: زرين للتبديل بين شورتس ودروس)
  const [selectedType, setSelectedType] = useState<VideoType>(initialType);
  const [hasUserSelectedType, setHasUserSelectedType] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialType) {
        setSelectedType(initialType);
      }
    }
  }, [isOpen, initialType]);
  
  // Camera state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('normal');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Preview & Metadata state
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [detectedDuration, setDetectedDuration] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState<SubjectId>('arabic');
  const [grade, setGrade] = useState('الصف الخامس الابتدائي');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoElementRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active user info
  const activeProfile = StorageService.getActiveProfile();

  // Start Camera when modal opens
  useEffect(() => {
    if (isOpen && mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, mode, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoElementRef.current) {
        videoElementRef.current.srcObject = mediaStream;
      }

      // Check for torch capability
      const track = mediaStream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities?.() as any) || {};
        setTorchSupported(Boolean(capabilities.torch));
      }
    } catch (err: any) {
      console.warn('Camera access note:', err);
      setCameraError('لم نتمكن من الوصول لكاميرا الموبايل. يمكنك السماح بالوصول أو رفع فيديو مسجل من جهازك مباشرة.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      try {
        const nextTorch = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextTorch }],
        });
        setIsTorchOn(nextTorch);
      } catch (e) {
        console.warn('Torch toggle note:', e);
      }
    }
  };

  // Start recording video
  const startRecording = () => {
    if (!stream) return;
    recordedChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      let recorder: MediaRecorder;
      if (MediaRecorder.isTypeSupported(options.mimeType)) {
        recorder = new MediaRecorder(stream, options);
      } else {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        setVideoBlobUrl(url);
        const duration = recordingSeconds || 15;
        setDetectedDuration(duration);
        if (!hasUserSelectedType) {
          setSelectedType(duration <= 180 ? 'shorts' : 'lesson');
        }
        setMode('preview');
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (e) {
      console.error('Recording start error', e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  // Handle local video file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setVideoBlobUrl(url);

    // Create a temporary video element to measure duration
    const tempVideo = document.createElement('video');
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      const dur = Math.round(tempVideo.duration) || 30;
      setDetectedDuration(dur);
      if (!hasUserSelectedType) {
        setSelectedType(dur <= 180 ? 'shorts' : 'lesson');
      }
      setMode('preview');
    };
    tempVideo.onerror = () => {
      setDetectedDuration(60);
      if (!hasUserSelectedType) {
        setSelectedType('shorts');
      }
      setMode('preview');
    };
  };

  // Save video
  const handlePublish = () => {
    if (!videoBlobUrl || !title.trim()) return;

    setIsSubmitting(true);
    const videoId = 'vid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    // Explicit user choice from the two buttons (shorts vs lesson)
    const finalType: VideoType = selectedType;

    const newVideo: VideoItem = {
      id: videoId,
      title: title.trim(),
      description: description.trim(),
      videoUrl: videoBlobUrl,
      durationSeconds: detectedDuration || (selectedType === 'shorts' ? 45 : 300),
      type: finalType,
      subject,
      grade,
      userId: auth.currentUser?.uid || activeProfile.id,
      author: activeProfile.name || auth.currentUser?.displayName || 'ناشر متميز',
      authorPhoto: activeProfile.photoURL,
      authorRole: activeProfile.role,
      likesCount: 0, // Starts strictly at 0!
      sharesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    VideoService.saveVideo(newVideo);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });

    setIsSubmitting(false);
    onVideoPublished?.(newVideo);
    onClose();
  };

  if (!isOpen) return null;

  const currentFilterObj = VIDEO_FILTERS.find((f) => f.id === selectedFilter) || VIDEO_FILTERS[0];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto font-['Cairo',sans-serif] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="تسجيل ونشر Shorts أو درس تعليمي"
      >
        {/* Header */}
        <header className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md">
              <Camera className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{mode === 'camera' ? 'تسجيل Shorts أو درس بالكاميرا' : 'إعدادات نشر الفيديو'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold">
                  جديد
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {mode === 'camera' 
                  ? '3 دقائق أو أقل = Shorts 🎬 • أكثر من 3 دقائق = درس كامل 📺' 
                  : 'حدد العنوان والوصف وسيتم النشر بـ 0 لايكات زي اليوتيوب'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* ⚡ الزران الرئيسيان للاختيار والتبديل بين Shorts ودروس تعليمية ⚡ */}
        <div className="px-4 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/70 dark:bg-slate-900/40">
          <div className="p-1.5 bg-slate-200/60 dark:bg-slate-800 rounded-2xl border border-slate-300/60 dark:border-slate-700">
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>اختر نوع النشر:</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  (اضغط على أحد الزرين لتحديد مكان نشر الفيديو)
                </span>
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-all ${
                selectedType === 'shorts'
                  ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60'
                  : 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/60'
              }`}>
                {selectedType === 'shorts' ? '⚡ Shorts 🎬 محدد' : '🎓 درس تعليمي 📺 محدد'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2" role="group" aria-label="أزرار التبديل بين Shorts والدروس">
              {/* الزر الأول: Shorts */}
              <button
                type="button"
                onClick={() => {
                  setSelectedType('shorts');
                  setHasUserSelectedType(true);
                }}
                className={`flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all shadow-xs cursor-pointer select-none active:scale-95 ${
                  selectedType === 'shorts'
                    ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md ring-2 ring-rose-400'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
                title="نشر كفيديو قصير Shorts (تيك توك)"
              >
                <span className="text-lg">🎬</span>
                <div className="text-start">
                  <div className="leading-tight">فيديو قصير (Shorts)</div>
                  <div className={`text-[9px] font-bold ${selectedType === 'shorts' ? 'text-rose-100' : 'text-slate-400'}`}>
                    رأسي سريع حتى 3 د
                  </div>
                </div>
              </button>

              {/* الزر الثاني: درس تعليمي */}
              <button
                type="button"
                onClick={() => {
                  setSelectedType('lesson');
                  setHasUserSelectedType(true);
                }}
                className={`flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all shadow-xs cursor-pointer select-none active:scale-95 ${
                  selectedType === 'lesson'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md ring-2 ring-indigo-400'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
                title="نشر كدرس تعليمي كامل (يوتيوب)"
              >
                <span className="text-lg">📺</span>
                <div className="text-start">
                  <div className="leading-tight">درس تعليمي (كامل)</div>
                  <div className={`text-[9px] font-bold ${selectedType === 'lesson' ? 'text-indigo-100' : 'text-slate-400'}`}>
                    شروحات ووحدات دراسية
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {mode === 'camera' ? (
            <div className="space-y-4">
              {/* Camera Preview Area */}
              <div className="relative aspect-[9/16] sm:aspect-video w-full max-h-[460px] mx-auto bg-black rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
                {cameraError ? (
                  <div className="p-6 text-center text-white space-y-3">
                    <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                    <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                      {cameraError}
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-md hover:bg-amber-400 transition"
                    >
                      اختر فيديو أو صورة من جهازك 📁
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoElementRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transition-all"
                      style={{ filter: currentFilterObj.filterStyle }}
                    />

                    {/* Camera Top Floating Controls */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
                      {/* Recording Timer Badge */}
                      {isRecording && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600/90 text-white text-xs font-mono font-black animate-pulse shadow-md">
                          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                          <span>
                            {Math.floor(recordingSeconds / 60).toString().padStart(2, '0')}:
                            {(recordingSeconds % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      )}

                      {!isRecording && (
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-amber-300 font-bold border border-white/10">
                          {facingMode === 'user' ? 'الكاميرا الأمامية' : 'الكاميرا الخلفية'}
                        </span>
                      )}

                      {/* Right controls: Flashlight & Camera Flip */}
                      <div className="flex items-center gap-2">
                        {torchSupported && (
                          <button
                            type="button"
                            onClick={toggleTorch}
                            className={`p-2.5 rounded-full backdrop-blur-md transition ${
                              isTorchOn 
                                ? 'bg-amber-400 text-slate-950 shadow-lg ring-2 ring-amber-300' 
                                : 'bg-black/60 text-white hover:bg-black/80'
                            }`}
                            title="تشغيل/إطفاء الكشاف"
                          >
                            <Flashlight className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={toggleCameraFacing}
                          className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition"
                          title="قلب الكاميرا"
                        >
                          <SwitchCamera className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Floating Filters Bar */}
                    {!isRecording && (
                      <div className="absolute bottom-3 inset-x-3 flex items-center justify-center gap-1.5 overflow-x-auto p-1.5 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 no-scrollbar">
                        {VIDEO_FILTERS.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setSelectedFilter(f.id)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition whitespace-nowrap ${
                              selectedFilter === f.id
                                ? 'bg-amber-500 text-slate-950 font-black'
                                : 'bg-white/15 text-white hover:bg-white/30'
                            }`}
                          >
                            {f.nameAr}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Action Buttons: Record / Stop / Upload */}
              <div className="flex items-center justify-around gap-4 pt-1">
                {/* Upload from device */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-amber-500 transition text-xs font-bold"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span>رفع فيديو مسجل</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Main Big Record Button */}
                {isRecording ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="w-18 h-18 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl ring-4 ring-rose-400/40 animate-pulse transition active:scale-95 cursor-pointer"
                    title="إيقاف التسجيل وإنهاء الفيديو"
                  >
                    <Square className="w-7 h-7 fill-white" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="w-18 h-18 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white flex items-center justify-center shadow-xl ring-4 ring-rose-400/30 transition active:scale-95 cursor-pointer"
                    title="بدء تسجيل الفيديو الآن"
                  >
                    <div className="w-7 h-7 rounded-full bg-white shadow-xs" />
                  </button>
                )}

                {/* Duration Hint */}
                <div className="flex flex-col items-center gap-1 text-slate-400 text-xs font-medium">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-500" />
                  </div>
                  <span>≤ 3 دقائق: Shorts</span>
                </div>
              </div>
            </div>
          ) : (
            /* Mode 2: Preview & Publish Form */
            <div className="space-y-4">
              {/* Video Player Preview */}
              <div className="relative aspect-video max-h-[260px] w-full bg-black rounded-3xl overflow-hidden shadow-lg mx-auto">
                {videoBlobUrl && (
                  <video
                    ref={previewVideoRef}
                    src={videoBlobUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Selected Target Notification (Shorts vs Lessons) */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                selectedType === 'shorts' 
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200' 
                  : 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-xs ${
                    selectedType === 'shorts' ? 'bg-gradient-to-tr from-rose-600 to-red-500' : 'bg-gradient-to-tr from-indigo-600 to-blue-500'
                  }`}>
                    {selectedType === 'shorts' ? 'Shorts' : 'درس'}
                  </div>
                  <div>
                    <div className="text-xs font-black">
                      {selectedType === 'shorts' 
                        ? '🎬 سيتم النشر في قسم فيديوهات Shorts (تيك توك)' 
                        : '📺 سيتم النشر في قسم الدروس والشروحات الكاملة (يوتيوب)'}
                    </div>
                    <div className="text-[11px] opacity-80 font-medium">
                      {selectedType === 'shorts' 
                        ? `المدة: (${detectedDuration} ثانية) • يعرض بشكل رأسي سريع في موجز Shorts` 
                        : `المدة: (${detectedDuration > 60 ? `${Math.floor(detectedDuration / 60)} دقيقة و ${detectedDuration % 60} ث` : `${detectedDuration} ثانية`}) • يعرض في فهرس الدروس`}
                      <span className="mr-1 text-amber-600 dark:text-amber-400 font-bold">(يمكنك تغييره بالزرين بالأعلى)</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setVideoBlobUrl(null);
                    setMode('camera');
                  }}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 underline shrink-0"
                >
                  إعادة التسجيل
                </button>
              </div>

              {/* Title & Description Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان الفيديو أو الشرح <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: شرح درس ضرب الكسور العشرية بطريقة سهلة وسريعة"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    وصف الفيديو وملاحظات الدرس
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="اكتب وصفاً مختصراً عما يتعلمه الطالب في هذا الفيديو..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                      المادة الدراسية
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value as SubjectId)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                      الصف الدراسي
                    </label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                    >
                      <option value="الصف الخامس الابتدائي">الصف الخامس الابتدائي</option>
                      <option value="المرحلة الابتدائية">المرحلة الابتدائية عام</option>
                      <option value="المرحلة الإعدادية">المرحلة الإعدادية</option>
                    </select>
                  </div>
                </div>

                {/* YouTube Likes System Note */}
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-300 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>
                    يبدأ هذا الفيديو بـ <strong>0 لايكات</strong> زي اليوتيوب، وتزداد مع إعجاب ومشاركات زملائك في المنصة!
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {mode === 'preview' && (
          <footer className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMode('camera')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 transition"
            >
              الرجوع للكاميرا
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={isSubmitting || !title.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm shadow-md transition disabled:opacity-40 cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? 'جاري النشر...' : selectedType === 'shorts' ? 'نشر Shorts الآن 🎬' : 'نشر الدرس الكامل 📺'}</span>
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};

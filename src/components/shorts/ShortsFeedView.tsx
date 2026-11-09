import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Plus, 
  Bell, 
  Check, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  ChevronUp, 
  ChevronDown,
  Camera,
  Film,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { VideoItem } from '../../types';
import { VideoService } from '../../services/videoService';
import { StorageService } from '../../services/storage';
import { resolveVideoUrl } from '../../services/videoStorage';
import { InteractiveCommentsSection } from '../comments/InteractiveCommentsSection';
import confetti from 'canvas-confetti';

interface ShortsFeedViewProps {
  onOpenPublishVideo: () => void;
  onOpenPublisherProfile: (authorName: string) => void;
}

export const ShortsFeedView: React.FC<ShortsFeedViewProps> = ({
  onOpenPublishVideo,
  onOpenPublisherProfile,
}) => {
  const [shorts, setShorts] = useState<VideoItem[]>(() => VideoService.getShorts());
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isCommentsOpen, setIsCommentsOpen] = useState<boolean>(false);
  const [activeUrl, setActiveUrl] = useState<string>('');

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Resolve active short video URL (restores from IndexedDB if necessary)
  const currentShort = shorts[currentIndex];
  useEffect(() => {
    let active = true;
    if (currentShort) {
      resolveVideoUrl(currentShort).then((url) => {
        if (active) setActiveUrl(url || currentShort.videoUrl);
      });
    }
    return () => {
      active = false;
    };
  }, [currentShort?.id, currentShort?.videoUrl]);

  // Subscribe to live video updates
  useEffect(() => {
    const unsubscribe = VideoService.subscribe(() => {
      setShorts(VideoService.getShorts());
    });
    return () => unsubscribe();
  }, []);

  // Auto-play active short and pause others
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (video) {
        if (idx === currentIndex) {
          video.currentTime = 0;
          video.play().catch(() => {});
          setIsPlaying(true);
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex, shorts.length]);

  const handleToggleLike = (video: VideoItem) => {
    const isNowLiked = VideoService.toggleLike(video.id);
    if (isNowLiked) {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
    }
  };

  const handleToggleSubscribe = (authorName: string) => {
    const nextSub = StorageService.toggleSubscription(authorName);
    if (nextSub) {
      confetti({ particleCount: 40, spread: 70, origin: { y: 0.5 } });
    }
  };

  const handleShare = async (video: VideoItem) => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: `شاهد هذا الشرح القصير على منصة قلمي: ${video.title}`,
          url,
        });
        return;
      } catch {}
    }
    navigator.clipboard.writeText(url);
    setCopiedId(video.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePlayPause = () => {
    const activeVideo = videoRefs.current[currentIndex];
    if (activeVideo) {
      if (activeVideo.paused) {
        activeVideo.play();
        setIsPlaying(true);
      } else {
        activeVideo.pause();
        setIsPlaying(false);
      }
    }
  };

  // Empty state when no shorts exist
  if (shorts.length === 0) {
    return (
      <main className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-6 text-center font-['Cairo',sans-serif]">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500/20 to-amber-500/20 text-rose-500 flex items-center justify-center mb-4 shadow-inner">
          <Film className="w-10 h-10 stroke-[2.5]" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
          لا توجد فيديوهات Shorts حالياً 🎬
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
          يمكنك تجربة فيديو Shorts التجريبي لاختبار الصوت، اللايك، والتعليقات، أو تصوير فيديو جديد من كاميرا الموبايل.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => VideoService.resetToDemoVideos()}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[3]" />
            <span>عرض الفيديو التجريبي لـ Shorts ⚡</span>
          </button>
          <button
            type="button"
            onClick={onOpenPublishVideo}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm shadow-lg hover:shadow-xl transition active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            <span>+ تسجيل ونشر Shorts جديد</span>
          </button>
        </div>
      </main>
    );
  }

  const isSubscribedToAuthor = StorageService.isSubscribed(currentShort?.author || '');

  return (
    <main className="relative h-[calc(100vh-130px)] w-full flex items-center justify-center bg-black overflow-hidden select-none font-['Cairo',sans-serif]">
      {/* Video Container (Vertical aspect ratio like TikTok / Shorts) */}
      <div className="relative h-full aspect-[9/16] max-w-md w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        <video
          key={currentShort.id}
          ref={(el) => {
            videoRefs.current[currentIndex] = el;
          }}
          src={activeUrl || currentShort.videoUrl}
          poster={currentShort.thumbnailUrl || undefined}
          autoPlay
          loop
          playsInline
          preload="auto"
          muted={isMuted}
          onClick={togglePlayPause}
          className="w-full h-full object-cover cursor-pointer"
        />

        {/* Play/Pause Overlay Indicator on click */}
        {!isPlaying && (
          <div 
            onClick={togglePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-2xs cursor-pointer z-10"
          >
            <div className="w-20 h-20 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white shadow-2xl hover:scale-105 transition">
              <Play className="w-10 h-10 fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Top Sound Control */}
        <div className="absolute top-4 start-4 z-20">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition shadow-md cursor-pointer"
            title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Vertical Gliders to Switch Shorts */}
        <div className="absolute end-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            className="p-2 rounded-full bg-black/50 text-white disabled:opacity-20 hover:bg-black/80 backdrop-blur-md transition cursor-pointer"
            title="السابق (أعلى)"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            type="button"
            disabled={currentIndex >= shorts.length - 1}
            onClick={() => setCurrentIndex((prev) => Math.min(shorts.length - 1, prev + 1))}
            className="p-2 rounded-full bg-black/50 text-white disabled:opacity-20 hover:bg-black/80 backdrop-blur-md transition cursor-pointer"
            title="التالي (أسفل)"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Right Floating Interaction Column (Likes, Author, Share) */}
        <div className="absolute bottom-20 end-3 z-20 flex flex-col items-center gap-4">
          {/* Author Avatar with Subscribe (+) button */}
          <div className="relative flex flex-col items-center">
            <button
              type="button"
              onClick={() => onOpenPublisherProfile(currentShort.author)}
              className="w-12 h-12 rounded-full border-2 border-amber-400 overflow-hidden shadow-lg bg-slate-800"
              title={`زيارة صفحة ${currentShort.author}`}
            >
              {currentShort.authorPhoto ? (
                <img src={currentShort.authorPhoto} alt={currentShort.author} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-amber-500 to-orange-600 text-slate-950 font-black flex items-center justify-center text-sm">
                  {(currentShort.author || 'ط')[0]}
                </div>
              )}
            </button>

            {/* Subscribe Plus Button */}
            {!isSubscribedToAuthor && (
              <button
                type="button"
                onClick={() => handleToggleSubscribe(currentShort.author)}
                className="absolute -bottom-2 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center text-xs font-black shadow-md cursor-pointer transition active:scale-90"
                title="اشتراك في قناة الناشر"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            )}
          </div>

          {/* Like Button (Starts at 0 like YouTube) */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => handleToggleLike(currentShort)}
              className={`p-3 rounded-full backdrop-blur-md transition shadow-lg active:scale-80 cursor-pointer ${
                currentShort.likedByUser 
                  ? 'bg-rose-600 text-white' 
                  : 'bg-black/60 text-white hover:bg-black/80'
              }`}
              title="إعجاب (لايك)"
            >
              <Heart className={`w-6 h-6 ${currentShort.likedByUser ? 'fill-white' : ''}`} />
            </button>
            <span className="text-white text-xs font-black mt-1 drop-shadow-md">
              {currentShort.likesCount || 0}
            </span>
          </div>

          {/* Comments & Inquiries Button (استفسارات وأسئلة الطلاب) */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsCommentsOpen(true)}
              className="p-3 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition shadow-lg active:scale-90 cursor-pointer"
              title="استفسارات وأسئلة الطلاب"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <span className="text-white text-[11px] font-bold mt-1 drop-shadow-md">
              استفسار
            </span>
          </div>

          {/* Share Button */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => handleShare(currentShort)}
              className="p-3 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition shadow-lg active:scale-90 cursor-pointer"
              title="مشاركة الفيديو"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <span className="text-white text-[11px] font-bold mt-1 drop-shadow-md">
              {copiedId === currentShort.id ? 'تم!' : 'مشاركة'}
            </span>
          </div>

          {/* Delete Short Video Button */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => {
                if (confirmDeleteId === currentShort.id) {
                  VideoService.deleteVideo(currentShort.id);
                  setConfirmDeleteId(null);
                } else {
                  setConfirmDeleteId(currentShort.id);
                  setTimeout(() => setConfirmDeleteId(null), 3000);
                }
              }}
              className={`p-3 rounded-full backdrop-blur-md transition shadow-lg active:scale-90 cursor-pointer ${
                confirmDeleteId === currentShort.id
                  ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                  : 'bg-black/60 text-slate-300 hover:text-rose-500 hover:bg-black/80'
              }`}
              title={confirmDeleteId === currentShort.id ? 'اضغط مرة أخرى لتأكيد المسح' : 'مسح هذا الفيديو'}
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <span className={`text-[10px] font-bold mt-1 drop-shadow-md ${confirmDeleteId === currentShort.id ? 'text-rose-400 font-black' : 'text-slate-300'}`}>
              {confirmDeleteId === currentShort.id ? 'تأكيد المسح؟' : 'مسح'}
            </span>
          </div>
        </div>

        {/* Bottom Overlay: Title, Description, Author details */}
        <div className="absolute bottom-4 inset-x-4 z-20 text-white pointer-events-auto max-w-[80%] space-y-1.5 drop-shadow-lg">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenPublisherProfile(currentShort.author)}
              className="font-black text-sm text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>@{currentShort.author}</span>
            </button>

            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white font-bold">
              {currentShort.grade || 'الصف الخامس الابتدائي'}
            </span>

            {currentShort.id.startsWith('demo_') && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black shadow-xs">
                فيديو تجريبي 🎬
              </span>
            )}
          </div>


          <h3 className="font-extrabold text-sm sm:text-base leading-snug line-clamp-2">
            {currentShort.title}
          </h3>

          {currentShort.description && (
            <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed opacity-90">
              {currentShort.description}
            </p>
          )}

          <div className="text-[11px] text-amber-400 font-mono font-bold pt-0.5">
            ⚡ Shorts ({currentShort.durationSeconds} ثانية)
          </div>
        </div>
      </div>

      {/* Interactive Comments & Inquiries Modal */}
      {isCommentsOpen && currentShort && (
        <InteractiveCommentsSection
          targetId={currentShort.id}
          targetType="video"
          targetTitle={currentShort.title}
          isModal
          onClose={() => setIsCommentsOpen(false)}
        />
      )}
    </main>
  );
};

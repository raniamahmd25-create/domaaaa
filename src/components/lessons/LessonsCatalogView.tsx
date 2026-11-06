import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Heart, 
  Share2, 
  Plus, 
  Video as VideoIcon, 
  Clock, 
  User as UserIcon, 
  Check, 
  Bell, 
  Layers, 
  Sparkles,
  BookOpen,
  Camera,
  X,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { VideoItem, SUBJECTS } from '../../types';
import { VideoService } from '../../services/videoService';
import { StorageService } from '../../services/storage';
import { InteractiveCommentsSection } from '../comments/InteractiveCommentsSection';
import confetti from 'canvas-confetti';

interface LessonsCatalogViewProps {
  onOpenPublishVideo: () => void;
  onOpenPublisherProfile: (authorName: string) => void;
}

export const LessonsCatalogView: React.FC<LessonsCatalogViewProps> = ({
  onOpenPublishVideo,
  onOpenPublisherProfile,
}) => {
  const [lessons, setLessons] = useState<VideoItem[]>(() => VideoService.getLessons());
  const [activePlayingLesson, setActivePlayingLesson] = useState<VideoItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteLessonId, setConfirmDeleteLessonId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = VideoService.subscribe(() => {
      setLessons(VideoService.getLessons());
    });
    return () => unsubscribe();
  }, []);

  const handleToggleLike = (video: VideoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const isNowLiked = VideoService.toggleLike(video.id);
    if (isNowLiked) {
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
    }
  };

  const handleShare = async (video: VideoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: `شاهد درس: ${video.title} على منصة قلمي`,
          url,
        });
        return;
      } catch {}
    }
    navigator.clipboard.writeText(url);
    setCopiedId(video.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleSubscribe = (authorName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSub = StorageService.toggleSubscription(authorName);
    if (nextSub) {
      confetti({ particleCount: 40, spread: 70, origin: { y: 0.5 } });
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (lessons.length === 0) {
    return (
      <main className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-6 text-center font-['Cairo',sans-serif]">
        <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-inner">
          <VideoIcon className="w-10 h-10 stroke-[2.5]" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
          لا توجد دروس فيديو كاملة حالياً 📺
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
          يمكنك تجربة الدرس التعليمي التجريبي لاختبار المشغل، الشرح، والتعليقات التفاعلية، أو تسجيل ونشر درس جديد.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => VideoService.resetToDemoVideos()}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 stroke-[3]" />
            <span>عرض الدرس التجريبي 📺</span>
          </button>
          <button
            type="button"
            onClick={onOpenPublishVideo}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm shadow-lg hover:shadow-xl transition active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            <span>+ تسجيل ونشر أول درس كامل</span>
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-['Cairo',sans-serif] space-y-6">
      {/* Top Banner */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-5 rounded-3xl border border-indigo-200 dark:border-indigo-800/60">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>دروس الفيديو والشروحات الكاملة</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
              {lessons.length} درس
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            شروحات تفصيلية أطول من 3 دقائق مع عارض تفاعلي واستفسارات الطلاب
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => VideoService.resetToDemoVideos()}
            className="px-3.5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 font-black text-xs border border-amber-300 dark:border-amber-700/60 transition flex items-center gap-1.5 cursor-pointer"
            title="إعادة تعيين الدروس التجريبية"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>الدرس التجريبي 📺</span>
          </button>
          <button
            type="button"
            onClick={onOpenPublishVideo}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ نشر درس فيديو جديد</span>
          </button>
        </div>
      </header>


      {/* Grid of Lessons (YouTube Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {lessons.map((lesson) => {
          const isSubbed = StorageService.isSubscribed(lesson.author);
          return (
            <article
              key={lesson.id}
              onClick={() => setActivePlayingLesson(lesson)}
              className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
                <video
                  src={lesson.videoUrl}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition">
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </div>
                </div>

                {/* Duration Badge */}
                <span className="absolute bottom-2.5 end-2.5 px-2 py-0.5 rounded-lg bg-black/80 text-white font-mono text-[11px] font-bold">
                  {formatDuration(lesson.durationSeconds)}
                </span>

                <div className="absolute top-2.5 start-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-[10px] font-bold shadow-md">
                    درس كامل 📺
                  </span>
                  {lesson.id.startsWith('demo_') && (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black shadow-md">
                      تجريبي ⭐
                    </span>
                  )}
                </div>
              </div>

              {/* Lesson Details */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenPublisherProfile(lesson.author);
                      }}
                      className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <span>{lesson.author}</span>
                    </button>
                    <span className="text-[10px] text-slate-400">•</span>
                    <span className="text-[10px] text-slate-400">
                      {lesson.grade || 'الصف الخامس الابتدائي'}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    {lesson.title}
                  </h3>

                  {lesson.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed font-medium">
                      {lesson.description}
                    </p>
                  )}
                </div>

                {/* Bottom Actions: Likes, Share, Subscribe, Delete */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* Like button (Starts with 0 like YouTube) */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleLike(lesson, e)}
                      className={`flex items-center gap-1 text-xs font-bold transition ${
                        lesson.likedByUser ? 'text-rose-600' : 'text-slate-500 hover:text-rose-500'
                      }`}
                      title="إعجاب بالدرس"
                    >
                      <Heart className={`w-4 h-4 ${lesson.likedByUser ? 'fill-current' : ''}`} />
                      <span>{lesson.likesCount || 0}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleShare(lesson, e)}
                      className="text-slate-500 hover:text-indigo-600 text-xs font-bold transition flex items-center gap-1"
                      title="مشاركة الدرس"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{copiedId === lesson.id ? 'تم!' : 'مشاركة'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirmDeleteLessonId === lesson.id) {
                          VideoService.deleteVideo(lesson.id);
                          setConfirmDeleteLessonId(null);
                        } else {
                          setConfirmDeleteLessonId(lesson.id);
                          setTimeout(() => setConfirmDeleteLessonId(null), 3000);
                        }
                      }}
                      className={`text-xs transition p-1.5 rounded-lg flex items-center gap-1 cursor-pointer ${
                        confirmDeleteLessonId === lesson.id
                          ? 'bg-rose-600 text-white font-black animate-pulse'
                          : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={confirmDeleteLessonId === lesson.id ? 'اضغط مرة أخرى لتأكيد المسح' : 'مسح هذا الدرس'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {confirmDeleteLessonId === lesson.id && <span className="text-[10px]">تأكيد المسح؟</span>}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleToggleSubscribe(lesson.author, e)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                      isSubbed
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    {isSubbed ? 'مشترك ✓' : 'اشتراك 🔔'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>


      {/* Embedded Lesson Player Modal */}
      {activePlayingLesson && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in"
          onClick={() => setActivePlayingLesson(null)}
        >
          <div 
            className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Video Player */}
            <div className="relative aspect-video bg-black">
              <video
                src={activePlayingLesson.videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            {/* Modal Info Bar */}
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {activePlayingLesson.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <span>بواسطة {activePlayingLesson.author}</span>
                    <span>•</span>
                    <span>{activePlayingLesson.grade || 'الصف الخامس الابتدائي'}</span>
                    <span>•</span>
                    <span>المدة: {formatDuration(activePlayingLesson.durationSeconds)} دقيقة</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActivePlayingLesson(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {activePlayingLesson.description && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl">
                  {activePlayingLesson.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={(e) => handleToggleLike(activePlayingLesson, e)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black shadow-xs transition ${
                    activePlayingLesson.likedByUser
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${activePlayingLesson.likedByUser ? 'fill-current' : ''}`} />
                  <span>{activePlayingLesson.likesCount || 0} لايك</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const author = activePlayingLesson.author;
                    setActivePlayingLesson(null);
                    onOpenPublisherProfile(author);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md transition"
                >
                  زيارة قناة الناشر ↗
                </button>
              </div>

              {/* Interactive Student Inquiries & Comments below the Lesson */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <InteractiveCommentsSection
                  targetId={activePlayingLesson.id}
                  targetType="video"
                  targetTitle={activePlayingLesson.title}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

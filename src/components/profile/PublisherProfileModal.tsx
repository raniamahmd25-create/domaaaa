import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  ArrowRight,
  User as UserIcon, 
  Bell, 
  Check, 
  Share2, 
  Plus, 
  BookOpen, 
  GraduationCap, 
  Edit3, 
  Layers, 
  Star, 
  Sparkles,
  Calendar,
  Search,
  BookMarked,
  Trash2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Film,
  Video as VideoIcon,
  Play,
  Heart
} from 'lucide-react';
import { StudyDocument, UserProfile, getDocTypeInfo, SUBJECTS, SubjectId, DocumentType, VideoItem } from '../../types';
import { StorageService } from '../../services/storage';
import { VideoService } from '../../services/videoService';
import { InteractiveCommentsSection } from '../comments/InteractiveCommentsSection';
import confetti from 'canvas-confetti';

interface PublisherProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  publisherKey: string | null; // userId or author name
  allDocuments: StudyDocument[];
  onOpenDocument: (doc: StudyDocument) => void;
  onOpenPublishModal: () => void;
  onOpenEditProfile: () => void;
  onDeleteDocument?: (id: string) => void;
  currentUserId?: string;
  currentUserName?: string;
}

export const PublisherProfileModal: React.FC<PublisherProfileModalProps> = ({
  isOpen,
  onClose,
  publisherKey,
  allDocuments,
  onOpenDocument,
  onOpenPublishModal,
  onOpenEditProfile,
  onDeleteDocument,
  currentUserId,
  currentUserName,
}) => {
  if (!isOpen || !publisherKey) return null;

  // Resolve current active user profile
  const activeProfile = StorageService.getActiveProfile();

  const isMyProfile = Boolean(
    publisherKey === activeProfile.id || 
    publisherKey === activeProfile.name ||
    publisherKey === 'grade_5_student' ||
    (currentUserId && (publisherKey === currentUserId || publisherKey === activeProfile.id)) ||
    (currentUserName && (publisherKey === currentUserName || publisherKey === activeProfile.name))
  );

  // If it's my profile, use the live activeProfile to ensure instantaneous photo/name sync
  const profile: UserProfile = isMyProfile 
    ? activeProfile 
    : StorageService.getPublisherProfile(publisherKey);

  // Filter ALL real documents published by this author or user
  const publisherDocs = useMemo(() => {
    return allDocuments.filter((d) => {
      if (isMyProfile) {
        return (
          d.userId === activeProfile.id ||
          d.userId === 'grade_5_student' ||
          (currentUserId && d.userId === currentUserId) ||
          d.author === activeProfile.name ||
          (currentUserName && d.author === currentUserName) ||
          d.userId === publisherKey ||
          d.author === publisherKey ||
          (activeProfile.name && d.author && d.author.trim() === activeProfile.name.trim()) ||
          d.author === 'طالب' ||
          d.author === 'طالب متميز'
        );
      }
      return (
        d.userId === publisherKey ||
        d.author === profile.name ||
        (d.author && d.author.trim().toLowerCase() === publisherKey.trim().toLowerCase()) ||
        (profile.name && d.author && d.author.trim().toLowerCase() === profile.name.trim().toLowerCase())
      );
    });
  }, [allDocuments, isMyProfile, activeProfile, currentUserId, currentUserName, publisherKey, profile]);

  // Subscription state (strictly real counts, zero fake subscribers)
  const subscriptionTargetKey = profile.id || profile.name;
  const [isSubscribed, setIsSubscribed] = useState(() => StorageService.isSubscribed(subscriptionTargetKey));
  const [subscribersCount, setSubscribersCount] = useState(() => StorageService.getSubscribersCount(subscriptionTargetKey));
  const [copiedLink, setCopiedLink] = useState(false);

  // Filters within publisher's page
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<SubjectId | 'all'>('all');
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | 'all'>('all');
  const [docToDelete, setDocToDelete] = useState<StudyDocument | null>(null);
  const [selectedVideoForPlay, setSelectedVideoForPlay] = useState<VideoItem | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<VideoItem | null>(null);
  const [editingVideo, setEditingVideo] = useState<{ id: string; title: string; description?: string } | null>(null);

  // 3 Main Categories: Documents, Shorts, and Lessons ("المزكرات و ثاني صفحه هي shorts وثالث صفحه الدروس")
  const [publisherTab, setPublisherTab] = useState<'documents' | 'shorts' | 'lessons'>('documents');
  const [authorVideos, setAuthorVideos] = useState<VideoItem[]>(() => {
    return VideoService.getVideosByAuthor(publisherKey || profile.name);
  });

  useEffect(() => {
    const unsub = VideoService.subscribe(() => {
      setAuthorVideos(VideoService.getVideosByAuthor(publisherKey || profile.name));
    });
    return () => unsub();
  }, [publisherKey, profile.name]);

  const authorShorts = useMemo(() => authorVideos.filter((v) => v.type === 'shorts'), [authorVideos]);
  const authorLessons = useMemo(() => authorVideos.filter((v) => v.type === 'lesson'), [authorVideos]);

  // Esc key listener to exit full screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleToggleSubscribe = () => {
    const nextSubscribed = StorageService.toggleSubscription(subscriptionTargetKey);
    setIsSubscribed(nextSubscribed);
    setSubscribersCount(StorageService.getSubscribersCount(subscriptionTargetKey));

    if (nextSubscribed) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.4 } });
    }
  };

  const handleShareProfile = async () => {
    const url = `${window.location.origin}?publisher=${encodeURIComponent(profile.name)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `صفحة ${profile.name} - منصة قلمي التعليمية`,
          text: `تصفح جميع مذكرات ومراجعات واختبارات ${profile.name} على منصة قلمي`,
          url,
        });
        return;
      } catch {
        // fallback
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore
    }
  };

  // Filtered documents inside publisher page
  const filteredPublisherDocs = useMemo(() => {
    return publisherDocs.filter((d) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = d.title.toLowerCase().includes(q);
        const matchesDesc = d.description?.toLowerCase().includes(q);
        const matchesSubject = d.customSubjectName?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesSubject) return false;
      }
      if (selectedSubject !== 'all' && d.subject !== selectedSubject) {
        return false;
      }
      if (selectedDocType !== 'all' && d.docType !== selectedDocType) {
        return false;
      }
      return true;
    });
  }, [publisherDocs, searchQuery, selectedSubject, selectedDocType]);

  const totalPagesCount = useMemo(() => {
    return publisherDocs.reduce((acc, d) => acc + (d.pages?.length || 0), 0);
  }, [publisherDocs]);

  const handleDeleteConfirmed = () => {
    if (!docToDelete) return;
    if (onDeleteDocument) {
      onDeleteDocument(docToDelete.id);
    } else {
      StorageService.deleteDocument(docToDelete.id);
    }
    setDocToDelete(null);
  };

  return (
    <div className="fixed inset-0 z-50 w-full h-full min-h-screen bg-white dark:bg-[#060913] text-slate-900 dark:text-slate-100 overflow-y-auto flex flex-col font-['Cairo',sans-serif] animate-in fade-in duration-200 transition-colors">
      {/* 1. TOP STICKY APP BAR (Full Screen Header & Navigation) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#080d19]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#172033] px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Back button to return to main library */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-black text-xs sm:text-sm transition-all shadow-xs active:scale-95 cursor-pointer"
            title="العودة إلى المكتبة الرئيسية (Esc)"
          >
            <ArrowRight className="w-4 h-4 text-amber-500 stroke-[3]" />
            <span>العودة للمكتبة الرئيسية</span>
            <span className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 font-mono">
              Esc
            </span>
          </button>

          {/* Center Title */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">الصفحة الشخصية:</span>
            <span className="text-sm font-black text-slate-900 dark:text-white max-w-[200px] truncate">
              {profile.name}
            </span>
            {isMyProfile && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black">
                صفحتي
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {isMyProfile ? (
              <>
                <button
                  type="button"
                  onClick={onOpenEditProfile}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                  title="تعديل بيانات الحساب والصورة الشخصية"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">تعديل الحساب</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenPublishModal}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs sm:text-sm shadow-md transition active:scale-95 cursor-pointer"
                  title="نشر مذكرة أو كتاب جديد"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>نشر جديد</span>
                </button>
              </>
            ) : (
              <>
                {/* Real Subscribe Button */}
                <button
                  type="button"
                  onClick={handleToggleSubscribe}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all shadow-md active:scale-95 cursor-pointer ${
                    isSubscribed
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950'
                  }`}
                  title={isSubscribed ? 'إلغاء الاشتراك' : 'اشتراك في الصفحة لتلقي الإشعارات'}
                >
                  {isSubscribed ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>مشترك في الصفحة ✓</span>
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 fill-slate-950 animate-bounce" />
                      <span>اشتراك في الصفحة 🔔</span>
                    </>
                  )}
                </button>

                {/* Share Button */}
                <button
                  type="button"
                  onClick={handleShareProfile}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                  title="مشاركة رابط الصفحة الشخصية"
                >
                  {copiedLink ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Share2 className="w-4 h-4" />
                  )}
                </button>
              </>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="إغلاق الصفحة والعودة للمكتبة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. FULL-SCREEN HERO BANNER & AUTHOR PROFILE */}
      <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 pt-8 pb-16 px-4 sm:px-6 lg:px-8 shrink-0 overflow-hidden shadow-lg">
        {/* Background decorative motifs */}
        <div className="absolute inset-0 opacity-10 pointer-events-none flex justify-around items-center">
          <BookOpen className="w-64 h-64 -translate-y-10 rotate-12" />
          <GraduationCap className="w-72 h-72 translate-y-12 -rotate-12" />
          <Sparkles className="w-48 h-48 -translate-y-6" />
        </div>

        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-right">
            {/* Large Avatar Photo */}
            <div className="relative shrink-0">
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.name}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-white dark:border-slate-900 shadow-2xl bg-white"
                />
              ) : (
                <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr ${profile.avatarColor || 'from-amber-600 to-orange-700'} text-slate-950 flex items-center justify-center font-black text-4xl sm:text-5xl border-4 border-white dark:border-slate-900 shadow-2xl`}>
                  {(profile.name || 'ط')[0]}
                </div>
              )}

              {/* Role badge */}
              <span className="absolute -bottom-2 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-auto sm:-left-2 px-3 py-0.5 rounded-full bg-slate-950 text-amber-300 text-xs font-black border border-amber-400 shadow-md flex items-center gap-1">
                {profile.role === 'teacher' ? '👨‍🏫 معلم معتمد' : '🎓 طالب ناشر'}
              </span>
            </div>

            {/* Name, Grade, and Bio */}
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 drop-shadow-xs">
                  {profile.name}
                </h1>
                {isMyProfile && (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-300 text-xs font-black shadow-xs">
                    (صفحتي الشخصية)
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full bg-slate-950/20 backdrop-blur-xs text-slate-950 text-xs font-black border border-slate-950/20 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-950" />
                  <span>ناشر موثوق في منصة قلمي</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm font-extrabold text-slate-900/90 mt-1.5">
                <span>{profile.grade || 'الصف الخامس الابتدائي'}</span>
                <span>•</span>
                <span>
                  {profile.role === 'teacher' 
                    ? 'إعداد المناهج والمذكرات ونماذج الامتحانات المعتمدة' 
                    : 'نشر ومشاركة الملازم والملخصات والحلول النموذجية'}
                </span>
              </div>

              {profile.bio && (
                <p className="text-xs sm:text-sm text-slate-900/80 font-medium mt-2 max-w-2xl leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Action on Hero */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
            {isMyProfile ? (
              <>
                <button
                  type="button"
                  onClick={onOpenEditProfile}
                  className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4 text-amber-600" />
                  <span>تعديل الاسم والصورة</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenPublishModal}
                  className="px-5 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-900 text-amber-300 font-black text-xs shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ نشر مذكرة أو كتاب</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleToggleSubscribe}
                  className={`px-5 py-2.5 rounded-2xl font-black text-xs shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                    isSubscribed 
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white' 
                      : 'bg-slate-950 hover:bg-slate-900 text-amber-300'
                  }`}
                >
                  {isSubscribed ? <Check className="w-4 h-4 stroke-[3]" /> : <Bell className="w-4 h-4" />}
                  <span>
                    {isSubscribed 
                      ? 'مشترك في الصفحة ✓' 
                      : subscribersCount === 0 
                      ? 'اشتراك في الصفحة 🔔 (كن أول المشتركين!)' 
                      : 'اشتراك في الصفحة 🔔'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleShareProfile}
                  className="px-3.5 py-2.5 rounded-2xl bg-white/90 hover:bg-white text-slate-950 font-black text-xs shadow-md transition cursor-pointer flex items-center gap-1"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{copiedLink ? 'تم النسخ!' : 'مشاركة'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. KEY METRICS STATS BAR (Real subscriber numbers only, 0 fake) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Total Documents Published */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي المنشورات</div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {publisherDocs.length} <span className="text-xs text-slate-400 font-normal">مذكرة</span>
              </div>
            </div>
          </div>

          {/* 2. Real Subscribers Count (STRICTLY REAL: 0 fake, explicitly 'صفر مشتركون' on new pages) */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">المشتركون الحقيقيون</div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {subscribersCount === 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-black">صفر مشتركون</span>
                ) : (
                  <span>{subscribersCount} <span className="text-xs text-slate-400 font-normal">مشترك</span></span>
                )}
              </div>
              {subscribersCount === 0 && (
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                  🌱 صفحة جديدة (0 مشتركون)
                </div>
              )}
            </div>
          </div>

          {/* 3. Total Pages Count */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي الصفحات المتاحة</div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {totalPagesCount} <span className="text-xs text-slate-400 font-normal">صفحة</span>
              </div>
            </div>
          </div>

          {/* 4. Rating & Quality */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 fill-purple-500 text-purple-500" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">التقييم العام</div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-1">
                <span>5.0</span>
                <span className="text-xs text-amber-500 font-extrabold">★★★★★</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 3 MAIN PUBLISHER CATEGORY TABS ("المزكرات و ثاني صفحه هي shorts وثالث صفحه الدروس") */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full">
        <div className="grid grid-cols-3 gap-2 bg-slate-200/80 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-inner">
          <button
            type="button"
            onClick={() => setPublisherTab('documents')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              publisherTab === 'documents'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>1. المذكرات ({publisherDocs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setPublisherTab('shorts')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              publisherTab === 'shorts'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>2. Shorts 🎬 ({authorShorts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setPublisherTab('lessons')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              publisherTab === 'lessons'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <VideoIcon className="w-4 h-4" />
            <span>3. الدروس 📺 ({authorLessons.length})</span>
          </button>
        </div>
      </div>

      {/* 5. CONTENT SECTIONS ACCORDING TO ACTIVE TAB */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        {publisherTab === 'documents' && (
          <>
            {/* Section Header with Search and Filter bar */}
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <BookMarked className="w-5 h-5 text-amber-500" />
                    <span>
                      {isMyProfile 
                        ? 'جميع المذكرات والكتب التي قمت بنشرها' 
                        : `مذكرات وكتب ${profile.name}`}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black">
                      {filteredPublisherDocs.length} من {publisherDocs.length}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    تصفح واقرأ وافتح كل مذكرات هذا الناشر مع أدوات القلم والحل الذكي
                  </p>
                </div>

            {/* In-page Search Box */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في مذكرات هذا الناشر..."
                className="w-full pr-10 pl-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills for Subjects & Doc Types */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 ml-1">تصفية المادة:</span>
            <button
              type="button"
              onClick={() => setSelectedSubject('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedSubject === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              جميع المواد ({publisherDocs.length})
            </button>
            {SUBJECTS.map((s) => {
              const count = publisherDocs.filter((d) => d.subject === s.id).length;
              if (count === 0) return null;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSubject(s.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    selectedSubject === s.id
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{s.nameAr}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. DOCUMENTS GRID */}
        {filteredPublisherDocs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            {publisherDocs.length === 0 ? (
              <>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-1">
                  {isMyProfile 
                    ? 'لم تقم بنشر أي مذكرات حتى الآن' 
                    : `لم يقم ${profile.name} بنشر أي مذكرات حتى الآن`}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5">
                  {isMyProfile 
                    ? 'يمكنك الآن رفع أول كتاب أو مذكرة كملف PDF أو صور واستخدام القلم الإلكتروني الذكي!' 
                    : 'تابع هذه الصفحة لتصلك إشعارات وتنبيهات فور نشر أي كتب أو ملازم جديدة.'}
                </p>
                {isMyProfile && (
                  <button
                    type="button"
                    onClick={onOpenPublishModal}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>نشر أول مذكرة الآن</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
                  لا توجد مذكرات تطابق شروط البحث أو التصفية
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  جرب تغيير كلمات البحث أو اختيار مادة تعليمية أخرى
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSubject('all');
                    setSelectedDocType('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer"
                >
                  إعادة ضبط التصفية
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredPublisherDocs.map((doc) => {
              const subject = SUBJECTS.find((s) => s.id === doc.subject) || SUBJECTS[0];
              const docTypeInfo = getDocTypeInfo(doc.docType);
              const firstPage = doc.pages[0];

              return (
                <div
                  key={doc.id}
                  className="doc-card group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs hover:border-amber-400/80 dark:hover:border-amber-500/70 transition-all duration-300 flex flex-col"
                >
                  {/* Thumbnail Cover */}
                  <div
                    onClick={() => {
                      onClose();
                      onOpenDocument(doc);
                    }}
                    className="relative aspect-4/3 bg-slate-100 dark:bg-slate-950 overflow-hidden cursor-pointer"
                  >
                    {firstPage ? (
                      <img
                        src={firstPage.imageUrl}
                        alt={doc.title}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <BookOpen className="w-12 h-12" />
                      </div>
                    )}

                    {/* Smooth Hover Floating Indicator */}
                    <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center pointer-events-none">
                      <span className="px-3.5 py-1.5 rounded-2xl bg-amber-500/95 text-slate-950 text-xs font-black shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>فتح المذكرة 📖</span>
                      </span>
                    </div>

                    {/* Page count pill */}
                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[10px] font-black flex items-center gap-1 shadow-sm">
                      <BookOpen className="w-3 h-3 text-amber-400" />
                      <span>{doc.pages.length} ص</span>
                    </span>

                    {/* Subject badge top right */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black shadow-xs ${subject.badgeColor}`}>
                        {doc.customSubjectName || subject.nameAr}
                      </span>
                    </div>

                    {/* Doc Type badge top left */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black border shadow-xs ${docTypeInfo.badgeBg} ${docTypeInfo.badgeText} ${docTypeInfo.badgeBorder}`}>
                        {docTypeInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3
                        onClick={() => {
                          onClose();
                          onOpenDocument(doc);
                        }}
                        className="font-black text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-amber-500 transition cursor-pointer"
                        title={doc.title}
                      >
                        {doc.title}
                      </h3>

                      {doc.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 font-medium leading-relaxed">
                          {doc.description}
                        </p>
                      )}

                      {/* Extra Details Drawer on hover */}
                      <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out">
                        <div className="overflow-hidden">
                          <div className="pt-2 pb-1 flex flex-wrap items-center gap-1 text-[9px] font-bold border-t border-dashed border-amber-300/40 dark:border-amber-800/40 mt-2 bg-amber-50/50 dark:bg-amber-950/30 p-1.5 rounded-xl text-slate-600 dark:text-slate-300">
                            <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 shadow-2xs">
                              ⏱️ {Math.max(5, doc.pages.length * 3)} د مذاكرة
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 shadow-2xs">
                              ✍️ جاهز للحل
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metadata line */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {doc.term === 'term1' ? 'ترم أول' : doc.term === 'term2' ? 'ترم ثاني' : 'عام كامل'}
                        </span>
                        <span>•</span>
                        <span>{doc.grade || 'الصف الخامس'}</span>
                      </div>

                      <div className="flex items-center gap-1 text-amber-500 font-extrabold">
                        <Star className="w-3 h-3 fill-current" />
                        <span>5.0</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenDocument(doc);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <BookOpen className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>قراءة وتدوين ✏️</span>
                      </button>

                      {isMyProfile && (
                        <button
                          type="button"
                          onClick={() => setDocToDelete(doc)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="حذف هذه المذكرة من المنشورات"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    )}

    {/* TAB 2: SHORTS */}
    {publisherTab === 'shorts' && (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-rose-500" />
              <span>فيديوهات Shorts القصيرة ({authorShorts.length})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              فيديوهات تعليمية سريعة وموجزة (مدتها 3 دقائق أو أقل)
            </p>
          </div>
          {isMyProfile && (
            <button
              type="button"
              onClick={onOpenPublishModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>تسجيل أو نشر Shorts</span>
            </button>
          )}
        </div>

        {authorShorts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <Film className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
              {isMyProfile ? 'لم تقم بنشر أي فيديوهات Shorts قصيرة بعد' : `لم ينشر ${profile.name} أي فيديوهات Shorts`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5">
              {isMyProfile 
                ? 'سجّل فيديو بكاميرا الموبايل مع الفلاتر وتفعيل الكشاف، أو ارفع فيديو قصير مدته 3 دقائق أو أقل ليصنفه الموقع تلقائياً كـ Shorts!'
                : 'تابع القناة لتصلك الفيديوهات القصيرة والشروحات السريعة فور نشرها.'}
            </p>
            {isMyProfile && (
              <button
                type="button"
                onClick={onOpenPublishModal}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition inline-flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ تسجيل ونشر أول Shorts</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {authorShorts.map((short) => (
              <div
                key={short.id}
                className="group relative bg-slate-900 rounded-3xl overflow-hidden aspect-[9/15] flex flex-col justify-between p-3.5 shadow-lg border border-slate-800 hover:border-rose-500 transition-all cursor-pointer"
                onClick={() => setSelectedVideoForPlay(short)}
              >
                {/* Video Element Thumbnail */}
                <video
                  src={short.videoUrl}
                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 group-hover:opacity-95 transition-all duration-300 pointer-events-none"
                  playsInline
                  muted
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 pointer-events-none" />

                {/* Top Overlay Badge */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-black text-[10px] flex items-center gap-1 shadow-sm">
                    <Film className="w-3 h-3" />
                    <span>Shorts</span>
                  </span>
                  <span className="text-[10px] font-mono text-white/90 bg-black/60 px-1.5 py-0.5 rounded-md">
                    {Math.floor(short.durationSeconds / 60)}:{(short.durationSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                {/* Center Play Button Overlay */}
                <div className="relative z-10 self-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-600 transition shadow-lg">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>

                {/* Bottom Overlay Title, Likes, and Management */}
                <div className="relative z-10 space-y-2">
                  <h3 className="text-white font-black text-xs line-clamp-2 leading-tight drop-shadow-sm">
                    {short.title}
                  </h3>
                  {short.description && (
                    <p className="text-white/70 text-[10px] line-clamp-1 leading-snug">
                      {short.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-white/20 text-[10px] text-white/80">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                      <span className="font-bold">{short.likesCount || 0}</span>
                    </span>

                    {isMyProfile && (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setEditingVideo({ id: short.id, title: short.title, description: short.description })}
                          className="p-1 rounded-md bg-white/20 hover:bg-white/40 text-white transition"
                          title="تعديل العنوان والوصف"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setVideoToDelete(short)}
                          className="p-1 rounded-md bg-rose-600/80 hover:bg-rose-600 text-white transition"
                          title="حذف هذا الفيديو"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    {/* TAB 3: LESSONS (YouTube-style videos longer than 3 minutes) */}
    {publisherTab === 'lessons' && (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <VideoIcon className="w-5 h-5 text-indigo-500" />
              <span>دروس الفيديو والشروحات الكاملة ({authorLessons.length})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              شروحات وافية ومفصلة للمناهج والدروس (أطول من 3 دقائق)
            </p>
          </div>
          {isMyProfile && (
            <button
              type="button"
              onClick={onOpenPublishModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>تسجيل أو رفع درس جديد</span>
            </button>
          )}
        </div>

        {authorLessons.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center mx-auto mb-3">
              <VideoIcon className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
              {isMyProfile ? 'لم تقم بنشر أي دروس فيديو حتى الآن' : `لم ينشر ${profile.name} أي دروس فيديو`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5">
              {isMyProfile 
                ? 'ارفع أو سجّل درساً مدته أطول من 3 دقائق وسيصنفه الموقع تلقائياً من الدروس الطويلة الكاملة!'
                : 'تابع القناة لتشاهد الحصص والدروس التعليمية والشروحات النموذجية.'}
            </p>
            {isMyProfile && (
              <button
                type="button"
                onClick={onOpenPublishModal}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition inline-flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ نشر أول درس فيديو</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {authorLessons.map((lesson) => {
              const minutes = Math.floor(lesson.durationSeconds / 60);
              const seconds = lesson.durationSeconds % 60;

              return (
                <div
                  key={lesson.id}
                  className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col cursor-pointer"
                  onClick={() => setSelectedVideoForPlay(lesson)}
                >
                  {/* 16:9 Thumbnail preview */}
                  <div className="relative aspect-video bg-slate-950 overflow-hidden">
                    <video
                      src={lesson.videoUrl}
                      className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
                      playsInline
                      muted
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>

                    <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/80 text-white text-[11px] font-mono font-bold">
                      {minutes}:{seconds.toString().padStart(2, '0')}
                    </span>
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-[10px] font-black">
                      درس كامل
                    </span>
                  </div>

                  {/* Body Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-black text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                        {lesson.title}
                      </h3>
                      {lesson.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {lesson.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 font-bold">
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                        <span>{lesson.likesCount || 0} إعجاب</span>
                      </div>

                      {isMyProfile && (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setEditingVideo({ id: lesson.id, title: lesson.title, description: lesson.description })}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="تعديل الدرس"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setVideoToDelete(lesson)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="حذف الدرس"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}
  </div>

  {/* 6. CONFIRM DELETE DIALOG FOR DOCUMENTS */}
  {docToDelete && (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-['Cairo',sans-serif] animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
            تأكيد حذف المذكرة؟
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            هل أنت متأكد من رغبتك في حذف مذكرة &quot;{docToDelete.title}&quot;؟
          </p>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setDocToDelete(null)}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleDeleteConfirmed}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition cursor-pointer"
          >
            تأكيد الحذف
          </button>
        </div>
      </div>
    </div>
  )}

  {/* 7. CONFIRM DELETE DIALOG FOR VIDEOS */}
  {videoToDelete && (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-['Cairo',sans-serif] animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
            تأكيد حذف الفيديو؟
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            هل أنت متأكد من حذف &quot;{videoToDelete.title}&quot;؟ سيتم حذفه من المنصة نهائياً.
          </p>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setVideoToDelete(null)}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => {
              VideoService.deleteVideo(videoToDelete.id);
              setVideoToDelete(null);
            }}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition cursor-pointer"
          >
            تأكيد الحذف
          </button>
        </div>
      </div>
    </div>
  )}

  {/* 8. EDIT VIDEO MODAL */}
  {editingVideo && (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-['Cairo',sans-serif] animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-right">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-amber-500" />
            <span>تعديل بيانات الفيديو</span>
          </h3>
          <button
            type="button"
            onClick={() => setEditingVideo(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              عنوان الفيديو:
            </label>
            <input
              type="text"
              value={editingVideo.title}
              onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              وصف الفيديو:
            </label>
            <textarea
              rows={3}
              value={editingVideo.description || ''}
              onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setEditingVideo(null)}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => {
              VideoService.updateVideo(editingVideo.id, {
                title: editingVideo.title,
                description: editingVideo.description,
              });
              setEditingVideo(null);
            }}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md"
          >
            حفظ التعديلات
          </button>
        </div>
      </div>
    </div>
  )}

  {/* 9. VIDEO PLAYBACK MODAL */}
  {selectedVideoForPlay && (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md font-['Cairo',sans-serif] animate-in fade-in duration-200"
      onClick={() => setSelectedVideoForPlay(null)}
    >
      <div
        className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3.5 bg-slate-950/80 border-b border-slate-800 text-white">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-xs">
              {selectedVideoForPlay.type === 'shorts' ? 'Shorts 🎬' : 'درس فيديو 📺'}
            </span>
            <h3 className="font-bold text-sm truncate max-w-md">{selectedVideoForPlay.title}</h3>
          </div>
          <button
            type="button"
            onClick={() => setSelectedVideoForPlay(null)}
            className="p-1 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative aspect-video max-h-[70vh] bg-black flex items-center justify-center">
          <video
            src={selectedVideoForPlay.videoUrl}
            controls
            autoPlay
            className="max-h-full max-w-full object-contain"
          />
        </div>

        <div className="p-4 bg-slate-950 text-white flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-slate-400 font-bold">بواسطة: {selectedVideoForPlay.author}</div>
            {selectedVideoForPlay.description && (
              <p className="text-xs text-slate-300 mt-1 max-w-xl">{selectedVideoForPlay.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              VideoService.toggleLike(selectedVideoForPlay.id);
              setSelectedVideoForPlay({
                ...selectedVideoForPlay,
                likesCount: (selectedVideoForPlay.likesCount || 0) + (selectedVideoForPlay.likedByUser ? -1 : 1),
                likedByUser: !selectedVideoForPlay.likedByUser,
              });
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
              selectedVideoForPlay.likedByUser
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Heart className={`w-4 h-4 ${selectedVideoForPlay.likedByUser ? 'fill-current' : ''}`} />
            <span>{selectedVideoForPlay.likesCount || 0} إعجاب</span>
          </button>
        </div>

        {/* Student Inquiries & Comments Section */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 max-h-72 overflow-y-auto">
          <InteractiveCommentsSection
            targetId={selectedVideoForPlay.id}
            targetType="video"
            targetTitle={selectedVideoForPlay.title}
          />
        </div>
      </div>
    </div>
  )}
</div>
);
};

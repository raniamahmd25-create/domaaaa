import React, { useState, useMemo } from 'react';
import { 
  StudyDocument, 
  SubjectId, 
  DocumentType, 
  PublishFormat, 
  SUBJECTS, 
  DOC_TYPES,
  getDocTypeInfo 
} from '../../types';
import { 
  Search, 
  BookOpen, 
  FileText, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Star, 
  Edit3, 
  Sparkles,
  Layers,
  GraduationCap,
  Share2,
  Check,
  Printer,
  MessageSquare,
  Bell,
  Book,
  User as UserIcon,
  Users
} from 'lucide-react';
import { StudyReminder, EDUCATIONAL_GRADES } from '../../types';
import { QuickReminderWidget } from '../reminders/QuickReminderWidget';
import { DocumentCommentsModal } from './DocumentCommentsModal';
import { NotificationService } from '../../services/notificationService';
import { NotificationPermissionModal } from '../notifications/NotificationPermissionModal';
import { PublisherProfileModal } from '../profile/PublisherProfileModal';
import { WeeklyProgressWidget } from '../analytics/WeeklyProgressWidget';
import { StorageService } from '../../services/storage';
import { User } from 'firebase/auth';
import confetti from 'canvas-confetti';

interface LibraryViewProps {
  documents: StudyDocument[];
  onOpenDocument: (doc: StudyDocument) => void;
  onOpenPublishModal: () => void;
  onDeleteDocument: (docId: string) => void;
  onToggleFavorite: (docId: string) => void;
  onLoadSampleExam: () => void;
  reminders?: StudyReminder[];
  onOpenRemindersModal?: () => void;
  onQuickToggleComplete?: (id: string) => void;
  currentUser?: User | null;
  onDocumentUpdated?: (doc: StudyDocument) => void;
  onOpenPublisherProfile?: (publisherKey: string) => void;
  onOpenEditProfile?: () => void;
  onOpenStudyProgress?: () => void;
  initialSubject?: SubjectId | 'all';
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  documents,
  onOpenDocument,
  onOpenPublishModal,
  onDeleteDocument,
  onToggleFavorite,
  onLoadSampleExam,
  reminders = [],
  onOpenRemindersModal,
  onQuickToggleComplete,
  currentUser,
  onDocumentUpdated,
  onOpenPublisherProfile,
  onOpenEditProfile,
  onOpenStudyProgress,
  initialSubject,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<SubjectId | 'all'>(() => initialSubject || 'all');

  React.useEffect(() => {
    if (initialSubject) {
      setSelectedSubject(initialSubject);
    }
  }, [initialSubject]);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | 'all'>('all');
  const [selectedFormat, setSelectedFormat] = useState<PublishFormat | 'all'>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'title'>('latest');
  const [filterBySubscriptions, setFilterBySubscriptions] = useState<boolean>(false);
  const [internalPublisherKey, setInternalPublisherKey] = useState<string | null>(null);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const [commentingDoc, setCommentingDoc] = useState<StudyDocument | null>(null);

  // Site Study Notifications State
  const [notifPermission, setNotifPermission] = useState<string>(() => NotificationService.getPermissionStatus());
  const [notifNoticeMessage, setNotifNoticeMessage] = useState<string | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const handleActivateSiteNotifications = () => {
    setShowPermissionModal(true);
  };

  const handleSendTestStudyNotification = () => {
    NotificationService.sendTestNotification();
    setNotifNoticeMessage('تم إرسال إشعار مذاكرة تجريبي بنجاح! 🌟');
    setTimeout(() => setNotifNoticeMessage(null), 4000);
  };

  const handleShareDoc = async (e: React.MouseEvent, doc: StudyDocument) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}?doc=${doc.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: doc.title,
          text: `مذكرة ${doc.title} - منصة قلمي للصف الخامس الابتدائي`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedDocId(doc.id);
      setTimeout(() => {
        setCopiedDocId((curr) => (curr === doc.id ? null : curr));
      }, 2500);
    } catch {
      // Fallback
    }
  };

  // Subscribed Documents Count
  const subscribedDocsCount = useMemo(() => {
    return documents.filter((doc) => StorageService.isSubscribed(doc.userId || doc.author)).length;
  }, [documents]);

  // Filtered and Sorted Documents (Grade 5 focus, without user accounts)
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Subscriptions Filter (المشترَك فيها)
      if (filterBySubscriptions) {
        const isSub = StorageService.isSubscribed(doc.userId || doc.author);
        if (!isSub) return false;
      }

      // Keyword Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(q);
        const matchesAuthor = doc.author?.toLowerCase().includes(q);
        const matchesDesc = doc.description?.toLowerCase().includes(q);
        const matchesTags = doc.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesSubject = SUBJECTS.find((s) => s.id === doc.subject)?.nameAr.toLowerCase().includes(q);
        if (!matchesTitle && !matchesAuthor && !matchesDesc && !matchesTags && !matchesSubject) {
          return false;
        }
      }

      // Educational Grade Filter
      if (selectedGrade !== 'all' && doc.grade !== selectedGrade) {
        return false;
      }

      // Subject Filter
      if (selectedSubject !== 'all' && doc.subject !== selectedSubject) {
        return false;
      }

      // Document Type Filter
      if (selectedDocType !== 'all' && doc.docType !== selectedDocType) {
        return false;
      }

      // Format Filter (images or files)
      if (selectedFormat !== 'all' && doc.format !== selectedFormat) {
        return false;
      }

      // Date Filter
      if (selectedDateFilter !== 'all') {
        const docDate = new Date(doc.createdAt).getTime();
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        if (selectedDateFilter === 'today' && now - docDate > dayMs) return false;
        if (selectedDateFilter === 'week' && now - docDate > 7 * dayMs) return false;
        if (selectedDateFilter === 'month' && now - docDate > 30 * dayMs) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'title') return a.title.localeCompare(b.title, 'ar');
      return 0;
    });
  }, [documents, searchQuery, selectedGrade, selectedSubject, selectedDocType, selectedFormat, selectedDateFilter, sortBy, filterBySubscriptions]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-['Cairo',sans-serif]">
      {/* 1. Filter Bar (5 Selects in a single rounded card as in screenshot) */}
      <form 
        role="search" 
        aria-label="تصفية مذكرات ومواد الصف الخامس" 
        onSubmit={(e) => e.preventDefault()} 
        className="bg-white dark:bg-[#0c1222] rounded-2xl p-2.5 shadow-sm border border-slate-200 dark:border-[#1a233a] mb-8 transition-colors duration-200"
      >
        <fieldset className="border-0 p-0 m-0">
          <legend className="sr-only">تصفية المواد والمذكرات</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
            {/* Filter by Educational Grade */}
            <div>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-[#1e2a45] text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none font-bold transition-colors duration-200"
              >
                <option value="all">جميع المراحل والسنوات</option>
                {EDUCATIONAL_GRADES.map((g) => (
                  <option key={g.id} value={g.nameAr}>
                    {g.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Document Type */}
            <div>
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-[#1e2a45] text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none font-medium transition-colors duration-200"
              >
                <option value="all">الكل (حل، مراجعة، كتاب كامل)</option>
                {DOC_TYPES.map((dt) => (
                  <option key={dt.id} value={dt.id}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Format */}
            <div>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-[#1e2a45] text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none font-medium transition-colors duration-200"
              >
                <option value="all">جميع الصيغ (ملفات وصور)</option>
                <option value="files">ملفات PDF فقط</option>
                <option value="images">صور ومسح ضوئي فقط</option>
              </select>
            </div>

            {/* Filter by Date */}
            <div>
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-[#1e2a45] text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none font-medium transition-colors duration-200"
              >
                <option value="all">جميع التواريخ</option>
                <option value="today">المضافة اليوم</option>
                <option value="week">خلال هذا الأسبوع</option>
                <option value="month">خلال هذا الشهر</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-[#111a2e] border border-slate-200 dark:border-[#1e2a45] text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none font-medium transition-colors duration-200"
              >
                <option value="latest">الأحدث إضافة أولاً</option>
                <option value="oldest">الأقدم أولاً</option>
                <option value="title">أبجدياً حسب العنوان</option>
              </select>
            </div>
          </div>
        </fieldset>
      </form>

      {/* 5. Documents Grid (Semantic Section) */}
      <section aria-label="مذكرات وكتب الصف الخامس الابتدائي">
      {filteredDocuments.length === 0 ? (
        filterBySubscriptions ? (
          <div className="bg-white dark:bg-[#0c1222] rounded-3xl p-10 text-center border border-slate-200 dark:border-[#1a233a] shadow-sm max-w-xl mx-auto transition-colors duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-[#06241b] text-emerald-600 dark:text-[#34d399] flex items-center justify-center mx-auto mb-3 border border-emerald-200/50 dark:border-[#0d4a36]">
              <Bell className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
              لم تشترك في أي صفحات أو معلمين حتى الآن
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              تصفح مذكرات وكتب المكتبة، واضغط على زر (زيارة الصفحة 👤) أعلى أي مذكرة للاشتراك ومتابعة كل ما ينشره المعلم فوراً دون صفحات مزيفة!
            </p>
            <button
              type="button"
              onClick={() => setFilterBySubscriptions(false)}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition shadow-sm cursor-pointer active:scale-95"
            >
              عرض جميع المذكرات المتاحة ({documents.length})
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0c1222] rounded-3xl p-12 text-center border border-slate-200 dark:border-[#1a233a] shadow-sm max-w-2xl mx-auto transition-colors duration-200">
            <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-[#281e0f] text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-200/50 dark:border-[#473010]">
              <BookOpen className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              مكتبة الصف الخامس جاهزة لبدء مذاكرتك
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
              لم تقم بنشر أي مذكرات أو كتب حتى الآن. يمكنك رفع ملفاتك وصورك الخاصة، أو تجربة نموذج جاهز لاختبارات اللغة العربية للصف الخامس.
            </p>

            <div className="flex flex-col items-center justify-center gap-3">
              <button
                type="button"
                onClick={onOpenPublishModal}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>نشر أول مذكرة أو كتاب الآن</span>
              </button>

              <button
                type="button"
                onClick={onLoadSampleExam}
                className="px-6 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-[#131b2e] dark:hover:bg-[#18233d] dark:border dark:border-[#1e2a45] text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>تجربة نموذج (كتاب الامتحان للصف الخامس)</span>
              </button>
            </div>
          </div>
        )
      ) : (
        <ul role="list" aria-label="قائمة مذكرات وكتب الصف الخامس" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0 m-0">
          {filteredDocuments.map((doc) => {
            const subject = SUBJECTS.find((s) => s.id === doc.subject) || SUBJECTS[0];
            const docTypeInfo = getDocTypeInfo(doc.docType);
            const firstPage = doc.pages[0];

            // Resolve publisher stats for this document
            const authorKey = doc.userId || doc.author || 'ناشر';
            const pubProfile = StorageService.getPublisherProfile(authorKey);
            const isAuthorSubscribed = StorageService.isSubscribed(pubProfile.id || pubProfile.name);
            const authorSubCount = StorageService.getSubscribersCount(pubProfile.id || pubProfile.name);
            const activeProf = StorageService.getActiveProfile();
            const isMe = authorKey === activeProf.id || authorKey === activeProf.name || authorKey === 'grade_5_student' || (currentUser?.uid && authorKey === currentUser.uid);
            const authorDocCount = documents.filter((d) => {
              if (isMe) {
                return (
                  d.userId === activeProf.id ||
                  d.userId === 'grade_5_student' ||
                  (currentUser?.uid && d.userId === currentUser.uid) ||
                  d.author === activeProf.name ||
                  d.author === 'طالب' ||
                  d.author === 'طالب متميز'
                );
              }
              return d.userId === authorKey || d.author === pubProfile.name;
            }).length;

            return (
              <li key={doc.id} className="list-none p-0 m-0 flex flex-col">
                <article
                  aria-label={doc.title}
                  className="doc-card group relative bg-white dark:bg-[#0c1222] rounded-3xl border border-slate-200/90 dark:border-[#1a233a] overflow-hidden shadow-xs hover:border-amber-400/80 dark:hover:border-amber-500/70 transition-all duration-300 flex flex-col flex-1"
                >
                  {/* 👤 زر أعلى المذكرة يعرض الصفحة الشخصية للناشر (كام منشور وكام مشترك) */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenPublisherProfile) {
                        onOpenPublisherProfile(authorKey);
                      } else {
                        setInternalPublisherKey(authorKey);
                      }
                    }}
                  className="px-4 py-2.5 bg-slate-50/90 dark:bg-[#0e1628] hover:bg-amber-50/80 dark:hover:bg-[#152038] border-b border-slate-100 dark:border-[#1a233a] flex items-center justify-between transition cursor-pointer select-none"
                  title={`زيارة الصفحة الشخصية لـ ${pubProfile.name} (عرض المنشورات والمشتركين)`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {pubProfile.photoURL ? (
                      <img
                        src={pubProfile.photoURL}
                        alt={pubProfile.name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-amber-400 shrink-0 shadow-xs group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${pubProfile.avatarColor || 'from-amber-500 to-orange-500'} text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                        {(pubProfile.name || 'ط')[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {pubProfile.name}
                        </span>
                        {isAuthorSubscribed && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-[#06241b] dark:text-[#34d399] font-bold border border-emerald-300 dark:border-[#0d4a36] shrink-0">
                            مشترك ✓
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                        <span className="text-amber-600 dark:text-amber-400 font-extrabold">{authorDocCount} منشور</span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{authorSubCount} مشترك</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#131b2e] hover:bg-amber-500 hover:text-slate-950 dark:hover:bg-amber-400 dark:hover:text-slate-950 text-slate-700 dark:text-slate-200 text-[11px] font-black border border-slate-200 dark:border-[#1e2a45] transition flex items-center gap-1 shadow-xs shrink-0"
                  >
                    <span>زيارة الصفحة 👤</span>
                  </button>
                </div>

                {/* Thumbnail Preview with Badges (Semantic Figure) */}
                <figure
                  onClick={() => onOpenDocument(doc)}
                  className="relative aspect-4/3 bg-slate-100 dark:bg-[#080d19] overflow-hidden cursor-pointer m-0"
                >
                  <figcaption className="sr-only">{doc.title} - غلاف المستند</figcaption>
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

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Smooth Hover Floating Indicator */}
                  <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center pointer-events-none">
                    <span className="px-4 py-2 rounded-2xl bg-amber-500/95 text-slate-950 text-xs font-black shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 stroke-[2.5]" />
                      <span>تصفح المذكرة والحل الذكي 📖</span>
                    </span>
                  </div>

                  {/* Top Badges */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold shadow-xs border ${subject.badgeColor}`}>
                      {doc.customSubjectName || subject.nameAr}
                    </span>
                  </div>

                  <div className="absolute top-3 left-3 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(doc.id);
                      }}
                      className="p-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-amber-500 hover:scale-110 transition shadow-sm"
                      title="المفضلة"
                    >
                      <Star className={`w-3.5 h-3.5 ${doc.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Bottom Stats inside Thumbnail */}
                  <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-white text-xs font-bold pointer-events-none">
                    <span className="bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{doc.pages.length} صفحات</span>
                    </span>
                    <span className="bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-lg">
                      {doc.format === 'files' ? 'ملف PDF' : 'صور'}
                    </span>
                  </div>
                </figure>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full font-black border text-[10px] ${docTypeInfo.badgeBg} ${docTypeInfo.badgeText} ${docTypeInfo.badgeBorder}`}>
                        {docTypeInfo.label}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{doc.grade || 'الصف الخامس الابتدائي'}</span>
                    </div>

                    <h3
                      onClick={() => onOpenDocument(doc)}
                      className="font-black text-base text-slate-900 dark:text-white mb-2 line-clamp-2 hover:text-amber-500 cursor-pointer transition-colors"
                      title={doc.title}
                    >
                      {doc.title}
                    </h3>

                    {doc.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                        {doc.description}
                      </p>
                    )}

                    {/* Extra Details smoothly revealed on hover (إظهار تفاصيل إضافية بانسيابية تامة عند تمرير الفأرة) */}
                    <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out">
                      <div className="overflow-hidden">
                        <div className="pt-2 pb-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-bold border-t border-dashed border-amber-300/40 dark:border-amber-800/40 my-1 bg-amber-50/60 dark:bg-amber-950/30 p-2 rounded-xl">
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 flex items-center gap-1 border border-amber-200/50 dark:border-amber-900/50 shadow-2xs">
                            <span>📅</span>
                            <span>أضيفت: {new Date(doc.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200/50 dark:border-emerald-900/50 shadow-2xs">
                            <span>⏱️</span>
                            <span>{Math.max(5, doc.pages.length * 3)} دقيقة مذاكرة</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-indigo-800 dark:text-indigo-300 flex items-center gap-1 border border-indigo-200/50 dark:border-indigo-900/50 shadow-2xs">
                            <span>✍️</span>
                            <span>جاهز للكتابة بالقلم</span>
                          </span>
                          {doc.tags && doc.tags.length > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-purple-800 dark:text-purple-300 flex items-center gap-1 border border-purple-200/50 dark:border-purple-900/50 shadow-2xs truncate max-w-[120px]">
                              <span>🏷️</span>
                              <span>{doc.tags[0]}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ratings & Comments Pill + Quick Print */}
                    <div className="flex items-center justify-between my-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCommentingDoc(doc);
                        }}
                        className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:opacity-80 transition cursor-pointer"
                        title="عرض التعليقات والتقييمات أو إضافة تعليقك"
                      >
                        <div className="flex items-center text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          <span className="font-black mr-1">{doc.averageRating ?? 5}</span>
                        </div>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{doc.comments?.length || doc.ratingsCount || 0} تعليق</span>
                        </div>
                      </button>

                      {/* Quick Print Button (ميزة الطباعة المباشرة) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDocument(doc);
                          setTimeout(() => window.print(), 600);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition cursor-pointer"
                        title="طباعة هذه المذكرة"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Footer Action Buttons: زر فتح المذكرة وزر المشاركة */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    {/* زر فتح المذكرة */}
                    <button
                      type="button"
                      onClick={() => onOpenDocument(doc)}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 group-hover:bg-amber-400 group-hover:shadow-md active:scale-95 text-slate-950 text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      title="فتح المذكرة وتصفحها والمذاكرة بالقلم"
                    >
                      <BookOpen className="w-4 h-4 stroke-[2.5]" />
                      <span>فتح المذكرة</span>
                    </button>

                    {/* زر المشاركة */}
                    <button
                      type="button"
                      onClick={(e) => handleShareDoc(e, doc)}
                      className={`py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 border active:scale-95 shadow-xs cursor-pointer ${
                        copiedDocId === doc.id
                          ? 'bg-emerald-50 dark:bg-[#06241b] border-emerald-300 dark:border-[#0d4a36] text-emerald-700 dark:text-[#34d399]'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#131b2e] dark:hover:bg-[#18233d] border-slate-200 dark:border-[#1e2a45] text-slate-800 dark:text-slate-200'
                      }`}
                      title="مشاركة رابط المذكرة"
                    >
                      {copiedDocId === doc.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600 dark:text-[#34d399]" />
                          <span>تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>مشاركة</span>
                        </>
                      )}
                    </button>

                    {/* زر مسح المذكرة */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDocument(doc.id);
                      }}
                      className="p-2 rounded-xl text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-[#200d12] transition flex items-center justify-center cursor-pointer"
                      title="مسح هذه المذكرة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            </li>
            );
          })}
        </ul>
      )}
      </section>

      {/* 6. Semantic Educational Footer (تذييل الموقع الدلالي) */}
      <footer className="mt-10 pt-6 pb-6 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-[#172033]/60 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900 dark:text-white">منصة قلمي التعليمية</span>
            <span className="text-slate-400">•</span>
            <span className="text-amber-600 dark:text-amber-400 font-black">الصف الخامس الابتدائي</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            هيكل المنصة مبني وفق معايير HTML5 و CSS الحديثة لتجربة تعليمية سلسة وسريعة
          </p>
          <div className="flex items-center gap-3 text-[11px] font-bold">
            <a 
              href="/site-structure.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-amber-600 hover:text-amber-700 dark:text-amber-400 font-black hover:underline flex items-center gap-1"
              title="عرض وتصفح كود هيكل الموقع الكامل (HTML5 & CSS)"
            >
              <span>عرض كود الهيكل (HTML & CSS) ↗</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Comments & Ratings Modal */}
      {commentingDoc && (
        <DocumentCommentsModal
          isOpen={!!commentingDoc}
          document={commentingDoc}
          currentUser={currentUser}
          onClose={() => setCommentingDoc(null)}
          onDocumentUpdated={(updatedDoc) => {
            setCommentingDoc(updatedDoc);
            onDocumentUpdated?.(updatedDoc);
          }}
        />
      )}

      {/* Notification Permission Modal (سماح بالإشعارات أو حظر الموقع) */}
      <NotificationPermissionModal
        isOpen={showPermissionModal}
        onClose={() => {
          setShowPermissionModal(false);
          setNotifPermission(NotificationService.getPermissionStatus());
        }}
        onPermissionChanged={(status) => {
          setNotifPermission(status);
        }}
      />

      {/* Publisher Public Profile Modal */}
      {internalPublisherKey && (
        <PublisherProfileModal
          isOpen={!!internalPublisherKey}
          onClose={() => setInternalPublisherKey(null)}
          publisherKey={internalPublisherKey}
          allDocuments={documents}
          onOpenDocument={onOpenDocument}
          onOpenPublishModal={onOpenPublishModal}
          onOpenEditProfile={onOpenEditProfile || (() => {})}
          currentUserId={currentUser?.uid}
          currentUserName={currentUser?.displayName || undefined}
          onDeleteDocument={onDeleteDocument}
        />
      )}
    </div>
  );
};

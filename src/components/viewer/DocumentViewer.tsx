import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StudyDocument, ToolMode, AnnotationItem, SUBJECTS } from '../../types';
import { InteractiveCanvas } from './InteractiveCanvas';
import { MovablePenToolbar } from './MovablePenToolbar';
import { StorageService } from '../../services/storage';
import { StudyProgressService } from '../../services/studyProgressService';
import { createBlankPage } from '../../services/fileProcessor';
import { 
  ArrowRight, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Plus, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Star, 
  Printer, 
  LayoutGrid, 
  Maximize2,
  Bookmark,
  Share2,
  Sun,
  Moon,
  Trash2,
  Focus,
  Eye,
  EyeOff,
  BrainCircuit,
  Bell,
  BookOpen,
  Settings,
  ChevronUp,
  ChevronDown,
  StickyNote,
  MessageCircle,
  Search
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AiTutorSidebar } from './AiTutorSidebar';
import { QuickNotesSidebar } from './QuickNotesSidebar';
import { DocumentSettingsModal } from './DocumentSettingsModal';
import { InteractiveCommentsSection } from '../comments/InteractiveCommentsSection';
import { getDocTypeInfo } from '../../types';

interface DocumentViewerProps {
  initialDocument: StudyDocument;
  openDocuments: StudyDocument[];
  activeDocId: string;
  onSelectDocument: (docId: string) => void;
  onCloseDocument: (docId: string) => void;
  onBackToLibrary: () => void;
  onOpenPublishModal: () => void;
  onDeleteDocument: (docId: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenReminderForDoc?: (doc: StudyDocument) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  initialDocument,
  openDocuments,
  activeDocId,
  onSelectDocument,
  onCloseDocument,
  onBackToLibrary,
  onOpenPublishModal,
  onDeleteDocument,
  darkMode,
  onToggleDarkMode,
  onOpenReminderForDoc,
}) => {
  const [currentDoc, setCurrentDoc] = useState<StudyDocument>(initialDocument);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  
  // Pen and Drawing Tools State
  const [currentTool, setCurrentTool] = useState<ToolMode>('pen');
  const [currentColor, setCurrentColor] = useState<string>('#dc2626'); // Red by default like teacher correction
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [fontSize, setFontSize] = useState<number>(18);
  const [isBold, setIsBold] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1.0);
  // Thumbnails sidebar is open immediately upon loading PDF
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [thumbnailSearch, setThumbnailSearch] = useState<string>('');
  const [thumbnailFilterBookmarks, setThumbnailFilterBookmarks] = useState<boolean>(false);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isAutoSaved, setIsAutoSaved] = useState<boolean>(true);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  // Undo / Redo stacks per page
  const [undoStack, setUndoStack] = useState<AnnotationItem[][]>([]);
  const [redoStack, setRedoStack] = useState<AnnotationItem[][]>([]);

  // Focus Mode State (وضع القراءة المركزة - تجربة تشبه الكتاب الورقي بدون تشتيت)
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState<boolean>(false);

  // Quick Page Jump State for 100-300 page books
  const [jumpPageInput, setJumpPageInput] = useState<string>('');
  const [isJumpOpen, setIsJumpOpen] = useState<boolean>(false);

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumpPageInput.trim(), 10);
    if (!isNaN(num) && num >= 1 && num <= currentDoc.pages.length) {
      setCurrentPageIndex(num - 1);
      setIsJumpOpen(false);
      setJumpPageInput('');
    }
  };

  // Auto-scroll the thumbnail sidebar to keep the active page thumbnail visible
  useEffect(() => {
    if (showThumbnails) {
      const el = document.getElementById(`viewer-thumb-${currentPageIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentPageIndex, showThumbnails]);

  // Exit focus mode with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusMode) {
        setFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusMode]);

  // AI Tutor State (المعلم الذكي بجانب المذكرة - يفتح تلقائياً لتسهيل السؤال)
  const [showAiTutor, setShowAiTutor] = useState<boolean>(true);

  // Quick Notes Sidebar State (الملاحظات النصية السريعة لكل مذكرة ومحفوظة في Firebase)
  const [showQuickNotes, setShowQuickNotes] = useState<boolean>(false);

  // Settings Modal State (زر الإعدادات الموحد لجميع أدوات وخيارات المذكرة)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  // Sepia Mode State (وضع القراءة المريح لتقليل إجهاد العين)
  const [isSepiaMode, setIsSepiaMode] = useState<boolean>(() => {
    return localStorage.getItem('qalami_sepia_mode') === 'true';
  });

  const toggleSepiaMode = () => {
    setIsSepiaMode((prev) => {
      const next = !prev;
      localStorage.setItem('qalami_sepia_mode', String(next));
      return next;
    });
  };

  // Automatically track study time for this document's subject while reading
  useEffect(() => {
    if (!currentDoc?.subject) return;
    // Log 1 minute of study time every 60 seconds of viewing
    const interval = setInterval(() => {
      StudyProgressService.logStudyTime(currentDoc.subject, 1);
    }, 60000);
    return () => clearInterval(interval);
  }, [currentDoc?.subject]);

  // Sync when initialDocument changes
  useEffect(() => {
    setCurrentDoc(initialDocument);
    setCurrentPageIndex(0);
    setUndoStack([]);
    setRedoStack([]);
    setShowThumbnails(true); // Open thumbnail preview immediately upon loading
    setThumbnailSearch('');
    setThumbnailFilterBookmarks(false);
  }, [initialDocument.id]);

  // Ultra-fast page preloading: preload next and previous pages in browser image cache
  useEffect(() => {
    if (!currentDoc?.pages) return;
    const preloadIndices = [currentPageIndex + 1, currentPageIndex - 1, currentPageIndex + 2];
    preloadIndices.forEach((idx) => {
      if (idx >= 0 && idx < currentDoc.pages.length) {
        const page = currentDoc.pages[idx];
        if (page?.imageUrl) {
          const img = new Image();
          img.decoding = 'async';
          img.src = page.imageUrl;
        }
      }
    });
  }, [currentPageIndex, currentDoc?.pages]);

  const activePage = currentDoc.pages[currentPageIndex] || currentDoc.pages[0];
  const subjectInfo = SUBJECTS.find((s) => s.id === currentDoc.subject) || SUBJECTS[0];
  const docTypeInfo = getDocTypeInfo(currentDoc.docType);

  // Auto-Save handler
  const handleSaveAnnotations = useCallback(
    (newAnnotations: AnnotationItem[]) => {
      setIsAutoSaved(false);
      
      const updatedPages = [...currentDoc.pages];
      if (updatedPages[currentPageIndex]) {
        updatedPages[currentPageIndex] = {
          ...updatedPages[currentPageIndex],
          annotations: newAnnotations,
          lastEdited: Date.now(),
        };
      }

      const updatedDoc: StudyDocument = {
        ...currentDoc,
        pages: updatedPages,
        updatedAt: new Date().toISOString(),
      };

      setCurrentDoc(updatedDoc);
      StorageService.saveDocument(updatedDoc);

      // Flash auto-saved status after short debounce
      setTimeout(() => {
        setIsAutoSaved(true);
      }, 400);
    },
    [currentDoc, currentPageIndex]
  );

  const handleClearPage = () => {
    setUndoStack((prev) => [...prev, activePage.annotations || []]);
    setRedoStack([]);
    handleSaveAnnotations([]);
  };

  const handleAddBlankPage = () => {
    const newPage = createBlankPage(currentDoc.pages.length + 1, 'lined');
    const updatedDoc = {
      ...currentDoc,
      pages: [...currentDoc.pages, newPage],
    };
    setCurrentDoc(updatedDoc);
    StorageService.saveDocument(updatedDoc);
    setCurrentPageIndex(currentDoc.pages.length);
  };

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      await StorageService.exportAnnotatedPdf(currentDoc);
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء تصدير ملف PDF، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const handleExportCurrentPage = async () => {
    try {
      setIsExporting(true);
      await StorageService.exportPageAsImage(activePage, currentDoc.title);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const toggleBookmark = () => {
    const currentBookmarks = currentDoc.bookmarks || [];
    const isBookmarked = currentBookmarks.includes(activePage.pageNumber);
    const updated = isBookmarked
      ? currentBookmarks.filter((p) => p !== activePage.pageNumber)
      : [...currentBookmarks, activePage.pageNumber];

    const updatedDoc = { ...currentDoc, bookmarks: updated };
    setCurrentDoc(updatedDoc);
    StorageService.saveDocument(updatedDoc);
  };

  const displayedThumbnails = currentDoc.pages.filter((p) => {
    if (thumbnailFilterBookmarks) {
      if (!currentDoc.bookmarks?.includes(p.pageNumber)) return false;
    }
    if (thumbnailSearch.trim()) {
      const q = thumbnailSearch.trim();
      const num = parseInt(q, 10);
      if (!isNaN(num)) {
        return p.pageNumber === num;
      }
    }
    return true;
  });

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden font-['Cairo',sans-serif] relative">
      {/* 1. Google Chrome-Style Document Tabs Bar (مخفي في وضع التركيز والطباعة) */}
      {!focusMode && (
        <nav aria-label="تبويبات المذكرات المفتوحة" className="no-print print:hidden bg-slate-200 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 pt-1.5 px-2 flex items-center gap-1 overflow-x-auto select-none no-scrollbar">
        {/* Back to Library Button */}
        <button
          type="button"
          onClick={onBackToLibrary}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-800 transition mr-1"
          title="الرجوع إلى المكتبة الرئيسية"
        >
          <ArrowRight className="w-4 h-4" />
          <span>المكتبة</span>
        </button>

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* Browser Tabs List */}
        {openDocuments.map((doc) => {
          const isActive = doc.id === currentDoc.id;
          const sInfo = SUBJECTS.find((s) => s.id === doc.subject);
          return (
            <div
              key={doc.id}
              onClick={() => {
                if (!isActive) onSelectDocument(doc.id);
              }}
              className={`group relative flex items-center gap-2 max-w-[220px] min-w-[140px] px-3 py-2 rounded-t-xl text-xs font-bold cursor-pointer transition-all border-t border-x ${
                isActive
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-300 dark:border-slate-800 shadow-sm z-10'
                  : 'bg-slate-200/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-300/80 dark:hover:bg-slate-800'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: sInfo?.bgLight ? undefined : '#0284c7' }}
              />
              <span className="truncate flex-1 text-right">{doc.title}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseDocument(doc.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                title="إغلاق هذا المستند"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}

        {/* Add New / Publish Document Tab Button */}
        <button
          type="button"
          onClick={onOpenPublishModal}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/70 dark:hover:bg-slate-800 transition"
          title="نشر أو فتح مستند جديد (+)"
        >
          <Plus className="w-4 h-4" />
        </button>
      </nav>
      )}

      {/* 2. Secondary Navigation & Actions Bar (مخفي في وضع التركيز والطباعة) */}
      {!focusMode && (
        <header role="banner" className="no-print print:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Document Metadata & Bookmark */}
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${subjectInfo.badgeColor}`}>
            {subjectInfo.nameAr}
          </span>
          {docTypeInfo && (
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-black border ${docTypeInfo.badgeBg} ${docTypeInfo.badgeText} ${docTypeInfo.badgeBorder}`}>
              {docTypeInfo.label}
            </span>
          )}
          <h1 className="text-sm md:text-base font-extrabold text-slate-900 dark:text-white truncate max-w-[240px] md:max-w-md">
            {currentDoc.title}
          </h1>
          <button
            type="button"
            onClick={toggleBookmark}
            className={`p-1 rounded-lg transition ${
              currentDoc.bookmarks?.includes(activePage.pageNumber)
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            title="حفظ إشارة مرجعية لهذه الصفحة"
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>

          {/* Toggle Thumbnails Sidebar Button */}
          <button
            type="button"
            onClick={() => setShowThumbnails((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              showThumbnails
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs ring-2 ring-amber-400/50'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
            title={showThumbnails ? 'إخفاء شريط الصفحات المصغرة' : 'إظهار شريط الصفحات المصغرة (Thumbnails)'}
          >
            <LayoutGrid className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">الصفحات المصغرة</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-mono font-bold">
              {currentDoc.pages.length}
            </span>
          </button>
        </div>

        {/* Page Switcher with Up/Down Gliders (تقلع وتنزل بسلاسة) */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700/80">
          {/* Glide Up Button (تقلع لأعلى) */}
          <button
            type="button"
            onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentPageIndex === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-amber-500 hover:text-slate-950 disabled:opacity-30 disabled:hover:bg-white text-slate-700 dark:text-slate-200 font-black text-xs transition cursor-pointer shadow-2xs"
            title="الصعود لأعلى / الصفحة السابقة (تقلع لأعلى)"
          >
            <ChevronUp className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">أعلى 🔼</span>
          </button>

          {/* Current Page Indicator with Quick Jump */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsJumpOpen((prev) => !prev)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-black text-slate-800 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 rounded-lg transition cursor-pointer"
              title="انقر للانتقال المباشر لأي صفحة في الكتاب"
            >
              <span>صفحة</span>
              <span className="text-amber-600 dark:text-amber-400 font-extrabold text-sm">{currentPageIndex + 1}</span>
              <span>من</span>
              <span>{currentDoc.pages.length}</span>
              <span className="text-[10px] text-slate-400">⚡</span>
            </button>

            {isJumpOpen && (
              <form
                onSubmit={handleJumpToPage}
                className="absolute top-full mt-2 start-1/2 -translate-x-1/2 z-50 bg-white dark:bg-slate-800 p-2.5 rounded-2xl shadow-2xl border-2 border-amber-500 flex items-center gap-2 min-w-[210px] animate-in fade-in"
              >
                <input
                  type="number"
                  min={1}
                  max={currentDoc.pages.length}
                  value={jumpPageInput}
                  onChange={(e) => setJumpPageInput(e.target.value)}
                  placeholder={`1 - ${currentDoc.pages.length}`}
                  autoFocus
                  className="w-20 px-2.5 py-1 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-bold text-center focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition cursor-pointer"
                >
                  انتقال ⚡
                </button>
              </form>
            )}
          </div>

          {/* Glide Down Button (تنزل لأسفل) */}
          <button
            type="button"
            onClick={() => setCurrentPageIndex((prev) => Math.min(currentDoc.pages.length - 1, prev + 1))}
            disabled={currentPageIndex >= currentDoc.pages.length - 1}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-amber-500 hover:text-slate-950 disabled:opacity-30 disabled:hover:bg-white text-slate-700 dark:text-slate-200 font-black text-xs transition cursor-pointer shadow-2xs"
            title="النزول لأسفل / الصفحة التالية (تنزل لأسفل)"
          >
            <span className="hidden sm:inline">أسفل 🔽</span>
            <ChevronDown className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Action Buttons: Direct PDF Download & Master Settings */}
        <div className="flex items-center gap-2">
          {/* Direct Academic PDF Download Button */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
            title="تنزيل المذكرة كاملة كملف PDF منظم بتنسيق الطباعة الأكاديمية الرسمية"
          >
            <Download className={`w-4 h-4 stroke-[2.5] ${isExporting ? 'animate-bounce' : ''}`} />
            <span>{isExporting ? 'جاري إنشاء PDF...' : 'تنزيل PDF 📥'}</span>
          </button>

          {/* Quick Notes Toggle Button */}
          <button
            type="button"
            onClick={() => setShowQuickNotes((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer shadow-md ${
              showQuickNotes
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
            title="الملاحظات النصية السريعة للمذكرة (محفوظة في Firebase)"
          >
            <StickyNote className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">الملاحظات السريعة 📝</span>
            <span className="sm:hidden">ملاحظات 📝</span>
          </button>

          {/* Student Inquiries & Comments Button */}
          <button
            type="button"
            onClick={() => setIsCommentsOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer shadow-md bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
            title="استفسارات وأسئلة الطلاب حول هذه المذكرة (محفوظة في Firebase)"
          >
            <MessageCircle className="w-4 h-4 stroke-[2.5] text-amber-500" />
            <span className="hidden sm:inline">استفسارات 💬</span>
          </button>

          {/* Master Settings Button */}
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-slate-950 rounded-xl text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition cursor-pointer"
            title="إعدادات وخيارات المذكرة (الشرح، العرض، الطباعة، التحميل، والمعلم الذكي)"
          >
            <Settings className="w-4 h-4 stroke-[2.5] animate-spin-slow" />
            <span>الإعدادات ⚙️</span>
          </button>
        </div>
      </header>
      )}

      {/* Floating Focus Mode Bar (يظهر فقط في وضع القراءة المركزة لتجربة كتاب ورقي) */}
      {focusMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl border border-amber-300 dark:border-amber-700 animate-in fade-in slide-in-from-top-2 duration-200 select-none">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 dark:text-amber-400">
            <BookOpen className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>📖 وضع القراءة المركزة (كتاب ورقي)</span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

          {/* Quick Page Flip in Focus Mode */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentPageIndex === 0}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
              title="الصفحة السابقة"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs">
              صفحة {currentPageIndex + 1} من {currentDoc.pages.length}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPageIndex((prev) => Math.min(currentDoc.pages.length - 1, prev + 1))}
              disabled={currentPageIndex >= currentDoc.pages.length - 1}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
              title="الصفحة التالية"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

          {/* Zoom In/Out in Focus Mode */}
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="تصغير"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.0, z + 0.1))}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="تكبير"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

          {/* Export PDF Button in Focus Mode */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
            title="تصدير كـ PDF مع ملاحظاتك وحلولك"
          >
            {isExporting ? (
              <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>تصدير كـ PDF</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

          {/* Exit Focus Mode Button */}
          <button
            type="button"
            onClick={() => setFocusMode(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition"
            title="الخروج من وضع التركيز وإظهار جميع القوائم والأدوات (Esc)"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>إنهاء وضع التركيز (Esc)</span>
          </button>
        </div>
      )}

      {/* 3. Main Workspace Area: Sidebar (Thumbnails) + Canvas (Semantic Main) */}
      <main role="main" className="flex-1 flex overflow-hidden relative">
        {/* Thumbnails Sidebar */}
        {!focusMode && showThumbnails && (
          <aside aria-label="شريط الصفحات المصغرة" className="w-64 sm:w-72 bg-white dark:bg-slate-900 border-e border-slate-200 dark:border-slate-800 flex flex-col z-30 shadow-xl shrink-0 select-none animate-in slide-in-from-right-3 duration-200">
            {/* Header */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/90">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-amber-500 stroke-[2.5]" />
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  معاينة الصفحات ({currentDoc.pages.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowThumbnails(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition text-xs cursor-pointer"
                title="إخفاء الشريط الجانبي"
              >
                ✕
              </button>
            </div>

            {/* Quick Search & Bookmark Filter inside Thumbnail Sidebar */}
            <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900">
              <div className="flex-1 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl text-xs">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث برقم الصفحة..."
                  value={thumbnailSearch}
                  onChange={(e) => setThumbnailSearch(e.target.value)}
                  className="w-full bg-transparent text-slate-900 dark:text-white text-xs focus:outline-none font-bold"
                />
                {thumbnailSearch && (
                  <button type="button" onClick={() => setThumbnailSearch('')} className="text-slate-400 text-xs cursor-pointer">✕</button>
                )}
              </div>

              {/* Bookmark Filter Toggle */}
              <button
                type="button"
                onClick={() => setThumbnailFilterBookmarks((prev) => !prev)}
                className={`p-1.5 rounded-xl border transition cursor-pointer ${
                  thumbnailFilterBookmarks
                    ? 'bg-amber-500 text-slate-950 border-amber-500'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
                title="عرض الصفحات المميزة بعلامة مرجعية فقط"
              >
                <Bookmark className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>

            {/* Thumbnails Grid List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {displayedThumbnails.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 font-bold">
                  لا توجد صفحات مطابقة للبحث
                </div>
              ) : (
                displayedThumbnails.map((p) => {
                  const actualIndex = currentDoc.pages.findIndex((item) => item.id === p.id);
                  const isActive = currentPageIndex === actualIndex;
                  const isBookmarked = currentDoc.bookmarks?.includes(p.pageNumber);
                  const annotationsCount = p.annotations?.length || 0;

                  return (
                    <div
                      key={p.id}
                      id={`viewer-thumb-${actualIndex}`}
                      onClick={() => setCurrentPageIndex(actualIndex)}
                      className={`group relative rounded-2xl border-2 overflow-hidden cursor-pointer p-1.5 transition-all ${
                        isActive
                          ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-lg ring-3 ring-amber-400/40 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:border-amber-300 dark:hover:border-slate-700 hover:shadow-md'
                      }`}
                    >
                      {/* Thumbnail Image Container */}
                      <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-white dark:bg-slate-950 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                        <img
                          src={p.imageUrl}
                          alt={`صفحة ${p.pageNumber}`}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                        {/* Active Indicator Badge */}
                        {isActive && (
                          <div className="absolute top-1.5 start-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black shadow-md flex items-center gap-1">
                            <span>الحالية</span>
                          </div>
                        )}
                        {/* Bookmark Badge */}
                        {isBookmarked && (
                          <div className="absolute top-1.5 end-1.5 p-1 rounded-full bg-amber-500 text-slate-950 shadow-md">
                            <Bookmark className="w-3 h-3 fill-current" />
                          </div>
                        )}
                      </div>

                      {/* Meta Footer */}
                      <div className="flex items-center justify-between mt-1.5 px-1 text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                        <span className={isActive ? 'text-amber-600 dark:text-amber-400 font-black' : ''}>
                          صفحة {p.pageNumber}
                        </span>
                        {annotationsCount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold">
                            {annotationsCount} ملاحظة ✍️
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sidebar Bottom Action */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleAddBlankPage}
                className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>إضافة صفحة كشكول للمذكرة</span>
              </button>
            </div>
          </aside>
        )}

        {/* Floating Open Sidebar Button when collapsed */}
        {!focusMode && !showThumbnails && (
          <button
            type="button"
            onClick={() => setShowThumbnails(true)}
            className="absolute top-4 start-4 z-30 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border-2 border-amber-500 text-slate-950 dark:text-white text-xs font-black hover:bg-amber-500 hover:text-slate-950 transition cursor-pointer select-none"
            title="إظهار شريط الصفحات المصغرة (Thumbnails)"
          >
            <LayoutGrid className="w-4 h-4 text-amber-500" />
            <span>عرض الصفحات ({currentDoc.pages.length})</span>
          </button>
        )}

        {/* Interactive Drawing & Reading Surface (يدعم وضع القراءة المريح Sepia) */}
        <div 
          className={`flex-1 overflow-auto flex items-start justify-center p-4 relative transition-colors duration-300 ${
            isSepiaMode 
              ? 'bg-[#f4ebd0] dark:bg-[#231b14]' 
              : 'bg-slate-100 dark:bg-slate-950/80'
          }`}
        >

          <div 
            className={`transition-all duration-300 rounded-2xl ${
              isSepiaMode 
                ? 'shadow-2xl ring-4 ring-[#dfcfaf] dark:ring-[#453628] [filter:sepia(0.38)_brightness(0.98)_contrast(0.95)]' 
                : ''
            }`}
          >
            <InteractiveCanvas
              page={activePage}
              currentTool={currentTool}
              currentColor={currentColor}
              strokeWidth={strokeWidth}
              fontSize={fontSize}
              isBold={isBold}
              zoom={zoom}
              onSaveAnnotations={handleSaveAnnotations}
              undoStack={undoStack}
              redoStack={redoStack}
              setUndoStack={setUndoStack}
              setRedoStack={setRedoStack}
              onNextPage={() => setCurrentPageIndex((prev) => Math.min(currentDoc.pages.length - 1, prev + 1))}
              onPrevPage={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
            />
          </div>
        </div>

        {/* AI Tutor Assistant Panel Beside Note (وضع AI جانب المذكرة) */}
        {!focusMode && showAiTutor && (
          <AiTutorSidebar
            isOpen={showAiTutor}
            onClose={() => setShowAiTutor(false)}
            document={currentDoc}
            currentPage={activePage}
          />
        )}

        {/* Quick Notes Sidebar Beside Note (الملاحظات السريعة في Firebase) */}
        {!focusMode && showQuickNotes && (
          <QuickNotesSidebar
            isOpen={showQuickNotes}
            onClose={() => setShowQuickNotes(false)}
            document={currentDoc}
            currentPageNumber={activePage.pageNumber}
            onNavigateToPage={(pageNumber) => {
              const idx = currentDoc.pages.findIndex((p) => p.pageNumber === pageNumber);
              if (idx >= 0) setCurrentPageIndex(idx);
            }}
          />
        )}

        {/* Movable Floating Electronic Pen Toolbar (مخفي في وضع التركيز) */}
        {!focusMode && (
          <MovablePenToolbar
          currentTool={currentTool}
          setCurrentTool={setCurrentTool}
          currentColor={currentColor}
          setCurrentColor={setCurrentColor}
          strokeWidth={strokeWidth}
          setStrokeWidth={setStrokeWidth}
          fontSize={fontSize}
          setFontSize={setFontSize}
          isBold={isBold}
          setIsBold={setIsBold}
          onUndo={() => {
            if (undoStack.length === 0) return;
            const previous = undoStack[undoStack.length - 1];
            setUndoStack((prev) => prev.slice(0, prev.length - 1));
            setRedoStack((prev) => [...prev, activePage.annotations || []]);
            handleSaveAnnotations(previous);
          }}
          onRedo={() => {
            if (redoStack.length === 0) return;
            const next = redoStack[redoStack.length - 1];
            setRedoStack((prev) => prev.slice(0, prev.length - 1));
            setUndoStack((prev) => [...prev, activePage.annotations || []]);
            handleSaveAnnotations(next);
          }}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          onClearPage={handleClearPage}
          isAutoSaved={isAutoSaved}
        />
        )}
      </main>

      {/* 4. Bottom Page Tabs Bar (مخفي في وضع التركيز) */}
      {!focusMode && (
        <nav aria-label="التنقل السريع بين صفحات المستند" className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto text-xs font-bold select-none no-scrollbar">
          <span className="text-[11px] text-slate-400 font-semibold px-2 shrink-0">التنقل السريع ({currentDoc.pages.length} صفحة):</span>
          {currentDoc.pages.length <= 25 ? (
            currentDoc.pages.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setCurrentPageIndex(idx)}
                className={`px-3 py-1 rounded-lg shrink-0 transition-all ${
                  currentPageIndex === idx
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                صفحة {p.pageNumber}
              </button>
            ))
          ) : (
            <>
              {/* First Page */}
              <button
                type="button"
                onClick={() => setCurrentPageIndex(0)}
                className={`px-3 py-1 rounded-lg shrink-0 transition-all ${
                  currentPageIndex === 0
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                صفحة 1
              </button>

              {currentPageIndex > 4 && <span className="text-slate-400 px-1">...</span>}

              {/* Window around current page */}
              {Array.from({ length: 9 }).map((_, offset) => {
                const targetIdx = currentPageIndex - 4 + offset;
                if (targetIdx <= 0 || targetIdx >= currentDoc.pages.length - 1) return null;
                const p = currentDoc.pages[targetIdx];
                if (!p) return null;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCurrentPageIndex(targetIdx)}
                    className={`px-3 py-1 rounded-lg shrink-0 transition-all ${
                      currentPageIndex === targetIdx
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    صفحة {p.pageNumber}
                  </button>
                );
              })}

              {currentPageIndex < currentDoc.pages.length - 5 && <span className="text-slate-400 px-1">...</span>}

              {/* Last Page */}
              <button
                type="button"
                onClick={() => setCurrentPageIndex(currentDoc.pages.length - 1)}
                className={`px-3 py-1 rounded-lg shrink-0 transition-all ${
                  currentPageIndex === currentDoc.pages.length - 1
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                صفحة {currentDoc.pages.length}
              </button>
            </>
          )}
        </nav>
      )}

      {/* Floating Vertical Gliders (أزرار الصعود والنزول تقلع وتنزل بسلاسة - مخفية في وضع التركيز لتجربة كتاب ورقي) */}
      {!focusMode && (
        <div className="fixed end-4 bottom-24 z-40 flex flex-col items-center gap-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border-2 border-amber-500/80">
          <button
            type="button"
            onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentPageIndex === 0}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-20 text-slate-950 font-black transition active:scale-90 shadow-md cursor-pointer"
            title="الصعود لأعلى / الصفحة السابقة (تقلع لأعلى 🔼)"
          >
            <ChevronUp className="w-5 h-5 stroke-[3]" />
          </button>

          <div className="font-mono text-[11px] font-black text-slate-800 dark:text-slate-200 py-0.5 select-none">
            {currentPageIndex + 1}/{currentDoc.pages.length}
          </div>

          <button
            type="button"
            onClick={() => setCurrentPageIndex((prev) => Math.min(currentDoc.pages.length - 1, prev + 1))}
            disabled={currentPageIndex >= currentDoc.pages.length - 1}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-20 text-slate-950 font-black transition active:scale-90 shadow-md cursor-pointer"
            title="النزول لأسفل / الصفحة التالية (تنزل لأسفل 🔽)"
          >
            <ChevronDown className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      )}

      {/* Master Settings Modal (كل أزرار وخيارات المذكرة غير القلم) */}
      <DocumentSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        document={currentDoc}
        currentPage={activePage}
        currentPageIndex={currentPageIndex}
        subjectInfo={subjectInfo}
        showAiTutor={showAiTutor}
        onToggleAiTutor={() => setShowAiTutor(!showAiTutor)}
        showQuickNotes={showQuickNotes}
        onToggleQuickNotes={() => setShowQuickNotes(!showQuickNotes)}
        zoom={zoom}
        onSetZoom={setZoom}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode(!focusMode)}
        showThumbnails={showThumbnails}
        onToggleThumbnails={() => setShowThumbnails(!showThumbnails)}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
        isSepiaMode={isSepiaMode}
        onToggleSepiaMode={toggleSepiaMode}
        onAddBlankPage={handleAddBlankPage}
        isBookmarked={Boolean(currentDoc.bookmarks?.includes(activePage.pageNumber))}
        onToggleBookmark={toggleBookmark}
        isExporting={isExporting}
        onExportPdf={handleExportPdf}
        onExportCurrentPage={handleExportCurrentPage}
        onPrint={() => window.print()}
        onOpenReminder={onOpenReminderForDoc ? () => onOpenReminderForDoc(currentDoc) : undefined}
        onDeleteDocument={() => onDeleteDocument(currentDoc.id)}
      />

      {/* Interactive Comments & Inquiries Modal */}
      {isCommentsOpen && (
        <InteractiveCommentsSection
          targetId={currentDoc.id}
          targetType="document"
          targetTitle={currentDoc.title}
          isModal
          onClose={() => setIsCommentsOpen(false)}
        />
      )}
    </div>
  );
};

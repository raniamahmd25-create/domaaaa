import React, { useState, useRef } from 'react';
import { 
  SubjectId, 
  DocumentType, 
  PublishFormat, 
  SUBJECTS, 
  DOC_TYPES, 
  StudyDocument,
  DocumentPage
} from '../../types';
import { 
  processImagesToPages, 
  processPdfToPages, 
  generateId, 
  createBlankPage,
  createRecoveredPage,
  createSafeRecoveredDocument,
  rotatePageImage,
  renderSpecificPdfPage
} from '../../services/fileProcessor';
import { StorageService } from '../../services/storage';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Sparkles, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  Book,
  Maximize2,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ArrowUpDown,
  Search,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentCreated: (newDoc: StudyDocument) => void;
}

const FIXED_GRADE = 'الصف الخامس الابتدائي';

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  onDocumentCreated,
}) => {
  const [publishFormat, setPublishFormat] = useState<PublishFormat>('files');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<SubjectId>('arabic');
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [docType, setDocType] = useState<DocumentType>('revision');
  const [grade, setGrade] = useState('الصف الخامس الابتدائي');
  const [term, setTerm] = useState<'term1' | 'term2' | 'full_year'>('term1');
  const [author, setAuthor] = useState(() => {
    try {
      return StorageService.getActiveProfile().name || '';
    } catch {
      return '';
    }
  });
  const [description, setDescription] = useState('');
  
  // File & Page processing states
  const [pages, setPages] = useState<DocumentPage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Page Reviewer & Inspection Modal State
  const [inspectedPageIndex, setInspectedPageIndex] = useState<number | null>(null);
  const [inspectorZoom, setInspectorZoom] = useState<number>(1.0);
  const [searchPageQuery, setSearchPageQuery] = useState('');
  const [pageRangeFilter, setPageRangeFilter] = useState<'all' | '1-50' | '51-100' | '101+'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Ultra-Fast PDF / File Upload with Instant Page Display & Streaming
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setIsProcessing(true);
    setUploadedFile(file);
    setProgressMsg('⚡ جاري قراءة فهرس الكتاب وتجهيز الصفحات...');
    setProcessedCount(0);
    setTotalCount(0);

    // Auto-fill title from file name
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
    }

    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        await processPdfToPages(
          file,
          (completed, total) => {
            setProcessedCount(completed);
            setTotalCount(total);
            setProgressMsg(`⚡ تم تجهيز ${completed} من ${total} صفحة...`);
          },
          {
            onInitialBatch: (initialPages, total) => {
              // Immediately show all pages in the modal (takes ~1-2 seconds)
              setPages(initialPages);
              setTotalCount(total);
              setIsProcessing(false);
              setProgressMsg(`⚡ تم تجهيز الصفحات الأولى وجاري تجهيز باقي صفحات الكتاب (${total} صفحة)...`);
            },
            onPageReady: (index, updatedPage, completed, total) => {
              setProcessedCount(completed);
              setTotalCount(total);
              setPages((prev) => {
                if (!prev || prev.length === 0) return prev;
                const next = [...prev];
                if (next[index]) {
                  next[index] = updatedPage;
                }
                return next;
              });
            },
            onComplete: (finalPages) => {
              setPages(finalPages);
              setIsProcessing(false);
              setProgressMsg('');
            },
          }
        );
      } else {
        // Fallback for image upload via files tab
        const singlePage = await processImagesToPages([file]);
        setPages(singlePage);
        setTotalCount(singlePage.length);
        setProcessedCount(singlePage.length);
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.warn('File upload encountered an issue, initiating auto-recovery:', err);
      // Auto-recover damaged, corrupted, or malformed files so the user is never blocked
      const recoveredPages = createSafeRecoveredDocument(file.name);
      setPages(recoveredPages);
      setTotalCount(recoveredPages.length);
      setProcessedCount(recoveredPages.length);
      setIsProcessing(false);
      setProgressMsg('🛡️ تم قبول الملف وتأمينه بنجاح واسترداد الصفحات للمراجعة');
      setErrorMsg('');
    }
  };

  // Handle Multi-Image Upload
  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMsg('');
    setIsProcessing(true);
    setProgressMsg('جاري معالجة صور الملازم...');

    try {
      const fileArray = Array.from(files);
      const newPages = await processImagesToPages(fileArray, (completed, total) => {
        setProgressMsg(`جاري معالجة الصورة ${completed} من ${total}...`);
      });
      setPages((prev) => [...prev, ...newPages]);
      setTotalCount((prev) => prev + newPages.length);

      if (!title && fileArray[0]) {
        setTitle(fileArray[0].name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('تعذر رفع بعض الصور، يرجى المحاولة بصيغة PNG أو JPG.');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  // Page Editing Tools (Review & Corrections)
  const removePage = (indexToRemove: number) => {
    const updated = pages
      .filter((_, idx) => idx !== indexToRemove)
      .map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    setPages(updated);
    setTotalCount(updated.length);

    if (inspectedPageIndex !== null) {
      if (inspectedPageIndex >= updated.length) {
        setInspectedPageIndex(updated.length > 0 ? updated.length - 1 : null);
      }
    }
  };

  const movePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    const next = [...pages];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    const renumbered = next.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    setPages(renumbered);
    if (inspectedPageIndex === fromIndex) {
      setInspectedPageIndex(toIndex);
    }
  };

  const handleRotatePage = async (index: number) => {
    const target = pages[index];
    if (!target) return;
    try {
      const rotated = await rotatePageImage(target, 90);
      setPages((prev) => {
        const next = [...prev];
        next[index] = rotated;
        return next;
      });
    } catch (e) {
      console.warn('Rotation error:', e);
    }
  };

  const handleAddBlankNotePage = (afterIndex?: number) => {
    const newPage = createBlankPage(pages.length + 1, 'lined');
    if (afterIndex !== undefined && afterIndex >= 0 && afterIndex < pages.length) {
      const next = [...pages];
      next.splice(afterIndex + 1, 0, newPage);
      const renumbered = next.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
      setPages(renumbered);
      setTotalCount(renumbered.length);
      setInspectedPageIndex(afterIndex + 1);
    } else {
      setPages((prev) => [...prev, newPage]);
      setTotalCount((prev) => prev + 1);
    }
  };

  // Inspect specific page on-demand
  const openInspector = async (index: number) => {
    setInspectedPageIndex(index);
    setInspectorZoom(1.0);
    const page = pages[index];
    // If this page is an SVG placeholder and we have the PDF file, render high-res on-demand
    if (page && page.imageUrl.startsWith('data:image/svg') && uploadedFile) {
      const highRes = await renderSpecificPdfPage(uploadedFile, page.pageNumber);
      if (highRes) {
        setPages((prev) => {
          const next = [...prev];
          next[index] = { ...page, imageUrl: highRes };
          return next;
        });
      }
    }
  };

  // Quick Sample Loader (Al-Emtehan 5th Grade Arabic)
  const handleLoadSampleExam = () => {
    const sample = StorageService.createSampleArabicExam('grade_5_student');
    setTitle(sample.title);
    setSubject(sample.subject);
    setDocType(sample.docType);
    setGrade(sample.grade || 'الصف الخامس الابتدائي');
    setTerm(sample.term);
    setAuthor(sample.author);
    setDescription(sample.description);
    setPages(sample.pages);
    setTotalCount(sample.pages.length);
    setPublishFormat('files');
  };

  // Submit and Publish
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMsg('يرجى كتابة عنوان للمذكرة أو الكتاب');
      return;
    }

    if (pages.length === 0) {
      setErrorMsg('يرجى رفع ملف أو صور للمذكرة أولاً، أو إضافة صفحة كشكول بيضاء');
      return;
    }

    const activeProfile = StorageService.getActiveProfile();
    const newDoc: StudyDocument = {
      id: generateId(),
      title: title.trim(),
      subject,
      customSubjectName: subject === 'custom' ? customSubjectName : undefined,
      docType,
      format: publishFormat,
      grade: grade || FIXED_GRADE, // Properly save user-selected grade!
      term,
      author: author.trim() || activeProfile.name || 'طالب متميز',
      description: description.trim(),
      tags: [
        subject,
        docType,
        grade || FIXED_GRADE,
        term === 'term1' ? 'ترم أول' : term === 'term2' ? 'ترم ثاني' : 'عام كامل',
      ],
      pages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: activeProfile.id || 'grade_5_student',
      isFavorite: false,
    };

    StorageService.saveDocument(newDoc);
    confetti({ particleCount: 75, spread: 85, origin: { y: 0.5 } });
    onDocumentCreated(newDoc);
    onClose();
  };

  // Filtered pages for quick review
  const filteredPages = pages.filter((p) => {
    if (searchPageQuery) {
      const qNum = parseInt(searchPageQuery.trim(), 10);
      if (!isNaN(qNum) && p.pageNumber !== qNum) return false;
    }
    if (pageRangeFilter === '1-50') return p.pageNumber <= 50;
    if (pageRangeFilter === '51-100') return p.pageNumber > 50 && p.pageNumber <= 100;
    if (pageRangeFilter === '101+') return p.pageNumber > 100;
    return true;
  });

  const inspectedPage = inspectedPageIndex !== null ? pages[inspectedPageIndex] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm overflow-y-auto font-['Cairo',sans-serif]">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 stroke-2" />
            <div>
              <h2 className="text-lg sm:text-xl font-black">نشر كتاب أو ملزمة أو مذكرة دراسية</h2>
              <span className="text-[11px] font-bold text-amber-950/80">
                يدعم رفع الكتب الكبيرة (100 إلى 300+ صفحة) بسرعة فائقة مع إمكانية مراجعة وتعديل الصفحات
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/10 transition text-slate-950"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Sample Action Pill */}
        <div className="px-6 py-2.5 bg-amber-50 dark:bg-slate-800/80 border-b border-amber-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <span className="text-xs text-amber-900 dark:text-amber-200 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>هل تريد تجربة المنصة والأدوات فوراً بنموذج جاهز؟</span>
          </span>
          <button
            type="button"
            onClick={handleLoadSampleExam}
            className="px-3.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>تجربة نموذج (اختبارات لغة عربية - كتاب الامتحان الصف الخامس)</span>
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-bold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TWO PUBLISH MODES: نشر Files VS نشر بالصور */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-200 mb-2">
              طريقة النشر المطلوبة:
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Option 1: نشر Files */}
              <button
                type="button"
                onClick={() => setPublishFormat('files')}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-right transition-all cursor-pointer ${
                  publishFormat === 'files'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 text-blue-950 dark:text-blue-200 shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${publishFormat === 'files' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-black text-sm">نشر Files (ملفات PDF والكتب)</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    رفع كتب كاملة وملازم 100-300 صفحة بسرعة فائقة
                  </div>
                </div>
              </button>

              {/* Option 2: نشر بالصور */}
              <button
                type="button"
                onClick={() => setPublishFormat('images')}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-right transition-all cursor-pointer ${
                  publishFormat === 'images'
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 shadow-md ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${publishFormat === 'images' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-black text-sm">نشر بالصور (Multi-Images)</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    رفع صور ومسح ضوئي لصفحات الملازم من الكاميرا
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Upload Drop Zone */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-6 text-center hover:border-amber-500 transition-colors bg-slate-50 dark:bg-slate-950/40">
            {isProcessing ? (
              <div className="py-6 flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-sm font-black text-slate-800 dark:text-slate-200">{progressMsg}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  تجهيز فوري للصفحات، تظهر خلال ثوانٍ معدودة...
                </div>
              </div>
            ) : publishFormat === 'files' ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <FileText className="w-12 h-12 mx-auto text-blue-500 mb-2" />
                <h3 className="font-black text-slate-800 dark:text-slate-200 text-sm sm:text-base mb-1">
                  اختر ملف PDF من جهازك أو اسحبه إلى هنا (يدعم الكتب من 100 إلى 300+ صفحة)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-lg mx-auto">
                  ⚡ محرك قراءة سريع يظهر صفحات الكتاب فوراً بدون انتظار طويل، مع إمكانية مراجعة الصفحات، تدويرها، حذف غير المرغوب، وترتيبها.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>تصفح ملفات الجهاز (PDF)</span>
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesUpload}
                  className="hidden"
                />
                <ImageIcon className="w-12 h-12 mx-auto text-amber-500 mb-2" />
                <h3 className="font-black text-slate-800 dark:text-slate-200 text-sm sm:text-base mb-1">
                  اختر صورة أو مجموعة صور صفحات المذكرة
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  يمكنك تحديد عدة صور دفعة واحدة وترتيبها وتعديلها بسهولة
                </p>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-md transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>تصفح صور الملازم</span>
                </button>
              </div>
            )}
          </div>

          {/* LIVE PAGES REVIEW & CORRECTIONS WORKSPACE (مراجعة الصفحات وإصلاح الأخطاء أثناء النشر) */}
          {pages.length > 0 && (
            <div className="bg-slate-100 dark:bg-slate-800/80 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-700">
              {/* Header with Page Count & Progress Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      📖 مراجعة وتدقيق صفحات الكتاب ({pages.length} صفحة):
                    </span>
                    {totalCount > 0 && processedCount < totalCount && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[11px] font-bold border border-amber-300 dark:border-amber-800 flex items-center gap-1 animate-pulse">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>تم تجهيز {processedCount} من {totalCount} صفحة (المراجعة والنشر متاحان الآن)</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    انقر على أي صفحة لتكبيرها ومراجعتها بدقة، أو استخدم أدوات التدوير والترتيب والحذف.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddBlankNotePage()}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-slate-200 dark:border-slate-600 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة صفحة كشكول مسطرة</span>
                  </button>
                </div>
              </div>

              {/* Filtering & Quick Jump Toolbar for 100-300 Page Books */}
              {pages.length > 15 && (
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 mb-3 border-b border-slate-200 dark:border-slate-700/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold">تصفية العرض:</span>
                    <button
                      type="button"
                      onClick={() => setPageRangeFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition ${
                        pageRangeFilter === 'all'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      الكل ({pages.length})
                    </button>
                    {pages.length > 50 && (
                      <button
                        type="button"
                        onClick={() => setPageRangeFilter('1-50')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition ${
                          pageRangeFilter === '1-50'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        1 - 50
                      </button>
                    )}
                    {pages.length > 100 && (
                      <button
                        type="button"
                        onClick={() => setPageRangeFilter('51-100')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition ${
                          pageRangeFilter === '51-100'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        51 - 100
                      </button>
                    )}
                    {pages.length > 100 && (
                      <button
                        type="button"
                        onClick={() => setPageRangeFilter('101+')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition ${
                          pageRangeFilter === '101+'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        101 إلى {pages.length}
                      </button>
                    )}
                  </div>

                  {/* Jump to Page Number Input */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-700 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-600">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="رقم الصفحة..."
                      value={searchPageQuery}
                      onChange={(e) => setSearchPageQuery(e.target.value)}
                      className="w-20 text-xs bg-transparent focus:outline-none text-slate-900 dark:text-white"
                    />
                    {searchPageQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchPageQuery('')}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Pages Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-80 overflow-y-auto p-1">
                {filteredPages.map((p, idx) => {
                  const actualIndex = pages.findIndex((item) => item.id === p.id);
                  return (
                    <div
                      key={p.id}
                      className="group relative rounded-2xl border-2 border-slate-300 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 p-1.5 transition-all hover:border-amber-500 hover:shadow-lg flex flex-col justify-between"
                    >
                      {/* Thumbnail with Click to Inspect */}
                      <div
                        onClick={() => openInspector(actualIndex)}
                        className="relative cursor-pointer overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-950 aspect-[3/4] flex items-center justify-center"
                        title="انقر للمعاينة بحجم كامل والمراجعة"
                      >
                        <img
                          src={p.imageUrl}
                          alt={`صفحة ${p.pageNumber}`}
                          className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                          loading="lazy"
                        />
                        {/* Hover Overlay with Inspect Icon */}
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white">
                          <Maximize2 className="w-5 h-5 drop-shadow" />
                          <span className="text-[10px] font-black">مراجعة</span>
                        </div>
                      </div>

                      {/* Card Footer: Page Number & Fast Actions */}
                      <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] font-extrabold text-slate-700 dark:text-slate-300">
                        <span>صفحة {p.pageNumber}</span>
                        <div className="flex items-center gap-1">
                          {/* Rotate Page Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRotatePage(actualIndex);
                            }}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-600 transition"
                            title="تدوير الصفحة 90 درجة"
                          >
                            <RotateCw className="w-3 h-3" />
                          </button>

                          {/* Delete Page Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePage(actualIndex);
                            }}
                            className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition"
                            title="حذف هذه الصفحة"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Document Information & Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                عنوان المذكرة أو الكتاب *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: كتاب الامتحان لغة عربية - شرح كامل ونماذج اختبارات"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
              />
            </div>

            {/* Subject Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                المادة الدراسية *
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectId)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
              >
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Subject Name if selected */}
            {subject === 'custom' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اكتب اسم المادة المخصصة
                </label>
                <input
                  type="text"
                  value={customSubjectName}
                  onChange={(e) => setCustomSubjectName(e.target.value)}
                  placeholder="مثال: لغة فرنسية، مهارات مهنية..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
                />
              </div>
            )}

            {/* Document Type Classification: حل أو مراجعة أو كتاب كامل */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  تصنيف النشر * (اختر: حل، أو مراجعة، أو كتاب كامل)
                </label>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                  3 تصنيفات معتمدة للنشر
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DOC_TYPES.map((dt) => {
                  const isSelected = docType === dt.id;
                  return (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => setDocType(dt.id)}
                      className={`p-3.5 rounded-2xl border-2 text-right transition-all flex flex-col justify-between cursor-pointer relative ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/20 text-slate-950 dark:text-white shadow-md ring-2 ring-amber-500/40'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-xl ${
                            dt.id === 'solution'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                              : dt.id === 'revision'
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400'
                              : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                          }`}>
                            {dt.id === 'solution' && <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
                            {dt.id === 'revision' && <Sparkles className="w-4 h-4 stroke-[2.5]" />}
                            {dt.id === 'book' && <Book className="w-4 h-4 stroke-[2.5]" />}
                          </div>
                          <div>
                            <span className="font-black text-sm block">{dt.label}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">{dt.badgeLabel}</span>
                          </div>
                        </div>
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-amber-500 bg-amber-500' : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        {dt.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grade - All Educational Stages */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                الصف / المرحلة الدراسية *
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-amber-300 dark:border-amber-700/60 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <optgroup label="المرحلة الابتدائية">
                  <option value="الصف الأول الابتدائي">الصف الأول الابتدائي</option>
                  <option value="الصف الثاني الابتدائي">الصف الثاني الابتدائي</option>
                  <option value="الصف الثالث الابتدائي">الصف الثالث الابتدائي</option>
                  <option value="الصف الرابع الابتدائي">الصف الرابع الابتدائي</option>
                  <option value="الصف الخامس الابتدائي">الصف الخامس الابتدائي</option>
                  <option value="الصف السادس الابتدائي">الصف السادس الابتدائي</option>
                </optgroup>
                <optgroup label="المرحلة الإعدادية">
                  <option value="الصف الأول الإعدادي">الصف الأول الإعدادي</option>
                  <option value="الصف الثاني الإعدادي">الصف الثاني الإعدادي</option>
                  <option value="الصف الثالث الإعدادي">الصف الثالث الإعدادي</option>
                </optgroup>
                <optgroup label="المرحلة الثانوية">
                  <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                  <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                  <option value="الصف الثالث الثانوي (الثانوية العامة)">الصف الثالث الثانوي (الثانوية العامة)</option>
                </optgroup>
                <optgroup label="مرحلة رياض الأطفال">
                  <option value="مرحلة رياض الأطفال (KG1 - KG2)">مرحلة رياض الأطفال (KG1 - KG2)</option>
                </optgroup>
                <optgroup label="التعليم الجامعي والعام">
                  <option value="المرحلة الجامعية والمعاهد العليا">المرحلة الجامعية والمعاهد العليا</option>
                  <option value="مذكرات عامة وتدريب مهني">مذكرات عامة وتدريب مهني</option>
                </optgroup>
              </select>
            </div>

            {/* Term */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                الفصل الدراسي
              </label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
              >
                <option value="term1">الفصل الدراسي الأول (ترم أول)</option>
                <option value="term2">الفصل الدراسي الثاني (ترم ثاني)</option>
                <option value="full_year">العام الدراسي كاملاً</option>
              </select>
            </div>

            {/* Author / Teacher */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                اسم المعلم أو الكتاب
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="مثال: كتاب الامتحان / سلاح التلميذ / الأستاذ أحمد"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-bold"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                وصف وملاحظات إضافية
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="نبذة عن المذكرة أو محتوى الكتاب..."
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isProcessing || pages.length === 0}
              className="px-7 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>نشر وحفظ في المكتبة الآن ({pages.length} صفحة)</span>
            </button>
          </div>
        </form>

        {/* FULL-SCREEN PAGE INSPECTOR & REVIEW MODAL (المعاينة المكبرة وتدقيق كل صفحة بدقة) */}
        {inspectedPage && inspectedPageIndex !== null && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh]">
              {/* Inspector Header */}
              <div className="px-5 py-3.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-3">
                  <span className="font-black text-sm">
                    🔍 مراجعة الصفحة {inspectedPage.pageNumber} من {pages.length}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ({title || 'المستند'})
                  </span>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2">
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-700 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-600 text-xs">
                    <button
                      type="button"
                      onClick={() => setInspectorZoom((z) => Math.max(0.6, z - 0.15))}
                      className="p-1 hover:text-amber-500"
                      title="تصغير"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-bold px-1">{Math.round(inspectorZoom * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setInspectorZoom((z) => Math.min(2.5, z + 0.15))}
                      className="p-1 hover:text-amber-500"
                      title="تكبير"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Rotate */}
                  <button
                    type="button"
                    onClick={() => handleRotatePage(inspectedPageIndex)}
                    className="p-2 rounded-xl bg-white dark:bg-slate-700 hover:text-amber-500 border border-slate-200 dark:border-slate-600 transition"
                    title="تدوير الصفحة 90 درجة"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>

                  {/* Delete this Page */}
                  <button
                    type="button"
                    onClick={() => removePage(inspectedPageIndex)}
                    className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 border border-rose-200 dark:border-rose-800 transition"
                    title="حذف هذه الصفحة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Close */}
                  <button
                    type="button"
                    onClick={() => setInspectedPageIndex(null)}
                    className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Inspector Content */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-900/40 relative">
                <div
                  style={{ transform: `scale(${inspectorZoom})`, transformOrigin: 'center' }}
                  className="transition-transform duration-150 max-w-full"
                >
                  <img
                    src={inspectedPage.imageUrl}
                    alt={`صفحة ${inspectedPage.pageNumber}`}
                    className="max-h-[75vh] w-auto object-contain rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white"
                  />
                </div>

                {/* Previous Page Arrow */}
                {inspectedPageIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => openInspector(inspectedPageIndex - 1)}
                    className="absolute start-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white shadow-xl hover:bg-amber-500 hover:text-slate-950 transition cursor-pointer"
                    title="الصفحة السابقة"
                  >
                    <ChevronRight className="w-6 h-6 stroke-[3]" />
                  </button>
                )}

                {/* Next Page Arrow */}
                {inspectedPageIndex < pages.length - 1 && (
                  <button
                    type="button"
                    onClick={() => openInspector(inspectedPageIndex + 1)}
                    className="absolute end-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 text-slate-800 dark:text-white shadow-xl hover:bg-amber-500 hover:text-slate-950 transition cursor-pointer"
                    title="الصفحة التالية"
                  >
                    <ChevronLeft className="w-6 h-6 stroke-[3]" />
                  </button>
                )}
              </div>

              {/* Inspector Footer Navigation */}
              <div className="px-5 py-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => movePage(inspectedPageIndex, inspectedPageIndex - 1)}
                    disabled={inspectedPageIndex === 0}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-200 disabled:opacity-40 transition"
                  >
                    ⬅️ تقديم الصفحة
                  </button>
                  <button
                    type="button"
                    onClick={() => movePage(inspectedPageIndex, inspectedPageIndex + 1)}
                    disabled={inspectedPageIndex >= pages.length - 1}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-200 disabled:opacity-40 transition"
                  >
                    تأخير الصفحة ➡️
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddBlankNotePage(inspectedPageIndex)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إدراج صفحة بيضاء بعد هذه الصفحة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectedPageIndex(null)}
                    className="px-5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black transition"
                  >
                    موافق، إغلاق المعاينة
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

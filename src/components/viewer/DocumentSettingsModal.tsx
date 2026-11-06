import React from 'react';
import { 
  Settings, 
  X, 
  BrainCircuit, 
  FileText, 
  Printer, 
  Download, 
  Image as ImageIcon,
  Sun, 
  Moon, 
  BookOpen, 
  Focus, 
  Bell, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  LayoutGrid, 
  Plus, 
  Bookmark, 
  Sparkles,
  Layers,
  Share2,
  StickyNote
} from 'lucide-react';
import { StudyDocument, DocumentPage, SubjectInfo } from '../../types';

interface DocumentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: StudyDocument;
  currentPage: DocumentPage;
  currentPageIndex: number;
  subjectInfo: SubjectInfo;
  
  // AI Actions
  showAiTutor: boolean;
  onToggleAiTutor: () => void;
  showQuickNotes?: boolean;
  onToggleQuickNotes?: () => void;
  
  // Display & Zoom Actions
  zoom: number;
  onSetZoom: (zoom: number | ((prev: number) => number)) => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  showThumbnails: boolean;
  onToggleThumbnails: () => void;
  
  // Reading & Color Modes
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isSepiaMode: boolean;
  onToggleSepiaMode: () => void;
  
  // Pages
  onAddBlankPage: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  
  // Export & Print
  isExporting: boolean;
  onExportPdf: () => void;
  onExportCurrentPage: () => void;
  onPrint: () => void;
  
  // Reminders & Delete
  onOpenReminder?: () => void;
  onDeleteDocument: () => void;
}

export const DocumentSettingsModal: React.FC<DocumentSettingsModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  currentPage,
  currentPageIndex,
  subjectInfo,
  
  showAiTutor,
  onToggleAiTutor,
  showQuickNotes = false,
  onToggleQuickNotes,
  
  zoom,
  onSetZoom,
  focusMode,
  onToggleFocusMode,
  showThumbnails,
  onToggleThumbnails,
  
  darkMode,
  onToggleDarkMode,
  isSepiaMode,
  onToggleSepiaMode,
  
  onAddBlankPage,
  isBookmarked,
  onToggleBookmark,
  
  isExporting,
  onExportPdf,
  onExportCurrentPage,
  onPrint,
  
  onOpenReminder,
  onDeleteDocument,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 font-['Cairo',sans-serif]">
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-amber-500/80 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>إعدادات وخيارات المذكرة</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                  {doc.title}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                جميع أدوات العرض، الشرح بالذكاء الاصطناعي، التصدير، والطباعة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Categorized Options */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
          
          {/* Section 1: AI Tutor Assistant */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-black text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
              <span>المساعد الذكي للمذاكرة</span>
            </div>

            <div>
              {/* AI Tutor Toggle */}
              <button
                type="button"
                onClick={() => {
                  onToggleAiTutor();
                  onClose();
                }}
                className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border transition text-start cursor-pointer group ${
                  showAiTutor
                    ? 'bg-purple-500/15 border-purple-400 text-purple-950 dark:text-purple-200 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>المعلم الذكي AI</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${showAiTutor ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                      {showAiTutor ? 'مفتوح بجانب المذكرة 🟢' : 'مغلق'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    لوحة جانبية ذكية لحل التمارين وسؤال المعلم عن أي مسألة أو كلمة في الصفحة
                  </div>
                </div>
              </button>

              {/* Quick Notes Toggle */}
              {onToggleQuickNotes && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleQuickNotes();
                    onClose();
                  }}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border transition text-start cursor-pointer group mt-2 ${
                    showQuickNotes
                      ? 'bg-amber-500/15 border-amber-400 text-amber-950 dark:text-amber-200 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition">
                    <StickyNote className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>الملاحظات النصية السريعة (Firebase)</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${showQuickNotes ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {showQuickNotes ? 'مفتوحة جانب المذكرة 📝' : 'مغلقة'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      تدوين ملاحظات نصية جانبية أثناء المذاكرة وتخزينها سحابياً في Firebase لكل مستخدم
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Section 3: Reading Modes (Lighting & Comfort) */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-300">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>أوضاع القراءة والإضاءة</span>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              {/* Day */}
              <button
                type="button"
                onClick={() => {
                  if (darkMode) onToggleDarkMode();
                  if (isSepiaMode) onToggleSepiaMode();
                }}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-black transition cursor-pointer ${
                  !darkMode && !isSepiaMode
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4 mb-1 text-amber-900 fill-amber-500" />
                <span>وضع صباح</span>
              </button>

              {/* Sepia */}
              <button
                type="button"
                onClick={onToggleSepiaMode}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-black transition cursor-pointer ${
                  isSepiaMode
                    ? 'bg-[#d8a86a] text-slate-950 shadow-xs ring-1 ring-amber-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4 mb-1" />
                <span>مريح (Sepia)</span>
              </button>

              {/* Night */}
              <button
                type="button"
                onClick={() => {
                  if (!darkMode) onToggleDarkMode();
                  if (isSepiaMode) onToggleSepiaMode();
                }}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-black transition cursor-pointer ${
                  darkMode && !isSepiaMode
                    ? 'bg-slate-900 text-amber-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Moon className="w-4 h-4 mb-1 text-indigo-400 fill-indigo-400" />
                <span>وضع ليل</span>
              </button>
            </div>
          </div>

          {/* Section 3: Zoom & Display Controls */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-300">
              <ZoomIn className="w-4 h-4 text-blue-500" />
              <span>التحكم في التكبير والرؤية</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSetZoom((z: number) => Math.max(0.6, z - 0.1))}
                  className="p-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 shadow-2xs transition"
                  title="تصغير"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs font-black px-2 text-slate-800 dark:text-slate-100">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => onSetZoom((z: number) => Math.min(2.2, z + 0.1))}
                  className="p-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 shadow-2xs transition"
                  title="تكبير"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onSetZoom(1.0)}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-2xs transition"
                >
                  100%
                </button>
              </div>

              {/* Focus Mode & Thumbnails Toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onToggleFocusMode();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-black transition flex items-center gap-1.5"
                >
                  <Focus className="w-4 h-4" />
                  <span>وضع التركيز</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onToggleThumbnails();
                    onClose();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                    showThumbnails
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>فهرس الصفحات</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Export, Print & Pages */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-300">
              <Download className="w-4 h-4 text-emerald-500" />
              <span>الطباعة، التصدير، والصفحات</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* PDF Export */}
              <button
                type="button"
                onClick={() => {
                  onExportPdf();
                  onClose();
                }}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white font-black text-xs shadow-md transition cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>{isExporting ? 'جاري التصدير...' : 'تصدير PDF كامل'}</span>
              </button>

              {/* Print Document */}
              <button
                type="button"
                onClick={() => {
                  onPrint();
                  onClose();
                }}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-black text-xs shadow-md transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة مباشرة</span>
              </button>

              {/* Add blank lined page */}
              <button
                type="button"
                onClick={() => {
                  onAddBlankPage();
                  onClose();
                }}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة صفحة كشكول</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={onToggleBookmark}
                className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 hover:text-amber-500 transition cursor-pointer"
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span>{isBookmarked ? 'إزالة الإشارة المرجعية' : 'إضافة إشارة مرجعية للصفحة الحالية'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onExportCurrentPage();
                  onClose();
                }}
                className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-400 hover:text-blue-500 transition cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>تصدير الصفحة صورة PNG</span>
              </button>
            </div>
          </div>

          {/* Section 5: Study Reminder & Danger Zone (Delete) */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            {onOpenReminder && (
              <button
                type="button"
                onClick={() => {
                  onOpenReminder();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 hover:bg-amber-100 rounded-xl text-xs font-black border border-amber-300 dark:border-amber-800 transition cursor-pointer"
              >
                <Bell className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>ضبط تنبيه مذاكرة لهذه المذكرة</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (confirm('هل أنت متأكد من مسح هذه المذكرة نهائياً؟')) {
                  onDeleteDocument();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white rounded-xl text-xs font-black transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>مسح المذكرة</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>الصفحة الحالية: {currentPageIndex + 1} من {doc.pages.length}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-900 dark:text-white font-black transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

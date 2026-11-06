import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  FileText, 
  Check, 
  Layers, 
  Eye, 
  CheckCircle2, 
  Sliders, 
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { StudyDocument, DocumentPage, SUBJECTS } from '../../types';

interface DocumentPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: StudyDocument;
  initialPageIndex?: number;
}

export const DocumentPrintModal: React.FC<DocumentPrintModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  initialPageIndex = 0,
}) => {
  const [printScope, setPrintScope] = useState<'all' | 'single'>('all');
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(initialPageIndex);
  const [includeAnnotations, setIncludeAnnotations] = useState<boolean>(true);
  const [pageCopies, setPageCopies] = useState<number>(1);

  useEffect(() => {
    setSelectedPageIndex(initialPageIndex);
  }, [initialPageIndex]);

  if (!isOpen) return null;

  const subjectInfo = SUBJECTS.find((s) => s.id === doc.subject);
  const pagesToPrint = printScope === 'all' 
    ? doc.pages 
    : [doc.pages[selectedPageIndex] || doc.pages[0]];

  const handlePrint = () => {
    // Add temporary print class to document body
    document.body.classList.add('in-print-mode');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('in-print-mode');
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs font-['Cairo',sans-serif] animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header (Hidden in physical print via CSS) */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Printer className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                  وضع طباعة المذكرة
                </span>
                <span className="text-xs font-bold text-purple-200">
                  {doc.grade}
                </span>
              </div>
              <h3 className="text-lg font-black tracking-tight mt-0.5">
                {doc.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black shadow-md transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>بدء الطباعة الآن</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-black/20 hover:bg-black/30 text-white transition cursor-pointer"
              title="إغلاق وضع الطباعة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Configuration Controls Bar (Hidden in physical print) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-bold no-print">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 dark:text-slate-400">نطاق الطباعة:</span>
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setPrintScope('all')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  printScope === 'all'
                    ? 'bg-purple-600 text-white shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                كامل المذكرة ({doc.pages.length} صفحات)
              </button>
              <button
                type="button"
                onClick={() => setPrintScope('single')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  printScope === 'single'
                    ? 'bg-purple-600 text-white shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                صفحة معينة فقط
              </button>
            </div>

            {printScope === 'single' && (
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <span>الصفحة:</span>
                <select
                  value={selectedPageIndex}
                  onChange={(e) => setSelectedPageIndex(Number(e.target.value))}
                  className="bg-transparent font-black text-purple-600 dark:text-purple-400 focus:outline-none"
                >
                  {doc.pages.map((p, idx) => (
                    <option key={p.id} value={idx}>
                      صفحة {p.pageNumber}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeAnnotations}
                onChange={(e) => setIncludeAnnotations(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <span className="text-slate-700 dark:text-slate-300">
                تضمين الرسومات والملاحظات والحلول بالقلم
              </span>
            </label>

            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black flex items-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة ({pagesToPrint.length} {pagesToPrint.length === 1 ? 'صفحة' : 'صفحات'})</span>
            </button>
          </div>
        </div>

        {/* Printable Document Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950 printable-document-area">
          <div className="max-w-2xl mx-auto space-y-8">
            {pagesToPrint.map((page, idx) => (
              <div
                key={page.id}
                className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 print-page-break print:p-0 print:border-none print:shadow-none"
              >
                {/* Print Sheet Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-purple-700 text-sm">منصة قلمي التعليمية</span>
                    <span>•</span>
                    <span className="font-extrabold">{doc.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">{doc.grade}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono">
                      صفحة {page.pageNumber} من {doc.pages.length}
                    </span>
                  </div>
                </div>

                {/* Page Content Image */}
                <div className="relative flex items-center justify-center bg-slate-50 rounded-xl overflow-hidden border border-slate-100 print:border-none print:bg-white">
                  <img
                    src={page.imageUrl}
                    alt={`صفحة ${page.pageNumber}`}
                    className="w-full h-auto object-contain max-h-[85vh] print:max-h-none"
                  />
                </div>

                {/* Print Sheet Footer */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>تمت الطباعة عبر منصة قلمي - {subjectInfo?.nameAr || 'المادة'}</span>
                  <span>المعلم / الناشر: {doc.author || 'منصة قلمي'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

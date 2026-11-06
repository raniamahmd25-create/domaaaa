import React, { useState } from 'react';
import { X, Download, FileCode, Check, Sparkles, Copy, ExternalLink } from 'lucide-react';

interface DownloadCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadCodeModal: React.FC<DownloadCodeModalProps> = ({ isOpen, onClose }) => {
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloadedFile(filename);
    setTimeout(() => setDownloadedFile(null), 3000);
  };

  const handleDownloadAll = () => {
    triggerDownload('/download/index.html', 'index.html');
    setTimeout(() => triggerDownload('/download/scrip.css', 'scrip.css'), 400);
    setTimeout(() => triggerDownload('/download/script.js', 'script.js'), 800);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto font-['Cairo',sans-serif] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="تحميل ملفات الموقع"
      >
        {/* Header */}
        <header className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md">
              <Download className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>تحميل ملفات كود الموقع</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold">
                  جاهز للتحميل
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                الملفات الثلاثة المطلوبة (HTML, CSS, JS) تعمل معاً بدون أي برامج إضافية
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

        {/* Files List */}
        <div className="p-5 space-y-3">
          {/* File 1: index.html */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black text-xs shadow-xs">
                HTML
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">index.html</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  الهيكل الأساسي للموقع، الأقسام، المذكرات، والقلم الذكي
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => triggerDownload('/download/index.html', 'index.html')}
              className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {downloadedFile === 'index.html' ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              <span>{downloadedFile === 'index.html' ? 'تم التحميل!' : 'تحميل 📥'}</span>
            </button>
          </div>

          {/* File 2: scrip.css */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs shadow-xs">
                CSS
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">scrip.css</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  ملف التنسيقات الكامل، الوضع الليلي والصباحي، وخط كايرو
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => triggerDownload('/download/scrip.css', 'scrip.css')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {downloadedFile === 'scrip.css' ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              <span>{downloadedFile === 'scrip.css' ? 'تم التحميل!' : 'تحميل 📥'}</span>
            </button>
          </div>

          {/* File 3: script.js */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-black text-xs shadow-xs">
                JS
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">script.js</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  كود الجافاسكربت، القلم الإلكتروني، والحفظ التلقائي في localStorage
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => triggerDownload('/download/script.js', 'script.js')}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {downloadedFile === 'script.js' ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              <span>{downloadedFile === 'script.js' ? 'تم التحميل!' : 'تحميل 📥'}</span>
            </button>
          </div>

          {/* File 4: index.css */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-xs shadow-xs">
                CSS
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">index.css</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  ملف Tailwind CSS الرئيسي، قواعد الطباعة وقوائم HTML5
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => triggerDownload('/download/index.css', 'index.css')}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {downloadedFile === 'index.css' ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              <span>{downloadedFile === 'index.css' ? 'تم التحميل!' : 'تحميل 📥'}</span>
            </button>
          </div>
        </div>

        {/* Footer with "Download All" */}
        <footer className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-3">
          <a
            href="/download/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>معاينة في تبويب جديد</span>
          </a>

          <button
            type="button"
            onClick={handleDownloadAll}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md active:scale-95 transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[3]" />
            <span>تحميل الملفات الثلاثة معاً 📦</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

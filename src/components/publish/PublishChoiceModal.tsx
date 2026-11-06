import React from 'react';
import { 
  X, 
  FileText, 
  Video, 
  HelpCircle, 
  Sparkles, 
  Film, 
  Camera, 
  BookOpen, 
  CheckCircle2, 
  ArrowLeft 
} from 'lucide-react';

interface PublishChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChooseBooklet: () => void;
  onChooseVideo: () => void;
  onChooseQuiz: () => void;
}

export const PublishChoiceModal: React.FC<PublishChoiceModalProps> = ({
  isOpen,
  onClose,
  onChooseBooklet,
  onChooseVideo,
  onChooseQuiz,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto font-['Cairo',sans-serif] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="خيارات نشر المحتوى التعليمي"
      >
        {/* Header */}
        <header className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-md">
              <Sparkles className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                ماذا تريد أن تنشر اليوم؟ 🚀
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                اختر نوع المحتوى الذي تود مشاركته مع زملائك والطلاب على المنصة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* 3 Main Publishing Choices */}
        <div className="p-5 sm:p-6 space-y-3.5">
          {/* 1. نشر مذكرة أو كتاب */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onChooseBooklet();
            }}
            className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500/80 bg-white hover:bg-amber-50/40 dark:bg-slate-900 dark:hover:bg-amber-950/20 transition-all text-start flex items-center justify-between gap-4 group cursor-pointer shadow-xs hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition shadow-xs">
                <FileText className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                    1. نشر مذكرة أو ملزمة أو كتاب
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                    PDF وصور
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  رفع ونشر ملازم، مراجعات ليلة الامتحان، كتب مدرسية، مع دعم الكتابة بالقلم الإلكتروني.
                </p>
              </div>
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:-translate-x-1 transition shrink-0" />
          </button>

          {/* 2. نشر Shorts أو درس */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onChooseVideo();
            }}
            className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500/80 bg-white hover:bg-amber-50/40 dark:bg-slate-900 dark:hover:bg-amber-950/20 transition-all text-start flex items-center justify-between gap-4 group cursor-pointer shadow-xs hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition shadow-xs">
                <Camera className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                    2. نشر Shorts أو درس فيديو
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                    كاميرا وفلاتر
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  افتح كاميرا الموبايل مع الكشاف والفلاتر وسجل فيديو (3 دقائق أو أقل = Shorts، أطول = درس كامل).
                </p>
              </div>
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:-translate-x-1 transition shrink-0" />
          </button>

          {/* 3. نشر أسئلة تفاعلية */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onChooseQuiz();
            }}
            className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500/80 bg-white hover:bg-amber-50/40 dark:bg-slate-900 dark:hover:bg-amber-950/20 transition-all text-start flex items-center justify-between gap-4 group cursor-pointer shadow-xs hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition shadow-xs">
                <HelpCircle className="w-7 h-7 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                    3. نشر أسئلة تفاعلية (كويز)
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                    اختبار ذكي
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  حدد مدة الاختبار، عدد الأسئلة، زمن كل سؤال، وأضف خيارات الإجابات مع زر (+) وإجابة نموذجية.
                </p>
              </div>
            </div>
            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-amber-500 group-hover:-translate-x-1 transition shrink-0" />
          </button>
        </div>

        {/* Footer */}
        <footer className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 font-bold">
          ★ تبدأ جميع الفيديوهات والمنشورات الجديدة دائماً بـ 0 لايكات ومطابقة لمعايير يوتيوب وتيك توك
        </footer>
      </div>
    </div>
  );
};

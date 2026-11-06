import React from 'react';
import { StudyReminder, SUBJECTS } from '../../types';
import { 
  Bell, 
  Clock, 
  CheckCircle2, 
  Volume2, 
  ExternalLink, 
  X, 
  RotateCw,
  Sparkles,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ReminderSound } from '../../services/reminderSound';

interface StudyAlarmModalProps {
  reminder: StudyReminder | null;
  onClose: () => void;
  onSnooze: (reminderId: string, minutes?: number) => void;
  onComplete: (reminderId: string) => void;
  onOpenDocument?: (docId: string) => void;
}

export const StudyAlarmModal: React.FC<StudyAlarmModalProps> = ({
  reminder,
  onClose,
  onSnooze,
  onComplete,
  onOpenDocument,
}) => {
  if (!reminder) return null;

  const subject = SUBJECTS.find((s) => s.id === reminder.subjectId);
  const subjectName = reminder.customSubjectName || subject?.nameAr || 'المادة الدراسية';

  const handleCompleteClick = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
    onComplete(reminder.id);
  };

  const handleStartStudy = () => {
    if (reminder.linkedDocId && onOpenDocument) {
      onOpenDocument(reminder.linkedDocId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 font-['Cairo',sans-serif]">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-amber-400 dark:border-amber-500 overflow-hidden transform animate-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Animated Top Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-5 text-white relative overflow-hidden">
          {/* Subtle background glow circle */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-slate-950 flex items-center justify-center shadow-lg animate-bounce">
                <Bell className="w-6 h-6 text-amber-600 fill-amber-500" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-block mb-1">
                  ⏰ حان موعد المذاكرة والمراجعة!
                </span>
                <h3 className="text-xl font-black text-white">
                  تنبيه مادة: {subjectName}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition"
              title="إغلاق التنبيه"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Main Task Card */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-black border ${subject?.badgeColor || 'bg-slate-100 text-slate-800'}`}>
                {subjectName}
              </span>
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{reminder.targetTime}</span>
              </div>
            </div>

            <h4 className="text-base font-black text-slate-900 dark:text-white leading-relaxed">
              {reminder.title}
            </h4>

            {reminder.notes && (
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-800/70 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                💡 <span className="font-bold">ملاحظة:</span> {reminder.notes}
              </p>
            )}

            {reminder.linkedDocTitle && (
              <div className="mt-3 flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 p-2 rounded-xl border border-blue-200 dark:border-blue-900">
                <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-bold">المذكرة المرتبطة:</span>
                <span className="truncate">{reminder.linkedDocTitle}</span>
              </div>
            )}
          </div>

          {/* Sound Preview Action */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>مراجعة يومية مجدولة للصف الخامس</span>
            </span>
            <button
              type="button"
              onClick={() => ReminderSound.playStudyChime()}
              className="flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline font-bold"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>إعادة تشغيل النغمة</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {/* Primary Action: Start Study Now */}
            <button
              type="button"
              onClick={handleStartStudy}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <BookOpen className="w-4 h-4 stroke-[2.5]" />
              <span>ابدأ مراجعة المادة الآن 🚀</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              {/* Snooze 5 mins */}
              <button
                type="button"
                onClick={() => onSnooze(reminder.id, 5)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5 text-amber-500" />
                <span>تأجيل 5 دقائق ⏱️</span>
              </button>

              {/* Mark Done */}
              <button
                type="button"
                onClick={handleCompleteClick}
                className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>تم إنجاز المراجعة ✅</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

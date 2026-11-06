import React from 'react';
import { StudyReminder, SUBJECTS } from '../../types';
import { 
  Bell, 
  Clock, 
  Plus, 
  CheckCircle2, 
  Sparkles, 
  Flame,
  CalendarCheck
} from 'lucide-react';

interface QuickReminderWidgetProps {
  reminders: StudyReminder[];
  onOpenRemindersModal: () => void;
  onQuickToggleComplete: (id: string) => void;
}

export const QuickReminderWidget: React.FC<QuickReminderWidgetProps> = ({
  reminders,
  onOpenRemindersModal,
  onQuickToggleComplete,
}) => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  // Get active or today reminders
  const activeReminders = reminders.filter((r) => r.isActive);
  const completedTodayCount = reminders.filter((r) => r.isCompleted).length;

  return (
    <section aria-labelledby="reminders-widget-title" className="mb-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-slate-900/40 p-4 sm:p-5 border border-amber-200/80 dark:border-amber-800/50 shadow-xs font-['Cairo',sans-serif]">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60 dark:border-amber-800/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md shrink-0">
            <Bell className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 id="reminders-widget-title" className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                تذكيرات ومواعيد المراجعة اليومية
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-black">
                {activeReminders.length} تنبيهات مفعلة
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              تنبيهات صوتية وإشعارات لمواعيد مراجعة العربي، الرياضيات وباقي المواد
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenRemindersModal}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-xs hover:shadow-md transition flex items-center gap-1.5 shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>ضبط تنبيه مادة</span>
        </button>
      </header>

      {/* Reminders List */}
      <div className="pt-3">
        {activeReminders.length === 0 ? (
          <div className="flex items-center justify-between py-2 text-xs text-slate-500 dark:text-slate-400">
            <span>لا توجد تنبيهات مفعلة حالياً. اضغط «ضبط تنبيه مادة» لتحديد موعد مراجعة!</span>
            <button
              type="button"
              onClick={onOpenRemindersModal}
              className="text-amber-600 dark:text-amber-400 font-bold hover:underline"
            >
              فتح جدول التنبيهات
            </button>
          </div>
        ) : (
          <ul role="list" aria-label="قائمة التنبيهات السريعة" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 list-none p-0 m-0">
            {activeReminders.slice(0, 3).map((rem) => {
              const subject = SUBJECTS.find((s) => s.id === rem.subjectId);
              const subjectName = rem.customSubjectName || subject?.nameAr || 'المادة';

              return (
                <li key={rem.id} className="list-none p-0 m-0">
                  <article
                    className={`p-2.5 rounded-2xl bg-white dark:bg-slate-900/90 border transition flex items-center justify-between gap-2 shadow-xs ${
                      rem.isCompleted
                        ? 'border-emerald-300 dark:border-emerald-800/60 opacity-70'
                        : 'border-slate-200 dark:border-slate-800 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => onQuickToggleComplete(rem.id)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition ${
                          rem.isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'border border-slate-300 dark:border-slate-600 text-transparent hover:border-emerald-500'
                        }`}
                        title={rem.isCompleted ? 'مكتمل' : 'تحديد كمكتمل'}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-black border ${subject?.badgeColor || 'bg-slate-100 text-slate-800'}`}>
                            {subjectName}
                          </span>
                          {rem.priority === 'high' && (
                            <Flame className="w-3 h-3 text-rose-500 shrink-0" />
                          )}
                        </div>
                        <p className={`text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5 ${rem.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                          {rem.title}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-700 dark:text-amber-400 shrink-0 bg-amber-50 dark:bg-amber-950/50 px-2 py-1 rounded-xl">
                      <Clock className="w-3 h-3" />
                      <time className="font-mono">{rem.targetTime}</time>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}

        {activeReminders.length > 3 && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onOpenRemindersModal}
              className="text-xs text-amber-700 dark:text-amber-300 font-bold hover:underline"
            >
              عرض جميع التنبيهات المتبقية ({activeReminders.length - 3}+)
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

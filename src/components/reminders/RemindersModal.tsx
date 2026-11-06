import React, { useState, useMemo } from 'react';
import { 
  StudyReminder, 
  SubjectId, 
  SUBJECTS, 
  SUBJECT_PRESET_TASKS,
  StudyDocument,
  ReminderRepeatType,
  ReminderPriority
} from '../../types';
import { ReminderService } from '../../services/reminderService';
import { ReminderSound } from '../../services/reminderSound';
import { 
  Bell, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Volume2, 
  Sparkles, 
  X, 
  Calendar, 
  Check, 
  AlertCircle, 
  BookOpen, 
  Settings, 
  Repeat,
  Flame,
  ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents?: StudyDocument[];
  onOpenDocument?: (doc: StudyDocument) => void;
  preselectedDoc?: StudyDocument | null;
  onReminderChanged?: () => void;
}

export const RemindersModal: React.FC<RemindersModalProps> = ({
  isOpen,
  onClose,
  documents = [],
  onOpenDocument,
  preselectedDoc,
  onReminderChanged,
}) => {
  // Active Tab: 'list' | 'create' | 'settings'
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  // Reminders List state
  const [reminders, setReminders] = useState<StudyReminder[]>(() => ReminderService.getReminders());

  // Filter state in list
  const [subjectFilter, setSubjectFilter] = useState<SubjectId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'today' | 'active' | 'completed'>('all');

  // Create Form State
  const [newSubjectId, setNewSubjectId] = useState<SubjectId>(preselectedDoc?.subject || 'arabic');
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [newTitle, setNewTitle] = useState(preselectedDoc ? `مراجعة مذكرة: ${preselectedDoc.title}` : '');
  
  // Default target date is today
  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Default target time is 1 hour from now
  const getDefaultTimeStr = () => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    const h = String(d.getHours()).padStart(2, '0');
    const min = '00';
    return `${h}:${min}`;
  };

  const [newDate, setNewDate] = useState(getTodayStr());
  const [newTime, setNewTime] = useState(getDefaultTimeStr());
  const [newRepeat, setNewRepeat] = useState<ReminderRepeatType>('daily');
  const [newPriority, setNewPriority] = useState<ReminderPriority>('medium');
  const [newNotes, setNewNotes] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>(preselectedDoc?.id || '');

  // Browser notification permission state
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(() => 
    ReminderService.getNotificationPermissionStatus()
  );

  const refreshList = () => {
    setReminders(ReminderService.getReminders());
    if (onReminderChanged) onReminderChanged();
  };

  // Open modal prefilled if preselectedDoc is provided
  React.useEffect(() => {
    if (preselectedDoc) {
      setNewSubjectId(preselectedDoc.subject);
      setNewTitle(`مراجعة مذكرة: ${preselectedDoc.title}`);
      setSelectedDocId(preselectedDoc.id);
      setActiveTab('create');
    }
  }, [preselectedDoc]);

  // Request browser permission
  const handleRequestPermission = async () => {
    const result = await ReminderService.requestNotificationPermission();
    setNotifPermission(result);
    if (result === 'granted') {
      ReminderSound.playStudyChime();
    }
  };

  // Toggle Reminder Active
  const handleToggleActive = (id: string) => {
    ReminderService.toggleActive(id);
    refreshList();
  };

  // Toggle Reminder Completed
  const handleToggleCompleted = (id: string) => {
    const isNowDone = ReminderService.toggleCompleted(id);
    if (isNowDone) {
      try {
        confetti({ particleCount: 60, spread: 60 });
      } catch (e) {}
    }
    refreshList();
  };

  // Delete Reminder
  const handleDeleteReminder = (id: string) => {
    ReminderService.deleteReminder(id);
    refreshList();
  };

  // Test ring now
  const handleTestRing = (rem: StudyReminder) => {
    ReminderService.triggerNotification(rem);
  };

  // Quick preset time helper
  const handleApplyPresetTime = (minsFromNow: number) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minsFromNow);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    setNewDate(`${y}-${m}-${day}`);
    setNewTime(`${h}:${min}`);
  };

  // Save new reminder
  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();

    let finalTitle = newTitle.trim();
    if (!finalTitle) {
      const subj = SUBJECTS.find((s) => s.id === newSubjectId);
      finalTitle = `مراجعة مادة ${subj?.nameAr || 'المادة'}`;
    }

    const linkedDoc = documents.find((d) => d.id === selectedDocId);

    ReminderService.addReminder({
      subjectId: newSubjectId,
      customSubjectName: newSubjectId === 'custom' ? customSubjectName : undefined,
      title: finalTitle,
      targetDate: newDate,
      targetTime: newTime,
      repeatType: newRepeat,
      priority: newPriority,
      notes: newNotes.trim() || undefined,
      linkedDocId: linkedDoc?.id,
      linkedDocTitle: linkedDoc?.title,
    });

    ReminderSound.playStudyChime();
    refreshList();
    setActiveTab('list');

    // Reset some fields
    setNewTitle('');
    setNewNotes('');
  };

  // Filtered Reminders
  const filteredReminders = useMemo(() => {
    const todayStr = getTodayStr();
    return reminders.filter((rem) => {
      if (subjectFilter !== 'all' && rem.subjectId !== subjectFilter) {
        return false;
      }
      if (statusFilter === 'today' && rem.targetDate !== todayStr && rem.repeatType === 'once') {
        return false;
      }
      if (statusFilter === 'active' && (!rem.isActive || rem.isCompleted)) {
        return false;
      }
      if (statusFilter === 'completed' && !rem.isCompleted) {
        return false;
      }
      return true;
    });
  }, [reminders, subjectFilter, statusFilter]);

  if (!isOpen) return null;

  const currentSubjectPresetTasks = SUBJECT_PRESET_TASKS[newSubjectId] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 font-['Cairo',sans-serif]">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-md">
              <Bell className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  جدول وتنبيهات المذاكرة
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800">
                  الصف الخامس
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                اضبط مواعيد وتنبيهات لمراجعة موادك (عربي، رياضيات، علوم، دراسات...)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Notification Banner if not granted */}
        {notifPermission !== 'granted' && (
          <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>فعل إشعارات المتصفح لتتلقى التنبيه الصوتي والنوافذ فور حلول موعد المذاكرة</span>
            </div>
            <button
              type="button"
              onClick={handleRequestPermission}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-black shrink-0 transition"
            >
              تفعيل الإشعارات 🔔
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/40 px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black border-b-2 transition ${
              activeTab === 'list'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>مواعيد المراجعة المجدولة ({reminders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black border-b-2 transition ${
              activeTab === 'create'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ ضبط تنبيه مادة جديدة</span>
          </button>

          {/* Sound Preview in Tab bar */}
          <button
            type="button"
            onClick={() => ReminderSound.playStudyChime()}
            className="mr-auto flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition"
            title="تجربة صوت جرس التنبيه"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">تجربة نغمة التنبيه</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* TAB 1: LIST VIEW */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              {/* Quick Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                      statusFilter === 'all'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    الكل ({reminders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('active')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                      statusFilter === 'active'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    قيد التفعيل
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('completed')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                      statusFilter === 'completed'
                        ? 'bg-emerald-600 text-white font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    تم إنجازها
                  </button>
                </div>

                {/* Subject Selector Filter */}
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value as SubjectId | 'all')}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">جميع المواد الدراسية</option>
                  {SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reminders List */}
              {filteredReminders.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-3">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-1">
                    لا توجد تنبيهات مطابقة لهذا الفلتر
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    اضغط زر «+ ضبط تنبيه مادة جديدة» لإضافة تذكير لمذاكرة العربي، الرياضيات أو أي مادة.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>ضبط تنبيه جديد الآن</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReminders.map((rem) => {
                    const subject = SUBJECTS.find((s) => s.id === rem.subjectId);
                    const subjectName = rem.customSubjectName || subject?.nameAr || 'مادة دراسية';
                    const isDueToday = rem.targetDate === getTodayStr() || rem.repeatType !== 'once';

                    return (
                      <div
                        key={rem.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                          rem.isCompleted
                            ? 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-70'
                            : rem.isActive
                            ? 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 shadow-xs hover:border-amber-400 dark:hover:border-amber-500'
                            : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Right Side: Checkbox & Info */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Complete Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleCompleted(rem.id)}
                              className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition shrink-0 ${
                                rem.isCompleted
                                  ? 'bg-emerald-500 text-white shadow-xs'
                                  : 'border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 text-transparent hover:text-emerald-500'
                              }`}
                              title={rem.isCompleted ? 'إلغاء التحديد' : 'تحديد كمكتمل'}
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                            </button>

                            <div className="min-w-0 flex-1">
                              {/* Subject Badge & Priority & Time */}
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-black border ${subject?.badgeColor || 'bg-slate-100 text-slate-800'}`}>
                                  {subjectName}
                                </span>

                                {rem.priority === 'high' && (
                                  <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900">
                                    <Flame className="w-3 h-3 text-rose-500" />
                                    <span>هام وعاجل</span>
                                  </span>
                                )}

                                <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-700 dark:text-amber-400 mr-auto">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{rem.targetTime}</span>
                                </div>
                              </div>

                              {/* Title */}
                              <h4 className={`text-sm font-black text-slate-900 dark:text-white leading-snug ${rem.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                                {rem.title}
                              </h4>

                              {/* Details / Notes */}
                              {rem.notes && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                                  {rem.notes}
                                </p>
                              )}

                              {/* Metadata & Linked Doc */}
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{rem.targetDate}</span>
                                </span>

                                <span className="flex items-center gap-1">
                                  <Repeat className="w-3 h-3" />
                                  <span>
                                    {rem.repeatType === 'daily'
                                      ? 'يومياً'
                                      : rem.repeatType === 'weekdays'
                                      ? 'أيام الدراسة'
                                      : 'مرة واحدة'}
                                  </span>
                                </span>

                                {rem.linkedDocTitle && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const doc = documents.find((d) => d.id === rem.linkedDocId);
                                      if (doc && onOpenDocument) {
                                        onOpenDocument(doc);
                                        onClose();
                                      }
                                    }}
                                    className="flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline font-bold truncate max-w-[200px]"
                                  >
                                    <BookOpen className="w-3 h-3" />
                                    <span>{rem.linkedDocTitle}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Left Side: Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Ring Test */}
                            <button
                              type="button"
                              onClick={() => handleTestRing(rem)}
                              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                              title="تشغيل تنبيه تجريبي لهذا الموعد"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>

                            {/* Active Switch Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleActive(rem.id)}
                              className={`w-9 h-5 rounded-full transition-colors relative p-0.5 ${
                                rem.isActive ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                              title={rem.isActive ? 'تعطيل التنبيه' : 'تفعيل التنبيه'}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                                  rem.isActive ? '-translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteReminder(rem.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                              title="حذف هذا التنبيه"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE NEW REMINDER */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateReminder} className="space-y-4">
              {/* 1. Subject Selection */}
              <div>
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-2">
                  اختر المادة الدراسية:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SUBJECTS.map((s) => {
                    const isSelected = newSubjectId === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setNewSubjectId(s.id);
                          // Default title to subject review if empty
                          if (!newTitle || newTitle.startsWith('مراجعة مادة')) {
                            setNewTitle(`مراجعة مادة ${s.nameAr}`);
                          }
                        }}
                        className={`p-2.5 rounded-2xl text-xs font-bold border transition text-right flex items-center justify-between ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 ring-2 ring-amber-400/50'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="truncate">{s.nameAr}</span>
                        {isSelected && <Check className="w-4 h-4 text-amber-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {newSubjectId === 'custom' && (
                  <input
                    type="text"
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    placeholder="اكتب اسم المادة (مثال: اللغة الألمانية، مهارات مهنية...)"
                    className="mt-2 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                )}
              </div>

              {/* 2. Quick Preset Tasks for this Subject */}
              {currentSubjectPresetTasks.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    مقترحات سريعة لمراجعة {SUBJECTS.find((s) => s.id === newSubjectId)?.nameAr}:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {currentSubjectPresetTasks.map((task, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewTitle(task)}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-slate-700 dark:text-slate-300 hover:text-amber-800 dark:hover:text-amber-300 text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition"
                      >
                        + {task}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Title / Task Name */}
              <div>
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
                  عنوان التنبيه أو مهمة المراجعة:
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: مراجعة درس القواعد وحل نموذج تدريبات كتاب الامتحان"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* 4. Date & Time Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
                    تاريخ المراجعة:
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
                    وقت التنبيه (الساعة والدقيقة):
                  </label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500">أوقات مقترحة:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPresetTime(15)}
                  className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold"
                >
                  بعد 15 دقيقة
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetTime(30)}
                  className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold"
                >
                  بعد نصف ساعة
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetTime(60)}
                  className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold"
                >
                  بعد ساعة
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewDate(getTodayStr());
                    setNewTime('17:00');
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold"
                >
                  اليوم 5:00 مساءً
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewDate(getTodayStr());
                    setNewTime('19:30');
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold"
                >
                  اليوم 7:30 مساءً
                </button>
              </div>

              {/* 5. Repetition & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
                    تكرار التنبيه:
                  </label>
                  <select
                    value={newRepeat}
                    onChange={(e) => setNewRepeat(e.target.value as ReminderRepeatType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="once">مرة واحدة فقط</option>
                    <option value="daily">يومياً بنفس الموعد</option>
                    <option value="weekdays">أيام الدراسة (من الأحد إلى الخميس)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
                    درجة الأهمية:
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as ReminderPriority)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="normal">عادي</option>
                    <option value="medium">متوسط</option>
                    <option value="high">هام وعاجل 🔥 (نغمة تنبيه مكثفة)</option>
                  </select>
                </div>
              </div>

              {/* 6. Link to Existing Document (Optional) */}
              {documents.length > 0 && (
                <div>
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
                    ربط بمذكرة من مكتبتك (اختياري - للفتح المباشر فور التنبيه):
                  </label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">بدون ربط مذكرة معينة</option>
                    {documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title} ({SUBJECTS.find((s) => s.id === d.subject)?.nameAr})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 7. Notes */}
              <div>
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-1.5">
                  ملاحظات أو نصائح إضافية (اختياري):
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="مثال: التركيز على حل أسئلة النماذج الاسترشادية ومراجعة جدول الضرب..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition flex items-center gap-2 active:scale-95"
                >
                  <Bell className="w-4 h-4 fill-slate-950" />
                  <span>حفظ التنبيه وتفعيله ⏰</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  BookOpen, 
  Calendar, 
  CheckCheck, 
  Trash2, 
  ShieldCheck, 
  AlertCircle,
  Zap
} from 'lucide-react';
import { 
  NotificationService, 
  AppNotification, 
  NotificationSettings 
} from '../../services/notificationService';
import confetti from 'canvas-confetti';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReminders?: () => void;
  onSelectDoc?: (docId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onOpenReminders,
  onSelectDoc,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(NotificationService.getSettings());
  const [permStatus, setPermStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadData = () => {
    setNotifications(NotificationService.getNotifications());
    setSettings(NotificationService.getSettings());
    setPermStatus(NotificationService.getPermissionStatus());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await NotificationService.requestPermission();
    setPermStatus(res);
    if (res === 'granted') {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      setToastMsg('تم تفعيل إشعارات المتصفح بنجاح! 🔔');
    } else {
      setToastMsg('تم رفض إذن الإشعارات من المتصفح.');
    }
    loadData();
  };

  const handleSendTest = () => {
    NotificationService.sendTestNotification();
    loadData();
    setToastMsg('تم إرسال إشعار تجريبي بنجاح! ✨');
  };

  const handleToggleSound = () => {
    const next = { ...settings, soundEnabled: !settings.soundEnabled };
    setSettings(next);
    NotificationService.saveSettings(next);
  };

  const handleToggleBrowserNotif = async () => {
    if (permStatus !== 'granted') {
      await handleRequestPermission();
      return;
    }
    const next = { ...settings, browserNotificationsEnabled: !settings.browserNotificationsEnabled };
    setSettings(next);
    NotificationService.saveSettings(next);
  };

  const handleMarkAllRead = () => {
    NotificationService.markAllAsRead();
    loadData();
  };

  const handleClearAll = () => {
    NotificationService.clearAll();
    loadData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-slate-950/40 backdrop-blur-xs font-['Cairo',sans-serif] animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] mt-12 animate-in slide-in-from-top-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <Bell className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">مركز الإشعارات والتنبيهات</h3>
              <p className="text-[11px] font-bold text-slate-900/80">
                مواعيد المذاكرة ومراجعات الدروس أولاً بأول
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-black/10 hover:bg-black/20 text-slate-950 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Permission Activation Bar */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${permStatus === 'granted' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span>إشعارات المتصفح: {permStatus === 'granted' ? 'مفعلة بنجاح 🟢' : 'غير مفعلة 🔴'}</span>
            </span>

            {permStatus !== 'granted' ? (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-xs transition active:scale-95 cursor-pointer"
              >
                تفعيل الآن 🔔
              </button>
            ) : (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>جاهزة للتنبيه</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-800/40 text-xs">
            <button
              type="button"
              onClick={handleSendTest}
              className="flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>إرسال إشعار تجريبي فوري</span>
            </button>

            <button
              type="button"
              onClick={handleToggleSound}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              {settings.soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>الصوت: مفعّل</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span>الصوت: صامت</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Feedback message */}
        {toastMsg && (
          <div className="mx-3 mt-2 p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold text-center">
            {toastMsg}
          </div>
        )}

        {/* Notifications List Controls */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-500">
          <span>الإشعارات الأخيرة ({notifications.length})</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>تحديد كمقروء</span>
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح</span>
            </button>
          </div>
        </div>

        {/* Notifications Scroll Area */}
        <div className="p-3 overflow-y-auto flex-1 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs space-y-2">
              <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p>لا توجد إشعارات جديدة حالياً.</p>
              <p className="text-[11px]">سيتم تنبيهك عند اقتراب مواعيد المذاكرة أو إضافة مذكرات جديدة!</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  NotificationService.markAsRead(n.id);
                  loadData();
                  if (n.type === 'reminder') {
                    onOpenReminders?.();
                    onClose();
                  }
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  !n.isRead
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 shadow-xs'
                    : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300">
                      {n.type === 'reminder' ? (
                        <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      ) : n.type === 'document' ? (
                        <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      )}
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">
                        {n.title}
                      </h4>
                      {n.subjectName && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold">
                          {n.subjectName}
                        </span>
                      )}
                    </div>
                  </div>

                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {n.body}
                </p>

                <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>
                    {new Date(n.timestamp).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {n.type === 'reminder' && (
                    <span className="text-amber-600 dark:text-amber-400 font-bold hover:underline">
                      عرض جدول المذاكرة ←
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

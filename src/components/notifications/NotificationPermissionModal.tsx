import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  Check, 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Lock, 
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Laptop,
  CheckCircle2
} from 'lucide-react';
import { NotificationService, NotificationSettings } from '../../services/notificationService';
import confetti from 'canvas-confetti';

interface NotificationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionChanged?: (status: 'granted' | 'denied' | 'default') => void;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  isOpen,
  onClose,
  onPermissionChanged,
}) => {
  const [currentStatus, setCurrentStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [settings, setSettings] = useState<NotificationSettings>(NotificationService.getSettings());
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [showBrowserGuide, setShowBrowserGuide] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStatus(NotificationService.getPermissionStatus());
      setSettings(NotificationService.getSettings());
      setFeedbackMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle "سماح بالإشعارات" (Allow)
  const handleAllowNotifications = async () => {
    const perm = await NotificationService.requestPermission();
    setCurrentStatus(perm);

    const updated = {
      ...settings,
      browserNotificationsEnabled: true,
      studyRemindersEnabled: true,
    };
    setSettings(updated);
    NotificationService.saveSettings(updated);

    if (perm === 'granted') {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      setFeedbackMessage('🎉 تم السماح بالإشعارات بنجاح! ستصلك تنبيهات المذاكرة والدروس.');
      NotificationService.addNotification({
        title: '🔔 أهلاً بك! تم السماح بإشعارات الموقع',
        body: 'نظام التنبيهات نشط الآن لمساعدتك في مذاكرة دروس الصف الخامس بانتظام.',
        type: 'system',
      });
    } else {
      setFeedbackMessage('⚠️ متصفحك حظر الإشعار أو تم رفضه. يمكنك تمكينه من إعدادات المتصفح.');
    }

    if (onPermissionChanged && (perm === 'granted' || perm === 'denied' || perm === 'default')) {
      onPermissionChanged(perm);
    }
  };

  // Handle "حظر الموقع" (Block / Deny)
  const handleBlockNotifications = () => {
    const updated = {
      ...settings,
      browserNotificationsEnabled: false,
    };
    setSettings(updated);
    NotificationService.saveSettings(updated);
    setCurrentStatus('denied');

    setFeedbackMessage('🚫 تم حظر إشعارات الموقع. لن تتلقى تنبيهات المتصفح، ويمكنك التفعيل مجدداً في أي وقت.');

    if (onPermissionChanged) {
      onPermissionChanged('denied');
    }
  };

  // Test Notification
  const handleSendTestNotification = () => {
    NotificationService.sendTestNotification();
    setFeedbackMessage('🚀 تم إرسال إشعار تجريبي الآن بنجاح! تحقق من جهازك.');
  };

  const handleToggleSound = () => {
    const next = { ...settings, soundEnabled: !settings.soundEnabled };
    setSettings(next);
    NotificationService.saveSettings(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 font-['Cairo',sans-serif]">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-amber-500/80 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Simulated Browser Permission Prompt Bar */}
        <div className="bg-slate-900 text-white p-3.5 border-b border-slate-800 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-xs font-mono font-bold text-slate-300 ltr:text-left">
              qalami-edu.app
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
              طلب إذن متصفح
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-lg shrink-0">
              <Bell className="w-7 h-7 fill-slate-950 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  إذن إشعارات الموقع للمذاكرة 🔔
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                يريد موقع منصة قلمي التعليمية إرسال إشعارات وتنبيهات لمساعدتك في تنظيم أوقات المذاكرة وحل الواجبات.
              </p>
            </div>
          </div>
        </div>

        {/* Realistic Allow / Block Interactive Action Box */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Main Decision Buttons Box */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 shadow-inner">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 text-center">
              اختر الإجراء المناسب لإشعارات الموقع:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Button 1: سماح بالإشعارات (Allow) */}
              <button
                type="button"
                onClick={handleAllowNotifications}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>سماح بالإشعارات (Allow)</span>
              </button>

              {/* Button 2: حظر الموقع (Block) */}
              <button
                type="button"
                onClick={handleBlockNotifications}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-sm shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <BellOff className="w-5 h-5 text-rose-200" />
                <span>حظر الموقع (Block)</span>
              </button>
            </div>
          </div>

          {/* Feedback Banner if clicked */}
          {feedbackMessage && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-900 dark:text-amber-200 flex items-start gap-2.5 animate-in fade-in duration-200">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{feedbackMessage}</div>
            </div>
          )}

          {/* What will you receive list */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>ما الذي ستحصل عليه عند السماح بالإشعارات؟</span>
            </h4>
            <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>⏰ تنبيهات يومية بمواعيد وجدول مراجعة مذكرات الصف الخامس.</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                <span>📖 إشعارات عند إضافة حلول نموذجية أو مذكرات جديدة للمنهج.</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span>🏆 تنبيهات تشجيعية عند إنجاز الأهداف والمذاكرة المتواصلة.</span>
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSound}
                className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                  settings.soundEnabled
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                }`}
              >
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span>نغمة التنبيه الصوتية: {settings.soundEnabled ? 'مفعلة' : 'صامت'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSendTestNotification}
              className="text-xs font-black text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>تجربة إرسال إشعار 🚀</span>
            </button>
          </div>

          {/* Browser Unblock Guide Accordion */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowBrowserGuide(!showBrowserGuide)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 py-1 cursor-pointer"
            >
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>كيف تغير اختيارك بين السماح والحظر من المتصفح مباشرة؟</span>
              </span>
              <span>{showBrowserGuide ? '▲ إخفاء' : '▼ إظهار'}</span>
            </button>

            {showBrowserGuide && (
              <div className="mt-2 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
                <p>1. اضغط على رمز القفل 🔒 أو خيارات الموقع في شريط عنوان المتصفح بالأعلى.</p>
                <p>2. اختر «إعدادات الموقع» أو «الأذونات» (Permissions).</p>
                <p>3. بجانب خيار «الإشعارات» (Notifications)، اختر <strong>سماح (Allow)</strong> أو <strong>حظر (Block)</strong> حسب رغبتك.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            الحالة الحالية: {currentStatus === 'granted' ? (
              <span className="text-emerald-600 font-bold">مسموح بالإشعارات ✅</span>
            ) : currentStatus === 'denied' ? (
              <span className="text-rose-600 font-bold">تم حظر الموقع 🚫</span>
            ) : (
              <span className="text-amber-600 font-bold">في انتظار اختيارك ⏳</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

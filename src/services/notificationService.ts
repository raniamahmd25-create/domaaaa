import { ReminderSound } from './reminderSound';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'reminder' | 'document' | 'system' | 'comment';
  timestamp: string;
  isRead: boolean;
  linkUrl?: string;
  subjectName?: string;
}

const STORAGE_KEY = 'qalami_notifications_v1';
const SETTINGS_KEY = 'qalami_notification_settings_v1';

export interface NotificationSettings {
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
  studyRemindersEnabled: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  soundEnabled: true,
  browserNotificationsEnabled: true,
  studyRemindersEnabled: true,
};

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_welcome',
    title: 'مرحباً بك في منصة قلمي التعليمية! 🌟',
    body: 'تم تفعيل ميزة الإشعارات لتذكيرك بمواعيد المذاكرة ومراجعات الدروس أولاً بأول.',
    type: 'system',
    timestamp: new Date().toISOString(),
    isRead: false,
  },
  {
    id: 'notif_study_1',
    title: 'تنبيه مذاكرة اليوم 📚',
    body: 'لديك مراجعة مقررة لمادة اللغة العربية وحل نماذج الامتحانات.',
    type: 'reminder',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    isRead: false,
    subjectName: 'اللغة العربية',
  },
];

export const NotificationService = {
  getSettings(): NotificationSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: NotificationSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  },

  getNotifications(): AppNotification[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        this.saveNotifications(DEFAULT_NOTIFICATIONS);
        return DEFAULT_NOTIFICATIONS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  },

  saveNotifications(notifs: AppNotification[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
    } catch (e) {
      console.error(e);
    }
  },

  addNotification(params: {
    title: string;
    body: string;
    type?: 'reminder' | 'document' | 'system' | 'comment';
    linkUrl?: string;
    subjectName?: string;
  }): AppNotification {
    const notifs = this.getNotifications();
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: params.title,
      body: params.body,
      type: params.type || 'system',
      timestamp: new Date().toISOString(),
      isRead: false,
      linkUrl: params.linkUrl,
      subjectName: params.subjectName,
    };

    const updated = [newNotif, ...notifs.slice(0, 49)];
    this.saveNotifications(updated);

    // Trigger browser notification if enabled
    this.triggerBrowserNotification(newNotif.title, newNotif.body);

    return newNotif;
  },

  markAsRead(id: string): void {
    const notifs = this.getNotifications();
    const updated = notifs.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    this.saveNotifications(updated);
  },

  markAllAsRead(): void {
    const notifs = this.getNotifications();
    const updated = notifs.map((n) => ({ ...n, isRead: true }));
    this.saveNotifications(updated);
  },

  clearAll(): void {
    this.saveNotifications([]);
  },

  getUnreadCount(): number {
    return this.getNotifications().filter((n) => !n.isRead).length;
  },

  isBrowserSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.isBrowserSupported()) return 'unsupported';
    return Notification.permission;
  },

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isBrowserSupported()) return 'denied';
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        const settings = this.getSettings();
        settings.browserNotificationsEnabled = true;
        this.saveSettings(settings);
        
        // Fire confirmation notification
        this.triggerBrowserNotification(
          '🔔 تم تفعيل إشعارات منصة قلمي بنجاح!',
          'سنقوم بتنبيهك بمواعيد المذاكرة ومراجعات الدروس أولاً بأول.'
        );
      }
      return perm;
    } catch (e) {
      console.warn('Error requesting notification permission', e);
      return 'denied';
    }
  },

  triggerBrowserNotification(title: string, body: string): void {
    const settings = this.getSettings();

    // Play chime sound
    if (settings.soundEnabled) {
      try {
        ReminderSound.playStudyChime();
      } catch {
        // audio context fallback
      }
    }

    // Native browser push notification
    if (this.isBrowserSupported() && Notification.permission === 'granted' && settings.browserNotificationsEnabled) {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/favicon.ico',
          dir: 'rtl',
          lang: 'ar',
          badge: '/favicon.ico',
        });
        notif.onclick = () => {
          window.focus();
        };
      } catch (err) {
        console.warn('Browser notification error:', err);
      }
    }
  },

  sendTestNotification(): void {
    this.addNotification({
      title: '🔔 إشعار تجريبي من منصة قلمي',
      body: 'نظام الإشعارات يعمل الآن بكفاءة عالية على جهازك ومتصفحك! 🌟',
      type: 'system',
    });
  },
};

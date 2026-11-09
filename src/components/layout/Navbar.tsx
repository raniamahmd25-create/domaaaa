import React, { useState } from 'react';
import { 
  Moon, 
  Sun, 
  Plus, 
  PenTool, 
  Layers, 
  GraduationCap,
  Bell,
  Cloud,
  User as UserIcon,
  BarChart3,
  Users,
  Database,
  Menu,
  X,
  Sparkles,
  Share2,
  Check,
  Copy
} from 'lucide-react';
import { User } from 'firebase/auth';
import { UserProfile } from '../../types';

interface NavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenPublishModal: () => void;
  onOpenRemindersModal: () => void;
  onOpenPeopleSearch?: () => void;
  onOpenStudyProgress?: () => void;
  onOpenSupabaseModal?: () => void;
  isSupabaseConfigured?: boolean;
  totalDocsCount: number;
  activeRemindersCount?: number;
  currentUser?: User | null;
  activeProfile?: UserProfile | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onOpenProfile?: () => void;
  onOpenMyProfile?: () => void;
  onOpenNotifications?: () => void;
  onOpenNotificationPermission?: () => void;
  unreadNotificationsCount?: number;
  onNavigateHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleDarkMode,
  onOpenPublishModal,
  onOpenRemindersModal,
  onOpenPeopleSearch,
  onOpenStudyProgress,
  totalDocsCount,
  activeRemindersCount = 0,
  currentUser,
  activeProfile,
  onSignIn,
  onSignOut,
  onOpenProfile,
  onOpenMyProfile,
  onOpenNotifications,
  onOpenNotificationPermission,
  unreadNotificationsCount = 0,
  onNavigateHome,
  onOpenSupabaseModal,
  isSupabaseConfigured,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentDisplayName = activeProfile?.name || currentUser?.displayName || 'طالب';
  const currentPhotoURL = activeProfile?.photoURL || currentUser?.photoURL;

  const handleMobileAction = (action?: () => void) => {
    setIsMobileMenuOpen(false);
    action?.();
  };

  const [copiedLink, setCopiedLink] = useState(false);

  const handleShareApp = async () => {
    const url = window.location.href;
    const title = 'منصة قلمي التعليمية - الصف الخامس الابتدائي';
    const text = 'منصة متكاملة لمذاكرة وحل مذكرات وامتحانات الصف الخامس الابتدائي مع قلم إلكتروني متطور!';

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      window.prompt('انسخ رابط المنصة للمشاركة:', url);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#080d19]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#172033] font-['Cairo',sans-serif] transition-colors duration-200">
        <div className="w-full px-2.5 sm:px-4">
          <div className="flex items-center justify-between py-1.5 sm:py-2">
            {/* Brand Logo & Name with 5th Grade Badge */}
            <div 
              className="flex items-center gap-2 cursor-pointer group select-none shrink-0" 
              role="button" 
              tabIndex={0}
              onClick={onNavigateHome}
              onKeyDown={(e) => e.key === 'Enter' && onNavigateHome?.()}
              title="العودة للصفحة الرئيسية"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <PenTool className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight group-hover:text-amber-500 transition-colors">
                    <span className="text-amber-500">قلمي</span>
                  </span>
                  <span className="text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 font-black border border-amber-300 dark:border-amber-700/60 flex items-center gap-0.5">
                    <GraduationCap className="w-2.5 h-2.5" />
                    <span>5 ابتدائي</span>
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 hidden sm:block leading-none mt-0.5">
                  مكتبة المذكرات والفيديوهات الذكية
                </p>
              </div>
            </div>

            {/* Mobile Actions: Theme mode + Hamburger Menu Button */}
            <div className="flex items-center gap-1.5 md:hidden">
              {/* Quick Theme Toggle */}
              <button
                type="button"
                onClick={onToggleDarkMode}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#111827] dark:hover:bg-[#1a2337] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#1f2937] transition active:scale-95 cursor-pointer"
                title={darkMode ? 'تفعيل الوضع الصباحي' : 'تفعيل الوضع المسائي'}
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-500 fill-indigo-500" />
                )}
              </button>

              {/* Hamburger Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="relative flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs shadow-xs transition cursor-pointer"
                aria-label="فتح القائمة الجانبية للأدوات والإعدادات"
              >
                <Menu className="w-4 h-4 stroke-[2.5]" />
                <span className="text-[11px]">القائمة</span>
                {unreadNotificationsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping absolute -top-0.5 -right-0.5" />
                )}
              </button>
            </div>

            {/* Desktop Navigation Actions (Compact Buttons on medium & large screens) */}
            <nav aria-label="شريط أدوات وإعدادات المنصة الرئيسية" className="hidden md:flex flex-col items-end gap-1 sm:gap-1.5">
              {/* Top Row: Compact Badges and Action buttons */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
                {/* Supabase Unified Settings Button */}
                {onOpenSupabaseModal && (
                  <button
                    type="button"
                    onClick={onOpenSupabaseModal}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold border transition active:scale-95 shadow-xs cursor-pointer ${
                      isSupabaseConfigured
                        ? 'bg-emerald-50 dark:bg-[#06241b] text-emerald-700 dark:text-[#34d399] border-emerald-300 dark:border-[#0d4a36]'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-700/60'
                    }`}
                    title="إعدادات Supabase (رابط المشروع ومفتاح API Key)"
                  >
                    <Database className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Supabase</span>
                    {isSupabaseConfigured ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ) : (
                      <span className="text-[9px]">⚙️</span>
                    )}
                  </button>
                )}

                {/* Firebase Cloud Sync Status */}
                <div 
                  className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-[#06241b] text-emerald-700 dark:text-[#34d399] rounded-lg text-[10px] font-bold border border-emerald-200/60 dark:border-[#0d4a36]"
                  title="قاعدة بيانات Firebase متصلة سحابياً"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <Cloud className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Firebase متصل</span>
                </div>

                {/* Total Docs Badge */}
                <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-[#111827] rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-[#1f2937]">
                  <Layers className="w-3 h-3 text-amber-500" />
                  <span>{totalDocsCount} مذكرات</span>
                </div>

                {/* Study Reminders Button */}
                <button
                  type="button"
                  onClick={onOpenRemindersModal}
                  className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 hover:bg-amber-100 dark:bg-[#251705] dark:hover:bg-[#332007] text-amber-900 dark:text-amber-300 rounded-lg text-[10px] sm:text-[11px] font-black border border-amber-200 dark:border-[#4d2800] transition active:scale-95 shadow-xs cursor-pointer"
                  title="تنبيهات ومواعيد مراجعة المواد الدراسية"
                >
                  <Bell className="w-3 h-3 text-amber-600 dark:text-amber-400 fill-amber-500" />
                  <span>تنبيهات المذاكرة</span>
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center">
                    {activeRemindersCount > 0 ? activeRemindersCount : 3}
                  </span>
                </button>

                {/* Notification Permission Activation Button */}
                <button
                  type="button"
                  onClick={onOpenNotificationPermission || onOpenNotifications}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] sm:text-[11px] font-black shadow-xs transition active:scale-95 cursor-pointer"
                  title="تفعيل إشعارات الموقع للمذاكرة"
                >
                  <Bell className="w-3 h-3 fill-slate-950 animate-bounce" />
                  <span>إشعارات الموقع</span>
                </button>

                {/* Notification Center Bell with Badge */}
                <button
                  type="button"
                  onClick={onOpenNotifications}
                  className="relative p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#111827] dark:hover:bg-[#1a2337] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#1f2937] transition active:scale-95 cursor-pointer"
                  title="مركز الإشعارات وتنبيهات المتصفح"
                >
                  <Bell className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white font-black text-[8px] flex items-center justify-center shadow-xs">
                    {unreadNotificationsCount > 0 ? unreadNotificationsCount : 2}
                  </span>
                </button>

                {/* Weekly Study Progress Button */}
                <button
                  type="button"
                  onClick={onOpenStudyProgress}
                  className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 dark:from-[#2a1d0d] dark:to-[#22170a] dark:hover:from-[#352511] dark:hover:to-[#2d1f0e] text-amber-900 dark:text-amber-300 rounded-lg text-[10px] sm:text-[11px] font-black border border-amber-300/80 dark:border-[#473010] transition active:scale-95 shadow-xs cursor-pointer"
                  title="عرض الرسوم البيانية لمعدل تقدم المذاكرة"
                >
                  <BarChart3 className="w-3 h-3 text-amber-600 dark:text-amber-400 stroke-[2.5]" />
                  <span>تقدم المذاكرة</span>
                </button>

                {/* People Pages Search Button */}
                {onOpenPeopleSearch && (
                  <button
                    type="button"
                    onClick={onOpenPeopleSearch}
                    className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[10px] sm:text-[11px] font-black transition active:scale-95 shadow-xs cursor-pointer"
                    title="البحث عن صفحات المعلمين والطلاب"
                  >
                    <Users className="w-3 h-3 stroke-[2.5]" />
                    <span>صفحات الناس</span>
                  </button>
                )}

                {/* Share App Link Button */}
                <button
                  type="button"
                  onClick={handleShareApp}
                  className="flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-200 rounded-lg text-[10px] sm:text-[11px] font-black border border-blue-200 dark:border-blue-800/80 transition active:scale-95 shadow-xs cursor-pointer"
                  title="مشاركة رابط المنصة ونسخ اللينك"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700 dark:text-emerald-300">تم نسخ الرابط!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                      <span>مشاركة الرابط</span>
                    </>
                  )}
                </button>
              </div>

              {/* Bottom Row: Publish + User Profile + Auth Controls + Theme Mode */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
                {/* Publish Button */}
                <button
                  type="button"
                  onClick={onOpenPublishModal}
                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-slate-950 text-[10px] sm:text-[11px] font-black shadow-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                  <span>نشر جديد</span>
                </button>


                {/* User Account / Profile Pill */}
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#111827] dark:hover:bg-[#1a2337] text-slate-700 dark:text-slate-200 text-[10px] sm:text-[11px] font-bold border border-slate-200 dark:border-[#1f2937] transition cursor-pointer"
                  title="تعديل بيانات الحساب"
                >
                  {currentPhotoURL ? (
                    <img src={currentPhotoURL} alt={currentDisplayName} className="w-3.5 h-3.5 rounded-full object-cover" />
                  ) : (
                    <UserIcon className="w-3 h-3 text-amber-500" />
                  )}
                  <span>{currentDisplayName || 'طالب'}</span>
                </button>

                {/* My Public Profile Button */}
                <button
                  type="button"
                  onClick={onOpenMyProfile}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 dark:bg-[#221808] dark:hover:bg-[#30210b] text-amber-900 dark:text-amber-300 text-[10px] sm:text-[11px] font-black border border-amber-300/70 dark:border-[#4a3410] transition cursor-pointer"
                  title="عرض صفحتي الشخصية"
                >
                  <UserIcon className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span className="hidden sm:inline">صفحتي</span>
                </button>

                {/* Morning Mode / Night Mode Switcher */}
                <div className="flex items-center bg-slate-100 dark:bg-[#0c1220] p-0.5 rounded-lg border border-slate-200 dark:border-[#1a2438]">
                  <button
                    type="button"
                    onClick={() => {
                      if (darkMode) onToggleDarkMode();
                    }}
                    className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                      !darkMode
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="تفعيل الوضع الصباحي"
                  >
                    <Sun className="w-3 h-3 text-amber-800 fill-amber-500" />
                    <span>صباح</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!darkMode) onToggleDarkMode();
                    }}
                    className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                      darkMode
                        ? 'bg-[#131b2e] text-white shadow-xs border border-indigo-500/30'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="تفعيل الوضع المسائي"
                  >
                    <Moon className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                    <span>ليل</span>
                  </button>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Sidebar Drawer (بيتفتح ويتقفل على الموبايل) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs md:hidden transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
          role="presentation"
        />
      )}

      <div 
        className={`fixed top-0 bottom-0 right-0 z-50 w-[300px] sm:w-[340px] bg-white dark:bg-[#0a0f1d] shadow-2xl border-l border-slate-200 dark:border-[#172033] flex flex-col md:hidden transform transition-transform duration-300 ease-in-out font-['Cairo',sans-serif] ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="القائمة الجانبية للأدوات"
      >
        {/* Drawer Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-black">
              <PenTool className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-950">قائمة منصة قلمي</h3>
              <p className="text-[10px] text-slate-900/80 font-bold">الصف الخامس الابتدائي</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-xl bg-black/10 hover:bg-black/20 text-slate-950 transition cursor-pointer"
            title="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* User Account / Login Section */}
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-[#111827] border border-slate-200/80 dark:border-[#1f2937] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentPhotoURL ? (
                  <img src={currentPhotoURL} alt={currentDisplayName} className="w-8 h-8 rounded-full object-cover border border-amber-400" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <span className="text-xs font-black block text-slate-900 dark:text-white">
                    {currentDisplayName}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    طالب نشط ✓
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleMobileAction(onOpenProfile)}
                className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-300 text-xs font-bold border border-amber-300/60 dark:border-amber-700/60 cursor-pointer"
              >
                تعديل الاسم
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-[#1f2937]">
              <button
                type="button"
                onClick={() => handleMobileAction(onOpenProfile)}
                className="py-1.5 px-2 rounded-xl bg-white dark:bg-[#172033] text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-[#222e47] text-center cursor-pointer hover:bg-slate-50"
              >
                تعديل الحساب
              </button>
              <button
                type="button"
                onClick={() => handleMobileAction(onOpenMyProfile)}
                className="py-1.5 px-2 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-300 text-xs font-black border border-amber-300/70 dark:border-[#4a3410] text-center cursor-pointer hover:bg-amber-500/25"
              >
                صفحتي الشخصية
              </button>
            </div>
          </div>

          {/* Action 1: Publish New Button */}
          <button
            type="button"
            onClick={() => handleMobileAction(onOpenPublishModal)}
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>نشر جديد (مذكرة / درس / اختبار) ✨</span>
          </button>

          {/* Action: Share App Link Card */}
          <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black block text-slate-900 dark:text-white">مشاركة رابط المنصة 🔗</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">شارك التطبيق لفتحه على أي جهاز</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleShareApp}
              className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>تم نسخ الرابط بنجاح!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ ومشاركة رابط الموقع</span>
                </>
              )}
            </button>
          </div>

          {/* Action 2: Supabase Settings Button */}
          {onOpenSupabaseModal && (
            <button
              type="button"
              onClick={() => handleMobileAction(onOpenSupabaseModal)}
              className="w-full p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60 flex items-center justify-between cursor-pointer transition active:scale-95"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-black block">إعدادات Supabase ⚡</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {isSupabaseConfigured ? 'المشروع متصل سحابياً بنجاح' : 'أدخل رابط المشروع والـ API Key'}
                  </span>
                </div>
              </div>
              <span className="text-xs">
                {isSupabaseConfigured ? '✅' : '⚙️'}
              </span>
            </button>
          )}

          {/* Action 3: Reminders, Progress, and Notifications */}
          <div className="space-y-2">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 px-1 block">
              أدوات المذاكرة والتنبيهات
            </span>

            {/* Study Reminders */}
            <button
              type="button"
              onClick={() => handleMobileAction(onOpenRemindersModal)}
              className="w-full p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#111827] dark:hover:bg-[#161f33] text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-between cursor-pointer transition border border-slate-200/60 dark:border-[#1f2937]"
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>تنبيهات ومواعيد المذاكرة</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                {activeRemindersCount > 0 ? activeRemindersCount : 3}
              </span>
            </button>

            {/* Site Notifications Enable */}
            <button
              type="button"
              onClick={() => handleMobileAction(onOpenNotificationPermission || onOpenNotifications)}
              className="w-full p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#111827] dark:hover:bg-[#161f33] text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-between cursor-pointer transition border border-slate-200/60 dark:border-[#1f2937]"
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>تفعيل إشعارات المتصفح</span>
              </div>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">تفعيل</span>
            </button>

            {/* Notifications Center */}
            <button
              type="button"
              onClick={() => handleMobileAction(onOpenNotifications)}
              className="w-full p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#111827] dark:hover:bg-[#161f33] text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-between cursor-pointer transition border border-slate-200/60 dark:border-[#1f2937]"
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-500" />
                <span>مركز الإشعارات والتنبيهات</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px]">
                {unreadNotificationsCount > 0 ? unreadNotificationsCount : 2}
              </span>
            </button>

            {/* Study Progress */}
            <button
              type="button"
              onClick={() => handleMobileAction(onOpenStudyProgress)}
              className="w-full p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#111827] dark:hover:bg-[#161f33] text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-between cursor-pointer transition border border-slate-200/60 dark:border-[#1f2937]"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500 stroke-[2.5]" />
                <span>رسوم بيانية لتقدم المذاكرة</span>
              </div>
              <span className="text-amber-600 dark:text-amber-400 text-xs font-black">📊</span>
            </button>

            {/* People Pages */}
            {onOpenPeopleSearch && (
              <button
                type="button"
                onClick={() => handleMobileAction(onOpenPeopleSearch)}
                className="w-full p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#111827] dark:hover:bg-[#161f33] text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-between cursor-pointer transition border border-slate-200/60 dark:border-[#1f2937]"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-500 stroke-[2.5]" />
                  <span>دليل صفحات المعلمين والطلاب</span>
                </div>
                <span className="text-xs">👥</span>
              </button>
            )}
          </div>

          {/* Cloud Info & Badges */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0c1220] border border-slate-200/60 dark:border-[#172033] space-y-2">
            <span className="text-[10px] font-black text-slate-400 block">حالة المزامنة والمحتوى</span>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                <span>قاعدة بيانات Firebase</span>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black text-[11px]">متصل ✓</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                <span>المذكرات المتاحة</span>
              </span>
              <span className="font-black text-[11px]">{totalDocsCount} مذكرات</span>
            </div>
          </div>
        </div>

        {/* Drawer Footer: Theme mode */}
        <div className="p-4 border-t border-slate-200 dark:border-[#172033] bg-slate-50 dark:bg-[#080d19]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300">وضع الإضاءة</span>
            <div className="flex items-center bg-slate-200 dark:bg-[#111827] p-0.5 rounded-xl border border-slate-300 dark:border-[#1f2937]">
              <button
                type="button"
                onClick={() => {
                  if (darkMode) onToggleDarkMode();
                }}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                  !darkMode ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-800 fill-amber-500" />
                <span>صباح</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!darkMode) onToggleDarkMode();
                }}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                  darkMode ? 'bg-[#1b253b] text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                <span>ليل</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};


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
  LogIn,
  LogOut
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
}) => {
  const currentDisplayName = activeProfile?.name || currentUser?.displayName || 'طالب';
  const currentPhotoURL = activeProfile?.photoURL || currentUser?.photoURL;
  return (
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


          {/* Quick Stats & Navigation Actions (Compact Buttons) */}
          <nav aria-label="شريط أدوات وإعدادات المنصة الرئيسية" className="flex flex-col items-end gap-1 sm:gap-1.5">
            {/* Top Row: Compact Badges and Action buttons */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
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

              {/* Sign In button if not authenticated */}
              {!currentUser ? (
                <button
                  type="button"
                  onClick={onSignIn}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white text-[10px] sm:text-[11px] font-black shadow-xs transition cursor-pointer"
                  title="تسجيل الدخول بحساب Google أو البريد الإلكتروني"
                >
                  <LogIn className="w-3 h-3" />
                  <span>تسجيل دخول 🔑</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-700 dark:text-rose-300 text-[10px] sm:text-[11px] font-bold border border-rose-200 dark:border-rose-900/50 transition cursor-pointer"
                  title="تسجيل الخروج من الحساب"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">خروج</span>
                </button>
              )}

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
  );
};

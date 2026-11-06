import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Users, 
  User as UserIcon, 
  Bell, 
  Check, 
  Layers, 
  GraduationCap, 
  BookOpen, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  Star,
  Plus
} from 'lucide-react';
import { PeoplePageInfo, SUBJECTS } from '../../types';
import { StorageService } from '../../services/storage';
import confetti from 'canvas-confetti';

interface PeoplePagesSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPerson: (publisherKey: string) => void;
  onOpenMyProfile?: () => void;
}

export const PeoplePagesSearchModal: React.FC<PeoplePagesSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectPerson,
  onOpenMyProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'teacher' | 'student' | 'publisher' | 'subscribed'>('all');
  const [sortBy, setSortBy] = useState<'all' | 'subscribers' | 'docs' | 'newest'>('all');

  // Load live people pages from storage
  const [peoplePages, setPeoplePages] = useState<PeoplePageInfo[]>(() => {
    return StorageService.getAllPeoplePages();
  });

  const refreshPages = () => {
    setPeoplePages(StorageService.getAllPeoplePages());
  };

  const handleToggleSubscribe = (person: PeoplePageInfo, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSub = StorageService.toggleSubscription(person.id || person.name);
    refreshPages();
    if (nextSub) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.5 } });
    }
  };

  // Filter and sort people pages
  const filteredPages = useMemo(() => {
    return peoplePages.filter((p) => {
      // 1. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBio = p.bio?.toLowerCase().includes(q);
        const matchesGrade = p.grade?.toLowerCase().includes(q);
        if (!matchesName && !matchesBio && !matchesGrade) return false;
      }

      // 2. Role filter
      if (roleFilter === 'teacher') return p.role === 'teacher';
      if (roleFilter === 'student') return p.role === 'student' && !p.name.includes('كتاب') && !p.name.includes('دار');
      if (roleFilter === 'publisher') return p.name.includes('كتاب') || p.name.includes('دار') || p.name.includes('الامتحان') || p.name.includes('سلاح');
      if (roleFilter === 'subscribed') return p.isSubscribed;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'subscribers') return b.subscribersCount - a.subscribersCount;
      if (sortBy === 'docs') return b.documentsCount - a.documentsCount;
      if (sortBy === 'newest') return a.subscribersCount - b.subscribersCount; // 0 subscribers first (new pages)
      return 0;
    });
  }, [peoplePages, searchQuery, roleFilter, sortBy]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto font-['Cairo',sans-serif] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="دليل والبحث عن صفحات الناس والناشرين والمعلمين"
      >
        {/* 1. Header */}
        <header className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-md">
              <Users className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>البحث عن صفحات الناس والناشرين</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-700/60">
                  {peoplePages.length} صفحة
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                تصفح صفحات المعلمين، زملاء الدراسة، ودور النشر، وتابع مذكراتهم وملخصاتهم أولاً بأول!
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

        {/* 2. Search & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-3">
          {/* Main search input */}
          <div className="relative">
            <Search className="absolute right-4 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن أي اسم صفحة شخص (طالب، معلم، ناشر، أو اكتب أي اسم جديد لزيارته فوراً)..."
              autoFocus
              className="w-full pr-12 pl-4 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-900 dark:text-white shadow-2xs font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-4 top-3.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                مسح
              </button>
            )}
          </div>

          {/* Quick direct visit banner for ANY person's page name */}
          {searchQuery.trim().length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-300/80 dark:border-amber-600/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  هل تبحث عن صفحة شخصية باسم <span className="text-amber-600 dark:text-amber-400 font-black font-mono">«{searchQuery.trim()}»</span>؟
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectPerson(searchQuery.trim());
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
              >
                <span>زيارة صفحة {searchQuery.trim()} مباشرة</span>
                <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          )}

          {/* Role Filters & Sort */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  roleFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                الكل ({peoplePages.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('teacher')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
                  roleFilter === 'teacher'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>👨‍🏫 المعلمون</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('student')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
                  roleFilter === 'student'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>🎓 الطلاب</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('publisher')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
                  roleFilter === 'publisher'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>📚 دور النشر</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('subscribed')}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
                  roleFilter === 'subscribed'
                    ? 'bg-emerald-600 text-white font-black shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>أتابعهم ({peoplePages.filter(p => p.isSubscribed).length})</span>
              </button>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-bold hidden sm:inline">ترتيب بحسب:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">الافتراضي</option>
                <option value="newest">🌱 الصفحات الجديدة (صفر مشتركون)</option>
                <option value="docs">الأكثر نشراً للمذكرات</option>
                <option value="subscribers">الأكثر متابعين</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Results Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredPages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                <Users className="w-8 h-8 stroke-[2]" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                {searchQuery.trim() ? `لم نجد صفحة مسجلة مسبقاً باسم "${searchQuery.trim()}"` : 'لم يتم العثور على صفحات تطابق بحثك'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                {searchQuery.trim()
                  ? 'يمكنك فتح وتصفح صفحة هذا الشخص الآن مباشرة (صفحة جديدة بـ صفر مشتركون)!'
                  : 'جرب كتابة أي اسم للبحث عنه، أو قم بنشر أول مذكرة أو فيديو لإنشاء صفحتك الخاصة فوراً!'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectPerson(searchQuery.trim());
                    }}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-md hover:from-amber-600 hover:to-orange-600 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>زيارة صفحة «{searchQuery.trim()}» الآن 🚀</span>
                    <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )}
                {onOpenMyProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenMyProfile();
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                  >
                    فتح وتعديل صفحتي الشخصية
                  </button>
                )}
              </div>
            </div>
          ) : (
            <ul role="list" className="grid grid-cols-1 md:grid-cols-2 gap-3.5 list-none p-0 m-0">
              {filteredPages.map((person) => {
                const isNewPage = person.subscribersCount === 0;

                return (
                  <li key={person.id + person.name} className="list-none p-0 m-0">
                    <article
                      onClick={() => {
                        onClose();
                        onSelectPerson(person.name);
                      }}
                      className="group p-4 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/60 bg-white dark:bg-slate-900/90 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3 relative"
                    >
                      {/* Top card row: Avatar, Name, Role badge */}
                      <div className="flex items-start gap-3.5">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          {person.photoURL ? (
                            <img
                              src={person.photoURL}
                              alt={person.name}
                              className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-sm bg-white"
                            />
                          ) : (
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${person.avatarColor || 'from-amber-500 to-orange-600'} text-slate-950 flex items-center justify-center font-black text-xl shadow-sm border border-black/10`}>
                              {(person.name || 'ط')[0]}
                            </div>
                          )}

                          {person.isMyPage && (
                            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[9px] font-black border border-amber-400 shadow-xs">
                              أنت
                            </span>
                          )}
                        </div>

                        {/* Name and Role */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                              {person.name}
                            </h3>
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          </div>

                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              person.role === 'teacher'
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            }`}>
                              {person.role === 'teacher' ? '👨‍🏫 معلم معتمد' : '🎓 طالب ناشر'}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">
                              {person.grade || 'الصف الخامس الابتدائي'}
                            </span>
                          </div>

                          {person.bio && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                              {person.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bottom card row: Metrics & Actions */}
                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        {/* Metrics: Published docs & Subscriber count */}
                        <div className="flex items-center gap-2 text-xs font-bold">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-amber-500" />
                            <span>{person.documentsCount} مذكرة</span>
                          </span>

                          {/* Zero subscribers highlighting for new pages */}
                          {isNewPage ? (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-extrabold flex items-center gap-1 border border-amber-200 dark:border-amber-800/60">
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              <span>صفر مشتركون (جديدة)</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                              <Bell className="w-3 h-3 text-emerald-500" />
                              <span>{person.subscribersCount} مشترك</span>
                            </span>
                          )}
                        </div>

                        {/* Buttons: Visit & Subscribe */}
                        <div className="flex items-center gap-1.5">
                          {!person.isMyPage && (
                            <button
                              type="button"
                              onClick={(e) => handleToggleSubscribe(person, e)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs ${
                                person.isSubscribed
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : isNewPage
                                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                              }`}
                              title={person.isSubscribed ? 'إلغاء المتابعة' : 'متابعة الصفحة'}
                            >
                              {person.isSubscribed ? (
                                <>
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>متابع</span>
                                </>
                              ) : isNewPage ? (
                                <>
                                  <Bell className="w-3 h-3" />
                                  <span>كن أول مشترك!</span>
                                </>
                              ) : (
                                <>
                                  <Bell className="w-3 h-3" />
                                  <span>اشتراك</span>
                                </>
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onSelectPerson(person.name);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-300 text-xs font-bold transition flex items-center gap-1 shadow-xs"
                          >
                            <span>الصفحة</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 4. Footer */}
        <footer className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-bold">
            عدد الصفحات المعروضة: {filteredPages.length}
          </span>
          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
            ★ تبدأ الصفحات الجديدة دائماً بـ 0 مشتركين حقيقيين لضمان الشفافية
          </span>
        </footer>
      </div>
    </div>
  );
};

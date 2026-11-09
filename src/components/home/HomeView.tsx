import React from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Film, 
  Video, 
  PenTool, 
  GraduationCap, 
  CheckCircle2, 
  ArrowLeft, 
  LogIn, 
  User as UserIcon, 
  Clock, 
  Layers, 
  Star, 
  Bell, 
  BarChart3, 
  Plus,
  BookMarked
} from 'lucide-react';
import { StudyDocument, SubjectId, SUBJECTS } from '../../types';
import { User } from 'firebase/auth';
import { MainTabType } from '../layout/BottomTabBar';

interface HomeViewProps {
  onNavigateTab: (tab: MainTabType) => void;
  onOpenPublishModal: () => void;
  onOpenDocument: (doc: StudyDocument) => void;
  documents: StudyDocument[];
  currentUser?: User | null;
  onSignIn?: () => void;
  onSelectSubject?: (subjectId: SubjectId) => void;
  onOpenStudyProgress?: () => void;
  onOpenReminders?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigateTab,
  onOpenPublishModal,
  onOpenDocument,
  documents,
  currentUser,
  onSignIn,
  onSelectSubject,
  onOpenStudyProgress,
  onOpenReminders,
}) => {
  const latestDocs = documents.slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10 font-['Cairo',sans-serif]">
      {/* 1. Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-slate-950 p-6 sm:p-10 md:p-12 shadow-xl border border-amber-400/40">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-black/10 rounded-full blur-2xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/20 backdrop-blur-md text-slate-950 text-xs sm:text-sm font-black border border-white/20">
            <GraduationCap className="w-4 h-4" />
            <span>منصة قلمي التعليمية • الصف الخامس الابتدائي</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-950 leading-tight">
            مرحباً بك في بوابتك الذكية للمذاكرة والحل بالقلم 🎓
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-900/90 font-bold leading-relaxed max-w-2xl">
            كل ما يحتاجه بطل الصف الخامس في مكان واحد: مذكرات كتب وامتحانات، قلم ذكي للحل المباشر، فيديوهات Shorts سريعة، واختبارات تفاعلية مصححة ذاتياً.
          </p>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigateTab('documents')}
              className="px-6 py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 active:scale-95 text-amber-400 font-black text-xs sm:text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 stroke-[2.5]" />
              <span>تصفح المذكرات والكتب</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('quizzes')}
              className="px-5 py-3 rounded-2xl bg-white/90 hover:bg-white active:scale-95 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>حل الاختبارات التفاعلية 📝</span>
            </button>

            <button
              type="button"
              onClick={onOpenPublishModal}
              className="px-4 py-3 rounded-2xl bg-amber-400/40 hover:bg-amber-400/60 active:scale-95 text-slate-950 font-black text-xs sm:text-sm border border-slate-950/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ نشر جديد</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Educational Dashboard Banner (متاح بالكامل لجميع الطلاب دون أي تسجيل دخول) */}
      <section className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/40 rounded-3xl p-6 sm:p-7 border border-amber-300/70 dark:border-amber-700/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
            <GraduationCap className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                مرحباً بك في منصة قلمي التعليمية - الصف الخامس الابتدائي 🌟
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black border border-emerald-300 dark:border-emerald-800">
                مفتوح بالكامل مجاناً
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed">
              تصفح وحل مذكرات وامتحانات الصف الخامس، شاهد شروحات الفيديو التفاعلية، واستخدم القلم الإلكتروني الذكي مباشرة دون الحاجة لأي تسجيل دخول.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={() => onNavigateTab('documents')}
            className="flex-1 md:flex-none px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 stroke-[2.5]" />
            <span>تصفح المذكرات</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('shorts')}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>شاهد Shorts 🎬</span>
          </button>
          {onOpenStudyProgress && (
            <button
              type="button"
              onClick={onOpenStudyProgress}
              className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
              <span>معدل تقدمي</span>
            </button>
          )}
          {onOpenReminders && (
            <button
              type="button"
              onClick={onOpenReminders}
              className="px-3.5 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-[#251705] dark:hover:bg-[#332007] text-amber-900 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-[#4d2800] transition flex items-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>منبهات المذاكرة</span>
            </button>
          )}
        </div>
      </section>

      {/* 3. Main Sections Hub (بطاقات أقسام المنصة الأربعة) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>أقسام المنصة الرئيسية</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black">
              4 أركان تعليمية
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: المذكرات والكتب */}
          <div
            onClick={() => onNavigateTab('documents')}
            className="group p-6 rounded-3xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-[#1a233a] hover:border-amber-400/80 dark:hover:border-amber-500/70 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-[#281e0f] text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-1 group-hover:text-amber-500 transition-colors">
                1. مكتبة المذكرات والكتب 📚
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                ملازم، ملخصات، وكتب الوزارة المعتمدة للصف الخامس قابلة للقراءة والحل والطباعة A4.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1a233a] flex items-center justify-between text-xs font-black text-amber-600 dark:text-amber-400">
              <span>{documents.length} مذكرة متاحة</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: بنك الأسئلة والاختبارات */}
          <div
            onClick={() => onNavigateTab('quizzes')}
            className="group p-6 rounded-3xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-[#1a233a] hover:border-emerald-400/80 dark:hover:border-emerald-500/70 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-[#06241b] text-emerald-600 dark:text-[#34d399] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-1 group-hover:text-emerald-500 transition-colors">
                2. الاختبارات التفاعلية 📝
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                امتحانات إلكترونية ذاتية التصحيح مع إظهار النتيجة والتفسير النموذجي واحتفال الفوز فوراً.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1a233a] flex items-center justify-between text-xs font-black text-emerald-600 dark:text-[#34d399]">
              <span>اختبر معلوماتك الآن</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: فيديوهات Shorts */}
          <div
            onClick={() => onNavigateTab('shorts')}
            className="group p-6 rounded-3xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-[#1a233a] hover:border-rose-400/80 dark:hover:border-rose-500/70 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-[#200d12] text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Film className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-1 group-hover:text-rose-500 transition-colors">
                3. شورتس تعليمية سريعة 🎬
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                مقاطع فيديو رأسية قصيرة وسريعة تشرح أهم القواعد والألغاز العلمية في أقل من دقيقة.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1a233a] flex items-center justify-between text-xs font-black text-rose-600 dark:text-rose-400">
              <span>شاهد وتعلم سريعاً</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: الدروس والحصص الكاملة */}
          <div
            onClick={() => onNavigateTab('lessons')}
            className="group p-6 rounded-3xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-[#1a233a] hover:border-indigo-400/80 dark:hover:border-indigo-500/70 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-[#0f172a] text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Video className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-1 group-hover:text-indigo-500 transition-colors">
                4. الدروس والشروحات 📺
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                حصص وشروحات كاملة من أفضل المعلمين مرتبة ومبوبة حسب وحدات المنهج الجديد.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#1a233a] flex items-center justify-between text-xs font-black text-indigo-600 dark:text-indigo-400">
              <span>شاهد الحصص الكاملة</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Grade 5 Subjects Hub (مواد الصف الخامس الابتدائي) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              المواد الدراسية المقررة للصف الخامس
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              اختر المادة لتصفح كافة مذكراتها وفيديوهاتها واختباراتها مباشرة
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {SUBJECTS.filter((s) => s.id !== 'custom').map((subj) => (
            <button
              key={subj.id}
              type="button"
              onClick={() => {
                onSelectSubject?.(subj.id);
                onNavigateTab('documents');
              }}
              className="p-4 rounded-2xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-[#1a233a] hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-md hover:-translate-y-1 transition-all duration-200 text-center flex flex-col items-center justify-center gap-2 cursor-pointer group"
            >
              <div className={`w-10 h-10 rounded-xl ${subj.bgLight} text-white flex items-center justify-center text-sm font-black shadow-xs group-hover:scale-110 transition-transform`}>
                <BookMarked className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 line-clamp-1">
                {subj.nameAr}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 5. Features Spotlight (القلم الذكي + المعلم الصوتي + المنبهات) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-[#1a233a] shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <PenTool className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-900 dark:text-white mb-1">
              قلم إلكتروني وحل مباشر ✍️
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              اكتب وحل وظلل مباشرة على صفحات المذكرات، مع حفظ تلقائي لحلك في كل زيارة.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-[#1a233a] shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-900 dark:text-white mb-1">
              معلم ذكي وشرح صوتي 🤖
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              استمع لشرح صوتي فوري لأي صفحة، أو اسأل الذكاء الاصطناعي مع إرفاق صور الواجبات.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-[#1a233a] shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-900 dark:text-white mb-1">
              منبهات مذاكرة متطورة ⏰
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              جدول مواعيد مذاكرة موادك مع نغمة إنذار صوتية ونافذة منبثقة تفاعلية للبدء فوراً.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Latest Documents Quick Peek (أحدث مذكرات المكتبة) */}
      {latestDocs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>أحدث المذكرات المضافة</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black">
                جديد المكتبة
              </span>
            </h2>

            <button
              type="button"
              onClick={() => onNavigateTab('documents')}
              className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>عرض جميع المذكرات ({documents.length})</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {latestDocs.map((doc) => {
              const firstPage = doc.pages[0];
              return (
                <div
                  key={doc.id}
                  onClick={() => onOpenDocument(doc)}
                  className="group bg-white dark:bg-[#0c1222] rounded-3xl border border-slate-200 dark:border-[#1a233a] overflow-hidden shadow-xs hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-4/3 bg-slate-100 dark:bg-[#080d19] overflow-hidden">
                    {firstPage ? (
                      <img
                        src={firstPage.imageUrl}
                        alt={doc.title}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <BookOpen className="w-10 h-10" />
                      </div>
                    )}
                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/70 text-white text-[10px] font-black flex items-center gap-1">
                      <Layers className="w-3 h-3 text-amber-400" />
                      <span>{doc.pages.length} صفحات</span>
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-amber-500 transition-colors">
                        {doc.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 font-medium">
                        {doc.description || doc.author}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#1a233a] flex items-center justify-between text-xs font-black text-amber-600 dark:text-amber-400">
                      <span>فتح المذكرة 📖</span>
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

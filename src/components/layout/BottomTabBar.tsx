import React from 'react';
import { Home, Film, Video, BookOpen, Sparkles } from 'lucide-react';

export type MainTabType = 'home' | 'documents' | 'quizzes' | 'lessons' | 'shorts';

interface BottomTabBarProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  shortsCount?: number;
  lessonsCount?: number;
  quizzesCount?: number;
  documentsCount?: number;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
  shortsCount = 0,
  lessonsCount = 0,
  quizzesCount = 0,
  documentsCount = 0,
}) => {
  return (
    <nav
      aria-label="التنقل الرئيسي السفلي للموقع"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#080d19]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#172033] shadow-2xl py-1.5 px-3 font-['Cairo',sans-serif] transition-colors duration-200"
    >
      <div className="max-w-2xl mx-auto flex items-center justify-around gap-1 sm:gap-2">
        {/* 1. الرئيسية Home Button */}
        <button
          type="button"
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 sm:px-5 rounded-2xl transition-all cursor-pointer select-none active:scale-95 relative ${
            activeTab === 'home'
              ? 'bg-amber-100/90 dark:bg-[#281e0f] text-amber-900 dark:text-amber-400 font-black border border-amber-200/70 dark:border-[#473010] shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
          }`}
          title="الصفحة الرئيسية للمنصة"
        >
          <Home className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'home' ? 'text-amber-600 dark:text-amber-400 stroke-[2.5]' : ''}`} />
          <span className="text-[10px] sm:text-[11px] mt-0.5">الرئيسية 🏠</span>
        </button>

        {/* 2. المذكرات Button */}
        <button
          type="button"
          onClick={() => onTabChange('documents')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 sm:px-5 rounded-2xl transition-all cursor-pointer select-none active:scale-95 relative ${
            activeTab === 'documents'
              ? 'bg-amber-100/90 dark:bg-[#281e0f] text-amber-900 dark:text-amber-400 font-black border border-amber-200/70 dark:border-[#473010] shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
          }`}
          title="تصفح المذكرات والكتب والملازم"
        >
          <BookOpen className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'documents' ? 'text-amber-600 dark:text-amber-400 stroke-[2.5]' : ''}`} />
          <span className="text-[10px] sm:text-[11px] mt-0.5">المذكرات 📚</span>
        </button>

        {/* 3. أسئلة تفاعلية Button */}
        <button
          type="button"
          onClick={() => onTabChange('quizzes')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 sm:px-5 rounded-2xl transition-all cursor-pointer select-none active:scale-95 relative ${
            activeTab === 'quizzes'
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
          }`}
          title="الأسئلة والاختبارات التفاعلية"
        >
          <Sparkles className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'quizzes' ? 'stroke-[2.8] text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
          <span className="text-[10px] sm:text-[11px] mt-0.5">أسئلة 📝</span>
        </button>

        {/* 4. الدروس Button */}
        <button
          type="button"
          onClick={() => onTabChange('lessons')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 sm:px-5 rounded-2xl transition-all cursor-pointer select-none active:scale-95 relative ${
            activeTab === 'lessons'
              ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
          }`}
          title="الدروس والشروحات الكاملة"
        >
          <div className="relative">
            <Video className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'lessons' ? 'stroke-[2.8] text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-rose-600 text-white font-mono font-bold text-[8px] flex items-center justify-center">
              {lessonsCount > 0 ? lessonsCount : 1}
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] mt-0.5">دروس 📺</span>
        </button>

        {/* 5. Shorts Button */}
        <button
          type="button"
          onClick={() => onTabChange('shorts')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 sm:px-5 rounded-2xl transition-all cursor-pointer select-none active:scale-95 relative ${
            activeTab === 'shorts'
              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold'
          }`}
          title="فيديوهات Shorts السريعة"
        >
          <div className="relative">
            <Film className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'shorts' ? 'stroke-[2.8] text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-rose-600 text-white font-mono font-bold text-[8px] flex items-center justify-center">
              {shortsCount > 0 ? shortsCount : 1}
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] mt-0.5">Shorts 🎬</span>
        </button>
      </div>
    </nav>
  );
};

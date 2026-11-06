import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  ChevronLeft, 
  Sparkles, 
  Award,
  Plus
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';
import { StudyProgressService, SubjectStudyStat, WeeklyStudyData } from '../../services/studyProgressService';

interface WeeklyProgressWidgetProps {
  onOpenFullAnalytics: () => void;
}

export const WeeklyProgressWidget: React.FC<WeeklyProgressWidgetProps> = ({ onOpenFullAnalytics }) => {
  const [data, setData] = useState<WeeklyStudyData>(() => StudyProgressService.getData());
  const [subjectStats, setSubjectStats] = useState<SubjectStudyStat[]>(() => StudyProgressService.getSubjectStats());

  useEffect(() => {
    const handleUpdate = () => {
      setData(StudyProgressService.getData());
      setSubjectStats(StudyProgressService.getSubjectStats());
    };
    window.addEventListener('qalami_study_progress_updated', handleUpdate);
    return () => window.removeEventListener('qalami_study_progress_updated', handleUpdate);
  }, []);

  const totalHours = subjectStats.reduce((acc, s) => acc + s.hours, 0);
  const goalPercentage = Math.min(100, Math.round((totalHours / (data.weeklyGoalHours || 21)) * 100));

  // Custom compact tooltip
  const CompactTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white px-2.5 py-1.5 rounded-xl shadow-lg border border-slate-700 text-xs font-bold font-['Cairo',sans-serif]">
          <span className="text-amber-400">{label}: </span>
          <span className="font-mono text-white">{payload[0].value} ساعة</span>
        </div>
      );
    }
    return null;
  };

  return (
    <section aria-labelledby="weekly-progress-heading" className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm mb-8 font-['Cairo',sans-serif]">
      {/* Top Banner Row */}
      <header className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-sm">
            <BarChart3 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 id="weekly-progress-heading" className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                معدل تقدم المذاكرة الأسبوعي (Recharts)
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-black border border-amber-300/60">
                {totalHours.toFixed(1)} / {data.weeklyGoalHours} ساعة
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              إحصائيات تفاعلية لساعات المذاكرة لكل مادة دراسية للصف الخامس
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenFullAnalytics}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black transition cursor-pointer active:scale-95 shadow-xs"
        >
          <span>عرض التحليلات الكاملة 📊</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </header>

      {/* Grid: Compact BarChart + Subject Pills */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Recharts BarChart container (7 cols) */}
        <div className="lg:col-span-7 h-44 w-full bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectStats.slice(0, 6)} margin={{ top: 8, right: 10, left: -25, bottom: 20 }}>
              <XAxis 
                dataKey="subjectName" 
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                interval={0}
              />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip content={<CompactTooltip />} />
              <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                {subjectStats.slice(0, 6).map((entry, index) => (
                  <Cell key={`widget-cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Highlights & Subject Badges (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
          {/* Progress Bar & Goal (Semantic progress element) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>نسبة إنجاز هدف الأسبوع</span>
              <span className="font-mono font-black text-amber-600 dark:text-amber-400">{goalPercentage}%</span>
            </div>
            <progress 
              value={goalPercentage} 
              max={100} 
              className="w-full h-2 rounded-full overflow-hidden semantic-progress block"
              aria-label="نسبة إنجاز هدف المذاكرة الأسبوعي"
            >
              {goalPercentage}%
            </progress>
          </div>

          {/* Top 4 Subject Badges (Semantic list) */}
          <ul role="list" className="grid grid-cols-2 gap-2 list-none p-0 m-0">
            {subjectStats.slice(0, 4).map((s) => (
              <li key={s.subjectId} className="list-none p-0 m-0">
                <button 
                  type="button"
                  onClick={onOpenFullAnalytics}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800/80 hover:border-amber-300 transition cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{s.subjectName}</span>
                  </div>
                  <span className="font-black text-slate-900 dark:text-white font-mono text-[11px] mr-1">
                    {s.hours}س
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

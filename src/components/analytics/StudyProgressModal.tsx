import React, { useState, useEffect } from 'react';
import { 
  X, 
  TrendingUp, 
  Clock, 
  Target, 
  Award, 
  Plus, 
  Sparkles, 
  BookOpen, 
  Calendar,
  CheckCircle2,
  BarChart3,
  PieChart as PieIcon,
  RotateCcw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  Cell, 
  PieChart, 
  Pie, 
  AreaChart, 
  Area 
} from 'recharts';
import { StudyProgressService, WeeklyStudyData, SubjectStudyStat } from '../../services/studyProgressService';
import { SubjectId, SUBJECTS } from '../../types';
import confetti from 'canvas-confetti';

interface StudyProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudyProgressModal: React.FC<StudyProgressModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<WeeklyStudyData>(() => StudyProgressService.getData());
  const [subjectStats, setSubjectStats] = useState<SubjectStudyStat[]>(() => StudyProgressService.getSubjectStats());
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'daily'>('overview');
  const [selectedSubjectToLog, setSelectedSubjectToLog] = useState<SubjectId>('math');
  const [logMinutes, setLogMinutes] = useState<number>(30);
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);

  const refreshData = () => {
    setData(StudyProgressService.getData());
    setSubjectStats(StudyProgressService.getSubjectStats());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalHours = subjectStats.reduce((acc, s) => acc + s.hours, 0);
  const averageDailyHours = Number((totalHours / 7).toFixed(1));
  const goalPercentage = Math.min(100, Math.round((totalHours / (data.weeklyGoalHours || 21)) * 100));
  const topSubject = subjectStats[0] || { subjectName: 'الرياضيات', hours: 0 };

  const handleLogTime = (subjectId: SubjectId, minutes: number) => {
    StudyProgressService.logStudyTime(subjectId, minutes);
    refreshData();
    const subjectInfo = SUBJECTS.find((s) => s.id === subjectId);
    setShowSuccessToast(`تمت إضافة ${minutes} دقيقة لمادة ${subjectInfo?.nameAr || ''} بنجاح 🌟`);
    setTimeout(() => setShowSuccessToast(null), 3000);

    if (goalPercentage >= 95) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    }
  };

  const handleReset = () => {
    if (window.confirm('هل تريد إعادة تعيين إحصائيات المذاكرة لهذا الأسبوع؟')) {
      StudyProgressService.resetToDefaults();
      refreshData();
      setShowSuccessToast('تمت إعادة ضبط إحصائيات الأسبوع 🔄');
      setTimeout(() => setShowSuccessToast(null), 2500);
    }
  };

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs font-['Cairo',sans-serif]">
          <p className="font-black text-amber-400 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="flex items-center gap-2 font-bold">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}:</span>
              <span className="font-mono text-amber-300 font-black">{entry.value} ساعة</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Data for PieChart
  const pieData = subjectStats.map((s) => ({
    name: s.subjectName,
    value: s.hours,
    color: s.color,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm font-['Cairo',sans-serif] animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <BarChart3 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  معدل تقدم المذاكرة الأسبوعي
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black border border-emerald-300">
                  محدث ومباشر
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                إحصائيات ورسوم بيانية تفاعلية بعدد الساعات المذاكرة لكل مادة تعليمية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs flex items-center gap-1 cursor-pointer"
              title="إعادة تعيين البيانات الافتراضية"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">إعادة ضبط</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="bg-emerald-500 text-white px-4 py-2 text-xs font-black text-center animate-in slide-in-from-top duration-200">
            {showSuccessToast}
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar">
          
          {/* Top KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Weekly Hours */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>إجمالي الساعات</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {totalHours.toFixed(1)} <span className="text-xs text-slate-400 font-bold">ساعة</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                من أصل {data.weeklyGoalHours} ساعة مستهدفة
              </div>
            </div>

            {/* Daily Average */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>المعدل اليومي</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {averageDailyHours} <span className="text-xs text-slate-400 font-bold">ساعة/يوم</span>
              </div>
              <div className="text-[10px] text-slate-400 font-bold mt-1">
                معدل إيجابي ومنتظم 👏
              </div>
            </div>

            {/* Top Studied Subject */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">
                <Award className="w-4 h-4 text-purple-500" />
                <span>المادة الأكثر مذاكرة</span>
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                {topSubject.subjectName}
              </div>
              <div className="text-[10px] text-purple-600 dark:text-purple-400 font-black mt-1">
                {topSubject.hours} ساعات مذاكرة 📚
              </div>
            </div>

            {/* Goal Completion */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">
                <Target className="w-4 h-4 text-rose-500" />
                <span>تحقيق الهدف</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {goalPercentage}%
              </div>
              {/* Mini Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${goalPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Navigation View Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>ساعات المواد (أعمدة بيانية)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'daily'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>التقدم اليومي خلال الأسبوع</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('subjects')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'subjects'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <PieIcon className="w-4 h-4" />
              <span>توزيع النسب المئوية</span>
            </button>
          </div>

          {/* 1. Bar Chart: Hours per Educational Subject */}
          {activeTab === 'overview' && (
            <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    عدد ساعات المذاكرة لكل مادة تعليمية (الصف الخامس الابتدائي)
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  الوحدة: ساعات مذاكرة
                </span>
              </div>

              <div className="h-72 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectStats} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis 
                      dataKey="subjectName" 
                      angle={-25} 
                      textAnchor="end" 
                      interval={0} 
                      tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} 
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="hours" name="ساعات المذاكرة" radius={[8, 8, 0, 0]}>
                      {subjectStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Subject Badges Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60">
                {subjectStats.map((s) => (
                  <div key={s.subjectId} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{s.subjectName}</span>
                    </div>
                    <span className="font-black text-slate-900 dark:text-white font-mono shrink-0 mr-1">
                      {s.hours}س
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Daily Weekly Progress Chart (السبت - الجمعة) */}
          {activeTab === 'daily' && (
            <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    معدل التقدم اليومي خلال أيام الأسبوع مقابل الهدف المستهدف
                  </h4>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <div className="flex items-center gap-1 text-amber-500">
                    <span className="w-3 h-3 rounded bg-amber-500" />
                    <span>المذاكرة الفعلية</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500">
                    <span className="w-3 h-3 rounded bg-emerald-500" />
                    <span>الهدف اليومي</span>
                  </div>
                </div>
              </div>

              <div className="h-72 w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.dailyProgress} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="dayName" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="actualHours" 
                      name="ساعات المذاكرة الفعلية" 
                      stroke="#f59e0b" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorActual)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="targetHours" 
                      name="الهدف اليومي" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      strokeDasharray="4 4" 
                      fillOpacity={1} 
                      fill="url(#colorTarget)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 3. Pie Chart: Percentage Distribution */}
          {activeTab === 'subjects' && (
            <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500" />
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    النسبة المئوية لحصص المذاكرة بين المواد الدراسية
                  </h4>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-6">
                <div className="h-64 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`pie-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Percentage details list */}
                <div className="space-y-2">
                  {subjectStats.map((s) => {
                    const percent = totalHours > 0 ? Math.round((s.hours / totalHours) * 100) : 0;
                    return (
                      <div key={s.subjectId} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                          <span className="font-bold text-slate-800 dark:text-slate-200">{s.subjectName}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-extrabold text-slate-900 dark:text-white">{s.hours}س</span>
                          <span className="text-[11px] text-slate-400 font-bold">({percent}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Quick Study Session Logger (+15m, +30m, +1h) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-300 dark:border-amber-800/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  تسجيل جلسة مذاكرة جديدة (تحديث فوري للرسوم البيانية)
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                أضف الوقت الذي ذاكرته اليوم ليرتفع مؤشر تقدمك 🚀
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Select Subject */}
              <select
                value={selectedSubjectToLog}
                onChange={(e) => setSelectedSubjectToLog(e.target.value as SubjectId)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2 font-bold focus:outline-none"
              >
                {SUBJECTS.filter((s) => s.id !== 'french' && s.id !== 'custom').map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nameAr}
                  </option>
                ))}
              </select>

              {/* Quick Minutes Buttons */}
              <div className="flex items-center gap-1.5">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleLogTime(selectedSubjectToLog, mins)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-amber-500 hover:text-slate-950 dark:hover:bg-amber-400 dark:hover:text-slate-950 text-slate-700 dark:text-slate-300 text-xs font-black border border-slate-200 dark:border-slate-700 transition active:scale-95 cursor-pointer shadow-xs"
                  >
                    +{mins} دقيقة
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

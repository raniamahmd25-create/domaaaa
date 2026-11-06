import { SubjectId, SUBJECTS } from '../types';

export interface DayStudyProgress {
  dayName: string;
  dayShort: string;
  dateStr: string;
  actualHours: number;
  targetHours: number;
}

export interface SubjectStudyStat {
  subjectId: SubjectId;
  subjectName: string;
  hours: number;
  color: string;
  targetHours: number;
  sessionsCount: number;
}

export interface WeeklyStudyData {
  weeklyGoalHours: number;
  dailyProgress: DayStudyProgress[];
  subjectProgress: Record<SubjectId, number>; // subjectId -> hours
  subjectSessions: Record<SubjectId, number>; // subjectId -> count
  lastUpdated: string;
}

const STORAGE_KEY = 'qalami_weekly_study_progress_v1';

const SUBJECT_COLORS: Record<SubjectId, string> = {
  arabic: '#10b981', // emerald
  math: '#f43f5e', // rose
  science: '#a855f7', // purple
  social_studies: '#f59e0b', // amber
  connect: '#06b6d4', // cyan
  connect_plus: '#3b82f6', // blue
  islamic_studies: '#14b8a6', // teal
  ict: '#6366f1', // indigo
  french: '#ec4899', // pink
  custom: '#64748b', // slate
};

const DEFAULT_SUBJECT_HOURS: Record<SubjectId, number> = {
  arabic: 4.5,
  math: 5.0,
  science: 3.5,
  social_studies: 3.0,
  connect: 2.5,
  connect_plus: 2.0,
  islamic_studies: 2.0,
  ict: 1.5,
  french: 0,
  custom: 0.5,
};

const DEFAULT_DAYS: DayStudyProgress[] = [
  { dayName: 'السبت', dayShort: 'سبت', dateStr: 'sat', actualHours: 3.5, targetHours: 3.0 },
  { dayName: 'الأحد', dayShort: 'أحد', dateStr: 'sun', actualHours: 4.0, targetHours: 3.0 },
  { dayName: 'الإثنين', dayShort: 'إثنين', dateStr: 'mon', actualHours: 2.5, targetHours: 3.0 },
  { dayName: 'الثلاثاء', dayShort: 'ثلاثاء', dateStr: 'tue', actualHours: 3.5, targetHours: 3.0 },
  { dayName: 'الأربعاء', dayShort: 'أربعاء', dateStr: 'wed', actualHours: 4.5, targetHours: 3.0 },
  { dayName: 'الخميس', dayShort: 'خميس', dateStr: 'thu', actualHours: 3.0, targetHours: 3.0 },
  { dayName: 'الجمعة', dayShort: 'جمعة', dateStr: 'fri', actualHours: 3.5, targetHours: 3.0 },
];

function getDefaultWeeklyData(): WeeklyStudyData {
  return {
    weeklyGoalHours: 21,
    dailyProgress: DEFAULT_DAYS,
    subjectProgress: { ...DEFAULT_SUBJECT_HOURS },
    subjectSessions: {
      arabic: 6,
      math: 7,
      science: 5,
      social_studies: 4,
      connect: 3,
      connect_plus: 2,
      islamic_studies: 3,
      ict: 2,
      french: 0,
      custom: 1,
    },
    lastUpdated: new Date().toISOString(),
  };
}

export const StudyProgressService = {
  getData(): WeeklyStudyData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.dailyProgress)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load study progress', e);
    }
    const def = getDefaultWeeklyData();
    this.saveData(def);
    return def;
  },

  saveData(data: WeeklyStudyData): void {
    try {
      data.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('qalami_study_progress_updated', { detail: data }));
    } catch (e) {
      console.warn('Failed to save study progress', e);
    }
  },

  getSubjectStats(): SubjectStudyStat[] {
    const data = this.getData();
    return SUBJECTS.filter((s) => s.id !== 'french' && s.id !== 'custom').map((s) => {
      const hours = data.subjectProgress[s.id] || 0;
      const sessions = data.subjectSessions[s.id] || 0;
      return {
        subjectId: s.id,
        subjectName: s.nameAr,
        hours: Number(hours.toFixed(1)),
        color: SUBJECT_COLORS[s.id] || '#f59e0b',
        targetHours: 4.0,
        sessionsCount: sessions,
      };
    }).sort((a, b) => b.hours - a.hours);
  },

  getTotalWeeklyHours(): number {
    const data = this.getData();
    return Object.values(data.subjectProgress).reduce((acc, h) => acc + (h || 0), 0);
  },

  logStudyTime(subjectId: SubjectId, minutes: number): void {
    if (minutes <= 0) return;
    const data = this.getData();
    const additionalHours = minutes / 60;

    // Update subject hours
    data.subjectProgress[subjectId] = (data.subjectProgress[subjectId] || 0) + additionalHours;
    data.subjectSessions[subjectId] = (data.subjectSessions[subjectId] || 0) + 1;

    // Update today's entry in daily progress
    const todayIndex = (new Date().getDay() + 1) % 7; // Saturday = 0 in Egyptian week
    if (data.dailyProgress[todayIndex]) {
      data.dailyProgress[todayIndex].actualHours = Number(
        (data.dailyProgress[todayIndex].actualHours + additionalHours).toFixed(1)
      );
    }

    this.saveData(data);
  },

  setWeeklyGoal(goalHours: number): void {
    const data = this.getData();
    data.weeklyGoalHours = Math.max(1, goalHours);
    const dailyTarget = Number((goalHours / 7).toFixed(1));
    data.dailyProgress.forEach((d) => {
      d.targetHours = dailyTarget;
    });
    this.saveData(data);
  },

  resetToDefaults(): void {
    const def = getDefaultWeeklyData();
    this.saveData(def);
  },
};

export type SubjectId = 
  | 'arabic' 
  | 'social_studies' 
  | 'islamic_studies' 
  | 'connect_plus' 
  | 'connect' 
  | 'science' 
  | 'math' 
  | 'ict' 
  | 'french' 
  | 'custom';

export type DocumentType = 'solution' | 'revision' | 'book' | 'booklet' | 'notes';
export type PublishFormat = 'images' | 'files';

export interface SubjectInfo {
  id: SubjectId;
  nameAr: string;
  nameEn: string;
  badgeColor: string;
  bgLight: string;
  bgDark: string;
  iconName: string;
}

export const SUBJECTS: SubjectInfo[] = [
  { id: 'arabic', nameAr: 'اللغة العربية', nameEn: 'Arabic', badgeColor: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800', bgLight: 'bg-emerald-500', bgDark: 'bg-emerald-600', iconName: 'BookOpen' },
  { id: 'social_studies', nameAr: 'الدراسات الاجتماعية', nameEn: 'Social Studies', badgeColor: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800', bgLight: 'bg-amber-500', bgDark: 'bg-amber-600', iconName: 'Globe' },
  { id: 'islamic_studies', nameAr: 'التربية الدينية', nameEn: 'Islamic Studies', badgeColor: 'text-teal-700 bg-teal-50 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800', bgLight: 'bg-teal-500', bgDark: 'bg-teal-600', iconName: 'Moon' },
  { id: 'connect_plus', nameAr: 'Connect Plus', nameEn: 'Connect Plus', badgeColor: 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800', bgLight: 'bg-blue-500', bgDark: 'bg-blue-600', iconName: 'Sparkles' },
  { id: 'connect', nameAr: 'Connect', nameEn: 'Connect', badgeColor: 'text-cyan-700 bg-cyan-50 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800', bgLight: 'bg-cyan-500', bgDark: 'bg-cyan-600', iconName: 'Languages' },
  { id: 'science', nameAr: 'Science / العلوم', nameEn: 'Science', badgeColor: 'text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800', bgLight: 'bg-purple-500', bgDark: 'bg-purple-600', iconName: 'FlaskConical' },
  { id: 'math', nameAr: 'Math / الرياضيات', nameEn: 'Math', badgeColor: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800', bgLight: 'bg-rose-500', bgDark: 'bg-rose-600', iconName: 'Calculator' },
  { id: 'ict', nameAr: 'تكنولوجيا المعلومات ICT', nameEn: 'ICT', badgeColor: 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800', bgLight: 'bg-indigo-500', bgDark: 'bg-indigo-600', iconName: 'Laptop' },
  { id: 'custom', nameAr: 'مادة أخرى', nameEn: 'Other Subject', badgeColor: 'text-slate-700 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700', bgLight: 'bg-slate-600', bgDark: 'bg-slate-700', iconName: 'Folder' },
];

export const DOC_TYPES: { 
  id: DocumentType; 
  label: string; 
  badgeLabel: string;
  description: string; 
  icon: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}[] = [
  { 
    id: 'solution', 
    label: 'حل', 
    badgeLabel: 'حل وإجابات نموذجية', 
    description: 'حلول الدروس والتمارين ونماذج الإجابة لجميع المواد', 
    icon: 'CheckCircle2',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/70',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    badgeBorder: 'border-emerald-300 dark:border-emerald-800'
  },
  { 
    id: 'revision', 
    label: 'مراجعة', 
    badgeLabel: 'مراجعة وامتحانات', 
    description: 'مراجعات ليلة الامتحان، اختبارات شهرية وتوقعات نهائية', 
    icon: 'Sparkles',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/70',
    badgeText: 'text-purple-800 dark:text-purple-300',
    badgeBorder: 'border-purple-300 dark:border-purple-800'
  },
  { 
    id: 'book', 
    label: 'كتاب كامل', 
    badgeLabel: 'كتاب كامل', 
    description: 'كتاب الوزارة المدرسي أو كتاب خارجي كامل (سلاح التلميذ / الأضواء / الامتحان)', 
    icon: 'Book',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/70',
    badgeText: 'text-blue-800 dark:text-blue-300',
    badgeBorder: 'border-blue-300 dark:border-blue-800'
  },
];

export function getDocTypeInfo(docType?: string) {
  if (docType === 'solution') return DOC_TYPES[0];
  if (docType === 'revision') return DOC_TYPES[1];
  if (docType === 'book') return DOC_TYPES[2];
  // Default fallback for legacy types
  return DOC_TYPES[1];
}

export interface Point {
  x: number;
  y: number;
}

export type ToolMode = 
  | 'pen' 
  | 'highlighter' 
  | 'eraser' 
  | 'text' 
  | 'rect' 
  | 'line' 
  | 'arrow' 
  | 'circle' 
  | 'cursor'
  | 'hand';

export interface AnnotationItem {
  id: string;
  type: ToolMode;
  color: string;
  strokeWidth: number;
  opacity?: number;
  points?: Point[];
  startPoint?: Point;
  endPoint?: Point;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  isBold?: boolean;
  box?: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
}

export interface DocumentPage {
  id: string;
  pageNumber: number;
  imageUrl: string;
  annotations: AnnotationItem[];
  notes?: string;
  lastEdited?: number;
}

export interface DocumentComment {
  id: string;
  userId: string;
  userName: string;
  userRole?: 'student' | 'teacher' | 'parent';
  userPhoto?: string;
  rating: number; // 1 to 5 stars
  comment: string;
  createdAt: string;
}

export interface EducationalGrade {
  id: string;
  nameAr: string;
  stage: 'kindergarten' | 'primary' | 'preparatory' | 'secondary' | 'university_general';
  stageAr: string;
}

export const EDUCATIONAL_GRADES: EducationalGrade[] = [
  // رياض الأطفال
  { id: 'kg', nameAr: 'مرحلة رياض الأطفال (KG1 - KG2)', stage: 'kindergarten', stageAr: 'رياض الأطفال' },

  // المرحلة الابتدائية
  { id: 'pri_1', nameAr: 'الصف الأول الابتدائي', stage: 'primary', stageAr: 'المرحلة الابتدائية' },
  { id: 'pri_2', nameAr: 'الصف الثاني الابتدائي', stage: 'primary', stageAr: 'المرحلة الابتدائية' },
  { id: 'pri_3', nameAr: 'الصف الثالث الابتدائي', stage: 'primary', stageAr: 'المرحلة الابتدائية' },
  { id: 'pri_4', nameAr: 'الصف الرابع الابتدائي', stage: 'primary', stageAr: 'المرحلة الابتدائية' },
  { id: 'pri_5', nameAr: 'الصف الخامس الابتدائي', stage: 'primary', stageAr: 'المرحلة الابتدائية' },
  { id: 'pri_6', nameAr: 'الصف السادس الابتدائي', stage: 'primary', stageAr: 'المرحلة الابتدائية' },

  // المرحلة الإعدادية
  { id: 'prep_1', nameAr: 'الصف الأول الإعدادي', stage: 'preparatory', stageAr: 'المرحلة الإعدادية' },
  { id: 'prep_2', nameAr: 'الصف الثاني الإعدادي', stage: 'preparatory', stageAr: 'المرحلة الإعدادية' },
  { id: 'prep_3', nameAr: 'الصف الثالث الإعدادي', stage: 'preparatory', stageAr: 'المرحلة الإعدادية' },

  // المرحلة الثانوية
  { id: 'sec_1', nameAr: 'الصف الأول الثانوي', stage: 'secondary', stageAr: 'المرحلة الثانوية' },
  { id: 'sec_2', nameAr: 'الصف الثاني الثانوي', stage: 'secondary', stageAr: 'المرحلة الثانوية' },
  { id: 'sec_3', nameAr: 'الصف الثالث الثانوي (الثانوية العامة)', stage: 'secondary', stageAr: 'المرحلة الثانوية' },

  // المرحلة الجامعية والتعليم العام
  { id: 'university', nameAr: 'المرحلة الجامعية والمعاهد العليا', stage: 'university_general', stageAr: 'الجامعة والعام' },
  { id: 'general', nameAr: 'مذكرات عامة وتدريب مهني', stage: 'university_general', stageAr: 'الجامعة والعام' },
];

export interface StudyDocument {
  id: string;
  title: string;
  subject: SubjectId;
  customSubjectName?: string;
  docType: DocumentType;
  format: PublishFormat;
  grade: string;
  term: 'term1' | 'term2' | 'full_year';
  author: string;
  description: string;
  tags: string[];
  pages: DocumentPage[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  isFavorite?: boolean;
  bookmarks?: number[];
  averageRating?: number;
  ratingsCount?: number;
  comments?: DocumentComment[];
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  photoURL?: string;
  role: 'student' | 'teacher' | 'parent';
  grade?: string;
  bio?: string;
  avatarColor: string;
  updatedAt?: string;
}

export type ReminderRepeatType = 'once' | 'daily' | 'weekdays' | 'custom';
export type ReminderPriority = 'normal' | 'medium' | 'high';

export interface StudyReminder {
  id: string;
  subjectId: SubjectId;
  customSubjectName?: string;
  title: string;
  targetDate: string; // YYYY-MM-DD
  targetTime: string; // HH:MM (24h)
  repeatType: ReminderRepeatType;
  repeatDays?: number[]; // [0,1,2,3,4,5,6] (0 = Sunday, 1 = Monday, etc.)
  notes?: string;
  linkedDocId?: string;
  linkedDocTitle?: string;
  priority: ReminderPriority;
  isActive: boolean;
  isCompleted: boolean;
  lastTriggered?: string; // YYYY-MM-DDTHH:mm
  createdAt: string;
}

export const SUBJECT_PRESET_TASKS: Record<SubjectId, string[]> = {
  arabic: [
    'مراجعة القواعد النحوية والإعراب',
    'حل تدريبات درس القراءة والنصوص',
    'كتابة موضوع التعبير والخط العربي',
    'مراجعة الإملاء والظواهر اللغوية',
  ],
  math: [
    'مراجعة ضرب وقسمة الكسور العشرية',
    'حل تدريبات سلاح التلميذ والأضواء',
    'مراجعة الهندسة وحساب المساحات والمحيط',
    'حل اختبار الفصل والمسائل اللفظية',
  ],
  science: [
    'مراجعة أجهزة الجسم والتكيف في الكائنات الحية',
    'مذاكرة المفاهيم العلمية والمصطلحات',
    'حل أنشطة كتاب العلوم وتجارب المنهج',
    'مراجعة اختبار المفهوم للوحدة الأولى',
  ],
  social_studies: [
    'مراجعة خريطة مصر التفاعلية والتضاريس',
    'مذاكرة شخصيات مصرية مؤثرة عبر التاريخ',
    'حل أسئلة المحافظات ونماذج الامتحانات',
    'مراجعة الموارد الطبيعية والبيئية في مصر',
  ],
  connect_plus: [
    'Connect Plus: Review Unit Vocabulary & Phonics',
    'Connect Plus: Grammar exercises & writing tasks',
    'Connect Plus: Practice reading comprehension',
  ],
  connect: [
    'Connect: Review English Vocabulary & Spelling',
    'Connect: Solve workbook exercises',
    'Connect: Practice speaking and dialogue',
  ],
  islamic_studies: [
    'مراجعة السور القرآنية المقررة وأحكام التلاوة',
    'حفظ ومذاكرة الأحاديث النبوية الشريفة',
    'مراجعة سيرة النبي صلى الله عليه وسلم والصحابة',
  ],
  ict: [
    'مراجعة أدوات التكنولوجيا والاتصالات الرقمية',
    'مذاكرة درس الأمان الرقمي وكلمات المرور',
    'حل تدريبات كتاب تكنولوجيا المعلومات والاتصالات',
  ],
  french: [
    'Révision du vocabulaire et dialogues',
    'Exercices de grammaire et conjugaison',
  ],
  custom: [
    'مراجعة عامة وحل تدريبات',
    'تلخيص الدرس وكتابة الملاحظات',
    'حل اختبار تقييم ذاتي',
  ],
};

export interface DocumentQuickNote {
  id: string;
  userId: string;
  docId: string;
  content: string;
  pageNumber?: number;
  color?: string; // 'amber' | 'emerald' | 'blue' | 'purple' | 'rose'
  createdAt: string;
  updatedAt: string;
}

export interface PeoplePageInfo {
  id: string; // userId or publisherKey
  name: string;
  role: 'student' | 'teacher' | 'parent';
  grade?: string;
  bio?: string;
  avatarColor?: string;
  photoURL?: string;
  documentsCount: number;
  subscribersCount: number;
  subjects: SubjectId[];
  isMyPage: boolean;
  isSubscribed: boolean;
}

export type VideoType = 'shorts' | 'lesson';

export interface InteractiveComment {
  id: string;
  targetId: string; // video ID or document ID
  targetType: 'video' | 'document';
  userId: string;
  userName: string;
  userPhotoURL?: string;
  role?: 'student' | 'teacher' | 'parent';
  content: string;
  likesCount?: number;
  likedByUser?: boolean;
  createdAt: string;
}

export interface VideoComment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: string;
}

export interface VideoItem {
  id: string;
  title: string;
  description?: string;
  videoUrl: string; // Blob or Data URL
  thumbnailUrl?: string;
  durationSeconds: number; // in seconds
  type: VideoType; // <= 180s = 'shorts', > 180s = 'lesson'
  subject?: SubjectId;
  grade?: string;
  userId: string;
  author: string;
  authorPhoto?: string;
  authorRole?: string;
  likesCount: number; // Starts with 0
  likedByUser?: boolean;
  sharesCount: number;
  commentsCount: number;
  comments?: VideoComment[];
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[]; // Options array (user can add more options with + button)
  correctOptionIndex: number;
  timeLimitSeconds?: number; // 0 or undefined for "no time limit until answered"
}

export interface InteractiveQuiz {
  id: string;
  title: string;
  grade: string;
  durationMode: 'temporary' | 'always';
  expireDate?: string;
  totalQuestions: number;
  questions: QuizQuestion[];
  subject?: SubjectId;
  userId: string;
  author: string;
  authorPhoto?: string;
  attemptsCount: number;
  createdAt: string;
}



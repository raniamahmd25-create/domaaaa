import { pgTable, serial, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email'),
  displayName: text('display_name'),
  photoURL: text('photo_url'),
  role: text('role').default('student'),
  grade: text('grade').default('الصف الخامس الابتدائي'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const documents = pgTable('documents', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  subject: text('subject').notNull(),
  customSubjectName: text('custom_subject_name'),
  docType: text('doc_type'),
  format: text('format').default('files'),
  grade: text('grade'),
  term: text('term'),
  author: text('author'),
  description: text('description'),
  pagesJson: text('pages_json'),
  averageRating: integer('average_rating').default(5),
  ratingsCount: integer('ratings_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const reminders = pgTable('reminders', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  subjectId: text('subject_id').notNull(),
  customSubjectName: text('custom_subject_name'),
  title: text('title').notNull(),
  targetDate: text('target_date').notNull(),
  targetTime: text('target_time').notNull(),
  repeatType: text('repeat_type').default('none'),
  priority: text('priority').default('normal'),
  isActive: boolean('is_active').default(true),
  isCompleted: boolean('is_completed').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const videos = pgTable('videos', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  author: text('author').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull(), // 'shorts' or 'lesson'
  durationSeconds: integer('duration_seconds').notNull(),
  videoUrl: text('video_url'),
  thumbnailUrl: text('thumbnail_url'),
  subject: text('subject'),
  grade: text('grade'),
  likesCount: integer('likes_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const quizzes = pgTable('quizzes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  author: text('author').notNull(),
  title: text('title').notNull(),
  grade: text('grade').notNull(),
  durationMode: text('duration_mode').default('always'),
  expireDate: text('expire_date'),
  totalQuestions: integer('total_questions').notNull(),
  questionsJson: text('questions_json').notNull(),
  subject: text('subject'),
  attemptsCount: integer('attempts_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const comments = pgTable('comments', {
  id: text('id').primaryKey(),
  targetId: text('target_id').notNull(),
  targetType: text('target_type').notNull(), // 'video' or 'document'
  userId: text('user_id').notNull(),
  authorName: text('author_name').notNull(),
  authorPhoto: text('author_photo'),
  authorRole: text('author_role').default('student'),
  content: text('content').notNull(),
  reaction: text('reaction'),
  likesCount: integer('likes_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});



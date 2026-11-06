import React, { useState } from 'react';
import { 
  X, 
  Star, 
  MessageSquare, 
  Send, 
  User as UserIcon, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  ThumbsUp,
  GraduationCap
} from 'lucide-react';
import { StudyDocument, DocumentComment, SUBJECTS } from '../../types';
import { StorageService } from '../../services/storage';
import { saveDocumentToFirestore } from '../../services/firebase';
import { User } from 'firebase/auth';
import confetti from 'canvas-confetti';

interface DocumentCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: StudyDocument;
  currentUser?: User | null;
  onDocumentUpdated?: (updatedDoc: StudyDocument) => void;
}

export const DocumentCommentsModal: React.FC<DocumentCommentsModalProps> = ({
  isOpen,
  onClose,
  document: initialDoc,
  currentUser,
  onDocumentUpdated,
}) => {
  const [doc, setDoc] = useState<StudyDocument>(initialDoc);
  const activeProfile = StorageService.getActiveProfile();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState(() => {
    return currentUser?.displayName || activeProfile.name || 'طالب متميز';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const subjectInfo = SUBJECTS.find((s) => s.id === doc.subject);
  const commentsList = doc.comments || [];
  const avgRating = doc.averageRating || 5;
  const reviewsCount = doc.ratingsCount || commentsList.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) {
      setErrorMsg('يرجى كتابة نص التعليق أولاً.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updated = StorageService.addComment(doc.id, {
        userId: currentUser?.uid || activeProfile.id || 'guest',
        userName: authorName.trim() || 'طالب متميز',
        userRole: (activeProfile.role as any) || 'student',
        userPhoto: currentUser?.photoURL || activeProfile.photoURL,
        rating,
        comment: commentText.trim(),
      });

      if (updated) {
        setDoc(updated);
        onDocumentUpdated?.(updated);
        // Sync to Firestore cloud
        saveDocumentToFirestore(updated).catch(() => {});
      }

      setCommentText('');
      setSuccessMsg('تم إضافة تقييمك وتعليقك بنجاح! شكراً لمشاركتك 🌟');
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    } catch (err: any) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء حفظ التعليق.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs font-['Cairo',sans-serif] animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <MessageSquare className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">التقييمات والتعليقات</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-950/15 font-black">
                  {doc.grade}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900/80 truncate max-w-xs">
                {doc.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-black/10 hover:bg-black/20 text-slate-950 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Rating Summary Bar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                {avgRating}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(avgRating)
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                  بناءً على {reviewsCount} {reviewsCount === 1 ? 'تقييم' : 'تقييمات'}
                </div>
              </div>
            </div>

            <div className="text-xs font-black px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xs border border-slate-200 dark:border-slate-700">
              {subjectInfo?.nameAr || 'المادة'}
            </div>
          </div>

          {/* Add Review Form */}
          <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                أضف تقييمك وتعليقك على المذكرة:
              </span>
              {/* Interactive Stars */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition transform hover:scale-125 focus:outline-none"
                    title={`تقييم ${star} نجوم`}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-500 drop-shadow-xs'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Author Name */}
            <div>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="اسمك (يظهر بجانب تعليقك)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Comment Textarea */}
            <div>
              <textarea
                rows={2}
                required
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="اكتب رأيك في المذكرة، سهولة الشرح، التمارين، أو نصيحة لزملائك..."
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
              />
            </div>

            {errorMsg && (
              <div className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>نشر التعليق والتقييم</span>
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>جميع التعليقات ({commentsList.length}):</span>
              <span>الأحدث أولاً</span>
            </div>

            {commentsList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                لا توجد تعليقات حتى الآن. كن أول من يقيّم ويعلّق على هذه المذكرة! 🌟
              </div>
            ) : (
              commentsList.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {c.userPhoto ? (
                        <img
                          src={c.userPhoto}
                          alt={c.userName}
                          className="w-7 h-7 rounded-xl object-cover border border-amber-400"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                          {c.userName[0] || 'ط'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {c.userName}
                          </span>
                          {c.userRole && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                              {c.userRole === 'teacher' ? 'معلم' : c.userRole === 'parent' ? 'ولي أمر' : 'طالب'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Comment Star Rating */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= c.rating
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                    {c.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

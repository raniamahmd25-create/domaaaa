import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  Heart, 
  Trash2, 
  Sparkles, 
  User as UserIcon, 
  HelpCircle, 
  X,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { InteractiveComment } from '../../types';
import { CommentService } from '../../services/commentService';
import { StorageService } from '../../services/storage';
import { auth } from '../../services/firebase';
import confetti from 'canvas-confetti';

interface InteractiveCommentsSectionProps {
  targetId: string;
  targetType: 'video' | 'document';
  targetTitle?: string;
  isModal?: boolean;
  onClose?: () => void;
}

const QUICK_EMOJIS = ['❓ سؤال', '💡 فكرة', '👍 فهمت', '👏 شكراً', '🌟 ممتاز', '✏️ ملاحظة'];

export const InteractiveCommentsSection: React.FC<InteractiveCommentsSectionProps> = ({
  targetId,
  targetType,
  targetTitle,
  isModal = false,
  onClose,
}) => {
  const [comments, setComments] = useState<InteractiveComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeProfile = StorageService.getActiveProfile();
  const currentUid = auth.currentUser?.uid || activeProfile.id;

  // Real-time comments listener from Firebase Firestore + Local cache
  useEffect(() => {
    if (!targetId) return;
    const unsubscribe = CommentService.subscribeToComments(targetId, (items) => {
      setComments(items);
    });
    return () => unsubscribe();
  }, [targetId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await CommentService.addComment({
        targetId,
        targetType,
        content: newCommentText.trim(),
        role: activeProfile.role || 'student',
        userName: auth.currentUser?.displayName || activeProfile.name || 'طالب مجتهد',
        userPhotoURL: auth.currentUser?.photoURL || activeProfile.photoURL,
      });

      setNewCommentText('');
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
    } catch (err) {
      console.warn('Comment post note:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async (commentId: string) => {
    const isNowLiked = await CommentService.toggleLikeComment(commentId, targetId);
    if (isNowLiked) {
      confetti({ particleCount: 20, spread: 40, origin: { y: 0.7 } });
    }
  };

  const handleDelete = async (commentId: string) => {
    await CommentService.deleteComment(commentId, targetId);
  };

  const contentJsx = (
    <div className="flex flex-col h-full font-['Cairo',sans-serif]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>استفسارات وأسئلة الطلاب</span>
              <span className="text-[11px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">
                {comments.length}
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              {targetType === 'video' ? 'اطرح سؤالك أو استفسارك حول هذا الدرس' : 'استفسارات وملاحظات الطلاب على المذكرة'}
            </p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
        {comments.length === 0 ? (
          <div className="py-8 text-center flex flex-col items-center justify-center text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-2 text-slate-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              لا توجد استفسارات حتى الآن
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
              كن أول من يكتب استفساراً أو يشارك زملاءه ومعلمه فكرة مفيدة!
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const isMyComment = comment.userId === currentUid || comment.userId === auth.currentUser?.uid;
            const timeAgo = formatTimeAgo(comment.createdAt);

            return (
              <div
                key={comment.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-amber-400/40 transition-all flex flex-col gap-2 text-right"
              >
                {/* Commenter Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {comment.userPhotoURL ? (
                      <img
                        src={comment.userPhotoURL}
                        alt={comment.userName}
                        className="w-7 h-7 rounded-xl object-cover border border-amber-400/60"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-2xs">
                        {(comment.userName || 'ط')[0]}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-slate-900 dark:text-white">
                          {comment.userName}
                        </span>
                        {comment.role === 'teacher' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black">
                            👨‍🏫 معلم
                          </span>
                        )}
                        {isMyComment && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                            أنت
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{timeAgo}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions: Like & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(comment.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition active:scale-95 cursor-pointer ${
                        comment.likedByUser
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-black'
                          : 'bg-white dark:bg-slate-800 text-slate-500 hover:text-rose-500 border border-slate-200 dark:border-slate-700'
                      }`}
                      title="إعجاب بالاستفسار"
                    >
                      <Heart
                        className={`w-3 h-3 ${comment.likedByUser ? 'fill-rose-500 text-rose-500' : ''}`}
                      />
                      <span>{comment.likesCount || 0}</span>
                    </button>

                    {isMyComment && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="حذف تعليقي"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment Body */}
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium whitespace-pre-wrap pr-1">
                  {comment.content}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Input Form with quick emoji pills */}
      <form onSubmit={handleSubmit} className="pt-2 border-t border-slate-200 dark:border-slate-800 shrink-0 space-y-2">
        {/* Quick Emoji Reaction Chips */}
        <div className="flex flex-wrap items-center gap-1">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setNewCommentText((prev) => (prev ? `${prev} ${emoji}` : emoji))}
              className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="اكتب استفسارك أو سؤالك هنا..."
            className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
          />
          <button
            type="submit"
            disabled={!newCommentText.trim() || isSubmitting}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-slate-950 font-black text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>إرسال</span>
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </form>
    </div>
  );

  if (isModal) {
    return (
      <div 
        className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md font-['Cairo',sans-serif] animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 h-[80vh] max-h-[600px] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {contentJsx}
        </div>
      </div>
    );
  }

  return contentJsx;
};

function formatTimeAgo(isoDate: string): string {
  try {
    const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
    if (diff < 60) return 'الآن';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    return `منذ ${Math.floor(diff / 86400)} يوم`;
  } catch {
    return 'مؤخراً';
  }
}

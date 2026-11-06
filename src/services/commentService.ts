import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { InteractiveComment } from '../types';

const LIKED_COMMENTS_KEY = 'qalami_liked_comments_v1';

function getLocalLikedIds(): string[] {
  try {
    const raw = localStorage.getItem(LIKED_COMMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalLikedIds(ids: string[]): void {
  try {
    localStorage.setItem(LIKED_COMMENTS_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

function getLocalCache(targetId: string): InteractiveComment[] {
  try {
    const raw = localStorage.getItem(`qalami_comments_${targetId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalCache(targetId: string, comments: InteractiveComment[]): void {
  try {
    localStorage.setItem(`qalami_comments_${targetId}`, JSON.stringify(comments));
  } catch {
    // ignore
  }
}

export const CommentService = {
  subscribeToComments(
    targetId: string,
    onData: (comments: InteractiveComment[]) => void
  ): () => void {
    const path = 'comments';
    const likedIds = getLocalLikedIds();

    // 1. Initial immediate emit from local cache for instant UI rendering
    const cached = getLocalCache(targetId).map((c) => ({
      ...c,
      likedByUser: likedIds.includes(c.id),
    }));
    onData(cached);

    // 2. Setup Firebase Firestore real-time listener
    const q = query(collection(db, path), where('targetId', '==', targetId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const firestoreComments: InteractiveComment[] = [];
        snapshot.forEach((snap) => {
          const data = snap.data() as InteractiveComment;
          firestoreComments.push({
            ...data,
            likedByUser: likedIds.includes(data.id),
          });
        });

        // Sort comments: newest first
        firestoreComments.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Update local cache
        setLocalCache(targetId, firestoreComments);
        onData(firestoreComments);
      },
      (error) => {
        console.warn('Firestore comments subscription fallback to local cache:', error);
        // Fallback to local cache gracefully
        const local = getLocalCache(targetId).map((c) => ({
          ...c,
          likedByUser: likedIds.includes(c.id),
        }));
        onData(local);
      }
    );

    return () => unsubscribe();
  },

  async addComment(params: {
    targetId: string;
    targetType: 'video' | 'document';
    content: string;
    role?: 'student' | 'teacher' | 'parent';
    userName?: string;
    userPhotoURL?: string;
  }): Promise<InteractiveComment> {
    const user = auth.currentUser;
    const commentId = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();

    const newComment: InteractiveComment = {
      id: commentId,
      targetId: params.targetId,
      targetType: params.targetType,
      userId: user?.uid || 'guest_student',
      userName: params.userName || user?.displayName || 'طالب مجتهد',
      userPhotoURL: params.userPhotoURL || user?.photoURL || undefined,
      role: params.role || 'student',
      content: params.content.trim(),
      likesCount: 0,
      likedByUser: false,
      createdAt,
    };

    // 1. Optimistically write to local storage
    const currentLocal = getLocalCache(params.targetId);
    const updatedLocal = [newComment, ...currentLocal];
    setLocalCache(params.targetId, updatedLocal);

    // 2. Persist to Firebase Firestore if online
    if (user) {
      const docPath = `comments/${commentId}`;
      try {
        const commentRef = doc(db, 'comments', commentId);
        const dataToSave = {
          id: commentId,
          targetId: params.targetId,
          targetType: params.targetType,
          userId: user.uid,
          userName: newComment.userName,
          userPhotoURL: newComment.userPhotoURL || '',
          role: newComment.role || 'student',
          content: newComment.content,
          likesCount: 0,
          createdAt,
        };
        await setDoc(commentRef, dataToSave);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      }
    }

    // 3. Dual-persist to PostgreSQL / Cloud SQL backend
    try {
      fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newComment.id,
          targetId: newComment.targetId,
          targetType: newComment.targetType,
          userId: newComment.userId,
          authorName: newComment.userName,
          authorPhoto: newComment.userPhotoURL,
          authorRole: newComment.role,
          content: newComment.content,
          reaction: null,
          likesCount: 0,
        }),
      }).catch(() => {});
    } catch {
      // non-blocking
    }

    return newComment;
  },

  async deleteComment(commentId: string, targetId: string): Promise<void> {
    // 1. Remove from local cache
    const currentLocal = getLocalCache(targetId);
    const updated = currentLocal.filter((c) => c.id !== commentId);
    setLocalCache(targetId, updated);

    // 2. Delete from Firebase
    if (auth.currentUser) {
      const docPath = `comments/${commentId}`;
      try {
        const commentRef = doc(db, 'comments', commentId);
        await deleteDoc(commentRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, docPath);
      }
    }

    // 3. Delete from PostgreSQL / Cloud SQL backend
    try {
      fetch(`/api/comments/${commentId}`, { method: 'DELETE' }).catch(() => {});
    } catch {
      // non-blocking
    }
  },


  async toggleLikeComment(commentId: string, targetId: string): Promise<boolean> {
    const liked = getLocalLikedIds();
    let isNowLiked = false;
    let nextLiked: string[];

    if (liked.includes(commentId)) {
      nextLiked = liked.filter((id) => id !== commentId);
      isNowLiked = false;
    } else {
      nextLiked = [...liked, commentId];
      isNowLiked = true;
    }
    setLocalLikedIds(nextLiked);

    // Update local cache
    const currentLocal = getLocalCache(targetId);
    const comment = currentLocal.find((c) => c.id === commentId);
    let nextLikesCount = 0;
    if (comment) {
      nextLikesCount = Math.max(0, (comment.likesCount || 0) + (isNowLiked ? 1 : -1));
      comment.likesCount = nextLikesCount;
      comment.likedByUser = isNowLiked;
      setLocalCache(targetId, currentLocal);
    }

    // Update in Firebase Firestore
    if (auth.currentUser) {
      const docPath = `comments/${commentId}`;
      try {
        const commentRef = doc(db, 'comments', commentId);
        await setDoc(commentRef, { likesCount: nextLikesCount }, { merge: true });
      } catch (e) {
        console.warn('Firestore comment like update note:', e);
      }
    }

    return isNowLiked;
  },
};

import { VideoItem, VideoType } from '../types';
import { auth } from './firebase';

const STORAGE_KEYS = {
  VIDEOS: 'qalami_videos_store_v1',
  LIKED_VIDEOS: 'qalami_liked_videos_v1',
};

export const DEMO_VIDEOS: VideoItem[] = [
  // 1. فيديو تجريبي واحد في Shorts (أقل من 3 دقائق)
  {
    id: 'demo_short_01',
    title: 'مراجعة سريعة: كان وأخواتها في 45 ثانية ⚡',
    description: 'درس تجريبي سريع: تعرف على كان وأخواتها وأثرها على المبتدأ والخبر بطريقة سريعة ومبسطة.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: '',
    durationSeconds: 45, // Shorts (<= 180s)
    type: 'shorts',
    subject: 'arabic',
    grade: 'الصف الخامس الابتدائي',
    userId: 'teacher_demo_01',
    author: 'أستاذ أحمد الشناوي',
    authorPhoto: '',
    likesCount: 0,
    likedByUser: false,
    sharesCount: 0,
    commentsCount: 0,
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // 2. فيديو تجريبي واحد في الدروس (أكثر من 3 دقائق)
  {
    id: 'demo_lesson_01',
    title: 'شرح كامل: القواعد النحوية ومراجعة ليلة الامتحان 📖',
    description: 'درس تجريبي كامل وشامل: شرح كافة دروس النحو المقررة وحل التدريبات والأنشطة النموذجية خطوة بخطوة.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl: '',
    durationSeconds: 596, // Lesson (> 180s)
    type: 'lesson',
    subject: 'arabic',
    grade: 'الصف الخامس الابتدائي',
    userId: 'teacher_demo_02',
    author: 'أستاذ محمد إبراهيم',
    authorPhoto: '',
    likesCount: 0,
    likedByUser: false,
    sharesCount: 0,
    commentsCount: 0,
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let inMemoryVideos: VideoItem[] = [];

// Load stored videos or initialize with exactly 1 trial video for each (Shorts & Lessons)
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VIDEOS);
    let list: VideoItem[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
      } catch {}
    }
    const hasShort = list.some((v) => v.type === 'shorts');
    const hasLesson = list.some((v) => v.type === 'lesson');
    if (!hasShort) {
      list.push(DEMO_VIDEOS[0]); // exactly 1 demo short
    }
    if (!hasLesson) {
      list.push(DEMO_VIDEOS[1]); // exactly 1 demo lesson
    }
    inMemoryVideos = list;
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(inMemoryVideos));
  } catch (e) {
    console.warn('Could not read videos from storage', e);
    inMemoryVideos = [...DEMO_VIDEOS];
  }
}



type VideoListener = (videos: VideoItem[]) => void;
const listeners: VideoListener[] = [];

function notifyListeners() {
  const current = [...inMemoryVideos];
  listeners.forEach((fn) => {
    try {
      fn(current);
    } catch (e) {
      console.warn('Video listener error', e);
    }
  });
}

export const VideoService = {
  subscribe(listener: VideoListener): () => void {
    listeners.push(listener);
    listener([...inMemoryVideos]);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  },

  getAllVideos(): VideoItem[] {
    const likedIds = this.getLikedVideoIds();
    return inMemoryVideos.map((v) => ({
      ...v,
      likedByUser: likedIds.includes(v.id),
    }));
  },

  getShorts(): VideoItem[] {
    return this.getAllVideos().filter((v) => v.type === 'shorts');
  },

  getLessons(): VideoItem[] {
    return this.getAllVideos().filter((v) => v.type === 'lesson');
  },

  getVideosByAuthor(authorOrUserId: string): VideoItem[] {
    const term = authorOrUserId.trim().toLowerCase();
    return this.getAllVideos().filter(
      (v) =>
        v.userId === authorOrUserId ||
        v.author.trim().toLowerCase() === term
    );
  },

  saveVideo(videoData: Omit<VideoItem, 'type' | 'likesCount' | 'sharesCount' | 'commentsCount'> & { likesCount?: number }): VideoItem {
    // Automatic classification based on video duration:
    // 3 minutes = 180 seconds
    const duration = Math.max(1, Math.round(videoData.durationSeconds || 1));
    const autoType: VideoType = duration <= 180 ? 'shorts' : 'lesson';

    const newVideo: VideoItem = {
      ...videoData,
      durationSeconds: duration,
      type: autoType,
      likesCount: videoData.likesCount ?? 0, // Starts strictly at 0!
      sharesCount: 0,
      commentsCount: 0,
      comments: [],
      createdAt: videoData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const existingIndex = inMemoryVideos.findIndex((v) => v.id === newVideo.id);
    if (existingIndex >= 0) {
      inMemoryVideos[existingIndex] = newVideo;
    } else {
      inMemoryVideos.unshift(newVideo);
    }

    this.persistToLocalStorage();
    notifyListeners();

    // Asynchronously sync with Cloud SQL PostgreSQL backend
    if (auth.currentUser) {
      auth.currentUser.getIdToken().then((token) => {
        fetch('/api/videos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newVideo),
        }).catch((err) => console.warn('PostgreSQL video sync note:', err));
      }).catch(() => {});
    }

    return newVideo;
  },

  deleteVideo(videoId: string): void {
    inMemoryVideos = inMemoryVideos.filter((v) => v.id !== videoId);
    this.persistToLocalStorage();
    notifyListeners();

    if (auth.currentUser) {
      auth.currentUser.getIdToken().then((token) => {
        fetch(`/api/videos/${videoId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }).catch((err) => console.warn('PostgreSQL video delete note:', err));
      }).catch(() => {});
    }
  },

  updateVideo(videoId: string, updates: { title?: string; description?: string }): void {
    const v = inMemoryVideos.find((item) => item.id === videoId);
    if (v) {
      if (updates.title) v.title = updates.title;
      if (updates.description !== undefined) v.description = updates.description;
      v.updatedAt = new Date().toISOString();
      this.persistToLocalStorage();
      notifyListeners();
    }
  },

  toggleLike(videoId: string): boolean {
    const liked = this.getLikedVideoIds();
    let isNowLiked = false;
    let nextLiked: string[];

    if (liked.includes(videoId)) {
      nextLiked = liked.filter((id) => id !== videoId);
      isNowLiked = false;
    } else {
      nextLiked = [...liked, videoId];
      isNowLiked = true;
    }

    try {
      localStorage.setItem(STORAGE_KEYS.LIKED_VIDEOS, JSON.stringify(nextLiked));
    } catch {
      // ignore
    }

    const video = inMemoryVideos.find((v) => v.id === videoId);
    if (video) {
      video.likesCount = Math.max(0, (video.likesCount || 0) + (isNowLiked ? 1 : -1));
      this.persistToLocalStorage();
      notifyListeners();
    }

    return isNowLiked;
  },

  getLikedVideoIds(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LIKED_VIDEOS);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [];
  },

  persistToLocalStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(inMemoryVideos));
    } catch (e) {
      console.warn('LocalStorage video quota note:', e);
    }
  },

  resetToDemoVideos(): void {
    inMemoryVideos = [...DEMO_VIDEOS];
    this.persistToLocalStorage();
    notifyListeners();
  },

  clearAllVideos(): void {
    inMemoryVideos = [];
    this.persistToLocalStorage();
    notifyListeners();
  },
};


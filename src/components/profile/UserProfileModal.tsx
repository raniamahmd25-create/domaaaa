import React, { useState, useRef } from 'react';
import { 
  X, 
  User as UserIcon, 
  Camera, 
  Check, 
  Save, 
  Sparkles, 
  GraduationCap, 
  Palette, 
  Upload, 
  Trash2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { User } from 'firebase/auth';
import { UserProfile, EDUCATIONAL_GRADES } from '../../types';
import { updateAccountProfile } from '../../services/firebase';
import { StorageService } from '../../services/storage';
import confetti from 'canvas-confetti';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  onProfileUpdated?: (updated: UserProfile) => void;
}

const PRESET_AVATAR_GRADIENTS = [
  'from-amber-500 to-orange-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-purple-500 to-violet-600',
  'from-cyan-500 to-blue-600',
];

const PRESET_AVATAR_ICONS = [
  '🎓', '✏️', '📚', '🌟', '🚀', '🧠', '🦁', '🦉', '🎨', '🔬'
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}) => {
  const activeLocalProfile = StorageService.getActiveProfile();

  const [name, setName] = useState<string>(() => {
    return currentUser?.displayName || activeLocalProfile.name || 'طالب متميز';
  });

  const [photoURL, setPhotoURL] = useState<string>(() => {
    return currentUser?.photoURL || activeLocalProfile.photoURL || '';
  });

  const [role, setRole] = useState<'student' | 'teacher' | 'parent'>(() => {
    return activeLocalProfile.role || 'student';
  });

  const [grade, setGrade] = useState<string>(() => {
    return activeLocalProfile.grade || 'الصف الخامس الابتدائي';
  });

  const [bio, setBio] = useState<string>(() => {
    return activeLocalProfile.bio || 'طالب محب للعلم والمعرفة ومراجعة الدروس أولاً بأول 🌟';
  });

  const [avatarColor, setAvatarColor] = useState<string>(() => {
    return activeLocalProfile.avatarColor || 'from-amber-500 to-orange-600';
  });

  const [selectedEmoji, setSelectedEmoji] = useState<string>('🎓');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle uploading custom photo from device
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('يرجى اختيار ملف صورة صالح.');
      return;
    }

    // Read and compress image to lightweight base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.naturalWidth || 320;
        let height = img.naturalHeight || 320;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setPhotoURL(compressed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoURL('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسمك الشخصي.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const updatedProfile: UserProfile = {
      id: currentUser?.uid || activeLocalProfile.id,
      name: name.trim(),
      email: currentUser?.email || activeLocalProfile.email || '',
      photoURL: photoURL || undefined,
      role,
      grade,
      bio,
      avatarColor,
      updatedAt: new Date().toISOString(),
    };

    try {
      // 1. Update in local storage
      StorageService.updateActiveProfile(updatedProfile);

      // 2. If logged in with Firebase, update Firebase Auth & Firestore
      if (currentUser) {
        await updateAccountProfile({
          name: name.trim(),
          photoURL,
          role,
          grade,
          bio,
          avatarColor,
        });
      }

      setSuccessMsg('تم حفظ وتحديث بيانات حسابك بنجاح! ✨');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      onProfileUpdated?.(updatedProfile);

      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ التعديلات.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs font-['Cairo',sans-serif] animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <UserIcon className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">إعدادات وتعديل الحساب</h3>
              <p className="text-xs font-bold text-slate-900/80">
                تعديل الاسم والصورة والمرحلة الدراسية لحسابك
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

        {/* Scrollable Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Status Notifications */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Profile Picture Section (تعديل الصورة) */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <div className="relative group">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={name}
                  className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-amber-400"
                />
              ) : (
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-tr ${avatarColor} text-white flex items-center justify-center font-black text-2xl shadow-lg border-2 border-amber-300`}>
                  {selectedEmoji}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -left-1 p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md transition active:scale-90"
                title="تغيير الصورة أو رفع صورة جديدة من جهازك"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-right space-y-2">
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                صورة الحساب الشخصي
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                يمكنك رفع صورة شخصية من جهازك أو اختيار أيقونة وألوان مميزة
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-300 rounded-xl text-xs font-bold transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع صورة من الجهاز</span>
                </button>

                {photoURL && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-300 rounded-xl text-xs font-bold transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف الصورة</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Preset Emojis & Colors when no custom photo */}
          {!photoURL && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                أو اختر أيقونة ولون الحساب:
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_AVATAR_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition ${
                      selectedEmoji === emoji
                        ? 'bg-amber-400 text-slate-950 scale-110 shadow-md ring-2 ring-amber-500'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                {PRESET_AVATAR_GRADIENTS.map((grad) => (
                  <button
                    key={grad}
                    type="button"
                    onClick={() => setAvatarColor(grad)}
                    className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${grad} transition ${
                      avatarColor === grad ? 'scale-110 ring-2 ring-offset-2 ring-amber-500' : 'opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Name Field (تغيير الاسم) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              الاسم الشخصي * (كما يظهر على المذكرات والتعليقات)
            </label>
            <div className="relative">
              <UserIcon className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسمك الكامل أو اللقب الدراسي..."
                className="w-full pr-10 pl-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Role & Grade Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                الصفة / نوع الحساب
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="student">طالب 🎓</option>
                <option value="teacher">معلم / مدرس 👨‍🏫</option>
                <option value="parent">ولي أمر 👨‍👩‍👧</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                السنة الدراسية
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {EDUCATIONAL_GRADES.map((g) => (
                  <option key={g.id} value={g.nameAr}>
                    {g.nameAr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              نبذة تعريفية (تظهر في الملف الشخصي)
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="اكتب نبذة قصيرة عنك أو أهدافك التعليمية..."
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
            />
          </div>

          {/* Email read-only info */}
          {currentUser?.email && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>البريد الإلكتروني المرتبط:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{currentUser.email}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs shadow-md transition active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>حفظ التعديلات</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

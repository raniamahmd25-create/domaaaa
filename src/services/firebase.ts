import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  collection, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { StudyDocument, StudyReminder, UserProfile, DocumentQuickNote } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Test Firestore Connection on startup as mandated by skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection: client appears offline.');
    }
    return false;
  }
}
testConnection();

// Standardized Firestore Error Handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Authentication Helpers
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await syncUserProfile(result.user);
    }
    return result.user;
  } catch (error) {
    console.error('Google Sign In Error:', error);
    throw error;
  }
}

// Email & Password Authentication
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  if (result.user) {
    await syncUserProfile(result.user);
  }
  return result.user;
}

export async function signUpWithEmail(
  email: string, 
  pass: string, 
  displayName: string,
  role: 'student' | 'teacher' | 'parent' = 'student',
  grade: string = 'الصف الخامس الابتدائي'
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (result.user) {
    await updateProfile(result.user, {
      displayName: displayName.trim() || 'طالب متميز',
    });
    // Create initial Firestore profile
    await syncUserProfile(result.user, { role, grade });
  }
  return result.user;
}

export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

// User Profile Sync & Edit
export async function syncUserProfile(
  user: User, 
  extras?: Partial<UserProfile>
): Promise<UserProfile> {
  const userPath = `users/${user.uid}`;
  try {
    const profileRef = doc(db, 'users', user.uid);
    const existingSnap = await getDoc(profileRef);
    
    if (existingSnap.exists()) {
      const existingData = existingSnap.data() as UserProfile;
      if (extras && Object.keys(extras).length > 0) {
        const merged = {
          ...existingData,
          ...extras,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(profileRef, merged, { merge: true });
        return merged;
      }
      return existingData;
    }

    const newProfile: UserProfile & { email?: string; createdAt?: string; updatedAt?: string } = {
      id: user.uid,
      name: user.displayName || extras?.name || 'طالب متميز',
      email: user.email || '',
      photoURL: user.photoURL || extras?.photoURL || '',
      role: extras?.role || 'student',
      grade: extras?.grade || 'الصف الخامس الابتدائي',
      avatarColor: extras?.avatarColor || 'from-amber-500 to-orange-600',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(profileRef, newProfile);

    // Asynchronously synchronize with PostgreSQL / Cloud SQL database
    user.getIdToken().then((token) => {
      fetch('/api/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: newProfile.name,
          photoURL: newProfile.photoURL,
        }),
      }).catch((err) => console.warn('PostgreSQL user sync note:', err));
    }).catch(() => {});

    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const profileRef = doc(db, 'users', userId);
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch {
    return null;
  }
}

export async function updateAccountProfile(data: {
  name: string;
  photoURL?: string;
  role?: 'student' | 'teacher' | 'parent';
  grade?: string;
  bio?: string;
  avatarColor?: string;
}): Promise<UserProfile | null> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('يجب تسجيل الدخول أولاً لتعديل الحساب');
  }

  // Update Firebase Auth profile
  try {
    await updateProfile(user, {
      displayName: data.name,
      photoURL: data.photoURL || user.photoURL,
    });
  } catch (err) {
    console.warn('Auth updateProfile note:', err);
  }

  // Update Firestore user document
  const userRef = doc(db, 'users', user.uid);
  const updatedData: Partial<UserProfile> = {
    id: user.uid,
    name: data.name,
    photoURL: data.photoURL !== undefined ? data.photoURL : user.photoURL || '',
    role: data.role || 'student',
    grade: data.grade || 'الصف الخامس الابتدائي',
    bio: data.bio || '',
    avatarColor: data.avatarColor || 'from-amber-500 to-orange-600',
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(userRef, updatedData, { merge: true });
  } catch (err) {
    console.warn('Firestore user update note:', err);
  }

  return updatedData as UserProfile;
}

// Document Cloud Persistence
export async function saveDocumentToFirestore(document: StudyDocument): Promise<void> {
  // If the student is browsing locally/unauthenticated, safely persist to IndexedDB/LocalStorage only.
  // Firestore rules strictly mandate isSignedIn() for document cloud writes.
  if (!auth.currentUser) {
    return;
  }

  const docPath = `documents/${document.id}`;
  try {
    const docRef = doc(db, 'documents', document.id);
    
    const cloudDoc = {
      id: document.id,
      title: document.title,
      subject: document.subject,
      customSubjectName: document.customSubjectName || '',
      docType: document.docType,
      format: document.format || 'files',
      grade: document.grade,
      term: document.term,
      author: document.author,
      description: document.description || '',
      userId: auth.currentUser.uid,
      averageRating: document.averageRating ?? 5,
      ratingsCount: document.ratingsCount ?? 0,
      comments: (document.comments || []).slice(-15),
      createdAt: document.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, cloudDoc, { merge: true });

    // Sync to PostgreSQL database
    auth.currentUser.getIdToken().then((token) => {
      fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: document.id,
          title: document.title,
          subject: document.subject,
          customSubjectName: document.customSubjectName || '',
          docType: document.docType,
          format: document.format || 'files',
          grade: document.grade,
          term: document.term,
          author: document.author,
          description: document.description || '',
          pagesJson: JSON.stringify(document.pages || []),
          averageRating: document.averageRating ?? 5,
          ratingsCount: document.ratingsCount ?? 0,
        }),
      }).catch((err) => console.warn('PostgreSQL doc sync note:', err));
    }).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteDocumentFromFirestore(documentId: string): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  const docPath = `documents/${documentId}`;
  try {
    await deleteDoc(doc(db, 'documents', documentId));

    // Delete from PostgreSQL database
    auth.currentUser.getIdToken().then((token) => {
      fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }).catch((err) => console.warn('PostgreSQL doc delete note:', err));
    }).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// Reminder Cloud Persistence
export async function saveReminderToFirestore(reminder: StudyReminder): Promise<void> {
  if (!auth.currentUser) return;
  const remPath = `reminders/${reminder.id}`;
  try {
    const remRef = doc(db, 'reminders', reminder.id);
    const cloudReminder = {
      id: reminder.id,
      userId: auth.currentUser.uid,
      subjectId: reminder.subjectId,
      customSubjectName: reminder.customSubjectName || '',
      title: reminder.title,
      targetDate: reminder.targetDate,
      targetTime: reminder.targetTime,
      repeatType: reminder.repeatType,
      priority: reminder.priority,
      isActive: reminder.isActive,
      isCompleted: reminder.isCompleted,
      notes: reminder.notes || '',
      linkedDocId: reminder.linkedDocId || '',
      linkedDocTitle: reminder.linkedDocTitle || '',
      createdAt: reminder.createdAt || new Date().toISOString(),
    };
    await setDoc(remRef, cloudReminder, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, remPath);
  }
}

export async function deleteReminderFromFirestore(reminderId: string): Promise<void> {
  if (!auth.currentUser) return;
  const remPath = `reminders/${reminderId}`;
  try {
    await deleteDoc(doc(db, 'reminders', reminderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, remPath);
  }
}

export function subscribeToUserReminders(
  userId: string,
  onData: (reminders: StudyReminder[]) => void
): () => void {
  const path = 'reminders';
  const q = query(collection(db, path), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const reminders: StudyReminder[] = [];
      snapshot.forEach((snap) => {
        reminders.push(snap.data() as StudyReminder);
      });
      onData(reminders);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Quick Notes Persistence in Firebase (مرتبطة بكل مستخدم وكل مذكرة)
export async function saveQuickNoteToFirestore(note: DocumentQuickNote): Promise<void> {
  if (!auth.currentUser) {
    // Save to local storage for guests / offline
    const localKey = `qalami_notes_${note.docId}`;
    try {
      const local = JSON.parse(localStorage.getItem(localKey) || '[]');
      const index = local.findIndex((n: DocumentQuickNote) => n.id === note.id);
      if (index >= 0) {
        local[index] = note;
      } else {
        local.unshift(note);
      }
      localStorage.setItem(localKey, JSON.stringify(local));
    } catch (e) {
      console.warn('Local storage notes write error:', e);
    }
    return;
  }

  const notePath = `users/${auth.currentUser.uid}/notes/${note.id}`;
  try {
    const noteRef = doc(db, 'users', auth.currentUser.uid, 'notes', note.id);
    const dataToSave = {
      id: note.id,
      userId: auth.currentUser.uid,
      docId: note.docId,
      content: note.content,
      pageNumber: note.pageNumber ?? 1,
      color: note.color || 'amber',
      createdAt: note.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(noteRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, notePath);
  }
}

export async function deleteQuickNoteFromFirestore(docId: string, noteId: string): Promise<void> {
  if (!auth.currentUser) {
    const localKey = `qalami_notes_${docId}`;
    try {
      const local = JSON.parse(localStorage.getItem(localKey) || '[]');
      const filtered = local.filter((n: DocumentQuickNote) => n.id !== noteId);
      localStorage.setItem(localKey, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Local storage notes delete error:', e);
    }
    return;
  }

  const notePath = `users/${auth.currentUser.uid}/notes/${noteId}`;
  try {
    const noteRef = doc(db, 'users', auth.currentUser.uid, 'notes', noteId);
    await deleteDoc(noteRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, notePath);
  }
}

export function subscribeToDocumentQuickNotes(
  docId: string,
  onData: (notes: DocumentQuickNote[]) => void
): () => void {
  const currentUid = auth.currentUser?.uid;
  if (!currentUid) {
    const localKey = `qalami_notes_${docId}`;
    try {
      const local = JSON.parse(localStorage.getItem(localKey) || '[]');
      onData(local);
    } catch {
      onData([]);
    }
    const handleStorage = (e: StorageEvent) => {
      if (e.key === localKey) {
        try {
          onData(JSON.parse(e.newValue || '[]'));
        } catch {
          onData([]);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }

  const path = `users/${currentUid}/notes`;
  const q = query(
    collection(db, 'users', currentUid, 'notes'),
    where('docId', '==', docId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notes: DocumentQuickNote[] = [];
      snapshot.forEach((snap) => {
        notes.push(snap.data() as DocumentQuickNote);
      });
      notes.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
      onData(notes);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}


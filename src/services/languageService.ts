import { useState, useEffect } from 'react';

export type LanguageCode = 'ar' | 'en' | 'fr';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'rtl' | 'ltr';
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'ar', name: 'Arabic', nativeName: 'العربية (مصر)', flag: '🇪🇬', dir: 'rtl' },
  { code: 'en', name: 'English', nativeName: 'English (US)', flag: '🇺🇸', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
];

const STORAGE_KEY = 'qalami_selected_language_v1';

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  ar: {
    appName: 'منصة قلمي التعليمية',
    appSubtitle: 'مكتبة المذكرات والكتب والملازم مع القلم الإلكتروني الذكي',
    gradeBadge: 'الصف الخامس الابتدائي',
    publishDoc: 'نشر كتاب أو ملزمة',
    publishModalTitle: 'نشر ملزمة أو كتاب أو حلول',
    publishSuccess: 'تم نشر المذكرة بنجاح في المكتبة ✨',
    studyReminders: 'تنبيهات المذاكرة',
    activeReminders: 'تنبيه نشط',
    notificationsCenter: 'مركز الإشعارات والتنبيهات',
    activateNotifications: 'تفعيل إشعارات الموقع',
    dayMode: 'وضع صباح',
    nightMode: 'وضع ليل',
    signIn: 'تسجيل الدخول',
    signOut: 'تسجيل الخروج',
    myAccount: 'حسابي',
    firebaseConnected: 'Firebase متصل سحابياً',
    docsCount: 'مذكرات',
    searchPlaceholder: 'ابحث عن أي مذكرة، درس، ملخص، أو حل بالاسم أو المادة...',
    allClassifications: 'جميع التصنيفات',
    allSubjects: 'جميع المواد',
    
    // Classifications
    typeSolution: 'حل',
    typeSolutionDesc: 'حلول الدروس والتمارين ونماذج الإجابة النموذجية',
    typeRevision: 'مراجعة',
    typeRevisionDesc: 'مراجعات نهائية، ليلة الامتحان، وتلخيص الدروس',
    typeBook: 'كتاب كامل',
    typeBookDesc: 'الكتب المدرسية والكتب الخارجية والكتيبات الشاملة',
    
    // Pen
    penSmart: 'القلم الإلكتروني الذكي',
    penClickToOpen: 'انقر لفتح القلم الإلكتروني والكتابة',
    penMinimize: 'تصغير القلم',
    penFreehand: 'قلم حر',
    penHighlighter: 'تظليل فسفوري',
    penText: 'كتابة نص',
    penShapes: 'تخطيط وأشكال',
    penUndo: 'تراجع',
    penRedo: 'إعادة',
    penClear: 'مسح الكل',
    penColors: 'الألوان',
    penStroke: 'السمك',
    
    // AI & Voice
    aiTutor: 'المعلم الذكي AI',
    voiceExplain: 'شرح بالصوت 🔊',
    voiceExplainTitle: 'شرح المعلم الذكي بالصوت 🎧',
    fullExplanationText: 'نص الشرح الكامل والتفصيلي:',
    speed: 'السرعة',
    copyText: 'نسخ النص',
    textCopied: 'تم النسخ بنجاح!',
    askAiAboutPage: 'اسأل المعلم الذكي عن هذه الصفحة',
    addAttachmentPlus: 'إضافة وسائط ومستندات (+)',
    attachImage: 'صورة أو لقطة شاشة',
    attachVideo: 'فيديو أو رابط تعليمي',
    attachDoc: 'ملف أو مذكرة PDF/Word',
    attachVoice: 'تسجيل صوتي لسؤالك',
    
    // Notifications modal
    allowNotif: 'سماح بالإشعارات (Allow)',
    blockNotif: 'حظر الموقع (Block)',
    notifAllowedMsg: 'مسموح بالإشعارات ✅',
    notifBlockedMsg: 'تم حظر الموقع 🚫',
    testNotifBtn: 'تجربة إرسال إشعار 🚀',
    openDoc: 'فتح المذكرة',
    shareDoc: 'مشاركة',
    deleteDoc: 'مسح فوري',
    downloadPdf: 'تحميل وطباعة PDF',
  },
  en: {
    appName: 'Qalami Educational Platform',
    appSubtitle: 'Smart Study Notes & Curriculum with Interactive Digital Pen',
    gradeBadge: '5th Primary Grade',
    publishDoc: 'Publish Document or Book',
    publishModalTitle: 'Publish Study Booklet, Book or Solutions',
    publishSuccess: 'Document published successfully to the library ✨',
    studyReminders: 'Study Reminders',
    activeReminders: 'Active Reminder',
    notificationsCenter: 'Notifications Center',
    activateNotifications: 'Enable Site Notifications',
    dayMode: 'Day Mode',
    nightMode: 'Night Mode',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    myAccount: 'My Account',
    firebaseConnected: 'Firebase Cloud Connected',
    docsCount: 'Documents',
    searchPlaceholder: 'Search any booklet, exam, revision or subject...',
    allClassifications: 'All Classifications',
    allSubjects: 'All Subjects',
    
    // Classifications
    typeSolution: 'Solution',
    typeSolutionDesc: 'Lesson solutions, exercises and model answers',
    typeRevision: 'Revision',
    typeRevisionDesc: 'Final exam revision, summary & key takeaways',
    typeBook: 'Complete Book',
    typeBookDesc: 'Official textbooks, reference books & complete guides',
    
    // Pen
    penSmart: 'Smart Electronic Pen',
    penClickToOpen: 'Click to open digital pen & write',
    penMinimize: 'Minimize Pen',
    penFreehand: 'Pen',
    penHighlighter: 'Highlighter',
    penText: 'Text',
    penShapes: 'Shapes',
    penUndo: 'Undo',
    penRedo: 'Redo',
    penClear: 'Clear Page',
    penColors: 'Colors',
    penStroke: 'Stroke Size',
    
    // AI & Voice
    aiTutor: 'AI Smart Tutor',
    voiceExplain: 'Voice Explanation 🔊',
    voiceExplainTitle: 'AI Smart Voice Explanation 🎧',
    fullExplanationText: 'Full Detailed Explanation Text:',
    speed: 'Speed',
    copyText: 'Copy Text',
    textCopied: 'Copied successfully!',
    askAiAboutPage: 'Ask AI Tutor about this page',
    addAttachmentPlus: 'Add Media & Documents (+)',
    attachImage: 'Photo or Screenshot',
    attachVideo: 'Video or Tutorial Link',
    attachDoc: 'PDF or Word Document',
    attachVoice: 'Voice Recording',
    
    // Notifications modal
    allowNotif: 'Allow Notifications',
    blockNotif: 'Block Site',
    notifAllowedMsg: 'Notifications Allowed ✅',
    notifBlockedMsg: 'Site Blocked 🚫',
    testNotifBtn: 'Send Test Notification 🚀',
    openDoc: 'Open Document',
    shareDoc: 'Share',
    deleteDoc: 'Instant Delete',
    downloadPdf: 'Download / Print PDF',
  },
  fr: {
    appName: 'Plateforme Éducative Qalami',
    appSubtitle: 'Cahiers Scolaires et Stylus Électronique Interactif',
    gradeBadge: '5ème Année Primaire',
    publishDoc: 'Publier un Document',
    publishModalTitle: 'Publier un Cahier, Livre ou Corrigés',
    publishSuccess: 'Document publié avec succès dans la bibliothèque ✨',
    studyReminders: 'Rappels d’Étude',
    activeReminders: 'Rappel Actif',
    notificationsCenter: 'Centre de Notifications',
    activateNotifications: 'Activer Notifications du Site',
    dayMode: 'Mode Jour',
    nightMode: 'Mode Nuit',
    signIn: 'Connexion',
    signOut: 'Déconnexion',
    myAccount: 'Mon Compte',
    firebaseConnected: 'Firebase Connecté',
    docsCount: 'Documents',
    searchPlaceholder: 'Rechercher un document, examen, résumé...',
    allClassifications: 'Toutes Catégories',
    allSubjects: 'Toutes Matières',
    
    // Classifications
    typeSolution: 'Corrigé',
    typeSolutionDesc: 'Solutions d’exercices et réponses types',
    typeRevision: 'Révision',
    typeRevisionDesc: 'Révisions finales et résumés essentiels',
    typeBook: 'Livre Complet',
    typeBookDesc: 'Manuels scolaires officiels et livres complets',
    
    // Pen
    penSmart: 'Stylet Numérique Intelligent',
    penClickToOpen: 'Cliquer pour ouvrir le stylet et annoter',
    penMinimize: 'Réduire le stylet',
    penFreehand: 'Stylet',
    penHighlighter: 'Surligneur',
    penText: 'Texte',
    penShapes: 'Formes',
    penUndo: 'Annuler',
    penRedo: 'Rétablir',
    penClear: 'Effacer Tout',
    penColors: 'Couleurs',
    penStroke: 'Épaisseur',
    
    // AI & Voice
    aiTutor: 'Tuteur IA Intelligent',
    voiceExplain: 'Explication Vocale 🔊',
    voiceExplainTitle: 'Explication Vocale par Tuteur IA 🎧',
    fullExplanationText: 'Texte d’Explication Détaillé :',
    speed: 'Vitesse',
    copyText: 'Copier le Texte',
    textCopied: 'Copié avec succès !',
    askAiAboutPage: 'Interroger le Tuteur IA',
    addAttachmentPlus: 'Ajouter Fichiers & Médias (+)',
    attachImage: 'Image ou Capture d’écran',
    attachVideo: 'Vidéo ou Lien Éducatif',
    attachDoc: 'Fichier PDF ou Word',
    attachVoice: 'Enregistrement Vocal',
    
    // Notifications modal
    allowNotif: 'Autoriser Notifications',
    blockNotif: 'Bloquer le Site',
    notifAllowedMsg: 'Notifications Autorisées ✅',
    notifBlockedMsg: 'Site Bloqué 🚫',
    testNotifBtn: 'Tester Notification 🚀',
    openDoc: 'Ouvrir le Document',
    shareDoc: 'Partager',
    deleteDoc: 'Suppression Immédiate',
    downloadPdf: 'Télécharger / Imprimer PDF',
  },
};

export const LanguageService = {
  getCurrentLanguage(): LanguageCode {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (saved && (saved === 'ar' || saved === 'en' || saved === 'fr')) {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'ar';
  },

  setLanguage(lang: LanguageCode): void {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      const langInfo = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
      
      // Update HTML lang and dir attributes
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
        document.documentElement.dir = langInfo.dir;
      }

      // Dispatch custom event for reactive subscribers
      window.dispatchEvent(new CustomEvent('qalami_language_changed', { detail: { lang } }));
    } catch (e) {
      console.error(e);
    }
  },

  t(key: string, currentLang?: LanguageCode): string {
    const lang = currentLang || this.getCurrentLanguage();
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.ar;
    return dict[key] || TRANSLATIONS.ar[key] || key;
  },

  init(): void {
    const lang = this.getCurrentLanguage();
    const langInfo = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = langInfo.dir;
    }
  },
};

// React Hook for easy subscription to language changes
export function useLanguage() {
  const [currentLang, setCurrentLangState] = useState<LanguageCode>(() => LanguageService.getCurrentLanguage());

  useEffect(() => {
    LanguageService.init();

    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ lang: LanguageCode }>;
      if (customEvent.detail && customEvent.detail.lang) {
        setCurrentLangState(customEvent.detail.lang);
      }
    };

    window.addEventListener('qalami_language_changed', handleLangChange);
    return () => {
      window.removeEventListener('qalami_language_changed', handleLangChange);
    };
  }, []);

  const changeLanguage = (lang: LanguageCode) => {
    LanguageService.setLanguage(lang);
    setCurrentLangState(lang);
  };

  const t = (key: string) => LanguageService.t(key, currentLang);
  const langInfo = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  return {
    currentLang,
    changeLanguage,
    t,
    langInfo,
    languages: LANGUAGES,
    isRtl: langInfo.dir === 'rtl',
  };
}

import React, { useState, useRef } from 'react';
import { 
  SubjectId, 
  DocumentType, 
  PublishFormat, 
  SUBJECTS, 
  DOC_TYPES, 
  StudyDocument,
  DocumentPage,
  EDUCATIONAL_GRADES
} from '../../types';
import { 
  processImagesToPages, 
  processPdfToPages, 
  generateId, 
  createBlankPage 
} from '../../services/fileProcessor';
import { StorageService } from '../../services/storage';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Sparkles, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  Book,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentCreated: (newDoc: StudyDocument) => void;
}

const FIXED_GRADE = 'الصف الخامس الابتدائي';

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  onDocumentCreated,
}) => {
  const [publishFormat, setPublishFormat] = useState<PublishFormat>('files');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<SubjectId>('arabic');
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [docType, setDocType] = useState<DocumentType>('revision');
  const [grade, setGrade] = useState('الصف الخامس الابتدائي');
  const [term, setTerm] = useState<'term1' | 'term2' | 'full_year'>('term1');
  const [author, setAuthor] = useState(() => {
    try {
      return StorageService.getActiveProfile().name || '';
    } catch {
      return '';
    }
  });
  const [description, setDescription] = useState('');
  
  // File processing states
  const [pages, setPages] = useState<DocumentPage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle PDF / File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setIsProcessing(true);
    setProgressMsg('جاري قراءة الملف وتجهيز الصفحات...');

    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const extractedPages = await processPdfToPages(file, (curr, total) => {
          setProgressMsg(`جاري معالجة الصفحة ${curr} من ${total}...`);
        });

        if (extractedPages.length === 0) {
          throw new Error('لم يتم العثور على صفحات في الملف');
        }

        setPages(extractedPages);
        if (!title) {
          // Auto fill title from file name without extension
          setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
        }
      } else {
        // Fallback for single image upload via file tab
        const singlePage = await processImagesToPages([file]);
        setPages(singlePage);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء معالجة الملف. يمكنك محاولة رفعه كصور أو التأكد من سلامة ملف الـ PDF.');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  // Handle Multi-Image Upload
  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMsg('');
    setIsProcessing(true);
    setProgressMsg('جاري معالجة الصور...');

    try {
      const fileArray = Array.from(files);
      const newPages = await processImagesToPages(fileArray);
      setPages((prev) => [...prev, ...newPages]);

      if (!title && fileArray[0]) {
        setTitle(fileArray[0].name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('تعذر رفع بعض الصور، يرجى المحاولة بصيغة PNG أو JPG.');
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const removePage = (indexToRemove: number) => {
    const updated = pages
      .filter((_, idx) => idx !== indexToRemove)
      .map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    setPages(updated);
  };

  const handleAddBlankNotePage = () => {
    const blank = createBlankPage(pages.length + 1, 'lined');
    setPages((prev) => [...prev, blank]);
  };

  // Quick Sample Loader (Al-Emtehan 5th Grade Arabic)
  const handleLoadSampleExam = () => {
    const sample = StorageService.createSampleArabicExam('grade_5_student');
    setTitle(sample.title);
    setSubject(sample.subject);
    setDocType(sample.docType);
    setTerm(sample.term);
    setAuthor(sample.author);
    setDescription(sample.description);
    setPages(sample.pages);
    setPublishFormat('files');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMsg('يرجى كتابة عنوان للمذكرة أو الكتاب');
      return;
    }

    if (pages.length === 0) {
      setErrorMsg('يرجى رفع ملف أو صور للمذكرة أولاً، أو إضافة صفحة كشكول بيضاء');
      return;
    }

    const activeProfile = StorageService.getActiveProfile();
    const newDoc: StudyDocument = {
      id: generateId(),
      title: title.trim(),
      subject,
      customSubjectName: subject === 'custom' ? customSubjectName : undefined,
      docType,
      format: publishFormat,
      grade: FIXED_GRADE,
      term,
      author: author.trim() || activeProfile.name || 'طالب متميز',
      description: description.trim(),
      tags: [
        subject,
        docType,
        FIXED_GRADE,
        term === 'term1' ? 'ترم أول' : term === 'term2' ? 'ترم ثاني' : 'عام كامل',
      ],
      pages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: activeProfile.id || 'grade_5_student',
      isFavorite: false,
    };

    StorageService.saveDocument(newDoc);
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
    onDocumentCreated(newDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto font-['Cairo',sans-serif]">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 stroke-2" />
            <h2 className="text-lg sm:text-xl font-extrabold">نشر كتاب أو ملزمة أو مذكرة دراسية</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Sample Action Pill */}
        <div className="px-6 py-2.5 bg-amber-50 dark:bg-slate-800/80 border-b border-amber-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-amber-900 dark:text-amber-200 font-medium">
            💡 هل تريد تجربة المنصة والأدوات فوراً بنموذج جاهز؟
          </span>
          <button
            type="button"
            onClick={handleLoadSampleExam}
            className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center gap-1 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>تجربة نموذج (اختبارات لغة عربية - كتاب الامتحان الصف الخامس)</span>
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TWO PUBLISH MODES: نشر بالصور VS نشر Files */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-200 mb-2">
              طريقة النشر المطلوبة:
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Option 1: نشر Files */}
              <button
                type="button"
                onClick={() => setPublishFormat('files')}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-right transition-all ${
                  publishFormat === 'files'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 text-blue-950 dark:text-blue-200 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${publishFormat === 'files' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-extrabold text-sm">نشر Files (ملفات PDF)</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    رفع كتب كاملة وملازم PDF مع تحويل الصفحات تلقائياً
                  </div>
                </div>
              </button>

              {/* Option 2: نشر بالصور */}
              <button
                type="button"
                onClick={() => setPublishFormat('images')}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-right transition-all ${
                  publishFormat === 'images'
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${publishFormat === 'images' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-extrabold text-sm">نشر بالصور (Multi-Images)</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    رفع صور ومسح ضوئي لصفحات الملازم من الكاميرا
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* File Upload Zone */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-amber-500 transition-colors bg-slate-50 dark:bg-slate-950/40">
            {isProcessing ? (
              <div className="py-6 flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{progressMsg}</div>
              </div>
            ) : publishFormat === 'files' ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <FileText className="w-12 h-12 mx-auto text-blue-500 mb-2" />
                <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm mb-1">
                  اختر ملف PDF من جهازك أو اسحبه إلى هنا
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  يدعم كتب وملازم ونماذج الامتحانات بصيغة PDF
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>تصفح ملفات الجهاز</span>
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesUpload}
                  className="hidden"
                />
                <ImageIcon className="w-12 h-12 mx-auto text-amber-500 mb-2" />
                <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm mb-1">
                  اختر صورة أو مجموعة صور صفحات المذكرة
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  يمكنك تحديد عدة صور دفعة واحدة وترتيبها كصفحات
                </p>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition inline-flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>تصفح صور الملازم</span>
                </button>
              </div>
            )}
          </div>

          {/* Uploaded Pages Preview Strip */}
          {pages.length > 0 && (
            <div className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  الصفحات الجاهزة للنشر ({pages.length} صفحة):
                </span>
                <button
                  type="button"
                  onClick={handleAddBlankNotePage}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة صفحة كشكول مسطرة للملاحظات</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {pages.map((p, idx) => (
                  <div key={p.id} className="relative group rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900 p-1">
                    <img
                      src={p.imageUrl}
                      alt={`صفحة ${p.pageNumber}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <div className="flex items-center justify-between mt-1 px-1 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      <span>صفحة {p.pageNumber}</span>
                      <button
                        type="button"
                        onClick={() => removePage(idx)}
                        className="text-rose-500 hover:text-rose-700 p-0.5"
                        title="حذف هذه الصفحة"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Information & Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                عنوان المذكرة أو الكتاب *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: نماذج اختبارات شهر أكتوبر لغة عربية - كتاب الامتحان"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Subject Selector (Specified in prompt) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                المادة الدراسية *
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectId)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
              >
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Subject Name if selected */}
            {subject === 'custom' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اكتب اسم المادة المخصصة
                </label>
                <input
                  type="text"
                  value={customSubjectName}
                  onChange={(e) => setCustomSubjectName(e.target.value)}
                  placeholder="مثال: لغة فرنسية، مهارات مهنية، فيزياء..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            )}

            {/* Document Type Classification: حل أو مراجعة أو كتاب كامل */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  تصنيف النشر * (اختر: حل، أو مراجعة، أو كتاب كامل)
                </label>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                  3 تصنيفات معتمدة للنشر
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DOC_TYPES.map((dt) => {
                  const isSelected = docType === dt.id;
                  return (
                    <button
                      key={dt.id}
                      type="button"
                      onClick={() => setDocType(dt.id)}
                      className={`p-3.5 rounded-2xl border-2 text-right transition-all flex flex-col justify-between cursor-pointer relative ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/20 text-slate-950 dark:text-white shadow-md ring-2 ring-amber-500/40'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-xl ${
                            dt.id === 'solution'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                              : dt.id === 'revision'
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400'
                              : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                          }`}>
                            {dt.id === 'solution' && <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
                            {dt.id === 'revision' && <Sparkles className="w-4 h-4 stroke-[2.5]" />}
                            {dt.id === 'book' && <Book className="w-4 h-4 stroke-[2.5]" />}
                          </div>
                          <div>
                            <span className="font-black text-sm block">{dt.label}</span>
                            <span className="text-[10px] text-slate-400 font-semibold">{dt.badgeLabel}</span>
                          </div>
                        </div>
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-amber-500 bg-amber-500' : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        {dt.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grade - All Educational Stages and Years */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                الصف / السنة الدراسية *
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <optgroup label="المرحلة الابتدائية">
                  <option value="الصف الأول الابتدائي">الصف الأول الابتدائي</option>
                  <option value="الصف الثاني الابتدائي">الصف الثاني الابتدائي</option>
                  <option value="الصف الثالث الابتدائي">الصف الثالث الابتدائي</option>
                  <option value="الصف الرابع الابتدائي">الصف الرابع الابتدائي</option>
                  <option value="الصف الخامس الابتدائي">الصف الخامس الابتدائي</option>
                  <option value="الصف السادس الابتدائي">الصف السادس الابتدائي</option>
                </optgroup>
                <optgroup label="المرحلة الإعدادية">
                  <option value="الصف الأول الإعدادي">الصف الأول الإعدادي</option>
                  <option value="الصف الثاني الإعدادي">الصف الثاني الإعدادي</option>
                  <option value="الصف الثالث الإعدادي">الصف الثالث الإعدادي</option>
                </optgroup>
                <optgroup label="المرحلة الثانوية">
                  <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                  <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                  <option value="الصف الثالث الثانوي (الثانوية العامة)">الصف الثالث الثانوي (الثانوية العامة)</option>
                </optgroup>
                <optgroup label="مرحلة رياض الأطفال">
                  <option value="مرحلة رياض الأطفال (KG1 - KG2)">مرحلة رياض الأطفال (KG1 - KG2)</option>
                </optgroup>
                <optgroup label="التعليم الجامعي والعام">
                  <option value="المرحلة الجامعية والمعاهد العليا">المرحلة الجامعية والمعاهد العليا</option>
                  <option value="مذكرات عامة وتدريب مهني">مذكرات عامة وتدريب مهني</option>
                </optgroup>
              </select>
            </div>

            {/* Term */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                الفصل الدراسي
              </label>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
              >
                <option value="term1">الفصل الدراسي الأول (ترم أول)</option>
                <option value="term2">الفصل الدراسي الثاني (ترم ثاني)</option>
                <option value="full_year">العام الدراسي كاملاً</option>
              </select>
            </div>

            {/* Author / Teacher */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                اسم المعلم أو الكتاب
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="مثال: كتاب الامتحان / الأستاذ أحمد / سلاح التلميذ"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                وصف وملاحظات إضافية
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="نبذة عن المذكرة، أهم الدروس التي تحتويها، أو مواصفات الامتحان..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold text-xs shadow-lg transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>نشر وحفظ في المكتبة الآن</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

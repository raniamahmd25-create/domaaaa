import React, { useState, useEffect } from 'react';
import { DocumentQuickNote, StudyDocument } from '../../types';
import { 
  saveQuickNoteToFirestore, 
  deleteQuickNoteFromFirestore, 
  subscribeToDocumentQuickNotes,
  auth 
} from '../../services/firebase';
import { 
  StickyNote, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Copy, 
  Printer, 
  Clock, 
  Sparkles, 
  Layers, 
  CloudCheck,
  FileText
} from 'lucide-react';

interface QuickNotesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  document: StudyDocument;
  currentPageNumber: number;
  onNavigateToPage: (pageNumber: number) => void;
}

const COLOR_OPTIONS: { id: string; name: string; bg: string; border: string; text: string; dot: string }[] = [
  { id: 'amber', name: 'أصفر كلاسيكي', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-300 dark:border-amber-700/60', text: 'text-amber-900 dark:text-amber-200', dot: 'bg-amber-500' },
  { id: 'emerald', name: 'أخضر هادئ', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-300 dark:border-emerald-700/60', text: 'text-emerald-900 dark:text-emerald-200', dot: 'bg-emerald-500' },
  { id: 'blue', name: 'أزرق تركيز', bg: 'bg-sky-50 dark:bg-sky-950/40', border: 'border-sky-300 dark:border-sky-700/60', text: 'text-sky-900 dark:text-sky-200', dot: 'bg-sky-500' },
  { id: 'purple', name: 'بنفسجي تلخيص', bg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-300 dark:border-purple-700/60', text: 'text-purple-900 dark:text-purple-200', dot: 'bg-purple-500' },
  { id: 'rose', name: 'وردي تنبيه مهم', bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-300 dark:border-rose-700/60', text: 'text-rose-900 dark:text-rose-200', dot: 'bg-rose-500' },
];

export const QuickNotesSidebar: React.FC<QuickNotesSidebarProps> = ({
  isOpen,
  onClose,
  document: currentDoc,
  currentPageNumber,
  onNavigateToPage,
}) => {
  const [notes, setNotes] = useState<DocumentQuickNote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterMode, setFilterMode] = useState<'all' | 'current'>('all');
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newContent, setNewContent] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('amber');
  const [attachToPage, setAttachToPage] = useState<boolean>(true);
  
  // Edit mode
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');

  // Status feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Subscribe to realtime updates from Firebase Firestore
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToDocumentQuickNotes(currentDoc.id, (fetchedNotes) => {
      setNotes(fetchedNotes);
      setIsLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentDoc.id]);

  if (!isOpen) return null;

  const filteredNotes = filterMode === 'current'
    ? notes.filter((n) => n.pageNumber === currentPageNumber)
    : notes;

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const noteId = 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newNote: DocumentQuickNote = {
      id: noteId,
      userId: auth.currentUser?.uid || 'guest_user',
      docId: currentDoc.id,
      content: newContent.trim(),
      pageNumber: attachToPage ? currentPageNumber : undefined,
      color: selectedColor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveQuickNoteToFirestore(newNote);
      setNewContent('');
      setIsAdding(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Error saving quick note:', err);
    }
  };

  const handleUpdateNote = async (note: DocumentQuickNote) => {
    if (!editContent.trim()) return;
    const updated: DocumentQuickNote = {
      ...note,
      content: editContent.trim(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveQuickNoteToFirestore(updated);
      setEditingNoteId(null);
      setEditContent('');
    } catch (err) {
      console.error('Error updating note:', err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) return;
    try {
      await deleteQuickNoteFromFirestore(currentDoc.id, noteId);
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const handleCopyNote = (noteId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(noteId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePrintNotes = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const notesHtml = notes.map((n, idx) => `
      <div style="margin-bottom: 16px; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-family: sans-serif; direction: rtl; text-align: right; background-color: #fafafa;">
        <div style="font-weight: bold; color: #b45309; margin-bottom: 6px;">ملاحظة #${idx + 1} ${n.pageNumber ? `- صفحة (${n.pageNumber})` : '- ملاحظة عامة'}</div>
        <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${n.content}</div>
        <div style="font-size: 11px; color: #888; margin-top: 8px;">تاريخ التدوين: ${new Date(n.createdAt).toLocaleDateString('ar-EG')}</div>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <title>ملاحظاتي - ${currentDoc.title}</title>
          <meta charset="utf-8" />
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; direction: rtl; }
            h1 { color: #1e293b; font-size: 20px; border-bottom: 2px solid #f59e0b; padding-bottom: 8px; }
            .header-info { color: #64748b; font-size: 13px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>📝 ملاحظات الاستذكار: ${currentDoc.title}</h1>
          <div class="header-info">المادة: ${currentDoc.customSubjectName || currentDoc.subject} | عدد الملاحظات: ${notes.length}</div>
          ${notesHtml}
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <aside 
      aria-label="الملاحظات النصية السريعة للمذكرة"
      className="w-80 md:w-96 bg-white dark:bg-slate-900 border-s border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0 shadow-2xl z-30 transition-all duration-300"
    >
      {/* 1. Header */}
      <header className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-500/10 dark:bg-amber-500/5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500 text-slate-950 shadow-sm">
            <StickyNote className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>الملاحظات السريعة</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold">
                {notes.length}
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {auth.currentUser ? 'تزامن سحابي آمن مع Firebase' : 'تخزين محلي بجهازك'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {notes.length > 0 && (
            <button
              type="button"
              onClick={handlePrintNotes}
              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition"
              title="طباعة وتصدير الملاحظات"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="إغلاق لوحة الملاحظات"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. Filter & Add Trigger Toolbar */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-900/40">
        <div className="flex items-center rounded-lg bg-slate-200/80 dark:bg-slate-800 p-0.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-md transition ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            الكل ({notes.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('current')}
            className={`px-2.5 py-1 rounded-md transition ${
              filterMode === 'current'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            صفحة {currentPageNumber} ({notes.filter(n => n.pageNumber === currentPageNumber).length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingNoteId(null);
          }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            isAdding
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm active:scale-95'
          }`}
        >
          {isAdding ? (
            <>
              <X className="w-3.5 h-3.5" />
              <span>إلغاء</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>ملاحظة جديدة</span>
            </>
          )}
        </button>
      </div>

      {/* 3. Feedback Banner */}
      {saveSuccess && (
        <div className="mx-3 mt-2 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>تم حفظ الملاحظة بنجاح في حسابك!</span>
        </div>
      )}

      {/* 4. Add Note Form */}
      {isAdding && (
        <form onSubmit={handleCreateNote} className="p-3 border-b border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20">
          <fieldset className="space-y-2 border-0 p-0 m-0">
            <legend className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>تدوين ملاحظة سريعة أثناء المذاكرة</span>
            </legend>

            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="اكتب ملاحظتك، تلخيصك، أو فكرة تريد تذكرها في هذه الصفحة..."
              rows={3}
              autoFocus
              className="w-full text-xs p-2.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none font-medium leading-relaxed"
            />

            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              {/* Color Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 font-bold">اللون:</span>
                <div className="flex items-center gap-1">
                  {COLOR_OPTIONS.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setSelectedColor(col.id)}
                      className={`w-5 h-5 rounded-full ${col.dot} transition-transform ${
                        selectedColor === col.id ? 'ring-2 ring-offset-1 ring-slate-800 dark:ring-white scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={col.name}
                    />
                  ))}
                </div>
              </div>

              {/* Attach to Page Option */}
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={attachToPage}
                  onChange={(e) => setAttachToPage(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 w-3.5 h-3.5"
                />
                <span>ربط بصفحة {currentPageNumber}</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewContent('');
                }}
                className="px-3 py-1 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={!newContent.trim()}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs transition shadow-sm cursor-pointer"
              >
                حفظ في حسابي
              </button>
            </div>
          </fieldset>
        </form>
      )}

      {/* 5. Notes List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-medium">جاري مزامنة الملاحظات مع Firebase...</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
              <StickyNote className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              {filterMode === 'current' ? `لا توجد ملاحظات لصفحة ${currentPageNumber}` : 'لا توجد ملاحظات مسجلة بعد'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs leading-relaxed">
              سجل ملاحظاتك وفوائدك أثناء المذاكرة هنا، وسيتم حفظها سحابياً في حسابك للرجوع لها وقت الامتحانات!
            </p>
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة أول ملاحظة</span>
            </button>
          </div>
        ) : (
          <ul role="list" className="space-y-2.5">
            {filteredNotes.map((note) => {
              const colorConfig = COLOR_OPTIONS.find((c) => c.id === note.color) || COLOR_OPTIONS[0];
              const isEditing = editingNoteId === note.id;

              return (
                <li key={note.id}>
                  <article
                    className={`rounded-2xl border p-3 transition-all relative group shadow-xs ${colorConfig.bg} ${colorConfig.border}`}
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          autoFocus
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId(null);
                              setEditContent('');
                            }}
                            className="px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800"
                          >
                            إلغاء
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateNote(note)}
                            className="px-3 py-1 rounded-md bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400"
                          >
                            تحديث
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Note Top Bar */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            {note.pageNumber ? (
                              <button
                                type="button"
                                onClick={() => onNavigateToPage(note.pageNumber!)}
                                className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/80 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/60 hover:bg-amber-500 hover:text-slate-950 transition flex items-center gap-1 cursor-pointer"
                                title="انتقل إلى الصفحة"
                              >
                                <Layers className="w-3 h-3" />
                                <span>صفحة {note.pageNumber}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70 dark:bg-slate-900/60 text-slate-500">
                                عامة
                              </span>
                            )}
                            <time className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(note.createdAt).toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' })}
                            </time>
                          </div>

                          {/* Action icons */}
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                            <button
                              type="button"
                              onClick={() => handleCopyNote(note.id, note.content)}
                              className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-white/60 dark:hover:bg-slate-800 transition"
                              title="نسخ الملاحظة"
                            >
                              {copiedId === note.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNoteId(note.id);
                                setEditContent(note.content);
                              }}
                              className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-white/60 dark:hover:bg-slate-800 transition"
                              title="تعديل الملاحظة"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-white/60 dark:hover:bg-slate-800 transition"
                              title="حذف الملاحظة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Note Body */}
                        <p className={`text-xs font-semibold leading-relaxed whitespace-pre-wrap ${colorConfig.text}`}>
                          {note.content}
                        </p>
                      </>
                    )}
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 6. Footer Info */}
      <footer className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span className="font-medium">المذكرة: {currentDoc.title.slice(0, 24)}...</span>
        <span className="font-bold text-amber-600 dark:text-amber-400">
          {notes.length} ملاحظة
        </span>
      </footer>
    </aside>
  );
};

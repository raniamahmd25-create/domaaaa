import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Check, 
  Clock, 
  Calendar, 
  GraduationCap, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { InteractiveQuiz, QuizQuestion, SUBJECTS, SubjectId } from '../../types';
import { QuizService } from '../../services/quizService';
import { StorageService } from '../../services/storage';
import { auth } from '../../services/firebase';
import confetti from 'canvas-confetti';

interface PublishQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuizPublished?: (quiz: InteractiveQuiz) => void;
}

export const PublishQuizModal: React.FC<PublishQuizModalProps> = ({
  isOpen,
  onClose,
  onQuizPublished,
}) => {
  // Step: 1 = General Settings, 2 = Questions Editing (one page per question)
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: General Settings
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('الصف الخامس الابتدائي');
  const [subject, setSubject] = useState<SubjectId>('arabic');
  const [durationMode, setDurationMode] = useState<'always' | 'temporary'>('always');
  const [stayDurationHours, setStayDurationHours] = useState<number>(24);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState<number>(5);

  // Step 2: Questions List & Current Question Index
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  // Current Question Form Fields
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);
  const [hasTimeLimit, setHasTimeLimit] = useState<boolean>(false);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number>(30);
  const [validationError, setValidationError] = useState<string | null>(null);

  const activeProfile = StorageService.getActiveProfile();

  if (!isOpen) return null;

  // Initialize questions array when transitioning to Step 2
  const handleProceedToQuestions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('يرجى كتابة عنوان للاختبار التفاعلي');
      return;
    }

    setValidationError(null);
    setCurrentQuestionIndex(0);
    // Prepare blank question template
    setQuestionText('');
    setOptions(['', '', '']);
    setCorrectOptionIndex(0);
    setHasTimeLimit(false);
    setTimeLimitSeconds(30);

    setStep(2);
  };

  // Add more options with the (+) button under answers as requested
  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions((prev) => [...prev, '']);
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
    if (correctOptionIndex >= updated.length) {
      setCorrectOptionIndex(0);
    }
  };

  // Next Question / Done button handler
  const handleNextOrFinishQuestion = () => {
    if (!questionText.trim()) {
      setValidationError('يرجى كتابة نص السؤال أولاً');
      return;
    }

    const filledOptions = options.map((o) => o.trim());
    if (filledOptions.some((o) => !o)) {
      setValidationError('يرجى كتابة جميع خيارات الإجابة المضافة');
      return;
    }

    setValidationError(null);

    const currentQ: QuizQuestion = {
      id: `q_${Date.now()}_${currentQuestionIndex}`,
      questionText: questionText.trim(),
      options: filledOptions,
      correctOptionIndex,
      timeLimitSeconds: hasTimeLimit ? timeLimitSeconds : 0,
    };

    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex] = currentQ;
    setQuestions(updatedQuestions);

    if (currentQuestionIndex + 1 < totalQuestionsCount) {
      // Move to Next Question
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);

      // Load existing question if already written, or clean form for next
      if (updatedQuestions[nextIndex]) {
        const nextQ = updatedQuestions[nextIndex];
        setQuestionText(nextQ.questionText);
        setOptions(nextQ.options);
        setCorrectOptionIndex(nextQ.correctOptionIndex);
        setHasTimeLimit(Boolean(nextQ.timeLimitSeconds && nextQ.timeLimitSeconds > 0));
        setTimeLimitSeconds(nextQ.timeLimitSeconds || 30);
      } else {
        setQuestionText('');
        setOptions(['', '', '']);
        setCorrectOptionIndex(0);
        setHasTimeLimit(false);
        setTimeLimitSeconds(30);
      }
    } else {
      // Finished all questions! Publish the quiz!
      publishQuiz(updatedQuestions);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      const prevQ = questions[prevIndex];
      if (prevQ) {
        setQuestionText(prevQ.questionText);
        setOptions(prevQ.options);
        setCorrectOptionIndex(prevQ.correctOptionIndex);
        setHasTimeLimit(Boolean(prevQ.timeLimitSeconds && prevQ.timeLimitSeconds > 0));
        setTimeLimitSeconds(prevQ.timeLimitSeconds || 30);
      }
    }
  };

  const publishQuiz = (finalQuestions: QuizQuestion[]) => {
    const expireDate = durationMode === 'temporary'
      ? new Date(Date.now() + stayDurationHours * 3600 * 1000).toISOString()
      : undefined;

    const quizId = 'quiz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newQuiz: InteractiveQuiz = {
      id: quizId,
      title: title.trim(),
      grade,
      subject,
      durationMode,
      expireDate,
      totalQuestions: finalQuestions.length,
      questions: finalQuestions,
      userId: auth.currentUser?.uid || activeProfile.id,
      author: activeProfile.name || auth.currentUser?.displayName || 'معلم متميز',
      authorPhoto: activeProfile.photoURL,
      attemptsCount: 0,
      createdAt: new Date().toISOString(),
    };

    QuizService.saveQuiz(newQuiz);
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });

    onQuizPublished?.(newQuiz);
    onClose();
  };

  const isLastQuestion = currentQuestionIndex + 1 === totalQuestionsCount;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto font-['Cairo',sans-serif] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="نشر أسئلة تفاعلية واختبارات"
      >
        {/* Header */}
        <header className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <HelpCircle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>نشر أسئلة تفاعلية (كويز)</span>
                {step === 2 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                    سؤال {currentQuestionIndex + 1} من {totalQuestionsCount}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {step === 1 ? 'الخطوة 1: تحديد السنة والمدة وعدد الأسئلة' : 'الخطوة 2: كتابة السؤال، زمن الإجابة، والخيارات'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Validation Alert */}
        {validationError && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Step 1: Initial Setup */}
        {step === 1 && (
          <form onSubmit={handleProceedToQuestions} className="p-5 sm:p-6 space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                عنوان الاختبار أو مراجعة الأسئلة <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: أسئلة مراجعة الوحدة الأولى - مادة اللغة العربية"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  المادة
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as SubjectId)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                  السنة الدراسية
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                >
                  <option value="الصف الخامس الابتدائي">الصف الخامس الابتدائي</option>
                  <option value="الصف الرابع الابتدائي">الصف الرابع الابتدائي</option>
                  <option value="الصف السادس الابتدائي">الصف السادس الابتدائي</option>
                  <option value="المرحلة الإعدادية">المرحلة الإعدادية</option>
                </select>
              </div>
            </div>

            {/* Time staying on site */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                مدة بقاء الاختبار التفاعلي في الموقع:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDurationMode('always')}
                  className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                    durationMode === 'always'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>طوال الوقت (دائم)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDurationMode('temporary')}
                  className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                    durationMode === 'temporary'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>وقت محدد (مؤقت)</span>
                </button>
              </div>

              {durationMode === 'temporary' && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-500">ينتهي بعد:</span>
                  <select
                    value={stayDurationHours}
                    onChange={(e) => setStayDurationHours(Number(e.target.value))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value={12}>12 ساعة</option>
                    <option value={24}>24 ساعة (يوم واحد)</option>
                    <option value={72}>3 أيام</option>
                    <option value={168}>أسبوع كامل</option>
                  </select>
                </div>
              )}
            </div>

            {/* Total Questions Count */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                كم سؤالاً يتضمنه هذا الاختبار؟
              </label>
              <div className="flex items-center gap-2">
                {[3, 5, 10, 15].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setTotalQuestionsCount(cnt)}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition ${
                      totalQuestionsCount === cnt
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {cnt} أسئلة
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <span>التالي: كتابة الأسئلة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Question Writing Page by Page */}
        {step === 2 && (
          <div className="p-5 sm:p-6 space-y-4">
            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestionsCount) * 100}%` }}
              />
            </div>

            {/* Time limit for question */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  تحديد وقت إجابة هذا السؤال:
                </span>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!hasTimeLimit}
                    onChange={(e) => setHasTimeLimit(!e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>بدون وقت محدد (لا ينتهي إلا بالإجابة)</span>
                </label>
              </div>

              {hasTimeLimit && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500 font-medium">ينتهي السؤال بعد:</span>
                  {[15, 30, 45, 60].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setTimeLimitSeconds(sec)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        timeLimitSeconds === sec
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {sec} ثانية
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Question Textarea with Clear & Delete Question options */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                  نص السؤال رقم ({currentQuestionIndex + 1}): <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuestionText('');
                      setOptions(['', '', '']);
                      setCorrectOptionIndex(0);
                    }}
                    className="text-[11px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-bold transition flex items-center gap-1 cursor-pointer"
                    title="تفريغ ومسح خانات السؤال الحالي"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>تفريغ السؤال 🧹</span>
                  </button>

                  {totalQuestionsCount > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...questions];
                        updated.splice(currentQuestionIndex, 1);
                        setQuestions(updated);
                        const nextTotal = Math.max(1, totalQuestionsCount - 1);
                        setTotalQuestionsCount(nextTotal);
                        const nextIdx = Math.min(currentQuestionIndex, nextTotal - 1);
                        setCurrentQuestionIndex(nextIdx);
                        if (updated[nextIdx]) {
                          setQuestionText(updated[nextIdx].questionText);
                          setOptions(updated[nextIdx].options);
                          setCorrectOptionIndex(updated[nextIdx].correctOptionIndex);
                          setHasTimeLimit(Boolean(updated[nextIdx].timeLimitSeconds && updated[nextIdx].timeLimitSeconds > 0));
                          setTimeLimitSeconds(updated[nextIdx].timeLimitSeconds || 30);
                        } else {
                          setQuestionText('');
                          setOptions(['', '', '']);
                          setCorrectOptionIndex(0);
                        }
                      }}
                      className="text-[11px] text-rose-500 hover:text-rose-700 font-black transition flex items-center gap-0.5 px-1.5 py-0.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      title="حذف هذا السؤال من الاختبار نهائياً"
                    >
                      <span>حذف السؤال ❌</span>
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={2}
                placeholder="اكتب السؤال هنا (مثال: ما هو إعراب كلمة «العلمُ» في جملة: العلمُ نورٌ؟)"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              />
            </div>


            {/* Answers List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200">
                <span>خيارات الإجابات (حدد الإجابة الصحيحة بعلامة ✓):</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  انقر على الدائرة الخضراء لاختيار الإجابة النموذجية
                </span>
              </div>

              {options.map((opt, idx) => {
                const isCorrect = correctOptionIndex === idx;
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCorrectOptionIndex(idx)}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition cursor-pointer ${
                        isCorrect
                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400 hover:bg-slate-300'
                      }`}
                      title={isCorrect ? 'هذه هي الإجابة الصحيحة' : 'اختر كإجابة صحيحة'}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>

                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`خيار الإجابة رقم ${idx + 1}...`}
                      className={`flex-1 px-3 py-2 rounded-xl border text-xs font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                        isCorrect ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />

                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="حذف هذا الخيار"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* (+) Add more option button under answers as explicitly requested */}
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="w-full py-2 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-500 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ إضافة خيار إجابة إضافي</span>
                </button>
              )}
            </div>

            {/* Bottom Actions: Previous & 'خلصت' (Done) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {currentQuestionIndex > 0 ? (
                <button
                  type="button"
                  onClick={handlePreviousQuestion}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 transition flex items-center gap-1"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>السؤال السابق</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 transition"
                >
                  تعديل الإعدادات
                </button>
              )}

              {/* 'خلصت' button as requested */}
              <button
                type="button"
                onClick={handleNextOrFinishQuestion}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>{isLastQuestion ? 'خلصت ونشر الاختبار التفاعلي 🚀' : 'خلصت / السؤال التالي ➡️'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

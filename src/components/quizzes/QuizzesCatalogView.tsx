import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Plus, 
  Award, 
  Sparkles, 
  Layers, 
  Check, 
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { InteractiveQuiz, QuizQuestion, SUBJECTS } from '../../types';
import { QuizService } from '../../services/quizService';
import confetti from 'canvas-confetti';

interface QuizzesCatalogViewProps {
  onOpenPublishQuiz: () => void;
  onOpenPublisherProfile: (authorName: string) => void;
}

export const QuizzesCatalogView: React.FC<QuizzesCatalogViewProps> = ({
  onOpenPublishQuiz,
  onOpenPublisherProfile,
}) => {
  const [quizzes, setQuizzes] = useState<InteractiveQuiz[]>(() => QuizService.getAllQuizzes());
  const [activeQuizForSolving, setActiveQuizForSolving] = useState<InteractiveQuiz | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);
  const [confirmDeleteQuizId, setConfirmDeleteQuizId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = QuizService.subscribe((list) => {
      setQuizzes(list);
    });
    return () => unsub();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-['Cairo',sans-serif] space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-emerald-100 text-xs font-black mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>بنك الأسئلة والاختبارات التفاعلية المباشرة</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            الأسئلة والاختبارات التفاعلية 📝
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 font-medium max-w-xl mt-1 leading-relaxed">
            اختبر فهمك للمناهج التعليمية، أجب على الأسئلة التفاعلية مع المؤقت الذكي واكسب النقاط وتصدر لوحة الشرف!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {quizzes.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirmClearAll) {
                  QuizService.clearAllQuizzes();
                  setConfirmClearAll(false);
                } else {
                  setConfirmClearAll(true);
                  setTimeout(() => setConfirmClearAll(false), 3500);
                }
              }}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs border transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                confirmClearAll
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                  : 'bg-rose-500/20 hover:bg-rose-500/30 text-white border-rose-300/30'
              }`}
              title={confirmClearAll ? 'اضغط مرة أخرى لتأكيد مسح جميع الأسئلة' : 'مسح جميع الأسئلة والاختبارات'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{confirmClearAll ? 'تأكيد مسح الجميع؟ ⚠️' : 'مسح جميع الأسئلة 🗑️'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenPublishQuiz}
            className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ نشر أسئلة تفاعلية جديدة</span>
          </button>
        </div>
      </div>

      {/* 2. Quizzes Grid */}
      {quizzes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto mb-3">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
            لا توجد أسئلة أو اختبارات تفاعلية منشورة حتى الآن
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
            المنصة نظيفة تماماً ولا تحتوي على اختبارات وهمية. كن أول من ينشر بنك أسئلة تفاعلي لزملائه أو طلابه الآن!
          </p>
          <button
            type="button"
            onClick={onOpenPublishQuiz}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-md transition active:scale-95 inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>نشر أول اختبار تفاعلي الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizzes.map((quiz) => {
            const subject = SUBJECTS.find((s) => s.id === quiz.subject) || SUBJECTS[0];

            return (
              <div
                key={quiz.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${subject.badgeColor}`}>
                      {subject.nameAr}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-500" />
                      <span>{quiz.durationMode === 'always' ? 'متاح دائماً' : 'مؤقت'}</span>
                    </span>
                  </div>

                  <h3 className="font-black text-base text-slate-900 dark:text-white group-hover:text-emerald-600 transition line-clamp-2">
                    {quiz.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span className="font-bold">{quiz.grade || 'الصف الخامس الابتدائي'}</span>
                    <span>•</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {quiz.questions?.length || quiz.totalQuestions} أسئلة
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenPublisherProfile(quiz.author)}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 font-bold truncate max-w-[110px]"
                    >
                      بواسطة: {quiz.author}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirmDeleteQuizId === quiz.id) {
                          QuizService.deleteQuiz(quiz.id);
                          setConfirmDeleteQuizId(null);
                        } else {
                          setConfirmDeleteQuizId(quiz.id);
                          setTimeout(() => setConfirmDeleteQuizId(null), 3000);
                        }
                      }}
                      className={`p-1 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                        confirmDeleteQuizId === quiz.id
                          ? 'bg-rose-600 text-white font-black animate-pulse px-1.5'
                          : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={confirmDeleteQuizId === quiz.id ? 'اضغط مرة أخرى لتأكيد المسح' : 'مسح هذا الاختبار / السؤال'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {confirmDeleteQuizId === quiz.id && <span className="text-[10px]">تأكيد؟</span>}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveQuizForSolving(quiz)}
                    className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    <span>ابدأ الحل 📝</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Quiz Solving Modal */}
      {activeQuizForSolving && (
        <QuizSolverModal
          quiz={activeQuizForSolving}
          onClose={() => setActiveQuizForSolving(null)}
        />
      )}
    </div>
  );
};

interface QuizSolverModalProps {
  quiz: InteractiveQuiz;
  onClose: () => void;
}

const QuizSolverModal: React.FC<QuizSolverModalProps> = ({ quiz, onClose }) => {
  const questions = quiz.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQ = questions[currentIndex];
  const timeLimit = currentQ?.timeLimitSeconds || 0;
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  // Timer per question if timeLimit > 0
  useEffect(() => {
    if (!timeLimit || timeLimit <= 0 || isAnswerRevealed || isFinished) return;

    setTimeLeft(timeLimit);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsAnswerRevealed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, timeLimit, isAnswerRevealed, isFinished]);

  const handleSelectOption = (idx: number) => {
    if (isAnswerRevealed) return;
    setSelectedOption(idx);
    setIsAnswerRevealed(true);

    if (idx === currentQ.correctOptionIndex) {
      setScore((s) => s + 1);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((idx) => idx + 1);
      setSelectedOption(null);
      setIsAnswerRevealed(false);
    } else {
      setIsFinished(true);
      QuizService.recordAttempt(quiz.id);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.4 } });
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md font-['Cairo',sans-serif] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white">
              {quiz.title}
            </h3>
            <span className="text-xs text-slate-400 font-bold">
              السؤال {currentIndex + 1} من {questions.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isFinished ? (
          /* Finished Result Card */
          <div className="py-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
              <Award className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                أحسنت يا بطل! أنهيت الاختبار 🌟
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-bold">
                نتيجتك النهائية:
              </p>
              <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 my-2">
                {score} / {questions.length}
              </div>
              <p className="text-xs text-slate-400">
                {score === questions.length
                  ? 'درجة كاملة ممتازة! تفوق مستحق 🏆'
                  : score >= Math.ceil(questions.length / 2)
                  ? 'نتيجة جيدة جداً! واصل المراجعة والاجتهاد 👏'
                  : 'حاول مرة أخرى لمراجعة الإجابات الصحيحة وتثبيت المعلومات 💪'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleRestart}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة المحاولة</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition cursor-pointer"
              >
                إنهاء وإغلاق
              </button>
            </div>
          </div>
        ) : currentQ ? (
          /* Active Question */
          <div className="space-y-4">
            {/* Timer if applicable */}
            {timeLimit > 0 && (
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>الوقت المتبقي:</span>
                </span>
                <span className={`font-mono font-black ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-800 dark:text-slate-200'}`}>
                  {timeLeft} ثانية
                </span>
              </div>
            )}

            {/* Question Text */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-relaxed">
                {currentQ.questionText}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {currentQ.options?.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = isAnswerRevealed && idx === currentQ.correctOptionIndex;
                const isWrongSelected = isAnswerRevealed && isSelected && idx !== currentQ.correctOptionIndex;

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswerRevealed}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full p-3.5 rounded-2xl border text-right text-xs sm:text-sm font-bold transition flex items-center justify-between gap-3 cursor-pointer ${
                      isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-black shadow-xs'
                        : isWrongSelected
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <span>{opt}</span>
                    {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    {isWrongSelected && <XCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Bottom Next button */}
            {isAnswerRevealed && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>{currentIndex + 1 < questions.length ? 'السؤال التالي' : 'عرض النتيجة 🏆'}</span>
                  <ChevronLeft className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

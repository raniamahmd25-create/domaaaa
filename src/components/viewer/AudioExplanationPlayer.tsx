import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  MessageSquare,
  Zap,
  Sliders,
  Radio,
  BookOpen,
  Award,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { DocumentPage, SubjectInfo } from '../../types';
import { ReminderSound } from '../../services/reminderSound';

interface AudioExplanationPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  docTitle: string;
  currentPage: DocumentPage;
  currentPageIndex: number;
  totalPages: number;
  subjectInfo: SubjectInfo;
  grade?: string;
  onOpenAiTutorWithQuestion?: (question: string) => void;
}

export const AudioExplanationPlayer: React.FC<AudioExplanationPlayerProps> = ({
  isOpen,
  onClose,
  docTitle,
  currentPage,
  currentPageIndex,
  totalPages,
  subjectInfo,
  grade,
  onOpenAiTutorWithQuestion,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [explanationText, setExplanationText] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [hasCopied, setHasCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isUsingNativeAudio, setIsUsingNativeAudio] = useState(false);

  // Audio elements & speech refs
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop any audio on unmount or close
  const stopAllAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  useEffect(() => {
    if (isOpen) {
      // Play brief cheerful teacher chime on open so user knows audio system is active
      try {
        ReminderSound.playStudyChime();
      } catch {
        // ignore
      }
      generateAndPlayExplanation();
    } else {
      stopAllAudio();
    }
    return () => {
      stopAllAudio();
    };
  }, [isOpen, currentPage.id, currentPageIndex]);

  const generateAndPlayExplanation = async () => {
    stopAllAudio();
    setIsLoading(true);
    setErrorMessage('');
    setExplanationText('');
    setAudioUrl(null);
    setCurrentTime(0);
    setDuration(0);

    try {
      const res = await fetch('/api/ai-explain-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docTitle,
          pageNumber: currentPageIndex + 1,
          totalPages,
          subjectName: subjectInfo.nameAr,
          grade: grade || 'الصف الخامس الابتدائي',
          pageImageUrl: currentPage.imageUrl,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'تعذر توليد الشرح الصوتي');
      }

      const data = await res.json();
      const text = data.explanation || 'أهلاً بك يا بطل! في هذه الصفحة نستعرض الدرس ونتعلم مفاهيمه الأساسية خطوة بخطوة.';
      setExplanationText(text);
      setIsLoading(false);

      // Check if real AI Studio Audio (WAV base64) was returned
      if (data.audioBase64) {
        const audioSrc = `data:${data.audioMimeType || 'audio/wav'};base64,${data.audioBase64}`;
        setAudioUrl(audioSrc);
        setIsUsingNativeAudio(true);
        playRealAudio(audioSrc, playbackRate, text);
      } else {
        // Fallback to Web Speech API
        setIsUsingNativeAudio(false);
        speakWebSpeech(text, playbackRate);
      }
    } catch (err: any) {
      console.error(err);
      setIsLoading(false);
      setErrorMessage(err.message || 'تعذر تشغيل الشرح الصوتي، يرجى المحاولة مرة أخرى.');
    }
  };

  const playRealAudio = (src: string, rate: number, fallbackText: string) => {
    stopAllAudio();

    const audio = new Audio(src);
    audioElementRef.current = audio;
    audio.playbackRate = rate;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    audio.onplay = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    audio.onpause = () => {
      setIsPlaying(false);
      setIsPaused(true);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentTime(0);
    };

    audio.play().catch((err) => {
      console.warn('Audio autoplay prevented or error, falling back to WebSpeech', err);
      // Fallback to browser SpeechSynthesis
      setIsUsingNativeAudio(false);
      speakWebSpeech(fallbackText, rate);
    });
  };

  const speakWebSpeech = (text: string, rate: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const cleanSpeech = text
      .replace(/[*_#`~[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.lang = 'ar-SA';
    utterance.rate = rate;
    utterance.pitch = 1.0;

    // Pick Arabic voice if available
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(
      (v) => v.lang.startsWith('ar') || v.name.toLowerCase().includes('arabic')
    );
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onpause = () => {
      setIsPlaying(false);
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.warn('Speech error', e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleTogglePlayPause = () => {
    if (isUsingNativeAudio && audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause();
      } else {
        audioElementRef.current.play().catch(() => {});
      }
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.pause();
        setIsPlaying(false);
        setIsPaused(true);
      } else if (isPaused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
        setIsPaused(false);
      } else if (explanationText) {
        speakWebSpeech(explanationText, playbackRate);
      }
    }
  };

  const handleRestart = () => {
    if (isUsingNativeAudio && audioUrl) {
      playRealAudio(audioUrl, playbackRate, explanationText);
    } else if (explanationText) {
      speakWebSpeech(explanationText, playbackRate);
    }
  };

  const handleRateChange = (newRate: number) => {
    setPlaybackRate(newRate);
    if (isUsingNativeAudio && audioElementRef.current) {
      audioElementRef.current.playbackRate = newRate;
    } else if (isPlaying && explanationText) {
      speakWebSpeech(explanationText, newRate);
    }
  };

  const handleCopyText = async () => {
    if (!explanationText) return;
    try {
      await navigator.clipboard.writeText(explanationText);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-['Cairo',sans-serif]">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in slide-in-from-bottom duration-300">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Volume2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-slate-900 dark:text-white">
                  شرح المعلم الذكي بالصوت 🎧
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black shadow-xs">
                  صفحة {currentPageIndex + 1} من {totalPages}
                </span>
                {isUsingNativeAudio && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                    <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                    <span>صوت استوديو ذكي</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {docTitle} • {subjectInfo.nameAr}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopAllAudio();
              onClose();
            }}
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition cursor-pointer"
            title="إغلاق الشرح الصوتي"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {/* Loading State */}
          {isLoading && (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="flex items-center gap-2 h-10">
                <span className="w-2 h-8 bg-amber-500 rounded-full animate-bounce delay-75" />
                <span className="w-2 h-12 bg-amber-400 rounded-full animate-bounce delay-150" />
                <span className="w-2 h-16 bg-orange-500 rounded-full animate-bounce delay-300" />
                <span className="w-2 h-10 bg-amber-400 rounded-full animate-bounce delay-200" />
                <span className="w-2 h-6 bg-amber-500 rounded-full animate-bounce delay-100" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mb-1">
                  المعلم الذكي يجهز الشرح الصوتي بأعلى جودة...
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  جاري تحليل الصفحة، شرح المفاهيم، حل التمارين، وتوليد نبرة صوت تعليمية واضحة وممتعة!
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {errorMessage && !isLoading && (
            <div className="py-8 text-center bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-3xl p-6">
              <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mb-4">{errorMessage}</p>
              <button
                type="button"
                onClick={generateAndPlayExplanation}
                className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition cursor-pointer"
              >
                إعادة المحاولة الآن
              </button>
            </div>
          )}

          {/* Audio Player Toolbar & Waveform */}
          {!isLoading && !errorMessage && explanationText && (
            <>
              <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  {/* Play / Pause / Restart */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleTogglePlayPause}
                      className="w-12 h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black flex items-center justify-center shadow-lg active:scale-95 transition cursor-pointer"
                      title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الصوت'}
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 fill-slate-950" />
                      ) : (
                        <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleRestart}
                      className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                      title="إعادة الشرح من البداية"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Animated Equalizer Waveform */}
                    <div className="flex items-center gap-1 px-3 h-8 bg-slate-800/80 rounded-2xl">
                      {[14, 22, 18, 28, 16, 24, 12, 20].map((h, i) => (
                        <span
                          key={i}
                          className={`w-1 rounded-full bg-amber-400 transition-all duration-200 ${
                            isPlaying ? 'animate-pulse' : 'opacity-30'
                          }`}
                          style={{ height: isPlaying ? `${h}px` : '6px' }}
                        />
                      ))}
                      <span className="text-xs font-bold text-amber-300 mr-2">
                        {isPlaying ? 'المعلم يشرح الآن...' : isPaused ? 'متوقف مؤقتاً' : 'جاهز للاستماع'}
                      </span>
                    </div>
                  </div>

                  {/* Playback Speed Controls */}
                  <div className="flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-2xl text-xs font-bold">
                    <span className="text-[11px] text-slate-400 px-1">السرعة:</span>
                    {[0.85, 1.0, 1.25].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => handleRateChange(rate)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                          playbackRate === rate
                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress bar if real audio */}
                {isUsingNativeAudio && duration > 0 && (
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-200"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                    </div>
                    <span>{formatTime(duration)}</span>
                  </div>
                )}
              </div>

              {/* Rich Formatted Explanation Display */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="font-black text-sm text-slate-900 dark:text-white">
                      نص الشرح الكامل والتفصيلي:
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition font-bold cursor-pointer"
                  >
                    {hasCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 font-bold">تم النسخ بنجاح!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ النص</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line space-y-3 font-medium">
                  {explanationText}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Bar */}
        {!isLoading && !errorMessage && explanationText && onOpenAiTutorWithQuestion && (
          <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-600 dark:text-slate-300 font-bold">
              هل لديك سؤال أو نقطة تريد من المعلم الذكي توضيحها أكثر؟
            </div>
            <button
              type="button"
              onClick={() => {
                stopAllAudio();
                onOpenAiTutorWithQuestion('هل يمكنك شرح هذه الصفحة بمزيد من التفصيل وتوضيح النقاط الصعبة؟');
                onClose();
              }}
              className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>اسأل المعلم الذكي عن هذه الصفحة</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

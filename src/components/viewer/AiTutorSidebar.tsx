import React, { useState, useRef, useEffect } from 'react';
import { StudyDocument, DocumentPage, SUBJECTS } from '../../types';
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  HelpCircle, 
  BookOpen, 
  Lightbulb, 
  CheckCircle2, 
  RotateCcw, 
  Copy, 
  Check,
  BrainCircuit,
  Maximize2,
  Minimize2,
  Zap,
  AlertCircle,
  Volume2,
  VolumeX,
  Plus,
  Image as ImageIcon,
  Video,
  FileText,
  Mic,
  Paperclip,
  Trash2
} from 'lucide-react';
import { useLanguage } from '../../services/languageService';

async function compressImageForAi(dataUrl?: string): Promise<string | undefined> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return dataUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 640;
      let width = img.naturalWidth || 640;
      let height = img.naturalHeight || 800;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.65));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

interface AiTutorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  document: StudyDocument;
  currentPage: DocumentPage;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  attachments?: AiAttachment[];
}

export interface AiAttachment {
  id: string;
  type: 'image' | 'video' | 'file' | 'audio' | 'link';
  name: string;
  size?: string;
  dataUrl?: string;
  textContent?: string;
  url?: string;
}

export const AiTutorSidebar: React.FC<AiTutorSidebarProps> = ({
  isOpen,
  onClose,
  document: currentDoc,
  currentPage,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      text: `أهلاً بك يا بطل! 👋 أنا «معلمك الذكي AI» لمساعدتك في مذاكرة «${currentDoc.title}». يمكنك سؤالي عن أي كلمة، قاعدة، سؤال، أو مسألة في الصفحة ${currentPage.pageNumber}، كما يمكنك استخدام زر (+) لإرفاق أي صور أو واجبات أو فيديوهات أو ملفات وسأشرحها لك فوراً! 🌟`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [includePageImage, setIncludePageImage] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // (+) Attachments state
  const [attachments, setAttachments] = useState<AiAttachment[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [linkInputUrl, setLinkInputUrl] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);

  const fileImageInputRef = useRef<HTMLInputElement>(null);
  const fileVideoInputRef = useRef<HTMLInputElement>(null);
  const fileDocInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Close attachment menu on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    if (showAttachMenu) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showAttachMenu]);

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const compressed = await compressImageForAi(dataUrl);
      setAttachments((prev) => [
        ...prev,
        {
          id: 'att_img_' + Date.now(),
          type: 'image',
          name: file.name,
          size: `${Math.round(file.size / 1024)} KB`,
          dataUrl: compressed || dataUrl,
        },
      ]);
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle Video Upload
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachments((prev) => [
      ...prev,
      {
        id: 'att_vid_' + Date.now(),
        type: 'video',
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      },
    ]);
    setShowAttachMenu(false);
    e.target.value = '';
  };

  // Handle Documents & Files Upload (PDF, Word, TXT)
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result.slice(0, 3000) : '';
      setAttachments((prev) => [
        ...prev,
        {
          id: 'att_doc_' + Date.now(),
          type: 'file',
          name: file.name,
          size: `${Math.round(file.size / 1024)} KB`,
          textContent: text || `ملف مرفق: ${file.name}`,
        },
      ]);
      setShowAttachMenu(false);
    };
    if (file.type.includes('text') || file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      setAttachments((prev) => [
        ...prev,
        {
          id: 'att_doc_' + Date.now(),
          type: 'file',
          name: file.name,
          size: `${Math.round(file.size / 1024)} KB`,
          textContent: `مستند دراسي مرفق من الطالب: ${file.name}`,
        },
      ]);
      setShowAttachMenu(false);
    }
    e.target.value = '';
  };

  // Handle adding external link (YouTube/Tutorial)
  const handleAddLink = () => {
    if (!linkInputUrl.trim()) return;
    setAttachments((prev) => [
      ...prev,
      {
        id: 'att_link_' + Date.now(),
        type: 'link',
        name: 'رابط فيديو / شرح تعليمي',
        url: linkInputUrl.trim(),
      },
    ]);
    setLinkInputUrl('');
    setShowLinkModal(false);
    setShowAttachMenu(false);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Stop speech when closing sidebar
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeakMessage = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingMessageId(msgId);

    const clean = text
      .replace(/[*_#`~[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'ar-SA';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const arVoice = voices.find(
      (v) => v.lang.startsWith('ar') || v.name.toLowerCase().includes('arabic')
    );
    if (arVoice) {
      utterance.voice = arVoice;
    }

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    window.speechSynthesis.speak(utterance);
  };

  const subjectInfo = SUBJECTS.find((s) => s.id === currentDoc.subject);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle asking question
  const handleSendMessage = async (textToSend?: string) => {
    const q = (textToSend || inputQuestion).trim();
    if (!q || isLoading) return;

    setErrorMessage(null);
    const currentAttachments = [...attachments];
    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setAttachments([]);
    setIsLoading(true);

    try {
      // Compress the page preview image for ultra-fast low-latency upload
      const optimizedImage = includePageImage ? await compressImageForAi(currentPage.imageUrl) : undefined;

      const response = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          docTitle: currentDoc.title,
          subjectName: subjectInfo?.nameAr || 'الصف الخامس الابتدائي',
          pageNumber: currentPage.pageNumber,
          pageImage: optimizedImage,
          chatHistory: messages.map((m) => ({ role: m.role, text: m.text })),
          attachments: currentAttachments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل الاتصال بالمعلم الذكي');
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: 'ast_' + Date.now(),
        role: 'assistant',
        text: data.reply || 'تمت الإجابة بنجاح.',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'حدث خطأ أثناء الرد، يرجى إعادة المحاولة.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    { label: '💡 اشرح لي هذه الصفحة ببساطة', prompt: `اشرح لي أهم محتويات ونقاط الصفحة رقم ${currentPage.pageNumber} بطريقة سهلة ومبسطة لطالب الصف الخامس الابتدائي.` },
    { label: '📝 ساعدني في حل أسئلة الصفحة', prompt: `انظر إلى أسئلة وتدريبات هذه الصفحة رقم ${currentPage.pageNumber}، وقدم لي إجابات نموذجية مع الشرح والتوضيح خطوة بخطوة.` },
    { label: '🔍 القواعد النحوية والإملائية', prompt: `استخرج جميع القواعد النحوية والإملائية الهامة الموجودة في هذه الصفحة واشرحها مع الإعراب.` },
    { label: '❓ اختبرني بـ 3 أسئلة سريعة', prompt: `اطرح عليّ 3 أسئلة ذكية ومتنوعة حول محتوى هذه الصفحة لاختبار مدى فهمي واستيعابي لها.` },
  ];

  if (!isOpen) return null;

  return (
    <aside className="w-80 sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-2xl z-40 select-none animate-in slide-in-from-right duration-200">
      {/* 1. Header */}
      <div className="p-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
            <BrainCircuit className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-wide">المعلم الذكي AI</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black flex items-center gap-1 shadow-xs">
                <Zap className="w-2.5 h-2.5 fill-slate-950" />
                <span>إجابة فائقة السرعة</span>
              </span>
            </div>
            <p className="text-[10px] text-indigo-100 font-medium">
              مساعدك الشخصي بجانب المذكرة لحظة بلحظة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMessages([messages[0]])}
            className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition"
            title="بدء محادثة جديدة"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition"
            title="إغلاق لوحة المعلم الذكي"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Active Page Context Banner */}
      <div className="px-3.5 py-2 bg-indigo-50/80 dark:bg-slate-800/80 border-b border-indigo-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-1.5 truncate">
          <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="truncate font-bold">
            صفحة {currentPage.pageNumber} • {subjectInfo?.nameAr || 'المادة'}
          </span>
        </div>
        <label className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={includePageImage}
            onChange={(e) => setIncludePageImage(e.target.checked)}
            className="rounded accent-indigo-600 cursor-pointer w-3.5 h-3.5"
          />
          <span>رؤية الصفحة</span>
        </label>
      </div>

      {/* 3. Messages Chat History */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-right select-text">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl p-3 text-xs sm:text-[13px] leading-relaxed shadow-xs relative group ${
                  isUser
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 rounded-tl-none'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between mb-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> المعلم الذكي:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSpeakMessage(msg.id, msg.text)}
                        className={`transition px-2 py-0.5 rounded-lg flex items-center gap-1 text-[10px] font-bold cursor-pointer ${
                          speakingMessageId === msg.id
                            ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                            : 'text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-slate-700'
                        }`}
                        title={speakingMessageId === msg.id ? 'إيقاف الصوت' : 'استماع للشرح بالصوت'}
                      >
                        <Volume2 className={`w-3 h-3 ${speakingMessageId === msg.id ? 'animate-pulse' : ''}`} />
                        <span>{speakingMessageId === msg.id ? 'إيقاف' : 'استماع بالصوت 🔊'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(msg.text, msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        title="نسخ الإجابة"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>

              <span className="text-[10px] text-slate-400 mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-2xl border border-indigo-200 dark:border-indigo-900 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
            <div>
              <div className="font-black">المعلم الذكي يقرأ الصفحة ويفكر في الإجابة...</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                جاري إعداد شرح مبسط يناسب منهج الصف الخامس
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Quick Suggestion Prompts */}
      <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 shrink-0">
        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 px-1 flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-amber-500" />
          <span>أسئلة سريعة حول الصفحة الحالية:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => handleSendMessage(qp.prompt)}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:border-indigo-300 dark:hover:border-indigo-700 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 transition text-right shadow-2xs"
            >
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Input Textarea & Send Button */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="relative flex items-end gap-2 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اسأل المعلم الذكي عن أي سؤال أو كلمة..."
            disabled={isLoading}
            className="w-full bg-transparent border-0 outline-none resize-none text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 p-1.5 text-right font-medium"
          />

          <button
            type="button"
            disabled={!inputQuestion.trim() || isLoading}
            onClick={() => handleSendMessage()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition shadow-md shrink-0 cursor-pointer"
            title="إرسال السؤال (Enter)"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </div>
        <div className="flex justify-between items-center mt-1 px-1 text-[10px] text-slate-400">
          <span>اضغط Enter للإرسال السريع</span>
          <span>مدعوم بـ Google Gemini AI ⚡</span>
        </div>
      </div>
    </aside>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  Key, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  ExternalLink,
  Eye,
  EyeOff,
  Zap,
  RefreshCw
} from 'lucide-react';
import { SupabaseService } from '../../services/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isCurrentlyConfigured, setIsCurrentlyConfigured] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = SupabaseService.getConfig();
      setUrl(config.url || '');
      setAnonKey(config.anonKey || '');
      setIsCurrentlyConfigured(SupabaseService.isConfigured());
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setStatusMessage(null);
    setIsLoading(true);

    try {
      const res = await SupabaseService.testConnection(url, anonKey);
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'حدث خطأ أثناء فحص الاتصال' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsLoading(true);

    try {
      const res = await SupabaseService.saveConfig(url, anonKey);
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
        setIsCurrentlyConfigured(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'تعذر حفظ الإعدادات' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    SupabaseService.clearConfig();
    setUrl('');
    setAnonKey('');
    setIsCurrentlyConfigured(false);
    setStatusMessage({ type: 'info', text: 'تم مسح إعدادات ومفاتيح Supabase بنجاح.' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-['Cairo',sans-serif] animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0c1222] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#1a233a] overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute left-4 top-4 p-2 rounded-xl bg-black/15 hover:bg-black/25 text-white transition cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
              <Database className="w-5 h-5 stroke-[2.5]" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider bg-black/15 px-2.5 py-0.5 rounded-full">
              إعدادات الربط السحابي
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-black flex items-center gap-2">
            <span>إعدادات قاعدة بيانات Supabase</span>
            <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
          </h3>
          <p className="text-xs text-white/85 font-medium mt-1 leading-relaxed">
            أدخل رابط مشروع Supabase ومفتاح الـ API Key لربط وحفظ بيانات منصتك سحابياً.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Status Indicator */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-[#131b2e] border border-slate-200 dark:border-[#1e2a45]">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isCurrentlyConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-xs font-black">
                حالة الربط: {isCurrentlyConfigured ? 'متصل سحابياً بـ Supabase ✅' : 'غير مهيأ بعد ⚠️'}
              </span>
            </div>
            {isCurrentlyConfigured && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح البيانات</span>
              </button>
            )}
          </div>

          {/* Source Link Guidance Pill */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
            <div className="font-black flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
              <Globe className="w-3.5 h-3.5" />
              <span>المصدر: Supabase (supabase.com)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              الرابط المشترك <code>https://share.google/C5WulQp7S4KiKNx3y</code> يوجه إلى موقع <strong>Supabase</strong> الرسمي. لربط وتفعيل قاعدة بياناتك الخاصة، انسخ <strong>Project URL</strong> ومفتاح <strong>anon key</strong> من مشروعك وضعهما بالأسفل:
            </p>
          </div>

          {/* Feedback Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-[#06241b] text-emerald-700 dark:text-[#34d399] border border-emerald-200 dark:border-[#0d4a36]'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-4">
            {/* Input 1: Project URL */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>رابط المشروع (Project URL) *</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  required
                  dir="ltr"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                تجد الرابط في: Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL
              </p>
            </div>

            {/* Input 2: API Key */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>مفتاح الواجهة (API Key / Anon Key) *</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showKey ? 'إخفاء' : 'إظهار'}</span>
                </button>
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  required
                  dir="ltr"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#131b2e] text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                استخدم المفتاح العام (anon public key) الخاص بمشروعك من لوحة تحكم Supabase.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              {/* Test Button */}
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isLoading || !url || !anonKey}
                className="w-full sm:w-1/2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-[#152037] dark:hover:bg-[#1e2d4d] text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-[#223354] transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span>فحص واختبار الاتصال</span>
              </button>

              {/* Save Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-1/2 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>حفظ الإعدادات والربط 💾</span>
              </button>
            </div>
          </form>

          {/* Quick Guidance Box */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-300/40 dark:border-amber-800/30 text-[11px] space-y-1.5">
            <span className="font-black text-amber-900 dark:text-amber-300 block">
              💡 أين تجد هذه البيانات في حساب Supabase؟
            </span>
            <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              <li>ادخل إلى لوحة تحكم موقع <strong>supabase.com</strong> واختر مشروعك.</li>
              <li>انتقل إلى <strong>Project Settings (أيقونة الترس)</strong> ثم اضغط على <strong>API</strong>.</li>
              <li>انسخ <strong>Project URL</strong> وضعه في الحقل الأول.</li>
              <li>انسخ <strong>anon public key</strong> وضعه في حقل المفتاح (API Key).</li>
            </ol>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
            >
              <span>فتح لوحة تحكم Supabase Dashboard</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

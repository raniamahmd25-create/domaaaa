import React, { useState, useRef, useEffect } from 'react';
import { ToolMode } from '../../types';
import { 
  Pen, 
  Highlighter, 
  Type, 
  Minus, 
  ArrowUpRight, 
  Square, 
  Circle, 
  Eraser, 
  Undo2, 
  Redo2, 
  Trash2, 
  GripHorizontal,
  ChevronDown,
  Check,
  Bold,
  Palette,
  Minimize2,
  Maximize2,
  Sparkles,
  Hand
} from 'lucide-react';
import { useLanguage } from '../../services/languageService';

interface MovablePenToolbarProps {
  currentTool: ToolMode;
  setCurrentTool: (tool: ToolMode) => void;
  currentColor: string;
  setCurrentColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  isBold: boolean;
  setIsBold: (b: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClearPage: () => void;
  isAutoSaved: boolean;
}

const PRESET_COLORS = [
  { name: 'أسود', hex: '#0f172a' },
  { name: 'أزرق كحلي', hex: '#1d4ed8' },
  { name: 'أزرق سماوي', hex: '#0284c7' },
  { name: 'أحمر تصحيح', hex: '#dc2626' },
  { name: 'أخضر تفوق', hex: '#16a34a' },
  { name: 'برتقالي ملحوظة', hex: '#ea580c' },
  { name: 'فسفوري أصفر', hex: '#eab308' },
  { name: 'بنفسجي', hex: '#9333ea' },
  { name: 'وردي', hex: '#db2777' },
  { name: 'بني قلم', hex: '#78350f' },
  { name: 'رمادي', hex: '#64748b' },
  { name: 'تركواز', hex: '#0d9488' },
];

export const MovablePenToolbar: React.FC<MovablePenToolbarProps> = ({
  currentTool,
  setCurrentTool,
  currentColor,
  setCurrentColor,
  strokeWidth,
  setStrokeWidth,
  fontSize,
  setFontSize,
  isBold,
  setIsBold,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClearPage,
  isAutoSaved,
}) => {
  // Draggable toolbar state
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 30, y: 70 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [showStrokeSlider, setShowStrokeSlider] = useState(false);
  const [showShapesMenu, setShowShapesMenu] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const previousToolRef = useRef<ToolMode>('pen');
  const { t } = useLanguage();

  // Switch to Hand tool immediately upon minimizing so the user can navigate & move in the screen
  const handleMinimize = () => {
    if (currentTool !== 'hand') {
      previousToolRef.current = currentTool;
    }
    setIsMinimized(true);
    setCurrentTool('hand');
  };

  // Restore previous drawing tool upon expanding
  const handleExpand = () => {
    setIsMinimized(false);
    setCurrentTool(previousToolRef.current || 'pen');
  };

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = Math.max(10, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const isShapeTool = ['line', 'arrow', 'rect', 'circle'].includes(currentTool);

  // Animated floating pen button when minimized (مع تفعيل تحريك الشاشة باليد)
  if (isMinimized) {
    return (
      <div
        ref={toolbarRef}
        onMouseDown={handleMouseDown}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        className={`fixed z-50 select-none group cursor-grab active:cursor-grabbing ${
          isDragging ? 'opacity-85 scale-105' : ''
        }`}
      >
        <button
          type="button"
          onClick={() => {
            if (!isDragging) handleExpand();
          }}
          className="relative flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 text-slate-950 font-black shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-white dark:border-slate-800 cursor-pointer"
          title="انقر لفتح القلم الإلكتروني والكتابة | حالياً الشاشة في وضع التحريك والسحب باليد ✋"
        >
          {/* Animated Stylus Tip */}
          <div className="relative animate-bounce">
            <Pen className="w-4 h-4 text-slate-950 rotate-[-45deg] stroke-[2.5]" />
            <span
              className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full border border-white dark:border-slate-900 shadow-xs"
              style={{ backgroundColor: currentColor }}
              title={`لون القلم: ${currentColor}`}
            />
          </div>

          <div className="flex items-center gap-1 text-[11px] font-black">
            <span>{t('penSmart')}</span>
            <span className="text-[10px] bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded-full">
              تحريك الشاشة ✋
            </span>
          </div>

          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={toolbarRef}
      onMouseDown={handleMouseDown}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      className={`fixed z-50 select-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 transition-shadow ${
        isDragging ? 'shadow-amber-500/20 cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Top Drag Handle, Auto-save Status & Minimize Button */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <GripHorizontal className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">{t('penSmart')}</span>
        </div>
        <div className="flex items-center gap-2">
          {isAutoSaved ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <Check className="w-3 h-3" /> تم الحفظ
            </span>
          ) : (
            <span className="text-[11px] text-amber-500 animate-pulse">جاري الحفظ...</span>
          )}

          {/* Minimize button to turn into animated floating pen & enable hand move */}
          <button
            type="button"
            onClick={handleMinimize}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
            title="تصغير القلم الإلكتروني وتفعيل تحريك وتصفح الشاشة باليد ✋"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Tool Buttons Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-2">
        {/* Hand Pan / Drag Tool (أداة اليد للتحكم والسحب والتقليب باليد) */}
        <button
          type="button"
          onClick={() => {
            setCurrentTool('hand');
            setShowShapesMenu(false);
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            currentTool === 'hand'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-105 font-black'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title="أداة اليد: التحكم بالمذكرة والتقليب والسحب باليد واللمس"
        >
          <Hand className="w-4 h-4" />
          <span>يد ✋</span>
        </button>

        {/* Freehand Pen */}
        <button
          type="button"
          onClick={() => {
            setCurrentTool('pen');
            setShowShapesMenu(false);
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            currentTool === 'pen'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title="القلم الحر للكتابة والشرح"
        >
          <Pen className="w-4 h-4" />
          <span>قلم</span>
        </button>

        {/* Highlighter */}
        <button
          type="button"
          onClick={() => {
            setCurrentTool('highlighter');
            setShowShapesMenu(false);
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            currentTool === 'highlighter'
              ? 'bg-yellow-400 text-slate-950 shadow-md scale-105'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title="قلم تظليل وفسفوري لتحديد النصوص الهامة"
        >
          <Highlighter className="w-4 h-4" />
          <span>تظليل</span>
        </button>

        {/* Keyboard Typing Tool */}
        <button
          type="button"
          onClick={() => {
            setCurrentTool('text');
            setShowShapesMenu(false);
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            currentTool === 'text'
              ? 'bg-blue-600 text-white shadow-md scale-105'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title="الكتابة المباشرة بالكيبورد على الصفحة"
        >
          <Type className="w-4 h-4" />
          <span>كتابة</span>
        </button>

        {/* Ruling & Shapes Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowShapesMenu(!showShapesMenu)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isShapeTool
                ? 'bg-purple-600 text-white shadow-md'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
            title="أدوات التخطيط والأشكال الهندسية والأسهم"
          >
            {currentTool === 'line' && <Minus className="w-4 h-4" />}
            {currentTool === 'arrow' && <ArrowUpRight className="w-4 h-4" />}
            {currentTool === 'rect' && <Square className="w-4 h-4" />}
            {currentTool === 'circle' && <Circle className="w-4 h-4" />}
            {!isShapeTool && <Square className="w-4 h-4" />}
            <span>تخطيط</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showShapesMenu && (
            <div className="absolute top-full mt-1.5 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 flex flex-col gap-1 z-50 min-w-[130px]">
              <button
                type="button"
                onClick={() => {
                  setCurrentTool('line');
                  setShowShapesMenu(false);
                }}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs w-full text-right ${
                  currentTool === 'line' ? 'bg-amber-100 dark:bg-amber-950/60 font-bold text-amber-700 dark:text-amber-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Minus className="w-4 h-4" /> خط مستقيم
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentTool('arrow');
                  setShowShapesMenu(false);
                }}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs w-full text-right ${
                  currentTool === 'arrow' ? 'bg-amber-100 dark:bg-amber-950/60 font-bold text-amber-700 dark:text-amber-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" /> سهم تأشير
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentTool('rect');
                  setShowShapesMenu(false);
                }}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs w-full text-right ${
                  currentTool === 'rect' ? 'bg-amber-100 dark:bg-amber-950/60 font-bold text-amber-700 dark:text-amber-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Square className="w-4 h-4" /> مستطيل تأطير
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentTool('circle');
                  setShowShapesMenu(false);
                }}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs w-full text-right ${
                  currentTool === 'circle' ? 'bg-amber-100 dark:bg-amber-950/60 font-bold text-amber-700 dark:text-amber-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Circle className="w-4 h-4" /> دائرة إحاطة
              </button>
            </div>
          )}
        </div>

        {/* Eraser Tool */}
        <button
          type="button"
          onClick={() => {
            setCurrentTool('eraser');
            setShowShapesMenu(false);
          }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            currentTool === 'eraser'
              ? 'bg-rose-500 text-white shadow-md scale-105'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title="ممحاة ذكية لمسح الخطوط أو النصوص"
        >
          <Eraser className="w-4 h-4" />
          <span>ممحاة</span>
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Active Color Preview & Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowColorPalette(!showColorPalette);
              setShowStrokeSlider(false);
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="اختيار لون القلم أو التظليل"
          >
            <div
              className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm"
              style={{ backgroundColor: currentColor }}
            />
            <Palette className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showColorPalette && (
            <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-50 w-64">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                اختر لون القلم أو أضف لون مخصص:
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => {
                      setCurrentColor(c.hex);
                      setShowColorPalette(false);
                    }}
                    className={`group relative flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
                      currentColor.toLowerCase() === c.hex.toLowerCase()
                        ? 'ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-950/40'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full shadow-sm border border-black/10 group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-[10px] mt-1 text-slate-600 dark:text-slate-400 truncate max-w-full">
                      {c.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Hex / Native Color Picker */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-600 dark:text-slate-300">لون مخصص بالكامل:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => setCurrentColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 overflow-hidden"
                  />
                  <span className="text-xs font-mono text-slate-500">{currentColor}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stroke Thickness / Font Size */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowStrokeSlider(!showStrokeSlider);
              setShowColorPalette(false);
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs font-bold text-slate-700 dark:text-slate-300"
            title="تغيير سمك الخط أو حجم خط الكتابة"
          >
            <div
              className="rounded-full bg-slate-700 dark:bg-slate-300"
              style={{
                width: `${Math.min(18, Math.max(4, strokeWidth))}px`,
                height: `${Math.min(18, Math.max(4, strokeWidth))}px`,
              }}
            />
            <span>{currentTool === 'text' ? `${fontSize}px` : `${strokeWidth}px`}</span>
          </button>

          {showStrokeSlider && (
            <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3.5 z-50 w-60">
              {currentTool === 'text' ? (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                    <span>حجم خط النص:</span>
                    <span className="text-amber-600 dark:text-amber-400">{fontSize} نقطة</span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="48"
                    step="2"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-600 dark:text-slate-300">عريض (Bold):</span>
                    <button
                      type="button"
                      onClick={() => setIsBold(!isBold)}
                      className={`p-1.5 rounded-lg border ${
                        isBold
                          ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold'
                          : 'border-slate-300 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                    <span>سمك خط القلم:</span>
                    <span className="text-amber-600 dark:text-amber-400">{strokeWidth} بكسل</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="40"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                    <span>دقيق (1px)</span>
                    <div
                      className="rounded-full bg-amber-500"
                      style={{ width: `${strokeWidth}px`, height: `${strokeWidth}px`, maxHeight: '30px', maxWidth: '30px' }}
                    />
                    <span>عريض (40px)</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Instant Undo & Redo */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 rounded-xl transition ${
            canUndo
              ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer'
              : 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
          }`}
          title="تراجع فوري (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 rounded-xl transition ${
            canRedo
              ? 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer'
              : 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
          }`}
          title="إعادة فورية (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* Clear Page Annotations immediately */}
        <button
          type="button"
          onClick={onClearPage}
          className="p-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
          title="مسح جميع كتابات وتعديلات الصفحة الحالية فوراً"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

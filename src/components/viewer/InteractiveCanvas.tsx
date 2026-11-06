import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DocumentPage, AnnotationItem, ToolMode, Point } from '../../types';
import { generateId } from '../../services/fileProcessor';

interface InteractiveCanvasProps {
  page: DocumentPage;
  currentTool: ToolMode;
  currentColor: string;
  strokeWidth: number;
  fontSize: number;
  isBold: boolean;
  zoom: number;
  onSaveAnnotations: (annotations: AnnotationItem[]) => void;
  undoStack: AnnotationItem[][];
  redoStack: AnnotationItem[][];
  setUndoStack: React.Dispatch<React.SetStateAction<AnnotationItem[][]>>;
  setRedoStack: React.Dispatch<React.SetStateAction<AnnotationItem[][]>>;
  onNextPage?: () => void;
  onPrevPage?: () => void;
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  page,
  currentTool,
  currentColor,
  strokeWidth,
  fontSize,
  isBold,
  zoom,
  onSaveAnnotations,
  undoStack,
  redoStack,
  setUndoStack,
  setRedoStack,
  onNextPage,
  onPrevPage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [annotations, setAnnotations] = useState<AnnotationItem[]>(page.annotations || []);
  const annotationsRef = useRef<AnnotationItem[]>(page.annotations || []);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [canvasHeight, setCanvasHeight] = useState<number>(1414);

  // Hand Drag & Pan State (أداة اليد للتحكم والسحب باليد واللمس)
  const [isHandDragging, setIsHandDragging] = useState(false);
  const handDragStartRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const [dragOffsetDisplay, setDragOffsetDisplay] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Snapshot taken at the start of an erase gesture so one undo restores all erased items
  const eraserSnapshotRef = useRef<AnnotationItem[] | null>(null);
  const hasErasedDuringStroke = useRef<boolean>(false);

  // Sync annotationsRef
  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  // Sync with page prop changes (e.g. when changing pages)
  useEffect(() => {
    const pageAnns = page.annotations || [];
    setAnnotations(pageAnns);
    annotationsRef.current = pageAnns;
    setEditingTextId(null);
  }, [page.id, page.pageNumber]);

  // Push to history helper
  const pushToHistory = useCallback((newAnnotations: AnnotationItem[]) => {
    setUndoStack((prev) => [...prev, annotationsRef.current]);
    setRedoStack([]);
    annotationsRef.current = newAnnotations;
    setAnnotations(newAnnotations);
    onSaveAnnotations(newAnnotations);
  }, [onSaveAnnotations, setUndoStack, setRedoStack]);

  // Undo / Redo keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack, redoStack, annotations]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, annotationsRef.current]);
    annotationsRef.current = previous;
    setAnnotations(previous);
    onSaveAnnotations(previous);
  }, [undoStack, onSaveAnnotations, setUndoStack, setRedoStack]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, annotationsRef.current]);
    annotationsRef.current = next;
    setAnnotations(next);
    onSaveAnnotations(next);
  }, [redoStack, onSaveAnnotations, setUndoStack, setRedoStack]);

  // Coordinate conversion: converts client pointer event to normalized 1000px canvas space
  const getCanvasCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = 1000 / rect.width;
    const scaleY = (canvas.height || 1414) / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // Redraw canvas content
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI / normalized 1000px coordinate system
    const width = 1000;
    const height = Math.round(1000 * (canvas.clientHeight / (canvas.clientWidth || 1))) || 1414;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    if (height !== canvasHeight) {
      setCanvasHeight(height);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render all saved annotations
    annotations.forEach((ann) => {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = ann.strokeWidth;
      ctx.strokeStyle = ann.color;
      ctx.fillStyle = ann.color;

      if (ann.type === 'highlighter') {
        ctx.globalAlpha = 0.38;
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.globalAlpha = ann.opacity || 1.0;
      }

      if ((ann.type === 'pen' || ann.type === 'highlighter') && ann.points && ann.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.stroke();
      } else if (ann.type === 'line' && ann.startPoint && ann.endPoint) {
        ctx.beginPath();
        ctx.moveTo(ann.startPoint.x, ann.startPoint.y);
        ctx.lineTo(ann.endPoint.x, ann.endPoint.y);
        ctx.stroke();
      } else if (ann.type === 'arrow' && ann.startPoint && ann.endPoint) {
        drawArrow(ctx, ann.startPoint.x, ann.startPoint.y, ann.endPoint.x, ann.endPoint.y, ann.strokeWidth);
      } else if (ann.type === 'rect' && ann.box) {
        ctx.strokeRect(ann.box.x, ann.box.y, ann.box.width || 0, ann.box.height || 0);
      } else if (ann.type === 'circle' && ann.box) {
        ctx.beginPath();
        const rx = (ann.box.width || 0) / 2;
        const ry = (ann.box.height || 0) / 2;
        ctx.ellipse(ann.box.x + rx, ann.box.y + ry, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });

    // Render active drawing preview
    if (isDrawing) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = currentColor;
      ctx.fillStyle = currentColor;

      if (currentTool === 'highlighter') {
        ctx.globalAlpha = 0.38;
      }

      if ((currentTool === 'pen' || currentTool === 'highlighter') && currentPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
        for (let i = 1; i < currentPoints.length; i++) {
          ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
        }
        ctx.stroke();
      } else if (startPoint && cursorPos) {
        if (currentTool === 'line') {
          ctx.beginPath();
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(cursorPos.x, cursorPos.y);
          ctx.stroke();
        } else if (currentTool === 'arrow') {
          drawArrow(ctx, startPoint.x, startPoint.y, cursorPos.x, cursorPos.y, strokeWidth);
        } else if (currentTool === 'rect') {
          ctx.strokeRect(
            Math.min(startPoint.x, cursorPos.x),
            Math.min(startPoint.y, cursorPos.y),
            Math.abs(cursorPos.x - startPoint.x),
            Math.abs(cursorPos.y - startPoint.y)
          );
        } else if (currentTool === 'circle') {
          const rx = Math.abs(cursorPos.x - startPoint.x) / 2;
          const ry = Math.abs(cursorPos.y - startPoint.y) / 2;
          const cx = Math.min(startPoint.x, cursorPos.x) + rx;
          const cy = Math.min(startPoint.y, cursorPos.y) + ry;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.restore();
    }
  }, [annotations, isDrawing, currentPoints, startPoint, cursorPos, currentTool, currentColor, strokeWidth, canvasHeight]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Pointer Event Handlers
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    // If 2 or more fingers touch the screen, or if user is in 'hand' or 'cursor' mode:
    const isMultiTouch = 'touches' in e && e.touches.length >= 2;
    if (currentTool === 'hand' || currentTool === 'cursor' || isMultiTouch) {
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      setIsHandDragging(true);
      handDragStartRef.current = { clientX, clientY };
      return;
    }

    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    if (currentTool === 'text') {
      // Spawn a new text box at this position
      const newTextAnnotation: AnnotationItem = {
        id: generateId(),
        type: 'text',
        color: currentColor,
        strokeWidth: 2,
        fontSize: fontSize,
        fontFamily: 'Cairo, sans-serif',
        isBold: isBold,
        text: 'انقر هنا لكتابة الملاحظة...',
        box: {
          x: coords.x,
          y: coords.y,
          width: 260,
          height: 60,
        },
      };
      pushToHistory([...annotationsRef.current, newTextAnnotation]);
      setEditingTextId(newTextAnnotation.id);
      return;
    }

    if (currentTool === 'eraser') {
      setIsDrawing(true);
      eraserSnapshotRef.current = [...annotationsRef.current];
      hasErasedDuringStroke.current = false;
      eraseNear(coords);
      return;
    }

    setIsDrawing(true);
    setStartPoint(coords);
    setCurrentPoints([coords]);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isHandDragging && handDragStartRef.current) {
      let clientX = 0;
      let clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      const dy = clientY - handDragStartRef.current.clientY;
      const dx = clientX - handDragStartRef.current.clientX;
      setDragOffsetDisplay({ x: dx * 0.5, y: dy * 0.5 });
      return;
    }

    if (currentTool === 'hand' || currentTool === 'cursor') {
      return;
    }

    const coords = getCanvasCoordinates(e);
    if (!coords) return;
    setCursorPos(coords);

    if (currentTool === 'eraser' && isDrawing) {
      eraseNear(coords);
      return;
    }

    if (!isDrawing) return;

    if (currentTool === 'pen' || currentTool === 'highlighter') {
      setCurrentPoints((prev) => [...prev, coords]);
    }
  };

  const handlePointerUp = () => {
    if (isHandDragging && handDragStartRef.current) {
      const currentDx = dragOffsetDisplay.x / 0.5;
      const currentDy = dragOffsetDisplay.y / 0.5;
      setIsHandDragging(false);
      setDragOffsetDisplay({ x: 0, y: 0 });
      handDragStartRef.current = null;

      // Check whether horizontal swipe or vertical swipe was performed by hand:
      // In Arabic (RTL):
      // - Swiping LEFT (dx < -40) flips to Next Page (الصفحة التالية)
      // - Swiping RIGHT (dx > 40) flips to Previous Page (الصفحة السابقة)
      // - Swiping UP (dy < -40) glides to Next Page (تنزل لأسفل)
      // - Swiping DOWN (dy > 40) glides to Previous Page (تقلع لأعلى)
      if (Math.abs(currentDx) >= Math.abs(currentDy)) {
        if (currentDx < -40) {
          onNextPage?.();
        } else if (currentDx > 40) {
          onPrevPage?.();
        }
      } else {
        if (currentDy < -40) {
          onNextPage?.();
        } else if (currentDy > 40) {
          onPrevPage?.();
        }
      }
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentTool === 'eraser') {
      // If items were erased during this swipe, commit snapshot to undo stack
      if (hasErasedDuringStroke.current && eraserSnapshotRef.current) {
        setUndoStack((prev) => [...prev, eraserSnapshotRef.current!]);
        setRedoStack([]);
        onSaveAnnotations(annotationsRef.current);
      }
      eraserSnapshotRef.current = null;
      hasErasedDuringStroke.current = false;
      return;
    }

    if ((currentTool === 'pen' || currentTool === 'highlighter') && currentPoints.length > 0) {
      // Support single taps / dots (e.g. Arabic letter diacritics and dots)
      const points =
        currentPoints.length === 1
          ? [currentPoints[0], { x: currentPoints[0].x + 0.5, y: currentPoints[0].y + 0.5 }]
          : currentPoints;
      const newAnn: AnnotationItem = {
        id: generateId(),
        type: currentTool,
        color: currentColor,
        strokeWidth: currentTool === 'highlighter' ? Math.max(16, strokeWidth * 2) : strokeWidth,
        points: points,
      };
      pushToHistory([...annotationsRef.current, newAnn]);
    } else if (startPoint && cursorPos && ['line', 'arrow', 'rect', 'circle'].includes(currentTool)) {
      const width = cursorPos.x - startPoint.x;
      const height = cursorPos.y - startPoint.y;

      if (Math.abs(width) > 4 || Math.abs(height) > 4) {
        const newAnn: AnnotationItem = {
          id: generateId(),
          type: currentTool,
          color: currentColor,
          strokeWidth: strokeWidth,
          startPoint,
          endPoint: cursorPos,
          box: {
            x: Math.min(startPoint.x, cursorPos.x),
            y: Math.min(startPoint.y, cursorPos.y),
            width: Math.abs(width),
            height: Math.abs(height),
          },
        };
        pushToHistory([...annotationsRef.current, newAnn]);
      }
    }

    setCurrentPoints([]);
    setStartPoint(null);
  };

  // Immediate collision eraser checking distance to segment, points, lines, shapes, and text
  const eraseNear = (coords: Point) => {
    const currentList = annotationsRef.current;
    if (!currentList || currentList.length === 0) return;

    // Generous threshold so user easily erases any drawing touched
    const threshold = Math.max(38, strokeWidth * 3.5);

    const remaining = currentList.filter((ann) => {
      // 1. Check freehand pen / highlighter strokes
      if (ann.points && ann.points.length > 0) {
        for (let i = 0; i < ann.points.length; i++) {
          const pt = ann.points[i];
          if (Math.hypot(pt.x - coords.x, pt.y - coords.y) < threshold) {
            return false; // Erase stroke!
          }
        }
        for (let i = 0; i < ann.points.length - 1; i++) {
          const d = distToSegment(coords, ann.points[i], ann.points[i + 1]);
          if (d < threshold) {
            return false; // Erase stroke!
          }
        }
      }

      // 2. Check straight lines & arrows
      if (ann.startPoint && ann.endPoint) {
        const d = distToSegment(coords, ann.startPoint, ann.endPoint);
        if (d < threshold) {
          return false; // Erase line/arrow
        }
      }

      // 3. Check bounding boxes (rect, circle, text)
      if (ann.box) {
        const b = ann.box;
        const w = b.width || 100;
        const h = b.height || 50;

        const isNear =
          coords.x >= b.x - threshold &&
          coords.x <= b.x + w + threshold &&
          coords.y >= b.y - threshold &&
          coords.y <= b.y + h + threshold;

        if (isNear) {
          return false; // Erase shape or text box
        }
      }

      return true;
    });

    if (remaining.length !== currentList.length) {
      hasErasedDuringStroke.current = true;
      annotationsRef.current = remaining;
      setAnnotations(remaining);
      onSaveAnnotations(remaining);
    }
  };

  const updateTextItem = (id: string, newText: string) => {
    const updated = annotationsRef.current.map((ann) => {
      if (ann.id === id) {
        return { ...ann, text: newText };
      }
      return ann;
    });
    pushToHistory(updated);
  };

  const deleteAnnotation = (id: string) => {
    const remaining = annotationsRef.current.filter((a) => a.id !== id);
    pushToHistory(remaining);
  };

  // Dynamic Cursor Style
  const getCursorClass = () => {
    switch (currentTool) {
      case 'hand':
        return isHandDragging ? 'cursor-grabbing' : 'cursor-grab';
      case 'pen':
        return 'cursor-crosshair';
      case 'highlighter':
        return 'cursor-cell';
      case 'text':
        return 'cursor-text';
      case 'eraser':
        return 'cursor-crosshair';
      case 'cursor':
        return isHandDragging ? 'cursor-grabbing' : 'cursor-grab';
      default:
        return 'cursor-crosshair';
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex justify-center items-start w-full overflow-auto py-6 px-2 select-none"
      style={{
        transform: `scale(${zoom})`,
        transformOrigin: 'top center',
        transition: 'transform 0.15s ease-out',
      }}
    >
      {/* Paper Container with Elevation */}
      <div
        className={`relative bg-white shadow-2xl rounded-sm border border-slate-200 dark:border-slate-800 ${getCursorClass()}`}
        style={{ 
          width: '1000px', 
          maxWidth: '100%',
          touchAction: currentTool === 'hand' ? 'pan-y' : 'none',
          transform: `translate3d(${dragOffsetDisplay.x}px, ${dragOffsetDisplay.y}px, 0) rotate(${dragOffsetDisplay.x * 0.015}deg)`,
          transition: isHandDragging ? 'none' : 'transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        {/* Hand Dragging Live Visual Guide */}
        {isHandDragging && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/95 text-amber-400 text-xs font-black shadow-2xl border border-amber-500/50 animate-pulse pointer-events-none whitespace-nowrap">
            <span>✋ اسحب باليد يميناً أو يساراً 👈 👉 أو لأعلى ولأسفل 🔼 🔽 لتقليب الصفحة</span>
          </div>
        )}
        {/* Base Document Image */}
        <img
          src={page.imageUrl}
          alt={`الصفحة ${page.pageNumber}`}
          className="w-full h-auto block pointer-events-none select-none"
          draggable={false}
        />

        {/* Overlay Drawing Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Interactive Text Annotations Layer */}
        {annotations
          .filter((ann) => ann.type === 'text')
          .map((ann) => {
            const isEditing = editingTextId === ann.id;
            return (
              <div
                key={ann.id}
                className={`absolute group transition-shadow ${
                  isEditing ? 'ring-2 ring-amber-500 shadow-lg' : 'hover:ring-1 hover:ring-amber-300'
                }`}
                style={{
                  left: `${((ann.box?.x || 0) / 1000) * 100}%`,
                  top: `${((ann.box?.y || 0) / (canvasHeight || 1414)) * 100}%`,
                  zIndex: 20,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingTextId(ann.id);
                }}
              >
                {/* Floating Quick Actions Bar for Text */}
                {isEditing && (
                  <div className="absolute -top-9 right-0 flex items-center gap-1 bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-md z-30">
                    <span className="text-amber-400 font-bold">نص</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAnnotation(ann.id);
                      }}
                      className="text-rose-400 hover:text-rose-300 ml-2"
                      title="حذف هذا النص"
                    >
                      ✕ حذف
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTextId(null);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 ml-1"
                      title="تم"
                    >
                      ✓ تم
                    </button>
                  </div>
                )}

                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    updateTextItem(ann.id, e.currentTarget.textContent || '');
                  }}
                  className="bg-amber-50/90 dark:bg-slate-900/90 p-2 rounded border border-amber-300 dark:border-amber-600 outline-none min-w-[140px] max-w-[400px] text-right shadow-sm"
                  style={{
                    color: ann.color || currentColor,
                    fontSize: `${ann.fontSize || fontSize}px`,
                    fontWeight: ann.isBold ? 'bold' : 'normal',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                >
                  {ann.text}
                </div>
              </div>
            );
          })}

        {/* Movable Pen Tip Indicator following user cursor */}
        {cursorPos && (currentTool === 'pen' || currentTool === 'highlighter') && (
          <div
            className="absolute pointer-events-none transition-transform duration-75 -translate-x-1/2 -translate-y-1/2 z-30"
            style={{
              left: `${(cursorPos.x / 1000) * 100}%`,
              top: `${(cursorPos.y / (canvasHeight || 1414)) * 100}%`,
            }}
          >
            <div
              className={`rounded-full shadow-md border-2 border-white flex items-center justify-center ${
                currentTool === 'highlighter' ? 'opacity-60 ring-2 ring-amber-400' : 'ring-1 ring-slate-800'
              }`}
              style={{
                backgroundColor: currentColor,
                width: `${Math.max(8, strokeWidth * 1.5)}px`,
                height: `${Math.max(8, strokeWidth * 1.5)}px`,
              }}
            />
          </div>
        )}

        {/* Movable Eraser Indicator */}
        {cursorPos && currentTool === 'eraser' && (
          <div
            className="absolute pointer-events-none transition-transform duration-75 -translate-x-1/2 -translate-y-1/2 z-30"
            style={{
              left: `${(cursorPos.x / 1000) * 100}%`,
              top: `${(cursorPos.y / (canvasHeight || 1414)) * 100}%`,
            }}
          >
            <div
              className="rounded-full border-2 border-rose-500 bg-rose-200/40 shadow-md ring-2 ring-white flex items-center justify-center animate-pulse"
              style={{
                width: `${Math.max(38, strokeWidth * 3.5)}px`,
                height: `${Math.max(38, strokeWidth * 3.5)}px`,
              }}
            >
              <div className="w-1.5 h-1.5 bg-rose-600 rounded-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Math helper: calculates perpendicular distance from point p to line segment (v, w)
function distToSegment(p: Point, v: Point, w: Point): number {
  const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromx: number,
  fromy: number,
  tox: number,
  toy: number,
  width: number
) {
  const headlen = Math.max(14, width * 3.5);
  const angle = Math.atan2(toy - fromy, tox - fromx);
  ctx.beginPath();
  ctx.moveTo(fromx, fromy);
  ctx.lineTo(tox, toy);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(tox, toy);
  ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

import * as pdfjsLib from 'pdfjs-dist';
import { DocumentPage } from '../types';

// Configure PDF.js worker using reliable CDN matching version or fallback
try {
  const version = pdfjsLib.version || '4.10.38';
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF.js worker setup note:', e);
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return 'id_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
}

/**
 * Convert and optimize an image File to a crisp Base64 data URL
 * Scales down giant camera photos to max dimension 1600px for speed and clarity
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1600;
        let w = img.width;
        let h = img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          } else {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.88));
        } else {
          resolve(reader.result as string);
        }
      };
      img.onerror = () => resolve(reader.result as string);
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Process a batch of image files into DocumentPages
 */
export async function processImagesToPages(files: File[]): Promise<DocumentPage[]> {
  const pages: DocumentPage[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const dataUrl = await fileToDataUrl(file);
    pages.push({
      id: generateId(),
      pageNumber: i + 1,
      imageUrl: dataUrl,
      annotations: [],
      lastEdited: Date.now(),
    });
  }

  return pages;
}

/**
 * Render a PDF page onto an offscreen canvas and export as clean high-res image data URL
 */
async function renderPdfPageToDataUrl(page: any, scale: number = 1.6): Promise<string> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  if (!context) {
    throw new Error('Canvas 2D context not available');
  }

  // Draw white background
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Process a PDF file into an array of DocumentPage items
 */
export async function processPdfToPages(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<DocumentPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pages: DocumentPage[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (onProgress) {
      onProgress(pageNum, numPages);
    }
    const page = await pdf.getPage(pageNum);
    const dataUrl = await renderPdfPageToDataUrl(page, 1.5);

    pages.push({
      id: generateId(),
      pageNumber: pageNum,
      imageUrl: dataUrl,
      annotations: [],
      lastEdited: Date.now(),
    });
  }

  return pages;
}

/**
 * Create a pristine blank notebook / exam paper page
 * with realistic lined or grid pattern
 */
export function createBlankPage(
  pageNumber: number,
  pattern: 'blank' | 'lined' | 'grid' | 'exam' = 'lined'
): DocumentPage {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // White paper background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (pattern === 'lined') {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      const topMargin = 120;
      const lineSpacing = 44;
      for (let y = topMargin; y < canvas.height - 80; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(80, y);
        ctx.lineTo(canvas.width - 80, y);
        ctx.stroke();
      }
      // Red margin line on the right for Arabic
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width - 120, 60);
      ctx.lineTo(canvas.width - 120, canvas.height - 60);
      ctx.stroke();
    } else if (pattern === 'grid') {
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 60; x <= canvas.width - 60; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 60);
        ctx.lineTo(x, canvas.height - 60);
        ctx.stroke();
      }
      for (let y = 60; y <= canvas.height - 60; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(60, y);
        ctx.lineTo(canvas.width - 60, y);
        ctx.stroke();
      }
    }
  }

  return {
    id: generateId(),
    pageNumber,
    imageUrl: canvas.toDataURL('image/jpeg', 0.85),
    annotations: [],
    lastEdited: Date.now(),
  };
}

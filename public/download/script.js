/**
 * ═════════════════════════════════════════════════════════════════════════
 * منصة قلمي التعليمية - كود الجافاسكربت الرئيسي (script.js)
 * يدعم: القلم الإلكتروني الذكي، الحفظ التلقائي في localStorage،
 * تبديل الأقسام (المذكرات، Shorts، الدروس، الأسئلة)، والوضع الليلي.
 * ═════════════════════════════════════════════════════════════════════════
 */

// 1. إدارة الوضع الليلي / الصباحي
const themeToggleBtn = document.getElementById('themeToggleBtn');
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('qalami_theme', isDark ? 'dark' : 'light');
    themeToggleBtn.innerHTML = isDark ? '☀️ وضع صباح' : '🌙 وضع ليل';
  });

  // استرجاع الوضع المحفوظ
  if (localStorage.getItem('qalami_theme') === 'dark') {
    document.body.classList.add('dark');
    themeToggleBtn.innerHTML = '☀️ وضع صباح';
  }
}

// 2. إدارة التبويبات السفلية (المذكرات، Shorts، الدروس، الأسئلة)
const tabs = document.querySelectorAll('.tab-btn');
const views = {
  documents: document.getElementById('viewDocuments'),
  shorts: document.getElementById('viewShorts'),
  lessons: document.getElementById('viewLessons'),
  quizzes: document.getElementById('viewQuizzes')
};

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    const target = tab.dataset.tab;
    Object.keys(views).forEach(key => {
      if (views[key]) {
        views[key].style.display = (key === target) ? 'block' : 'none';
      }
    });
  });
});

// 3. القلم الإلكتروني الذكي ولوحة الرسم (Canvas) مع الحفظ التلقائي
const canvas = document.getElementById('electronicCanvas');
let ctx = canvas ? canvas.getContext('2d') : null;
let isDrawing = false;
let currentPenColor = '#000000';
let currentPenSize = 3;
let isEraser = false;
let activeDocId = 'doc_sample_1';

if (canvas && ctx) {
  function resizeCanvas() {
    canvas.width = Math.min(window.innerWidth - 40, 800);
    canvas.height = 1000;
    restoreSavedAnnotations();
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function startPosition(e) {
    isDrawing = true;
    draw(e);
  }

  function endPosition() {
    isDrawing = false;
    ctx.beginPath();
    autoSaveAnnotations();
  }

  function draw(e) {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.lineWidth = isEraser ? 24 : currentPenSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#ffffff' : currentPenColor;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  // أحداث الماوس واللمس للهواتف والشاشات اللمسية
  canvas.addEventListener('mousedown', startPosition);
  canvas.addEventListener('mouseup', endPosition);
  canvas.addEventListener('mousemove', draw);

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startPosition(e);
  }, { passive: false });
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    endPosition();
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    draw(e);
  }, { passive: false });

  // الحفظ التلقائي في localStorage
  function autoSaveAnnotations() {
    try {
      const dataUrl = canvas.toDataURL('image/png');
      localStorage.setItem('qalami_canvas_' + activeDocId, dataUrl);
      console.log('تم حفظ تعديلات القلم الإلكتروني تلقائياً ✨');
    } catch (err) {
      console.warn('Auto-save note:', err);
    }
  }

  // استرجاع التعديلات المحفوظة
  function restoreSavedAnnotations() {
    const saved = localStorage.getItem('qalami_canvas_' + activeDocId);
    if (saved) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = saved;
    }
  }
}

// 4. أزرار اختيار القلم والممحاة والألوان
document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    isEraser = false;
    currentPenColor = e.target.dataset.color || '#000000';
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('toolPen')?.classList.add('active');
  });
});

document.getElementById('toolEraser')?.addEventListener('click', () => {
  isEraser = true;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('toolEraser')?.classList.add('active');
});

document.getElementById('toolClear')?.addEventListener('click', () => {
  if (confirm('هل تود مسح جميع كتابات القلم من الصفحة؟')) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    localStorage.removeItem('qalami_canvas_' + activeDocId);
  }
});

// 5. زرين التبديل بين Shorts والدروس في نافذة النشر
let publishType = 'shorts';
const btnShortsChoice = document.getElementById('choiceShortsBtn');
const btnLessonChoice = document.getElementById('choiceLessonBtn');

if (btnShortsChoice && btnLessonChoice) {
  btnShortsChoice.addEventListener('click', () => {
    publishType = 'shorts';
    btnShortsChoice.classList.add('active-shorts');
    btnLessonChoice.classList.remove('active-lesson');
    document.getElementById('publishNoticeText').innerText = 'تم تحديد النشر كفيديو Shorts قصير 🎬';
  });

  btnLessonChoice.addEventListener('click', () => {
    publishType = 'lesson';
    btnLessonChoice.classList.add('active-lesson');
    btnShortsChoice.classList.remove('active-shorts');
    document.getElementById('publishNoticeText').innerText = 'تم تحديد النشر كدرس تعليمي كامل 📺';
  });
}

// 6. تحميل الملفات الثلاثة مباشرة (تصدير الملفات)
function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type: type || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

window.downloadProjectFiles = function() {
  window.open('/download/index.html', '_blank');
};

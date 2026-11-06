import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser with 25MB limit to allow image dataURL from canvas/pages
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initialize GoogleGenAI SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, getCloudDocuments, saveCloudDocument, deleteCloudDocument } from './src/db/users.ts';

// PostgreSQL + Firebase Database Sync endpoints
// 1. Sync User to Cloud SQL PostgreSQL
app.post('/api/sync-user', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { displayName, photoURL } = req.body || {};
    const syncedUser = await getOrCreateUser(
      user.uid,
      user.email || '',
      displayName || user.name || 'طالب متميز',
      photoURL || user.picture || ''
    );
    return res.json({ success: true, user: syncedUser });
  } catch (error: any) {
    console.error('User sync error in PostgreSQL:', error);
    return res.status(500).json({ error: 'Failed to sync user to database', details: error?.message });
  }
});

// 2. Fetch Documents from PostgreSQL
app.get('/api/documents', async (_req, res) => {
  try {
    const docs = await getCloudDocuments();
    return res.json({ success: true, documents: docs });
  } catch (error: any) {
    console.error('Fetch documents error:', error);
    return res.status(500).json({ error: 'Failed to fetch documents', details: error?.message });
  }
});

// 3. Save Document to PostgreSQL (authenticated)
app.post('/api/documents', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const docData = req.body;
    if (!docData || !docData.id || !docData.title) {
      return res.status(400).json({ error: 'Invalid document payload' });
    }
    const saved = await saveCloudDocument({
      ...docData,
      userId: user.uid,
    });
    return res.json({ success: true, document: saved });
  } catch (error: any) {
    console.error('Save document error in PostgreSQL:', error);
    return res.status(500).json({ error: 'Failed to save document', details: error?.message });
  }
});

// 4. Delete Document from PostgreSQL (authenticated)
app.delete('/api/documents/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await deleteCloudDocument(id);
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Delete document error in PostgreSQL:', error);
    return res.status(500).json({ error: 'Failed to delete document', details: error?.message });
  }
});

// 5. Videos Endpoints
app.post('/api/videos', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id, title, description, type, durationSeconds, videoUrl, thumbnailUrl, subject, grade, author, likesCount } = req.body;
    const { db } = await import('./src/db/index.ts');
    const { videos } = await import('./src/db/schema.ts');
    await db.insert(videos).values({
      id,
      userId: req.user!.uid,
      author: author || 'ناشر',
      title: title || 'فيديو تعليمي',
      description: description || '',
      type: type || 'shorts',
      durationSeconds: durationSeconds || 60,
      videoUrl: videoUrl || '',
      thumbnailUrl: thumbnailUrl || '',
      subject: subject || 'arabic',
      grade: grade || 'الصف الخامس الابتدائي',
      likesCount: likesCount || 0,
    }).onConflictDoUpdate({
      target: videos.id,
      set: {
        title,
        description,
        type,
        durationSeconds,
        updatedAt: new Date(),
      },
    });
    return res.json({ success: true });
  } catch (err: any) {
    console.warn('PostgreSQL video save error note:', err?.message);
    return res.status(500).json({ error: 'Failed to save video to database' });
  }
});

app.delete('/api/videos/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { db } = await import('./src/db/index.ts');
    const { videos } = await import('./src/db/schema.ts');
    const { eq } = await import('drizzle-orm');
    await db.delete(videos).where(eq(videos.id, id));
    return res.json({ success: true });
  } catch (err: any) {
    console.warn('PostgreSQL video delete error note:', err?.message);
    return res.status(500).json({ error: 'Failed to delete video from database' });
  }
});

// 6. Quizzes Endpoints
app.post('/api/quizzes', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id, author, title, grade, durationMode, expireDate, totalQuestions, questionsJson, subject, attemptsCount } = req.body;
    const { db } = await import('./src/db/index.ts');
    const { quizzes } = await import('./src/db/schema.ts');
    await db.insert(quizzes).values({
      id,
      userId: req.user!.uid,
      author: author || 'معلم',
      title: title || 'اختبار تفاعلي',
      grade: grade || 'الصف الخامس الابتدائي',
      durationMode: durationMode || 'always',
      expireDate: expireDate || null,
      totalQuestions: totalQuestions || 5,
      questionsJson: questionsJson || '[]',
      subject: subject || 'arabic',
      attemptsCount: attemptsCount || 0,
    }).onConflictDoUpdate({
      target: quizzes.id,
      set: {
        title,
        grade,
        totalQuestions,
        questionsJson,
      },
    });
    return res.json({ success: true });
  } catch (err: any) {
    console.warn('PostgreSQL quiz save error note:', err?.message);
    return res.status(500).json({ error: 'Failed to save quiz to database' });
  }
});

app.delete('/api/quizzes/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { db } = await import('./src/db/index.ts');
    const { quizzes } = await import('./src/db/schema.ts');
    const { eq } = await import('drizzle-orm');
    await db.delete(quizzes).where(eq(quizzes.id, id));
    return res.json({ success: true });
  } catch (err: any) {
    console.warn('PostgreSQL quiz delete error note:', err?.message);
    return res.status(500).json({ error: 'Failed to delete quiz from database' });
  }
});

// 7. Comments Endpoints (PostgreSQL / Cloud SQL)
app.post('/api/comments', async (req, res) => {
  try {
    const { id, targetId, targetType, userId, authorName, authorPhoto, authorRole, content, reaction, likesCount } = req.body;
    const { db } = await import('./src/db/index.ts');
    const { comments } = await import('./src/db/schema.ts');
    await db.insert(comments).values({
      id,
      targetId,
      targetType: targetType || 'video',
      userId: userId || 'anonymous',
      authorName: authorName || 'مستخدم',
      authorPhoto: authorPhoto || null,
      authorRole: authorRole || 'student',
      content: content || '',
      reaction: reaction || null,
      likesCount: likesCount || 0,
    }).onConflictDoUpdate({
      target: comments.id,
      set: {
        content,
        reaction,
        likesCount,
      },
    });
    return res.json({ success: true });
  } catch (err: any) {
    console.warn('PostgreSQL comment save error note:', err?.message);
    return res.status(500).json({ error: 'Failed to save comment to database' });
  }
});

app.delete('/api/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { db } = await import('./src/db/index.ts');
    const { comments } = await import('./src/db/schema.ts');
    const { eq } = await import('drizzle-orm');
    await db.delete(comments).where(eq(comments.id, id));
    return res.json({ success: true });
  } catch (err: any) {
    console.warn('PostgreSQL comment delete error note:', err?.message);
    return res.status(500).json({ error: 'Failed to delete comment from database' });
  }
});



// AI Tutor Chat / Study Assistant endpoint
app.post('/api/ai-tutor', async (req, res) => {
  try {
    const { 
      question, 
      docTitle, 
      subjectName, 
      pageNumber, 
      pageImage,
      chatHistory = [],
      attachments = [] 
    } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'يرجى كتابة سؤالك' });
    }

    const systemInstruction = `أنت «المعلم الذكي» لطلاب الصف الخامس الابتدائي في مصر.
مهمتك:
- مساعدة الطالب في فهم دروس ومذكرات الصف الخامس (اللغة العربية، الدراسات الاجتماعية، التربية الدينية، العلوم Science، الرياضيات Math، Connect، Connect Plus، وتكنولوجيا المعلومات ICT).
- تقديم إجابات واضحة، تعليمية، ومبسطة تناسب سن وفهم طالب الصف الخامس.
- تشجيع الطالب وتقديم أمثلة واقعية.
- عند شرح أسئلة الامتحانات أو النحو أو حل المسائل، اشرح خطوة بخطوة مع التعليل.
- إذا أرسل الطالب صورة لصفحة المذكرة أو الامتحان أو أرفق ملفاً أو فيديو، اقرأه بدقة وساعده في حله وفهمه.
- التحدث باللغة العربية الفصحى البسيطة والمحببة للأطفال.`;

    // Construct prompt contents
    const contents: any[] = [];

    // Context metadata
    let contextText = `[سياق المذاكرة الحالي]\nالمذكرة/الكتاب: ${docTitle || 'مذكرة الصف الخامس'}\nالمادة: ${subjectName || 'عام'}\nرقم الصفحة المعروضة: ${pageNumber || 1}\n\n`;

    // If chat history is provided, include brief history for conversational continuity
    if (Array.isArray(chatHistory) && chatHistory.length > 0) {
      contextText += `[سياق المحادثة السابقة]\n`;
      chatHistory.slice(-4).forEach((msg: any) => {
        contextText += `${msg.role === 'user' ? 'الطالب' : 'المعلم'}: ${msg.text}\n`;
      });
      contextText += `\n`;
    }

    contextText += `سؤال الطالب الحالي: ${question}`;

    const parts: any[] = [];

    // Multimodal page image
    if (pageImage && typeof pageImage === 'string' && pageImage.startsWith('data:image/')) {
      const match = pageImage.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    // Process additional student attachments (+ button: images, videos, documents, audio, links)
    let attachmentsContext = '';
    if (Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments) {
        if (att.dataUrl && typeof att.dataUrl === 'string' && att.dataUrl.startsWith('data:image/')) {
          const match = att.dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
          if (match) {
            parts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            });
            attachmentsContext += `\n[مرفق صورة إضافية من الطالب: "${att.name || 'صورة الواجب أو السؤال'}"]`;
          }
        } else {
          attachmentsContext += `\n[مرفق إضافي من الطالب: نوع (${att.type || 'ملف'}) - اسم الملف: "${att.name || 'مرفق'}"${att.textContent ? ` - نص أو محتوى: "${att.textContent.slice(0, 3000)}"` : ''}${att.url ? ` - رابط: ${att.url}` : ''}]`;
        }
      }
    }

    const fullPrompt = `${contextText}${attachmentsContext ? `\n\nالمرفقات المضافة من الطالب بواسطة زر (+):${attachmentsContext}` : ''}`;
    parts.push({ text: fullPrompt });

    contents.push({ parts });

    // AI Model: gemini-3.1-flash-lite for responsive, pedagogical explanation
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: contents[0],
      config: {
        systemInstruction: systemInstruction + '\nأنت معلم متميز يحبب الطالب في المذاكرة. عندما يرسل الطالب سؤالاً أو يرفق صورة، أو مسألة، أو فيديو، أو ملف، اشرحها بتفصيل وافٍ وخطوات واضحة وبسيطة، وحل أي سؤال أو تمرين بالسبب وبأسلوب محفز وممتع.',
        temperature: 0.35,
        maxOutputTokens: 1200,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });

    const reply = response.text || 'عذراً، لم أتمكن من استخراج الإجابة. يرجى تكرار السؤال أو صياغته بشكل أوضح.';

    return res.json({ reply });
  } catch (error: any) {
    console.error('AI Tutor API error:', error);
    return res.status(500).json({ 
      error: 'حدث خطأ أثناء التواصل مع المعلم الذكي. يرجى التأكد من كتابة السؤال والمحاولة مرة أخرى.',
      details: error?.message || 'Server error'
    });
  }
});

// AI Audio Explanation endpoint: Generates superior pedagogical Arabic explanation + real WAV audio
app.post('/api/ai-explain-page', async (req, res) => {
  try {
    const { docTitle, pageNumber, totalPages, subjectName, grade, pageImageUrl } = req.body;

    const contents: any[] = [];
    const promptText = `أنت «المعلم الذكي المتميز» الخبير في تدريس مناهج ${grade || 'المرحلة الابتدائية'} لمادة "${subjectName || 'الدراسية'}".
أمامك الصفحة رقم (${pageNumber || 1} من ${totalPages || 1}) من "${docTitle || 'المذكرة التعليمية'}".

المطلوب منك «شرح» هذه الصفحة شرحاً تعليمياً ممتعاً وتوضيح المفاهيم وليس مجرد قراءة نصية للكلمات المكتوبة:
1. الترحيب والتمهيد: ابدأ بترحيب تشجيعي لطيف بأسلوب المعلم المفضل للطلاب، وعرف الطالب بفكرة وموضوع الصفحة.
2. شرح الفكرة والمفاهيم بعمق وتبسيط: اشرح المفاهيم والمعاني العلمية أو اللغوية بأسلوبك التربوي الرائع، مع ضرب أمثلة من واقع حياة الطالب لتثبيت الفهم.
3. التوضيح والتعليل: وضح «لماذا وكيف» تم الوصول لهذه القواعد أو القوانين، ولا تكتفِ بسرد الكلام.
4. حل التمارين والمسائل خطوة بخطوة: إذا كانت هناك تدريبات أو مسائل أو أسئلة في الصفحة، اشرح طريقة الحل النموذجية مع ذكر السبب وراء كل خطوة.
5. نصيحة المعلم الذهبية: اختم بنصيحة ذكية وسريعة تساعد الطالب على تذكر الفكرة وحل أي امتحان بسهولة.

تذكر دائماً: اشرح ووضح وبسط، ولا تقرأ الكلام المكتوب فقط، بل علمه وفهمه كما يفعل المعلم الخصوصي في البيت!`;

    if (pageImageUrl && typeof pageImageUrl === 'string' && pageImageUrl.startsWith('data:image/')) {
      const match = pageImageUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        contents.push({
          parts: [
            {
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            },
            {
              text: promptText,
            },
          ],
        });
      } else {
        contents.push({ text: promptText });
      }
    } else {
      contents.push({ text: promptText });
    }

    // 1. Generate high-quality explanation using gemini-3.8-flash
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents.length === 1 && typeof contents[0].text === 'string' ? contents[0].text : contents[0],
      config: {
        systemInstruction: 'أنت المعلم الصوتي المتميز في منصة قلمي التعليمية. تشرح الدروس بأعلى جودة وإتقان وبأسلوب محفز وممتع للطلاب.',
        temperature: 0.35,
        maxOutputTokens: 1200,
      },
    });

    const explanation = response.text || 'أهلاً بك يا بطل! في هذه الصفحة نستعرض الدرس ونتعلم مفاهيمه الأساسية خطوة بخطوة.';

    // 2. Synthesize Real Audio (WAV) using gemini-3.8-flash-lite-tts
    let audioBase64: string | null = null;
    try {
      const speechScript = explanation
        .replace(/[*_#`~[\]]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 1600);

      const ttsResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: speechScript,
                speechMetadata: {
                  style: 'Warm, clear, and cheerful Arabic teacher speaking to young students',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (ttsError: any) {
      console.warn('Gemini TTS synthesis note (client will use audio speech synthesis fallback):', ttsError?.message);
    }

    return res.json({ 
      explanation,
      audioBase64,
      audioMimeType: audioBase64 ? 'audio/wav' : null,
    });
  } catch (error: any) {
    console.error('AI Explain Page API error:', error);
    return res.status(500).json({
      error: 'تعذر توليد الشرح الصوتي حالياً. يرجى المحاولة مرة أخرى.',
      details: error?.message || 'Server error',
    });
  }
});

// Vite Middleware for development
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  // Serve static files in production
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

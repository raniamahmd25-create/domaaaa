/**
 * Capture a clear, vivid thumbnail (poster frame) from a Video Blob or URL.
 * Also generates a colorful branded card if the video frame is not immediately accessible,
 * completely preventing black screens across the platform.
 */
export async function captureVideoThumbnail(
  videoSource: Blob | string,
  fallbackTitle: string = 'درس تعليمي',
  fallbackSubject: string = 'شرح مميز'
): Promise<string> {
  return new Promise((resolve) => {
    let objectUrl = '';
    let isCreated = false;

    if (typeof videoSource === 'string') {
      objectUrl = videoSource;
    } else if (videoSource instanceof Blob) {
      objectUrl = URL.createObjectURL(videoSource);
      isCreated = true;
    }

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';

    let hasResolved = false;

    const cleanup = () => {
      if (isCreated && objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      video.src = '';
    };

    const finish = (result: string) => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        resolve(result);
      }
    };

    const drawFrame = () => {
      try {
        const w = video.videoWidth || 640;
        const h = video.videoHeight || 360;

        if (w > 0 && h > 0) {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(w, 1280);
          canvas.height = Math.min(h, 720);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Check if the captured frame is entirely black
            // Sample a few pixels from the center
            const imgData = ctx.getImageData(
              Math.floor(canvas.width / 4),
              Math.floor(canvas.height / 4),
              Math.floor(canvas.width / 2),
              Math.floor(canvas.height / 2)
            );
            const data = imgData.data;
            let totalBrightness = 0;
            const sampleStep = 16;
            let sampleCount = 0;
            for (let i = 0; i < data.length; i += 4 * sampleStep) {
              totalBrightness += data[i] + data[i + 1] + data[i + 2];
              sampleCount++;
            }
            const avgBrightness = sampleCount > 0 ? totalBrightness / (sampleCount * 3) : 0;

            // If the frame is too dark or pure black (e.g. video starts with 0.5s black fade),
            // generate a beautiful educational poster card
            if (avgBrightness < 12) {
              finish(generateBrandedPoster(fallbackTitle, fallbackSubject));
              return;
            }

            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            finish(dataUrl);
            return;
          }
        }
      } catch (e) {
        console.warn('Canvas frame capture error:', e);
      }
      finish(generateBrandedPoster(fallbackTitle, fallbackSubject));
    };

    video.onloadeddata = () => {
      // Seek slightly into the video (0.3s) to bypass any initial black frame
      try {
        if (video.duration && video.duration > 0.3) {
          video.currentTime = Math.min(0.4, video.duration / 4);
        } else {
          drawFrame();
        }
      } catch {
        drawFrame();
      }
    };

    video.onseeked = () => {
      drawFrame();
    };

    video.onerror = () => {
      finish(generateBrandedPoster(fallbackTitle, fallbackSubject));
    };

    // Safety timeout: 2 seconds max
    setTimeout(() => {
      if (!hasResolved) {
        finish(generateBrandedPoster(fallbackTitle, fallbackSubject));
      }
    }, 2000);

    video.src = objectUrl;
    video.load();
  });
}

/**
 * Generate a vibrant educational poster when a video has no visual frame or starts completely black
 */
export function generateBrandedPoster(title: string, subject: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Beautiful gradient background
    const grad = ctx.createLinearGradient(0, 0, 640, 360);
    grad.addColorStop(0, '#1e1b4b'); // deep indigo
    grad.addColorStop(0.5, '#312e81');
    grad.addColorStop(1, '#0f172a'); // slate
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 360);

    // Subtle decorative circles
    ctx.fillStyle = 'rgba(244, 63, 94, 0.15)'; // rose
    ctx.beginPath();
    ctx.arc(560, 60, 140, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)'; // amber
    ctx.beginPath();
    ctx.arc(80, 300, 120, 0, Math.PI * 2);
    ctx.fill();

    // Play icon badge in center
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(320, 150, 48, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(310, 130);
    ctx.lineTo(340, 150);
    ctx.lineTo(310, 170);
    ctx.closePath();
    ctx.fill();

    // Subject badge
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.roundRect(240, 40, 160, 30, 15);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(subject || 'درس تعليمي', 320, 60);

    // Title text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Cairo, sans-serif';
    ctx.textAlign = 'center';
    const displayTitle = title && title.length > 38 ? title.slice(0, 38) + '...' : title || 'فيديو تعليمي';
    ctx.fillText(displayTitle, 320, 240);

    // Branding note
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px Cairo, sans-serif';
    ctx.fillText('منصة قلمي التعليمية • الصف الخامس الابتدائي', 320, 280);
  }

  const result = canvas.toDataURL('image/jpeg', 0.85);
  canvas.width = 0;
  canvas.height = 0;
  return result;
}

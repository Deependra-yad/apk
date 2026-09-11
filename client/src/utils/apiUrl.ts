export const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Local development on port 3000 connects directly to local backend
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${window.location.hostname}:5000`;
    }
    // IMPORTANT: For production (Vercel), we MUST return the origin (Vercel domain) 
    // instead of the direct Railway URL. Indian ISPs like Jio actively block `*.up.railway.app`. 
    // By returning origin, we force the frontend to proxy all API/Socket traffic through 
    // Vercel's Edge network (via next.config.ts rewrites), completely bypassing the Jio block!
    return window.location.origin;
  }
  // Server-side rendering fallback
  return process.env.NEXT_PUBLIC_API_URL || 'https://apk-production-740c.up.railway.app';
};

export const resolveMediaUrl = (url?: string | null): string => {
  if (!url || url.startsWith('ENC:') || url === '[Decryption Failed]') return '';
  // If localhost:5000 is embedded in legacy database records, rewrite to active backend
  if (url.startsWith('http://localhost:5000/')) {
    const backend = getApiUrl();
    return url.replace('http://localhost:5000', backend);
  }
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const backend = getApiUrl();
  return `${backend}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Reliable download helper that works inside Android APK, mobile browsers, and desktop PWAs
export const downloadFile = async (url: string, filename: string) => {
  try {
    if (!url || typeof window === 'undefined') return;

    // Clean and sanitize filename
    const rawName = filename || url.split('/').pop() || 'file';
    const cleanFilename = rawName
      .split('?')[0]
      .split('#')[0]
      .replace(/[\\/:*?"<>|]/g, '_')
      .trim() || `download_${Date.now()}`;

    // Ensure URL is absolute or valid schema
    const absUrl = url.startsWith('/') 
      ? `${window.location.origin}${url}` 
      : (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:'))
        ? url
        : `${window.location.origin}/${url}`;

    // 1. Android Native App Bridge (running inside LiquidChat APK)
    // Priority: saveBase64File writes directly to MediaStore.Downloads (Android 10-15 Q+)
    // bypassing DownloadManager permissions, auth token headers, and ISP blocks!
    if ((window as any).Android?.saveBase64File) {
      try {
        if (absUrl.startsWith('data:')) {
          (window as any).Android.saveBase64File(absUrl, cleanFilename);
          return;
        }

        const token = localStorage.getItem('liquid_token');
        const headers: Record<string, string> = {};
        if (token && !absUrl.startsWith('blob:') && !absUrl.startsWith('data:')) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(absUrl, { headers });
        if (res.ok) {
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Data = reader.result as string;
            if (base64Data && (window as any).Android?.saveBase64File) {
              (window as any).Android.saveBase64File(base64Data, cleanFilename);
            }
          };
          reader.readAsDataURL(blob);
          return;
        }
      } catch (nativeErr) {
        console.warn("Native Base64 save failed, trying fallback bridge:", nativeErr);
      }
    }

    // Secondary Android native bridge fallback
    if ((window as any).Android?.downloadFile) {
      (window as any).Android.downloadFile(absUrl, cleanFilename);
      return;
    }

    // 2. Direct Blob Download (Standard for Chrome, Edge, Safari, Mobile Browsers)
    try {
      const token = localStorage.getItem('liquid_token');
      const headers: Record<string, string> = {};
      if (token && !absUrl.startsWith('blob:') && !absUrl.startsWith('data:')) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(absUrl, { headers });
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = cleanFilename;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(blobUrl);
        }, 3000);
        return;
      }
    } catch (fetchErr) {
      console.warn("Direct blob fetch failed, falling back to direct anchor", fetchErr);
    }

    // 3. Clean Fallback: standard anchor click with download attribute
    const a = document.createElement('a');
    a.href = absUrl;
    a.download = cleanFilename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 2000);
  } catch (e) {
    console.error("Download failed:", e);
    window.open(url, '_blank');
  }
};


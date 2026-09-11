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
    
    // Direct Railway domain to guarantee zero Chrome deep-link bouncing into the old APK
    const RAILWAY_HOST = 'https://apk-production-740c.up.railway.app';

    // Ensure URL is absolute
    const absUrl = url.startsWith('/') 
      ? `${window.location.origin}${url}` 
      : (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:'))
        ? url
        : `${window.location.origin}/${url}`;

    // 1. Android Native App Bridge (running inside updated LiquidChat APK)
    if ((window as any).Android?.downloadFile) {
      (window as any).Android.downloadFile(absUrl, filename);
      return;
    }

    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

    // 2. If running on Android without native downloadFile bridge (e.g. older APK or Android browser):
    // If the URL is hosted on liquidchat.online, Android App Links will intercept it and loop into the app!
    // By rewriting the download URL to the Railway backend domain with download=1, Chrome downloads directly without deep-link loop!
    if (isAndroid && !(window as any).Android?.downloadFile) {
      let directDownloadUrl = absUrl;
      if (absUrl.includes('/LiquidChat.apk')) {
        directDownloadUrl = `${RAILWAY_HOST}/LiquidChat.apk`;
      } else if (absUrl.includes('/uploads/')) {
        const pathPart = absUrl.substring(absUrl.indexOf('/uploads/'));
        const sep = pathPart.includes('?') ? '&' : '?';
        directDownloadUrl = `${RAILWAY_HOST}${pathPart}${sep}download=1`;
      } else if (absUrl.includes('/api/upload/')) {
        const pathPart = absUrl.substring(absUrl.indexOf('/api/upload/'));
        const sep = pathPart.includes('?') ? '&' : '?';
        directDownloadUrl = `${RAILWAY_HOST}${pathPart}${sep}download=1`;
      }

      // If Android has base64 bridge:
      if ((window as any).Android?.saveBase64File) {
        try {
          const res = await fetch(directDownloadUrl, { mode: 'cors' });
          if (res.ok) {
            const blob = await res.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              (window as any).Android.saveBase64File(reader.result as string, filename);
            };
            reader.readAsDataURL(blob);
            return;
          }
        } catch (e) {}
      }

      // Direct navigation to Railway endpoint:
      // Chrome opens apk-production-740c.up.railway.app which has NO app-link registration,
      // receives Content-Disposition: attachment, and downloads immediately!
      window.location.href = directDownloadUrl;
      return;
    }

    // 3. Direct Blob Download (Standard for Chrome, Edge, Safari, Mobile Chrome)
    try {
      const response = await fetch(absUrl, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = filename;
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

    // 4. Clean Fallback: standard anchor click with download attribute
    const a = document.createElement('a');
    a.href = absUrl;
    a.download = filename;
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


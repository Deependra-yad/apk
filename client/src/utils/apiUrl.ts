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
  if (!url) return '';
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
    
    // Ensure URL is absolute
    const absUrl = url.startsWith('/') 
      ? `${window.location.origin}${url}` 
      : (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:'))
        ? url
        : `${window.location.origin}/${url}`;

    // 1. Android Native App Bridge (running inside our LiquidChat APK)
    if ((window as any).Android?.downloadFile) {
      (window as any).Android.downloadFile(absUrl, filename);
      return;
    }

    // 2. Direct Blob Download (Standard for Chrome, Edge, Safari, Mobile Chrome)
    try {
      const response = await fetch(absUrl, { mode: 'cors' });
      if (response.ok) {
        const blob = await response.blob();
        
        // If Android bridge has saveBase64File for blob downloads
        if ((window as any).Android?.saveBase64File) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            (window as any).Android.saveBase64File(base64data, filename);
          };
          reader.readAsDataURL(blob);
          return;
        }

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

    // 3. Clean Fallback: standard anchor click with download attribute
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


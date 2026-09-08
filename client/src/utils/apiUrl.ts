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

// Download helper that works inside Android WebView (where <a download> is silently ignored)
export const downloadFile = async (url: string, filename: string) => {
  try {
    // For Android WebView: try the Android bridge first
    if (typeof window !== 'undefined' && (window as any).Android?.downloadFile) {
      (window as any).Android.downloadFile(url, filename);
      return;
    }

    // Attempt Web Share API for Mobile devices (works in many Android WebViews)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: blob.type });
        await navigator.share({
          files: [file],
          title: filename
        });
        return; // Success with native share sheet!
      } catch (shareError) {
        console.warn("Web Share API failed or was cancelled:", shareError);
        // Fall through to blob download
      }
    }

    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);
    
    // For Android WebViews, Blob downloads will fail silently. 
    // We bypass the Android native WebView host restriction by shortening the URL to an external domain (is.gd).
    // This forces Android to open the device's native Chrome browser which can download the file!
    if (isMobile) {
      try {
        const res = await fetch(`/api/shorten?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (data.shorturl) {
          window.open(data.shorturl, '_system'); // Bypass webview
          return;
        }
      } catch (e) {
        console.warn("URL shortening failed:", e);
      }
      // Ultimate Fallback for Android WebView if is.gd fails: Google Redirect
      window.open('https://www.google.com/url?q=' + encodeURIComponent(url), '_system');
      return;
    }

    // Fetch the file as a blob and trigger a programmatic download (Browser fallback for Desktop)
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 1000);
  } catch (e) {
    // Ultimate fallback: open in new tab
    window.open(url, '_blank');
  }
};


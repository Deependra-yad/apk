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

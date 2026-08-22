export const getApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== 'undefined') {
    // If on Vercel (.vercel.app), direct all traffic to Railway production backend
    if (window.location.hostname.endsWith('.vercel.app')) {
      return 'https://apk-production-740c.up.railway.app';
    }
    // Local development on port 3000
    if (window.location.port === '3000') {
      return `http://${window.location.hostname}:5000`;
    }
    return window.location.origin;
  }
  return 'https://apk-production-740c.up.railway.app';
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

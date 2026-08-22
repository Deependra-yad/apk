export const getApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== 'undefined') {
    // If on Vercel or production domain, connect directly to Railway backend for WebSockets
    if (window.location.hostname.endsWith('.vercel.app')) {
      return 'https://apk-production-740c.up.railway.app';
    }
    // Local dev on port 3000
    if (window.location.port === '3000') {
      return `http://${window.location.hostname}:5000`;
    }
    return window.location.origin;
  }
  return 'https://apk-production-740c.up.railway.app';
};

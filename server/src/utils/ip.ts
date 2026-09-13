import { Request } from 'express';

/**
 * Extracts authentic client public IP address handling Cloudflare,
 * reverse proxies (Railway, Vercel, Nginx), and IPv6-mapped IPv4.
 */
export function getClientIp(req: Request | any): string {
  // 1. Cloudflare connecting IP header (Highest accuracy when behind Cloudflare proxy)
  const cfIp = req.headers?.['cf-connecting-ip'];
  if (cfIp) {
    const val = (Array.isArray(cfIp) ? cfIp[0] : cfIp).trim();
    if (val && isValidIp(val)) return sanitizeIp(val);
  }

  // 2. Real IP header (Commonly provided by Nginx / Railway / Vercel proxy)
  const realIp = req.headers?.['x-real-ip'];
  if (realIp) {
    const val = (Array.isArray(realIp) ? realIp[0] : realIp).trim();
    if (val && isValidIp(val)) return sanitizeIp(val);
  }

  // 3. X-Forwarded-For (Client IP is the FIRST element in the comma-separated chain)
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) {
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const firstIp = raw.split(',')[0].trim();
    if (firstIp && isValidIp(firstIp)) return sanitizeIp(firstIp);
  }

  // 4. Express req.ip (populated when app.set('trust proxy', 1) is active)
  if (req.ip && isValidIp(req.ip)) {
    return sanitizeIp(req.ip);
  }

  // 5. Socket remote address
  const socketIp = req.socket?.remoteAddress;
  if (socketIp && isValidIp(socketIp)) {
    return sanitizeIp(socketIp);
  }

  return '127.0.0.1';
}

function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  const clean = ip.trim().toLowerCase();
  return clean !== 'unknown' && clean !== 'undefined' && clean.length > 2;
}

function sanitizeIp(ip: string): string {
  let clean = ip.trim();
  // Strip IPv4-mapped IPv6 prefix ::ffff:
  if (clean.startsWith('::ffff:')) {
    clean = clean.substring(7);
  }
  if (clean === '::1') {
    clean = '127.0.0.1';
  }
  return clean;
}

/**
 * Parses user-agent strings into human-readable Browser, OS, and Device info
 */
export function parseUserAgent(uaString?: string | null): {
  browser: string;
  os: string;
  device: string;
  summary: string;
} {
  if (!uaString) {
    return {
      browser: 'Unknown Browser',
      os: 'Unknown OS',
      device: 'Desktop',
      summary: 'Unknown Client'
    };
  }

  const ua = uaString.toLowerCase();

  // Detect LiquidChat Native Android App
  const isLiquidApp = ua.includes('liquidchat') || ua.includes('com.liquidchat.app');

  // Detect OS
  let os = 'Unknown OS';
  if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) os = 'iOS';
  else if (ua.includes('windows nt 10.0')) os = 'Windows 10/11';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os x') || ua.includes('macintosh')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';

  // Detect Device
  let device = 'Desktop';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    device = ua.includes('ipad') || ua.includes('tablet') ? 'Tablet' : 'Mobile';
  }

  // Detect Browser
  let browser = 'Unknown Browser';
  if (isLiquidApp) {
    browser = 'LiquidChat Android App (APK)';
  } else if (ua.includes('edg/')) {
    browser = 'Microsoft Edge';
  } else if (ua.includes('chrome/') && !ua.includes('edg/')) {
    browser = 'Google Chrome';
  } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
    browser = 'Apple Safari';
  } else if (ua.includes('firefox/')) {
    browser = 'Mozilla Firefox';
  } else if (ua.includes('opera/') || ua.includes('opr/')) {
    browser = 'Opera';
  }

  const summary = isLiquidApp 
    ? 'LiquidChat Android App' 
    : `${browser} on ${os}`;

  return { browser, os, device, summary };
}


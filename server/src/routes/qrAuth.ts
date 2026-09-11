import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'liquid_super_secret';

export interface QrSession {
  sessionId: string;
  status: 'pending' | 'scanned' | 'approved' | 'expired';
  token?: string;
  user?: any;
  createdAt: number;
  expiresAt: number;
  scannedByUserId?: string;
  desktopDeviceInfo?: {
    userAgent?: string;
    ip?: string;
  };
}

// In-memory active QR login sessions (auto-expire after 90 seconds)
export const qrSessions = new Map<string, QrSession>();

export interface ActiveLinkedSession {
  id: string;
  userId: string;
  deviceName: string;
  browser: string;
  os: string;
  ip: string;
  linkedAt: number;
  lastActive: number;
}

export const linkedSessions = new Map<string, ActiveLinkedSession>();

export function parseDeviceInfo(ua: string) {
  let browser = 'Chrome';
  let os = 'Windows';

  if (/Edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome/i.test(ua)) browser = 'Google Chrome';
  else if (/Firefox/i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Safari/i.test(ua)) browser = 'Apple Safari';
  else if (/Opera|OPR/i.test(ua)) browser = 'Opera';

  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS';

  return { browser, os, deviceName: `${browser} on ${os}` };
}

// Cleanup stale sessions every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of qrSessions.entries()) {
    if (session.expiresAt < now) {
      qrSessions.delete(id);
    }
  }
}, 120000);

// Global reference to Socket.IO server to broadcast QR events
let ioInstance: any = null;
export const setQrSocketIo = (io: any) => {
  ioInstance = io;
};

// 1. Desktop client initializes a QR login session
router.post('/init', (req, res) => {
  const sessionId = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = now + 90 * 1000; // 90 seconds validity

  const ip = (req.headers['x-forwarded-for'] as string) || (req.socket.remoteAddress as string) || 'Unknown IP';
  const userAgent = (req.headers['user-agent'] as string) || 'Desktop Browser';

  const session: QrSession = {
    sessionId,
    status: 'pending',
    createdAt: now,
    expiresAt,
    desktopDeviceInfo: {
      userAgent,
      ip
    }
  };

  qrSessions.set(sessionId, session);
  res.json({ sessionId, expiresAt });
});

// 2. Poll QR status (HTTP fallback for WebSockets)
router.get('/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = qrSessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found or expired', status: 'expired' });
  }

  if (Date.now() > session.expiresAt) {
    session.status = 'expired';
    return res.json({ status: 'expired' });
  }

  res.json({
    status: session.status,
    token: session.token,
    user: session.user,
    expiresAt: session.expiresAt
  });
});

// 3. Mobile app scans the QR code (notifies desktop of scan)
router.post('/scan', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'Session ID is required' });

  const session = qrSessions.get(sessionId);
  if (!session || Date.now() > session.expiresAt) {
    return res.status(400).json({ error: 'QR Code has expired. Please refresh the page on your desktop.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!decoded.userId) return res.status(401).json({ error: 'Invalid token' });

    session.status = 'scanned';
    session.scannedByUserId = decoded.userId;

    // Broadcast scan event to desktop room
    if (ioInstance) {
      ioInstance.to(`qr_${sessionId}`).emit('qr_scanned', {
        status: 'scanned',
        ip: session.desktopDeviceInfo?.ip
      });
    }

    res.json({
      success: true,
      deviceInfo: session.desktopDeviceInfo || { userAgent: 'Desktop Browser', ip: 'Unknown' }
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid authorization token' });
  }
});

// 4. Mobile app confirms & approves the desktop login
router.post('/approve', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'Session ID is required' });

  const session = qrSessions.get(sessionId);
  if (!session || Date.now() > session.expiresAt) {
    return res.status(400).json({ error: 'QR Code has expired. Please refresh the page on your desktop.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!decoded.userId) return res.status(401).json({ error: 'Invalid token' });

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isBanned) return res.status(403).json({ error: 'Account is banned' });

    // Generate dedicated 7-day token for the desktop session
    const desktopToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // Log desktop login
    await prisma.loginLog.create({
      data: {
        userId: user.id,
        ipAddress: session.desktopDeviceInfo?.ip || 'Unknown',
        userAgent: session.desktopDeviceInfo?.userAgent || 'Liquid Web (QR Login)',
        status: 'success'
      }
    }).catch(() => {});

    const userPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      liquidNumber: user.liquidNumber,
      avatar: user.avatar,
      about: user.about,
      publicKey: user.publicKey,
      isAdmin: user.isAdmin,
      isBanned: user.isBanned
    };

    session.status = 'approved';
    session.token = desktopToken;
    session.user = userPayload;

    // Register active linked session
    const ua = session.desktopDeviceInfo?.userAgent || 'Desktop Browser';
    const parsed = parseDeviceInfo(ua);
    const activeDevice: ActiveLinkedSession = {
      id: sessionId,
      userId: user.id,
      deviceName: parsed.deviceName,
      browser: parsed.browser,
      os: parsed.os,
      ip: session.desktopDeviceInfo?.ip || 'Unknown IP',
      linkedAt: Date.now(),
      lastActive: Date.now()
    };
    linkedSessions.set(sessionId, activeDevice);

    // Broadcast approval event to desktop room
    if (ioInstance) {
      ioInstance.to(`qr_${sessionId}`).emit('qr_login_success', {
        token: desktopToken,
        user: userPayload,
        sessionId
      });
    }

    res.json({ success: true, message: 'Device linked successfully!' });
  } catch (err) {
    console.error('QR Approval error:', err);
    res.status(500).json({ error: 'Failed to authorize QR login' });
  }
});

// 5. Get list of all currently active linked device sessions for the authenticated user
router.get('/sessions', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const userSessions: ActiveLinkedSession[] = [];
    for (const s of linkedSessions.values()) {
      if (s.userId === userId) {
        userSessions.push(s);
      }
    }

    // Also include recent successful login logs
    if (userSessions.length === 0) {
      const logs = await prisma.loginLog.findMany({
        where: { userId, status: 'success' },
        orderBy: { createdAt: 'desc' },
        take: 5
      });
      logs.forEach((l: any) => {
        const parsed = parseDeviceInfo(l.userAgent || '');
        userSessions.push({
          id: l.id,
          userId,
          deviceName: parsed.deviceName,
          browser: parsed.browser,
          os: parsed.os,
          ip: l.ipAddress || 'Unknown IP',
          linkedAt: new Date(l.createdAt).getTime(),
          lastActive: new Date(l.createdAt).getTime()
        });
      });
    }

    res.json({ sessions: userSessions });
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// 6. Terminate / log out a specific device session
router.delete('/sessions/:sessionId', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const { sessionId } = req.params;
  try {
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    linkedSessions.delete(sessionId);

    if (ioInstance) {
      ioInstance.to(`qr_${sessionId}`).emit('force_logout', { reason: 'Logged out from mobile device' });
      ioInstance.to(`user_${userId}`).emit('force_logout_session', { sessionId });
    }

    res.json({ success: true, message: 'Device session terminated' });
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// 7. Terminate / log out all linked devices
router.delete('/sessions', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    for (const [id, s] of linkedSessions.entries()) {
      if (s.userId === userId) {
        linkedSessions.delete(id);
        if (ioInstance) {
          ioInstance.to(`qr_${id}`).emit('force_logout', { reason: 'All devices logged out' });
        }
      }
    }

    if (ioInstance) {
      ioInstance.to(`user_${userId}`).emit('force_logout_all_sessions');
    }

    res.json({ success: true, message: 'All linked devices logged out' });
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;


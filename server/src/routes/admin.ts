import { Router } from 'express';
import prisma from '../prisma';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'liquid_super_secret';

const adminAuth = async (req: any, res: any, next: any) => {
  const adminPassword = req.headers['x-admin-password'];
  if (adminPassword === 'Deependra@123') {
    return next();
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }
    
    req.userId = user.id;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalMessages = await prisma.message.count();
    const totalGroups = await prisma.group.count();
    const totalStories = await prisma.story.count();

    // Sum storage from Media table
    const mediaFiles = await prisma.media.findMany({ select: { data: true } });
    let totalBytes = mediaFiles.reduce((acc: number, curr: any) => acc + curr.data.byteLength, 0);
    const fileCount = mediaFiles.length;

    // Check old uploads folder too
    const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
    if (fs.existsSync(UPLOAD_DIR)) {
      const files = fs.readdirSync(UPLOAD_DIR);
      files.forEach(file => {
        totalBytes += fs.statSync(path.join(UPLOAD_DIR, file)).size;
      });
    }

    const uploadsSizeMb = +(totalBytes / (1024 * 1024)).toFixed(2);

    res.json({
      totalUsers,
      totalMessages,
      totalGroups,
      totalStories,
      uploadsSizeMb,
      fileCount
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        isAdmin: true,
        isBanned: true,
        lastIpAddress: true,
        lastSeen: true,
        createdAt: true,
        _count: {
          select: { messagesSent: true, loginLogs: true, mediaUploaded: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/users/:id/ban', adminAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { isBanned: !user.isBanned }
    });
    
    res.json({ message: updatedUser.isBanned ? 'User banned successfully' : 'User unbanned successfully', isBanned: updatedUser.isBanned });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update ban status' });
  }
});

router.delete('/users/:id', adminAuth, async (req, res) => {
  const userId = req.params.id;
  try {
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } }),
      prisma.groupMember.deleteMany({ where: { userId } }),
      prisma.chatMeta.deleteMany({ where: { OR: [{ userId }, { targetId: userId }] } }),
      prisma.blockList.deleteMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } }),
      prisma.userSettings.deleteMany({ where: { userId } }),
      prisma.pushSubscription.deleteMany({ where: { userId } }),
      prisma.story.deleteMany({ where: { userId } }),
      prisma.callLog.deleteMany({ where: { OR: [{ callerId: userId }, { receiverId: userId }] } }),
      prisma.loginLog.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } })
    ]);
    res.json({ message: 'User completely deleted' });
  } catch (e: any) {
    console.error('Delete user error:', e);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.get('/logs', adminAuth, async (req, res) => {
  try {
    const logs = await prisma.loginLog.findMany({
      include: {
        user: { select: { username: true, email: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

router.get('/media', adminAuth, async (req, res) => {
  try {
    const media = await prisma.media.findMany({
      include: {
        user: { select: { username: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // We do NOT send the raw `data` buffer to the admin panel list API to save bandwidth.
    const safeMedia = media.map((m: any) => ({
      id: m.id,
      fileName: m.fileName,
      mimeType: m.mimeType,
      size: m.data.byteLength,
      createdAt: m.createdAt,
      user: m.user
    }));
    
    res.json(safeMedia);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

router.delete('/media/:id', adminAuth, async (req, res) => {
  try {
    await prisma.media.delete({ where: { id: req.params.id } });
    res.json({ message: 'Media file deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

router.post('/clear-storage', adminAuth, async (req, res) => {
  try {
    // Delete all DB media
    const dbRes = await prisma.media.deleteMany({});
    
    // Delete old local files
    const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
    let localDeleted = 0;
    if (fs.existsSync(UPLOAD_DIR)) {
      const files = fs.readdirSync(UPLOAD_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(UPLOAD_DIR, file));
        localDeleted++;
      }
    }
    res.json({ message: `Successfully deleted ${dbRes.count} database files and ${localDeleted} local files.` });
  } catch (e: any) {
    res.status(500).json({ error: 'Failed to clear storage' });
  }
});

export default router;

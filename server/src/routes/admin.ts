import { Router } from 'express';
import prisma from '../prisma';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'liquid_super_secret';

const adminAuth = async (req: any, res: any, next: any) => {
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

    let uploadsSizeMb = 0;
    let fileCount = 0;
    const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
    
    if (fs.existsSync(UPLOAD_DIR)) {
      const files = fs.readdirSync(UPLOAD_DIR);
      fileCount = files.length;
      let totalBytes = 0;
      files.forEach(file => {
        totalBytes += fs.statSync(path.join(UPLOAD_DIR, file)).size;
      });
      uploadsSizeMb = +(totalBytes / (1024 * 1024)).toFixed(2);
    }

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
        createdAt: true,
        _count: {
          select: { messagesSent: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'User deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.post('/clear-storage', adminAuth, async (req, res) => {
  try {
    const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
    let deletedCount = 0;
    
    if (fs.existsSync(UPLOAD_DIR)) {
      const files = fs.readdirSync(UPLOAD_DIR);
      files.forEach(file => {
        fs.unlinkSync(path.join(UPLOAD_DIR, file));
        deletedCount++;
      });
    }

    res.json({ message: Successfully deleted  files to free up space. });
  } catch (e) {
    res.status(500).json({ error: 'Failed to clear storage' });
  }
});

export default router;

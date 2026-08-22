import { Router } from 'express';
import prisma from '../prisma';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'liquid_super_secret';

const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Log a call
router.post('/log', authenticate, async (req: any, res) => {
  const { receiverId, type, status, duration } = req.body;
  const callerId = req.userId;

  try {
    const log = await prisma.callLog.create({
      data: {
        callerId,
        receiverId,
        type: type || 'video',
        status: status || 'completed',
        duration: duration || 0
      },
      include: {
        caller: { select: { id: true, username: true, avatar: true } },
        receiver: { select: { id: true, username: true, avatar: true } }
      }
    });

    res.json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log call' });
  }
});

// Get user call history
router.get('/history', authenticate, async (req: any, res) => {
  const userId = req.userId;

  try {
    const history = await prisma.callLog.findMany({
      where: {
        OR: [
          { callerId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        caller: { select: { id: true, username: true, avatar: true } },
        receiver: { select: { id: true, username: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
});

export default router;


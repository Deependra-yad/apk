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

// Delete all call logs permanently for user
router.delete('/history', authenticate, async (req: any, res) => {
  const userId = req.userId;
  try {
    const deleted = await prisma.callLog.deleteMany({
      where: {
        OR: [
          { callerId: userId },
          { receiverId: userId }
        ]
      }
    });
    res.json({ success: true, count: deleted.count, message: 'All call logs permanently deleted from server' });
  } catch (error) {
    console.error('Failed to delete call history:', error);
    res.status(500).json({ error: 'Failed to delete call history' });
  }
});

// Delete a specific call log permanently
router.delete('/:id', authenticate, async (req: any, res) => {
  const userId = req.userId;
  const { id } = req.params;

  try {
    const log = await prisma.callLog.findFirst({
      where: {
        id,
        OR: [
          { callerId: userId },
          { receiverId: userId }
        ]
      }
    });

    if (!log) {
      return res.status(404).json({ error: 'Call record not found or not authorized' });
    }

    await prisma.callLog.delete({ where: { id } });
    res.json({ success: true, message: 'Call record permanently deleted from server' });
  } catch (error) {
    console.error('Failed to delete call record:', error);
    res.status(500).json({ error: 'Failed to delete call record' });
  }
});

export default router;


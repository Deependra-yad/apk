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

// Get or Update User Settings & Privacy
router.get('/settings', authenticate, async (req: any, res) => {
  const userId = req.userId;

  try {
    let settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId }
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/settings', authenticate, async (req: any, res) => {
  const userId = req.userId;
  const { lastSeenPrivacy, readReceipts, enterToSend, theme, notificationSound, wallpaper } = req.body;

  try {
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        lastSeenPrivacy: lastSeenPrivacy || 'everyone',
        readReceipts: readReceipts !== undefined ? readReceipts : true,
        enterToSend: enterToSend !== undefined ? enterToSend : true,
        theme: theme || 'dark',
        notificationSound: notificationSound !== undefined ? notificationSound : true,
        wallpaper: wallpaper || null
      },
      update: {
        ...(lastSeenPrivacy && { lastSeenPrivacy }),
        ...(readReceipts !== undefined && { readReceipts }),
        ...(enterToSend !== undefined && { enterToSend }),
        ...(theme && { theme }),
        ...(notificationSound !== undefined && { notificationSound }),
        ...(wallpaper !== undefined && { wallpaper })
      }
    });

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Block / Unblock User
router.post('/block', authenticate, async (req: any, res) => {
  const blockerId = req.userId;
  const { blockedId } = req.body;

  if (blockerId === blockedId) {
    return res.status(400).json({ error: 'Cannot block yourself' });
  }

  try {
    const existing = await prisma.blockList.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } }
    });

    if (existing) {
      await prisma.blockList.delete({
        where: { blockerId_blockedId: { blockerId, blockedId } }
      });
      return res.json({ isBlocked: false, blockedId });
    } else {
      await prisma.blockList.create({
        data: { blockerId, blockedId }
      });
      return res.json({ isBlocked: true, blockedId });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update block state' });
  }
});

// Get list of blocked users
router.get('/blocked', authenticate, async (req: any, res) => {
  const blockerId = req.userId;

  try {
    const blockedList = await prisma.blockList.findMany({
      where: { blockerId },
      include: {
        blocked: { select: { id: true, username: true, avatar: true, about: true } }
      }
    });
    res.json(blockedList.map((b: any) => b.blocked));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
});

// Pin, Mute, Archive Chat Metadata
router.put('/chat-meta', authenticate, async (req: any, res) => {
  const userId = req.userId;
  const { targetId, isPinned, isArchived, isMuted } = req.body;

  try {
    const meta = await prisma.chatMeta.upsert({
      where: { userId_targetId: { userId, targetId } },
      create: {
        userId,
        targetId,
        isPinned: isPinned || false,
        isArchived: isArchived || false,
        isMuted: isMuted || false
      },
      update: {
        ...(isPinned !== undefined && { isPinned }),
        ...(isArchived !== undefined && { isArchived }),
        ...(isMuted !== undefined && { isMuted }),
        updatedAt: new Date()
      }
    });

    res.json(meta);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update chat meta' });
  }
});

// Get user's chat meta list
router.get('/chat-meta', authenticate, async (req: any, res) => {
  const userId = req.userId;

  try {
    const metaList = await prisma.chatMeta.findMany({
      where: { userId }
    });
    res.json(metaList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat meta' });
  }
});

export default router;

import { Router } from 'express';
import prisma from '../prisma';
import jwt from 'jsonwebtoken';
import { sendActivityNotification } from '../utils/email';

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
  const { 
    lastSeenPrivacy, 
    profilePhotoPrivacy, 
    aboutPrivacy, 
    statusPrivacy, 
    groupsPrivacy, 
    readReceipts, 
    enterToSend, 
    theme, 
    notificationSound, 
    wallpaper 
  } = req.body;

  try {
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        lastSeenPrivacy: lastSeenPrivacy || 'everyone',
        profilePhotoPrivacy: profilePhotoPrivacy || 'everyone',
        aboutPrivacy: aboutPrivacy || 'everyone',
        statusPrivacy: statusPrivacy || 'contacts',
        groupsPrivacy: groupsPrivacy || 'everyone',
        readReceipts: readReceipts !== undefined ? readReceipts : true,
        enterToSend: enterToSend !== undefined ? enterToSend : true,
        theme: theme || 'dark',
        notificationSound: notificationSound !== undefined ? notificationSound : true,
        wallpaper: wallpaper || null
      },
      update: {
        ...(lastSeenPrivacy && { lastSeenPrivacy }),
        ...(profilePhotoPrivacy && { profilePhotoPrivacy }),
        ...(aboutPrivacy && { aboutPrivacy }),
        ...(statusPrivacy && { statusPrivacy }),
        ...(groupsPrivacy && { groupsPrivacy }),
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

// Get list of user IDs that the current user has chatted with
router.get('/conversations', authenticate, async (req: any, res) => {
  const userId = req.userId;
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, groupId: null },
          { receiverId: userId, groupId: null }
        ]
      },
      select: { senderId: true, receiverId: true }
    });

    const userIds = new Set<string>();
    messages.forEach((m: any) => {
      if (m.senderId !== userId && m.senderId) userIds.add(m.senderId);
      if (m.receiverId !== userId && m.receiverId) userIds.add(m.receiverId);
    });

    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: {
        id: true,
        username: true,
        liquidNumber: true,
        avatar: true,
        about: true,
        lastSeen: true,
        publicKey: true,
        settings: { 
          select: { 
            lastSeenPrivacy: true, 
            profilePhotoPrivacy: true, 
            aboutPrivacy: true, 
            groupsPrivacy: true 
          } 
        },
        blocksInitiated: { select: { blockedId: true } },
        blocksReceived: { select: { blockerId: true } }
      }
    });

    const sanitizedUsers = users.map((u: any) => {
      const isBlockedByMe = u.blocksReceived.some((b: any) => b.blockerId === userId);
      const hasBlockedMe = u.blocksInitiated.some((b: any) => b.blockedId === userId);
      const lastSeenPriv = u.settings?.lastSeenPrivacy || 'everyone';
      const photoPriv = u.settings?.profilePhotoPrivacy || 'everyone';
      const aboutPriv = u.settings?.aboutPrivacy || 'everyone';

      let hideLastSeen = false;
      let hidePhoto = false;
      let hideAbout = false;

      if (lastSeenPriv === 'nobody' || isBlockedByMe || hasBlockedMe) hideLastSeen = true;
      if (photoPriv === 'nobody' || isBlockedByMe || hasBlockedMe) hidePhoto = true;
      if (aboutPriv === 'nobody' || isBlockedByMe || hasBlockedMe) hideAbout = true;

      const { settings, blocksInitiated, blocksReceived, ...safeUser } = u;
      if (hideLastSeen) safeUser.lastSeen = null;
      if (hidePhoto) safeUser.avatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${u.username}`;
      if (hideAbout) safeUser.about = null;
      safeUser.groupsPrivacy = u.settings?.groupsPrivacy || 'everyone';
      return safeUser;
    });

    res.json(sanitizedUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.delete('/me', authenticate, async (req: any, res) => {
  const userId = req.userId;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 1. Reassign or delete groups created by this user
    const createdGroups = await prisma.group.findMany({
      where: { creatorId: userId },
      include: { members: true }
    });
    for (const group of createdGroups) {
      const otherMember = group.members.find((m: any) => m.userId !== userId);
      if (otherMember) {
        await prisma.group.update({
          where: { id: group.id },
          data: { creatorId: otherMember.userId }
        });
        await prisma.groupMember.update({
          where: { groupId_userId: { groupId: group.id, userId: otherMember.userId } },
          data: { role: 'admin' }
        });
      } else {
        await prisma.message.deleteMany({ where: { groupId: group.id } });
        await prisma.groupMember.deleteMany({ where: { groupId: group.id } });
        await prisma.group.delete({ where: { id: group.id } });
      }
    }

    // 2. Cascade delete all user records across every table
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } }),
      prisma.groupMember.deleteMany({ where: { userId } }),
      prisma.chatMeta.deleteMany({ where: { OR: [{ userId }, { targetId: userId }] } }),
      prisma.blockList.deleteMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } }),
      prisma.callLog.deleteMany({ where: { OR: [{ callerId: userId }, { receiverId: userId }] } }),
      prisma.story.deleteMany({ where: { userId } }),
      prisma.media.deleteMany({ where: { userId } }),
      prisma.pushSubscription.deleteMany({ where: { userId } }),
      prisma.userSettings.deleteMany({ where: { userId } }),
      prisma.loginLog.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } })
    ]);

    if (user.email) {
      await prisma.otpCode.deleteMany({ where: { email: user.email } }).catch(() => {});
      sendActivityNotification(user.email, 'account_deleted', (req.ip as string) || 'Client', (req.headers['user-agent'] as string) || 'Web/Mobile App').catch(() => {});
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('force_logout');
      io.emit('user_deleted', { userId });
    }

    res.json({ success: true, message: 'Account permanently deleted from everywhere' });
  } catch (error) {
    console.error('Failed to delete account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

router.delete('/me/storage', authenticate, async (req: any, res) => {
  const userId = req.userId;
  try {
    await prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } });
    await prisma.story.deleteMany({ where: { userId } });
    res.json({ success: true, message: 'All personal messages and stories cleared' });
  } catch (error) {
    console.error('Failed to clear storage:', error);
    res.status(500).json({ error: 'Failed to clear storage' });
  }
});

router.put('/public-key', authenticate, async (req: any, res) => {
  const userId = req.userId;
  const { publicKey } = req.body;
  if (!publicKey) return res.status(400).json({ error: 'Public key is required' });

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { publicKey }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update public key' });
  }
});

router.get('/:userId/public-key', authenticate, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      select: { publicKey: true }
    });
    res.json({ publicKey: user?.publicKey || null });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch public key' });
  }
});

router.get('/search', authenticate, async (req: any, res) => {
  try {
    const liquidNumber = req.query.liquidNumber as string;
    if (!liquidNumber || liquidNumber.length !== 10) return res.json([]);
    
    const user = await prisma.user.findUnique({
      where: { liquidNumber },
      select: { 
        id: true, 
        username: true, 
        liquidNumber: true,
        avatar: true, 
        about: true, 
        lastSeen: true,
        publicKey: true,
        settings: { select: { lastSeenPrivacy: true } },
        blocksInitiated: { select: { blockedId: true } },
        blocksReceived: { select: { blockerId: true } }
      }
    });

    if (!user) return res.json([]);

    const currentUserId = req.userId;
    if (user.id === currentUserId) return res.json([]);

    const isBlockedByMe = currentUserId ? user.blocksReceived.some((b: any) => b.blockerId === currentUserId) : false;
    const hasBlockedMe = currentUserId ? user.blocksInitiated.some((b: any) => b.blockedId === currentUserId) : false;

    const privacy = user.settings?.lastSeenPrivacy || 'everyone';
    let hideLastSeen = false;

    if (privacy === 'nobody') hideLastSeen = true;
    else if (privacy === 'contacts' && !currentUserId) hideLastSeen = true;
    else if (isBlockedByMe || hasBlockedMe) hideLastSeen = true;

    const { settings, blocksInitiated, blocksReceived, ...safeUser } = user as any;
    if (hideLastSeen) safeUser.lastSeen = null;

    res.json([safeUser]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search user' });
  }
});

export default router;

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

// Create a new status story (expires in 24h)
router.post('/', authenticate, async (req: any, res) => {
  const { mediaUrl, caption, type, bgColor } = req.body;
  const userId = req.userId;

  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const story = await prisma.story.create({
      data: {
        userId,
        mediaUrl: mediaUrl || null,
        caption: caption || '',
        type: type || 'image',
        bgColor: bgColor || '#1e1e24',
        expiresAt
      },
      include: {
        user: {
          select: { id: true, username: true, avatar: true }
        }
      }
    });

    res.json(story);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create story' });
  }
});

// Get active stories (Strictly scoped to mutual chat contacts, respecting privacy settings)
router.get('/', authenticate, async (req: any, res) => {
  const myId = req.userId;

  try {
    // 1. Get mutual chat contacts (users who have sent messages to or received from myId)
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: myId, groupId: null },
          { receiverId: myId, groupId: null }
        ]
      },
      select: { senderId: true, receiverId: true },
      take: 2000
    });

    const contactIds = new Set<string>();
    messages.forEach((m: any) => {
      if (m.senderId && m.senderId !== myId) contactIds.add(m.senderId);
      if (m.receiverId && m.receiverId !== myId) contactIds.add(m.receiverId);
    });

    // 2. Exclude any blocked users (blocker or blocked)
    const blocks = await prisma.blockList.findMany({
      where: {
        OR: [
          { blockerId: myId },
          { blockedId: myId }
        ]
      },
      select: { blockerId: true, blockedId: true }
    });

    const blockedUserIds = new Set<string>();
    blocks.forEach((b: any) => {
      blockedUserIds.add(b.blockerId === myId ? b.blockedId : b.blockerId);
    });

    const allowedContactIds = Array.from(contactIds).filter(id => !blockedUserIds.has(id));

    // 3. Fetch stories: always include own stories, plus stories from contacts whose statusPrivacy is not 'nobody'
    const activeStories = await prisma.story.findMany({
      where: {
        expiresAt: { gt: new Date() },
        OR: [
          { userId: myId },
          {
            userId: { in: allowedContactIds },
            NOT: {
              user: {
                settings: {
                  statusPrivacy: 'nobody'
                }
              }
            }
          }
        ]
      },
      include: {
        user: {
          select: { id: true, username: true, avatar: true, publicKey: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(activeStories);
  } catch (error) {
    console.error('Failed to fetch scoped stories:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// Delete a story
router.delete('/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    console.log(`[DELETE STORY] User ${userId} attempting to delete story ${id}`);
    // Make sure the story belongs to the user
    const story = await prisma.story.findUnique({ where: { id } });
    if (!story) {
      console.log(`[DELETE STORY] Story not found`);
      return res.status(404).json({ error: 'Story not found' });
    }
    if (story.userId !== userId) {
      console.log(`[DELETE STORY] Unauthorized. Story userId: ${story.userId}, req.userId: ${userId}`);
      return res.status(403).json({ error: 'Unauthorized to delete this story' });
    }

    await prisma.story.delete({ where: { id } });
    console.log(`[DELETE STORY] Success`);
    res.json({ success: true });
  } catch (error) {
    console.error(`[DELETE STORY] Error:`, error);
    res.status(500).json({ error: 'Failed to delete story' });
  }
});

// View a story
router.post('/:id/view', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    console.log(`[VIEW STORY] User ${userId} viewing story ${id}`);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const story = await prisma.story.findUnique({ where: { id } });
    if (!story || !user) {
      console.log(`[VIEW STORY] Story or user not found`);
      return res.status(404).json({ error: 'Not found' });
    }

    let views = JSON.parse(story.views || '[]');
    if (!views.find((v: any) => v.userId === userId)) {
      views.push({
        userId,
        username: user.username,
        avatar: user.avatar,
        viewedAt: new Date().toISOString()
      });
      await prisma.story.update({
        where: { id },
        data: { views: JSON.stringify(views) }
      });
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

// React to a story
router.post('/:id/react', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { emoji } = req.body;
  const userId = req.userId;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const story = await prisma.story.findUnique({ where: { id } });
    if (!story || !user) return res.status(404).json({ error: 'Not found' });

    let reactions = JSON.parse(story.reactions || '[]');
    // Replace if exists, else push
    const idx = reactions.findIndex((r: any) => r.userId === userId);
    if (idx > -1) {
      if (reactions[idx].emoji === emoji) {
        reactions.splice(idx, 1); // toggle off
      } else {
        reactions[idx].emoji = emoji;
      }
    } else {
      reactions.push({
        userId,
        username: user.username,
        avatar: user.avatar,
        emoji
      });
    }

    const updated = await prisma.story.update({
      where: { id },
      data: { reactions: JSON.stringify(reactions) }
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;


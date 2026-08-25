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

// Get all active stories
router.get('/', authenticate, async (req: any, res) => {
  try {
    const activeStories = await prisma.story.findMany({
      where: {
        expiresAt: { gt: new Date() }
      },
      include: {
        user: {
          select: { id: true, username: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(activeStories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// Delete a story
router.delete('/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    // Make sure the story belongs to the user
    const story = await prisma.story.findUnique({ where: { id } });
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }
    if (story.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this story' });
    }

    await prisma.story.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete story' });
  }
});

export default router;


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

// Get direct conversation messages
router.get('/:userId', authenticate, async (req: any, res) => {
  const { userId } = req.params;
  const myId = req.userId;

  try {
    const messages = await prisma.message.findMany({
      where: {
        groupId: null,
        OR: [
          { senderId: myId, receiverId: userId },
          { senderId: userId, receiverId: myId }
        ]
      },
      include: {
        sender: { select: { id: true, username: true, avatar: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark messages sent by userId as seen
    await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: myId,
        isSeen: false
      },
      data: { isSeen: true }
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get group conversation messages
router.get('/group/:groupId', authenticate, async (req: any, res) => {
  const { groupId } = req.params;
  const myId = req.userId;

  try {
    const isMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: myId } }
    });

    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this group' });
    }

    const messages = await prisma.message.findMany({
      where: { groupId },
      include: {
        sender: { select: { id: true, username: true, avatar: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch group messages' });
  }
});

// Edit a sent message
router.put('/:messageId/edit', authenticate, async (req: any, res) => {
  const { messageId } = req.params;
  const { text } = req.body;
  const userId = req.userId;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Message text is required' });
  }

  try {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.senderId !== userId) return res.status(403).json({ error: 'Can only edit your own messages' });
    if (message.isDeleted) return res.status(400).json({ error: 'Cannot edit deleted message' });

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        text: text.trim(),
        isEdited: true,
        updatedAt: new Date()
      },
      include: {
        sender: { select: { id: true, username: true, avatar: true } }
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// Forward messages to target users or groups
router.post('/forward', authenticate, async (req: any, res) => {
  const { messageIds, targetIds, isGroupTarget } = req.body;
  const senderId = req.userId;

  try {
    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    const originalMessages = await prisma.message.findMany({
      where: { id: { in: messageIds } },
      include: { sender: { select: { username: true } } }
    });

    const forwardedList = [];

    for (const targetId of targetIds || []) {
      for (const orig of originalMessages) {
        const fwd = await prisma.message.create({
          data: {
            text: orig.text,
            type: orig.type,
            fileUrl: orig.fileUrl,
            fileName: orig.fileName,
            fileSize: orig.fileSize,
            mimeType: orig.mimeType,
            duration: orig.duration,
            pollData: orig.pollData,
            forwardedFrom: orig.sender?.username || 'User',
            senderId,
            receiverId: isGroupTarget ? null : targetId,
            groupId: isGroupTarget ? targetId : null
          },
          include: {
            sender: { select: { id: true, username: true, avatar: true } }
          }
        });
        forwardedList.push(fwd);
      }
    }

    res.json(forwardedList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to forward messages' });
  }
});

// Toggle Star message
router.put('/:messageId/star', authenticate, async (req: any, res) => {
  const { messageId } = req.params;

  try {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: 'Message not found' });

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { isStarred: !message.isStarred }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to star message' });
  }
});

// Get all starred messages
router.get('/starred/all', authenticate, async (req: any, res) => {
  const userId = req.userId;

  try {
    const starred = await prisma.message.findMany({
      where: {
        isStarred: true,
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: { select: { id: true, username: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(starred);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch starred messages' });
  }
});

// React to a message
router.put('/:messageId/react', authenticate, async (req: any, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.userId;

  try {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: 'Message not found' });

    let reactions: Array<{ userId: string; emoji: string }> = [];
    if (message.reactions) {
      try {
        reactions = JSON.parse(message.reactions);
      } catch (e) {
        reactions = [];
      }
    }

    const existingIndex = reactions.findIndex(r => r.userId === userId);
    if (existingIndex > -1) {
      if (reactions[existingIndex].emoji === emoji) {
        reactions.splice(existingIndex, 1);
      } else {
        reactions[existingIndex].emoji = emoji;
      }
    } else {
      reactions.push({ userId, emoji });
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { reactions: JSON.stringify(reactions) }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to react to message' });
  }
});

// Delete message
router.delete('/:messageId', authenticate, async (req: any, res) => {
  const { messageId } = req.params;
  const { deleteForEveryone } = req.body;
  const userId = req.userId;

  try {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) return res.status(404).json({ error: 'Message not found' });

    if (deleteForEveryone && message.senderId === userId) {
      const updated = await prisma.message.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          text: 'This message was deleted',
          fileUrl: null
        }
      });
      return res.json(updated);
    } else {
      await prisma.message.delete({ where: { id: messageId } });
      return res.json({ success: true, id: messageId });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;

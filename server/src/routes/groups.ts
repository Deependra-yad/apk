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

// Create a new group
router.post('/', authenticate, async (req: any, res) => {
  const { name, description, avatar, memberIds } = req.body;
  const creatorId = req.userId;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  try {
    const groupAvatar = avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`;
    const allMemberIds = Array.from(new Set([creatorId, ...(memberIds || [])]));

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description || 'Welcome to our group! 🌊',
        avatar: groupAvatar,
        creatorId,
        members: {
          create: allMemberIds.map((userId: string) => ({
            userId,
            role: userId === creatorId ? 'admin' : 'member'
          }))
        }
      },
      include: {
        creator: { select: { id: true, username: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, avatar: true, about: true, lastSeen: true } }
          }
        }
      }
    });

    res.json(group);
  } catch (error) {
    console.error('Group creation error:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Get user's groups
router.get('/', authenticate, async (req: any, res) => {
  const userId = req.userId;

  try {
    const groups = await prisma.group.findMany({
      where: {
        members: { some: { userId } }
      },
      include: {
        creator: { select: { id: true, username: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, avatar: true, about: true, lastSeen: true } }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get single group details
router.get('/:groupId', authenticate, async (req: any, res) => {
  const { groupId } = req.params;

  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        creator: { select: { id: true, username: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, avatar: true, about: true, lastSeen: true } }
          }
        }
      }
    });

    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch group details' });
  }
});

// Edit group information (name, description, avatar)
router.put('/:groupId', authenticate, async (req: any, res) => {
  const { groupId } = req.params;
  const { name, description, avatar } = req.body;
  const userId = req.userId;

  try {
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });

    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can edit group settings' });
    }

    const updated = await prisma.group.update({
      where: { id: groupId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(avatar && { avatar })
      },
      include: {
        creator: { select: { id: true, username: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, avatar: true } }
          }
        }
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// Add members to group
router.post('/:groupId/members', authenticate, async (req: any, res) => {
  const { groupId } = req.params;
  const { userIds } = req.body;
  const currentUserId = req.userId;

  try {
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: currentUserId } }
    });

    if (!member || member.role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can add members' });
    }

    const newMembers = await Promise.all(
      (userIds || []).map((userId: string) =>
        prisma.groupMember.upsert({
          where: { groupId_userId: { groupId, userId } },
          create: { groupId, userId, role: 'member' },
          update: {}
        })
      )
    );

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: { select: { id: true, username: true, avatar: true } }
          }
        }
      }
    });

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add members' });
  }
});

// Remove member from group or Leave group
router.delete('/:groupId/members/:targetUserId', authenticate, async (req: any, res) => {
  const { groupId, targetUserId } = req.params;
  const currentUserId = req.userId;

  try {
    // If not leaving on their own, check if caller is admin
    if (currentUserId !== targetUserId) {
      const caller = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId, userId: currentUserId } }
      });
      if (!caller || caller.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can remove group members' });
      }
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId, userId: targetUserId } }
    });

    res.json({ success: true, removedUserId: targetUserId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Promote/Demote group member role
router.put('/:groupId/members/:targetUserId/role', authenticate, async (req: any, res) => {
  const { groupId, targetUserId } = req.params;
  const { role } = req.body; // 'admin' | 'member'
  const currentUserId = req.userId;

  try {
    const caller = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: currentUserId } }
    });

    if (!caller || caller.role !== 'admin') {
      return res.status(403).json({ error: 'Only group admins can change roles' });
    }

    const updated = await prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      data: { role: role === 'admin' ? 'admin' : 'member' }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

export default router;


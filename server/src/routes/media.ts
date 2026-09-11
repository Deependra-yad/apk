import { Router } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import prisma from '../prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'liquid_super_secret';
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

function parseSizeToBytes(sizeStr?: string | null): number {
  if (!sizeStr) return 150 * 1024;
  const trimmed = sizeStr.trim().toUpperCase();
  if (trimmed.endsWith('MB')) {
    const num = parseFloat(trimmed.replace('MB', '').trim());
    return Math.round((isNaN(num) ? 1 : num) * 1024 * 1024);
  }
  if (trimmed.endsWith('KB')) {
    const num = parseFloat(trimmed.replace('KB', '').trim());
    return Math.round((isNaN(num) ? 50 : num) * 1024);
  }
  if (trimmed.endsWith('B')) {
    const num = parseFloat(trimmed.replace('B', '').trim());
    return Math.round(isNaN(num) ? 1024 : num);
  }
  const parsed = parseInt(trimmed, 10);
  return isNaN(parsed) ? 100 * 1024 : parsed;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// 1. WhatsApp-Style Manage Storage: Get breakdown, chats usage & file list
router.get('/storage/manage', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const myId = decoded.userId;

    // Find all groups user belongs to
    const memberships = await prisma.groupMember.findMany({
      where: { userId: myId },
      select: { groupId: true }
    });
    const myGroupIds = memberships.map((m: any) => m.groupId);

    // Fetch all active messages with attachments relevant to this user
    const messages = await (prisma as any).message.findMany({
      where: {
        OR: [
          { senderId: myId, fileUrl: { not: null } },
          { receiverId: myId, fileUrl: { not: null } },
          { groupId: { in: myGroupIds }, fileUrl: { not: null } }
        ],
        isDeleted: false
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, username: true, avatar: true } },
        receiver: { select: { id: true, username: true, avatar: true } },
        group: { select: { id: true, name: true, avatar: true } }
      }
    });

    let totalBytes = 0;
    const breakdown = {
      media: { bytes: 0, count: 0, label: 'Photos & Videos' },
      audio: { bytes: 0, count: 0, label: 'Voice & Audio' },
      docs: { bytes: 0, count: 0, label: 'Documents & Other' }
    };

    const chatMap = new Map<string, {
      chatId: string;
      chatName: string;
      chatAvatar: string;
      isGroup: boolean;
      bytes: number;
      count: number;
    }>();

    const files: any[] = [];

    messages.forEach((msg: any) => {
      const approxBytes = parseSizeToBytes(msg.fileSize);
      totalBytes += approxBytes;

      const isMine = msg.senderId === myId;
      let chatKey = '';
      let chatName = 'Unknown Chat';
      let chatAvatar = '';
      let isGroup = false;

      if (msg.groupId && msg.group) {
        chatKey = `group_${msg.groupId}`;
        chatName = msg.group.name;
        chatAvatar = msg.group.avatar || '';
        isGroup = true;
      } else if (msg.senderId === myId && msg.receiver) {
        chatKey = `user_${msg.receiver.id}`;
        chatName = msg.receiver.username;
        chatAvatar = msg.receiver.avatar || '';
      } else if (msg.sender) {
        chatKey = `user_${msg.sender.id}`;
        chatName = msg.sender.username;
        chatAvatar = msg.sender.avatar || '';
      }

      // Update Breakdown
      if (msg.type === 'image' || msg.type === 'video') {
        breakdown.media.bytes += approxBytes;
        breakdown.media.count += 1;
      } else if (msg.type === 'audio') {
        breakdown.audio.bytes += approxBytes;
        breakdown.audio.count += 1;
      } else {
        breakdown.docs.bytes += approxBytes;
        breakdown.docs.count += 1;
      }

      // Update Chat Map
      if (chatKey) {
        const existing = chatMap.get(chatKey) || {
          chatId: msg.groupId || (msg.senderId === myId ? msg.receiverId : msg.senderId),
          chatName,
          chatAvatar,
          isGroup,
          bytes: 0,
          count: 0
        };
        existing.bytes += approxBytes;
        existing.count += 1;
        chatMap.set(chatKey, existing);
      }

      files.push({
        id: msg.id,
        messageId: msg.id,
        fileName: msg.fileName || `${msg.type}_${msg.id.slice(0, 6)}`,
        fileSize: msg.fileSize || formatBytes(approxBytes),
        bytes: approxBytes,
        mimeType: msg.mimeType,
        type: msg.type,
        fileUrl: msg.fileUrl,
        createdAt: msg.createdAt,
        chatName,
        chatId: msg.groupId || (msg.senderId === myId ? msg.receiverId : msg.senderId),
        isGroup,
        isMine
      });
    });

    const chats = Array.from(chatMap.values())
      .sort((a, b) => b.bytes - a.bytes)
      .map(c => ({
        ...c,
        formattedSize: formatBytes(c.bytes)
      }));

    res.json({
      totalBytes,
      formattedTotal: formatBytes(totalBytes),
      breakdown: {
        media: { ...breakdown.media, formatted: formatBytes(breakdown.media.bytes) },
        audio: { ...breakdown.audio, formatted: formatBytes(breakdown.audio.bytes) },
        docs: { ...breakdown.docs, formatted: formatBytes(breakdown.docs.bytes) }
      },
      chats,
      files
    });
  } catch (err) {
    console.error('Failed to get storage breakdown:', err);
    res.status(500).json({ error: 'Failed to retrieve storage details' });
  }
});

// 2. Permanently Delete Files from Server & Database for that User
router.post('/storage/delete', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const myId = decoded.userId;
    const { messageIds, deleteAll } = req.body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      if (!deleteAll) {
        return res.status(400).json({ error: 'No messages selected for deletion' });
      }
    }

    let targetMessages: any[] = [];
    if (deleteAll) {
      targetMessages = await (prisma as any).message.findMany({
        where: {
          OR: [
            { senderId: myId },
            { receiverId: myId }
          ],
          fileUrl: { not: null }
        }
      });
    } else {
      targetMessages = await (prisma as any).message.findMany({
        where: {
          id: { in: messageIds },
          OR: [
            { senderId: myId },
            { receiverId: myId }
          ]
        }
      });
    }

    let deletedCount = 0;
    let freedBytes = 0;

    for (const msg of targetMessages) {
      const bytes = parseSizeToBytes(msg.fileSize);
      freedBytes += bytes;

      // 1. Delete from binary Media table if hosted at /api/upload/:id
      if (msg.fileUrl && msg.fileUrl.includes('/api/upload/')) {
        const mediaId = msg.fileUrl.split('/api/upload/')[1]?.split('?')[0]?.split(':')[0];
        if (mediaId) {
          try {
            await (prisma as any).media.delete({ where: { id: mediaId } });
          } catch (e) {}
        }
      }

      // 2. Delete from server disk if stored in uploads/
      if (msg.fileUrl && msg.fileUrl.includes('/uploads/')) {
        try {
          const fileName = msg.fileUrl.split('/uploads/')[1]?.split('?')[0];
          if (fileName) {
            const filePath = path.join(UPLOAD_DIR, fileName);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        } catch (e) {}
      }

      // 3. Mark message attachment as permanently deleted
      await (prisma as any).message.update({
        where: { id: msg.id },
        data: {
          fileUrl: null,
          fileName: '[Media permanently removed]',
          fileSize: '0 B'
        }
      });

      deletedCount++;
    }

    res.json({
      success: true,
      deletedCount,
      freedBytes,
      formattedFreed: formatBytes(freedBytes),
      message: `Permanently deleted ${deletedCount} file(s) from server disk and database.`
    });
  } catch (err) {
    console.error('Failed to permanently delete storage:', err);
    res.status(500).json({ error: 'Failed to delete files' });
  }
});

// 3. Clear All Media from a specific chat
router.post('/storage/clear-chat', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const myId = decoded.userId;
    const { chatId } = req.body;

    if (!chatId) return res.status(400).json({ error: 'Chat ID is required' });

    const messages = await (prisma as any).message.findMany({
      where: {
        OR: [
          { groupId: chatId },
          { senderId: myId, receiverId: chatId },
          { senderId: chatId, receiverId: myId }
        ],
        fileUrl: { not: null }
      }
    });

    for (const msg of messages) {
      if (msg.fileUrl && msg.fileUrl.includes('/api/upload/')) {
        const mediaId = msg.fileUrl.split('/api/upload/')[1]?.split('?')[0]?.split(':')[0];
        if (mediaId) {
          try {
            await (prisma as any).media.delete({ where: { id: mediaId } });
          } catch (e) {}
        }
      }
      await (prisma as any).message.update({
        where: { id: msg.id },
        data: {
          fileUrl: null,
          fileName: '[Media permanently removed]',
          fileSize: '0 B'
        }
      });
    }

    res.json({ success: true, count: messages.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear chat media' });
  }
});

// 4. Get Shared Media, Docs, Voice Notes & Links for a chat gallery
router.get('/gallery/:targetId', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const myId = decoded.userId;
    const { targetId } = req.params;

    const messages = await (prisma as any).message.findMany({
      where: {
        OR: [
          { groupId: targetId },
          { senderId: myId, receiverId: targetId },
          { senderId: targetId, receiverId: myId }
        ],
        isDeleted: false
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        text: true,
        type: true,
        fileUrl: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        duration: true,
        isStarred: true,
        createdAt: true,
        sender: { select: { id: true, username: true, avatar: true } }
      }
    });

    const media = messages.filter((m: any) => m.type === 'image' || m.type === 'video');
    const docs = messages.filter((m: any) => m.type === 'file');
    const audio = messages.filter((m: any) => m.type === 'audio');
    const links = messages.filter((m: any) => m.text && (m.text.includes('http://') || m.text.includes('https://')));
    const starred = messages.filter((m: any) => m.isStarred);

    res.json({ media, docs, audio, links, starred, totalCount: messages.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch media gallery' });
  }
});

// 5. Export Chat History as text file
router.get('/export/:targetId', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const myId = decoded.userId;
    const { targetId } = req.params;

    const messages = await (prisma as any).message.findMany({
      where: {
        OR: [
          { groupId: targetId },
          { senderId: myId, receiverId: targetId },
          { senderId: targetId, receiverId: myId }
        ]
      },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { username: true } } }
    });

    let transcript = `========================================\n`;
    transcript += `🌸 LIQUID CHAT TRANSCRIPT EXPORT\n`;
    transcript += `Generated on: ${new Date().toLocaleString()}\n`;
    transcript += `Total Messages: ${messages.length}\n`;
    transcript += `========================================\n\n`;

    messages.forEach((msg: any) => {
      const time = new Date(msg.createdAt).toLocaleString();
      const sender = msg.sender?.username || 'User';
      const content = msg.isDeleted ? '[Message was deleted]' : msg.text || `[Attachment: ${msg.fileName || msg.type}]`;
      transcript += `[${time}] ${sender}: ${content}\n`;
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="chat-export-${targetId}.txt"`);
    res.send(transcript);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export chat transcript' });
  }
});

export default router;

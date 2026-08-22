import { Router } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'liquid_super_secret';

// Get Shared Media, Docs, Voice Notes & Links for a chat
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

// Export Chat History as text file
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
    transcript += `🌊 LIQUID CHAT TRANSCRIPT EXPORT\n`;
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


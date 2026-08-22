import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import authRoutes from './routes/auth';
import messageRoutes from './routes/messages';
import uploadRoutes from './routes/upload';
import storyRoutes from './routes/stories';
import callRoutes from './routes/calls';
import groupRoutes from './routes/groups';
import userRoutes from './routes/users';
import aiRoutes from './routes/ai';
import mediaRoutes from './routes/media';
import stickerRoutes from './routes/stickers';
import prisma from './prisma';
import path from 'path';
import fs from 'fs';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Standard Uploads Static Directory with streaming header support
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(UPLOAD_DIR));

// Express JSON parser for API routes
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/stickers', stickerRoutes);

// Proxy all frontend/SSR routes to Next.js dev server on port 3000
app.use('/', createProxyMiddleware({
  target: 'http://127.0.0.1:3000',
  changeOrigin: true,
  ws: false, // Socket.io is handled natively below
  logger: console
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Map of userId -> socketId
const connectedUsers = new Map<string, string>();
// Map of socketId -> userId
const socketToUser = new Map<string, string>();

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId as string;
  if (userId) {
    connectedUsers.set(userId, socket.id);
    socketToUser.set(socket.id, userId);
    io.emit('online_users', Array.from(connectedUsers.keys()));
  }

  // --- Join Group Socket Rooms ---
  socket.on('join_group', (groupId: string) => {
    socket.join(`group_${groupId}`);
  });

  socket.on('leave_group', (groupId: string) => {
    socket.leave(`group_${groupId}`);
  });

  // --- Real-Time Messaging (Direct & Group) ---
  socket.on('send_message', async (data) => {
    try {
      const isGroup = !!data.groupId;

      // If direct chat, verify sender isn't blocked by receiver
      if (!isGroup && data.receiverId) {
        const isBlocked = await prisma.blockList.findUnique({
          where: { blockerId_blockedId: { blockerId: data.receiverId, blockedId: data.senderId } }
        });
        if (isBlocked) {
          socket.emit('message_error', { error: 'You cannot message this contact' });
          return;
        }
      }

      const msg = await prisma.message.create({
        data: {
          text: data.text || '',
          senderId: data.senderId,
          receiverId: isGroup ? null : data.receiverId,
          groupId: isGroup ? data.groupId : null,
          type: data.type || 'text',
          fileUrl: data.fileUrl || null,
          fileName: data.fileName || null,
          fileSize: data.fileSize || null,
          mimeType: data.mimeType || null,
          duration: data.duration || null,
          forwardedFrom: data.forwardedFrom || null,
          pollData: data.pollData ? JSON.stringify(data.pollData) : null,
          replyToId: data.replyToId || null,
          replyToText: data.replyToText || null,
          isSeen: false
        },
        include: {
          sender: { select: { id: true, username: true, avatar: true } }
        }
      });

      if (isGroup) {
        // Broadcast to group room (including sender)
        io.to(`group_${data.groupId}`).emit('receive_group_message', msg);
      } else {
        const receiverSocket = connectedUsers.get(data.receiverId);
        if (receiverSocket) {
          io.to(receiverSocket).emit('receive_message', msg);
        }
        socket.emit('message_sent', msg);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  });

  // --- Message Edit Event ---
  socket.on('edit_message', async ({ messageId, text, receiverId, groupId }) => {
    try {
      const updated = await prisma.message.update({
        where: { id: messageId },
        data: { text: text.trim(), isEdited: true, updatedAt: new Date() },
        include: { sender: { select: { id: true, username: true, avatar: true } } }
      });

      if (groupId) {
        io.to(`group_${groupId}`).emit('message_edited', updated);
      } else if (receiverId) {
        const receiverSocket = connectedUsers.get(receiverId);
        if (receiverSocket) {
          io.to(receiverSocket).emit('message_edited', updated);
        }
        socket.emit('message_edited', updated);
      }
    } catch (e) {}
  });

  // --- WhatsApp Poll Vote Syncing ---
  socket.on('vote_poll', async ({ messageId, optionId, voterId, receiverId, groupId }) => {
    try {
      const msg = await prisma.message.findUnique({ where: { id: messageId } });
      if (!msg || !msg.pollData) return;

      const poll = JSON.parse(msg.pollData);
      poll.options.forEach((opt: any) => {
        if (!opt.voters) opt.voters = [];
        if (opt.id === optionId) {
          if (!opt.voters.includes(voterId)) {
            opt.voters.push(voterId);
          } else {
            opt.voters = opt.voters.filter((id: string) => id !== voterId);
          }
        }
      });

      const updated = await prisma.message.update({
        where: { id: messageId },
        data: { pollData: JSON.stringify(poll) },
        include: { sender: { select: { id: true, username: true, avatar: true } } }
      });

      if (groupId) {
        io.to(`group_${groupId}`).emit('poll_updated', updated);
      } else {
        const receiverSocket = connectedUsers.get(receiverId);
        if (receiverSocket) {
          io.to(receiverSocket).emit('poll_updated', updated);
        }
        socket.emit('poll_updated', updated);
      }
    } catch (e) {
      console.error('Poll vote error:', e);
    }
  });

  // --- Typing Indicators (Direct & Group) ---
  socket.on('typing_start', ({ senderId, receiverId, groupId, senderName }) => {
    if (groupId) {
      socket.to(`group_${groupId}`).emit('group_user_typing', { groupId, senderId, senderName });
    } else if (receiverId) {
      const receiverSocket = connectedUsers.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit('user_typing', { senderId });
      }
    }
  });

  socket.on('typing_stop', ({ senderId, receiverId, groupId }) => {
    if (groupId) {
      socket.to(`group_${groupId}`).emit('group_user_stop_typing', { groupId, senderId });
    } else if (receiverId) {
      const receiverSocket = connectedUsers.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit('user_stop_typing', { senderId });
      }
    }
  });

  // --- Read Receipts ---
  socket.on('mark_seen', async ({ senderId, receiverId }) => {
    try {
      await prisma.message.updateMany({
        where: {
          senderId: senderId,
          receiverId: receiverId,
          isSeen: false
        },
        data: { isSeen: true }
      });

      const senderSocket = connectedUsers.get(senderId);
      if (senderSocket) {
        io.to(senderSocket).emit('messages_marked_seen', { seenBy: receiverId });
      }
    } catch (err) {
      console.error('Error marking seen:', err);
    }
  });

  // --- Message Reactions ---
  socket.on('message_reaction', ({ messageId, receiverId, groupId, reactions }) => {
    if (groupId) {
      io.to(`group_${groupId}`).emit('reaction_updated', { messageId, reactions });
    } else if (receiverId) {
      const receiverSocket = connectedUsers.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit('reaction_updated', { messageId, reactions });
      }
    }
  });

  // --- Message Deletion ---
  socket.on('message_deleted', ({ messageId, receiverId, groupId, isForEveryone }) => {
    if (groupId) {
      io.to(`group_${groupId}`).emit('message_deleted', { messageId, isForEveryone });
    } else if (receiverId) {
      const receiverSocket = connectedUsers.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket).emit('message_deleted', { messageId, isForEveryone });
      }
    }
  });

  // --- Profile Updated Broadcast ---
  socket.on('profile_updated', (updatedUser) => {
    io.emit('user_profile_updated', updatedUser);
  });

  // --- Status Stories ---
  socket.on('publish_story', (story) => {
    io.emit('new_story_published', story);
  });

  // --- WebRTC Calling Signaling ---
  socket.on('call_offer', ({ to, offer, fromUser, isVideo }) => {
    const receiverSocket = connectedUsers.get(to);
    if (receiverSocket) {
      io.to(receiverSocket).emit('incoming_call', {
        from: fromUser,
        offer,
        isVideo
      });
    }
  });

  socket.on('call_answer', ({ to, answer }) => {
    const callerSocket = connectedUsers.get(to);
    if (callerSocket) {
      io.to(callerSocket).emit('call_answered', { answer });
    }
  });

  socket.on('ice_candidate', ({ to, candidate }) => {
    const targetSocket = connectedUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit('ice_candidate', { candidate });
    }
  });

  socket.on('call_rejected', ({ to }) => {
    const callerSocket = connectedUsers.get(to);
    if (callerSocket) {
      io.to(callerSocket).emit('call_rejected');
    }
  });

  socket.on('end_call', ({ to }) => {
    const targetSocket = connectedUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit('call_ended');
    }
  });

  // --- Disconnection ---
  socket.on('disconnect', async () => {
    const disconnectedUserId = socketToUser.get(socket.id);
    if (disconnectedUserId) {
      connectedUsers.delete(disconnectedUserId);
      socketToUser.delete(socket.id);

      try {
        await prisma.user.update({
          where: { id: disconnectedUserId },
          data: { lastSeen: new Date() }
        });
      } catch (e) {}

      io.emit('online_users', Array.from(connectedUsers.keys()));
      io.emit('user_status_changed', { userId: disconnectedUserId, isOnline: false, lastSeen: new Date() });
    }
  });
});

const PORT = Number(process.env.PORT) || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌊 Liquid WhatsApp Server listening on port ${PORT}`);
});

import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import webpush from 'web-push';
import * as admin from 'firebase-admin';
import path from 'path';

try {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    serviceAccount = require(path.join(__dirname, '../../firebase-adminsdk.json'));
  }
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialized');
} catch (err) {
  console.warn('Firebase Admin init failed. Please set FIREBASE_SERVICE_ACCOUNT environment variable in Railway with the contents of the JSON file.', err);
}

const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuB3IQWwegwE3yB-kLNlU_ZPUY';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'QvT_0R6KozjHlHh_6gD_U28XkK3E5ZzK-U2NnF8pE10';
webpush.setVapidDetails('mailto:support@liquidchat.com', publicVapidKey, privateVapidKey);

import authRoutes from './routes/auth';
import messageRoutes from './routes/messages';
import uploadRoutes from './routes/upload';
import storyRoutes from './routes/stories';
import callRoutes from './routes/calls';
import adminRoutes from './routes/admin';
import groupRoutes from './routes/groups';
import userRoutes from './routes/users';
import aiRoutes from './routes/ai';
import mediaRoutes from './routes/media';
import stickerRoutes from './routes/stickers';
import pushRoutes from './routes/push';
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

// Express JSON parser for API routes (Increased limit for Base64 image handling)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/stickers', stickerRoutes);
app.use('/api/push', pushRoutes);

// Simple healthcheck route for Railway
app.get('/', (req, res) => {
  res.status(200).send('Liquid Chat Backend is running successfully.');
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  },
  pingTimeout: 60000,
  pingInterval: 10000,
  transports: ['polling', 'websocket'],
  allowUpgrades: true
});

const sendPushNotification = async (userId: string, title: string, body: string, url: string = '/') => {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
    const payload = JSON.stringify({ title, body, url });
    const isConnected = !!connectedUsers.get(userId);
    
    for (const sub of subscriptions) {
      if (sub.endpoint.startsWith('fcm://')) {
        const fcmToken = sub.endpoint.replace('fcm://', '');
        try {
          await admin.messaging().send({
            token: fcmToken,
            data: { title, body, url },
            notification: { title, body }
          });
        } catch (err: any) {
          if (err.code === 'messaging/registration-token-not-registered' || err.code === 'messaging/invalid-argument') {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
          console.error('FCM Push Error:', err);
        }
      } else {
        if (isConnected) continue; // Skip web push if user is connected via websocket
        const pushSub = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        };
        try {
          await webpush.sendNotification(pushSub, payload);
        } catch (err: any) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
        }
      }
    }
  } catch (e) {
    console.error('Push error:', e);
  }
};

// Map of userId -> socketId
const connectedUsers = new Map<string, string>();
// Map of socketId -> userId
const socketToUser = new Map<string, string>();

io.on('connection', (socket) => {
  const registerUser = async (uid: string) => {
    if (!uid) return;
    connectedUsers.set(uid, socket.id);
    socketToUser.set(socket.id, uid);
    socket.join(`user_${uid}`);
    io.emit('online_users', Array.from(connectedUsers.keys()));
    io.emit('user_status_changed', { userId: uid, isOnline: true });

    // Automatically join all group rooms the user is a member of (crucial for reconnections)
    try {
      const userGroups = await prisma.groupMember.findMany({
        where: { userId: uid },
        select: { groupId: true }
      });
      userGroups.forEach((g: any) => socket.join(`group_${g.groupId}`));
    } catch (err) {
      console.error('Failed to auto-join groups:', err);
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: uid },
        select: { id: true, username: true, avatar: true, about: true, lastSeen: true, stories: true }
      });
      if (user) {
        io.emit('user_joined', user);
      } else {
        // If user is missing from DB (e.g. SQLite ephemeral wipe on server restart), force client to logout
        socket.emit('force_logout');
      }
    } catch (e) {
      console.error('Error fetching user during registration:', e);
    }
  };

  const initialUserId = socket.handshake.query.userId as string;
  if (initialUserId) {
    registerUser(initialUserId);
  }

  socket.on('user_connected', (uid: string) => {
    registerUser(uid);
  });

  // --- Join Group Socket Rooms ---
  socket.on('join_group', (groupId: string) => {
    socket.join(`group_${groupId}`);
  });

  socket.on('leave_group', (groupId: string) => {
    socket.leave(`group_${groupId}`);
  });

  // --- Clear Chat History ---
  socket.on('clear_chat', async (data) => {
    try {
      const { targetId } = data;
      const userId = socket.handshake.query.userId as string;
      
      await prisma.message.deleteMany({
        where: {
          OR: [
            { senderId: userId, receiverId: targetId },
            { senderId: targetId, receiverId: userId }
          ]
        }
      });
      
      io.to(userId).emit('chat_cleared', { targetId });
      io.to(targetId).emit('chat_cleared', { targetId: userId });
    } catch (e) {
      console.error(e);
    }
  });

  // --- Real-Time Messaging (Direct & Group) ---
  socket.on('send_message', async (data) => {
    console.log('RECEIVED send_message:', data);
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
          
          const members = await prisma.groupMember.findMany({ where: { groupId: data.groupId } });
          members.forEach((member: any) => {
            if (member.userId !== data.senderId) {
              sendPushNotification(member.userId, `New message in group`, `${msg.sender?.username}: ${msg.text || msg.type}`);
            }
          });
        } else {
          // Always try sending push (sendPushNotification handles FCM vs WebPush logic internally)
          sendPushNotification(data.receiverId, `Message from ${msg.sender?.username}`, msg.text || msg.type);
          
          const receiverSocket = connectedUsers.get(data.receiverId);
          if (receiverSocket) {
            io.to(`user_${data.receiverId}`).emit('receive_message', msg);
          }
          io.to(`user_${data.senderId}`).emit('message_sent', msg);
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
        io.to(`user_${receiverId}`).emit('message_edited', updated);
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
        if (receiverId) io.to(`user_${receiverId}`).emit('poll_updated', updated);
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
      io.to(`user_${receiverId}`).emit('user_typing', { senderId });
    }
  });

  socket.on('typing_stop', ({ senderId, receiverId, groupId }) => {
    if (groupId) {
      socket.to(`group_${groupId}`).emit('group_user_stop_typing', { groupId, senderId });
    } else if (receiverId) {
      io.to(`user_${receiverId}`).emit('user_stop_typing', { senderId });
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

      io.to(`user_${senderId}`).emit('messages_marked_seen', { seenBy: receiverId });
    } catch (err) {
      console.error('Error marking seen:', err);
    }
  });

  // --- Message Reactions ---
  socket.on('message_reaction', ({ messageId, receiverId, groupId, reactions }) => {
    if (groupId) {
      io.to(`group_${groupId}`).emit('reaction_updated', { messageId, reactions });
    } else if (receiverId) {
      io.to(`user_${receiverId}`).emit('reaction_updated', { messageId, reactions });
    }
  });

  // --- Message Deletion ---
  socket.on('message_deleted', ({ messageId, receiverId, groupId, isForEveryone }) => {
    if (groupId) {
      io.to(`group_${groupId}`).emit('message_deleted', { messageId, isForEveryone });
    } else if (receiverId) {
      io.to(`user_${receiverId}`).emit('message_deleted', { messageId, isForEveryone });
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
    io.to(`user_${to}`).emit('incoming_call', {
      from: fromUser,
      offer,
      isVideo
    });
    
    // Trigger push notification for incoming call
    sendPushNotification(to, `Incoming ${isVideo ? 'Video' : 'Voice'} Call`, `Incoming call from ${fromUser?.username || 'someone'}`);
  });

  socket.on('call_answer', ({ to, answer }) => {
    io.to(`user_${to}`).emit('call_answered', { answer });
  });

  socket.on('ice_candidate', ({ to, candidate }) => {
    io.to(`user_${to}`).emit('ice_candidate', { candidate });
  });

  socket.on('call_rejected', ({ to }) => {
    io.to(`user_${to}`).emit('call_rejected');
  });

  socket.on('end_call', ({ to }) => {
    io.to(`user_${to}`).emit('call_ended');
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

prisma.user.updateMany({
  where: { username: { contains: 'Deependra', mode: 'insensitive' } },
  data: { isAdmin: true }
}).catch(() => {});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌊 Liquid WhatsApp Server listening on port ${PORT}`);
});

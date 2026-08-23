import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'liquid_super_secret';

import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client('543385888390-9gjodv3m7ah41mbtb37p0v7nnbs4iiin.apps.googleusercontent.com');

router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Missing credential' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: '543385888390-9gjodv3m7ah41mbtb37p0v7nnbs4iiin.apps.googleusercontent.com'
    });
    
    const payload = ticket.getPayload();
    if (!payload) return res.status(400).json({ error: 'Invalid Google token' });

    const { sub, email, name, picture } = payload;
    
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: sub },
          { email: email }
        ]
      }
    });

    if (!user) {
      let baseUsername = (name || email?.split('@')[0] || 'user').replace(/[^a-zA-Z0-9]/g, '');
      let uniqueUsername = baseUsername;
      let counter = 1;
      
      while (await prisma.user.findUnique({ where: { username: uniqueUsername } })) {
        uniqueUsername = baseUsername + counter;
        counter++;
      }

      user = await prisma.user.create({
        data: {
          username: uniqueUsername,
          email: email,
          googleId: sub,
          avatar: picture
        }
      });
    } else {
      if (!user.googleId || (picture && !user.avatar)) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: sub,
            ...(picture && !user.avatar && { avatar: picture })
          }
        });
      }
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        about: user.about
      }
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
});

router.post('/google-redirect', async (req, res) => {
  const credential = req.body.credential;
  if (!credential) {
    return res.redirect('https://apk-flame.vercel.app/auth?error=MissingCredential');
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: '543385888390-9gjodv3m7ah41mbtb37p0v7nnbs4iiin.apps.googleusercontent.com'
    });
    
    const payload = ticket.getPayload();
    if (!payload) return res.redirect('https://apk-flame.vercel.app/auth?error=InvalidToken');

    const { sub, email, name, picture } = payload;
    
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: sub },
          { email: email }
        ]
      }
    });

    if (!user) {
      let baseUsername = (name || email?.split('@')[0] || 'user').replace(/[^a-zA-Z0-9]/g, '');
      let uniqueUsername = baseUsername;
      let counter = 1;
      
      while (await prisma.user.findUnique({ where: { username: uniqueUsername } })) {
        uniqueUsername = baseUsername + counter;
        counter++;
      }

      user = await prisma.user.create({
        data: {
          username: uniqueUsername,
          email: email,
          googleId: sub,
          avatar: picture
        }
      });
    } else {
      if (!user.googleId || (picture && !user.avatar)) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: sub,
            ...(picture && !user.avatar && { avatar: picture })
          }
        });
      }
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    const userStr = encodeURIComponent(JSON.stringify({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      about: user.about
    }));
    
    return res.redirect(`https://apk-flame.vercel.app/auth/callback?token=${token}&user=${userStr}`);

  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.redirect('https://apk-flame.vercel.app/auth?error=AuthFailed');
  }
});

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) return res.status(400).json({ error: 'Username already taken' });

    const passwordHash = await bcrypt.hash(password, 10);
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

    const user = await prisma.user.create({
      data: { 
        username, 
        passwordHash, 
        avatar,
        about: "Hey there! I am using Liquid Chat 🌊"
      }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar, about: user.about, lastSeen: user.lastSeen } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date() }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar, about: user.about, lastSeen: user.lastSeen } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({ user: { id: user.id, username: user.username, avatar: user.avatar, about: user.about, lastSeen: user.lastSeen } });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.put('/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const { username, avatar, about } = req.body;

    // If username is being changed, verify uniqueness
    if (username && username.trim()) {
      const trimmedUsername = username.trim();
      const existing = await prisma.user.findUnique({ where: { username: trimmedUsername } });
      if (existing && existing.id !== decoded.userId) {
        return res.status(400).json({ error: 'Username already taken by another user' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        ...(username && username.trim() && { username: username.trim() }),
        ...(avatar && { avatar }),
        ...(about !== undefined && { about: about.trim() })
      }
    });

    res.json({ 
      user: { 
        id: updatedUser.id, 
        username: updatedUser.username, 
        avatar: updatedUser.avatar, 
        about: updatedUser.about, 
        lastSeen: updatedUser.lastSeen 
      } 
    });
  } catch (err) {
    console.error('Failed to update profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Permanent Account Deletion
router.delete('/account', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    // Delete user's messages, stories, and call logs first
    await prisma.message.deleteMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] }
    });
    await prisma.story.deleteMany({
      where: { userId }
    });
    await prisma.callLog.deleteMany({
      where: { OR: [{ callerId: userId }, { receiverId: userId }] }
    });

    // Delete user record
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ success: true, message: 'Account permanently deleted' });
  } catch (err) {
    console.error('Account deletion error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        username: true, 
        avatar: true, 
        about: true, 
        lastSeen: true,
        stories: {
          where: { expiresAt: { gt: new Date() } }
        }
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;

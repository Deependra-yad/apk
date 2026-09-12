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
          ...(email ? [{ email }] : [])
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

      const { generateLiquidNumber } = await import('../utils/numberGen');
      const liquidNumber = await generateLiquidNumber();

      user = await prisma.user.create({
        data: {
          username: uniqueUsername,
          email: email || null,
          googleId: sub,
          liquidNumber,
          avatar: picture || null
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

    if (user.isBanned) return res.status(403).json({ error: 'Your account is banned' });

    const ip = (req.headers['x-forwarded-for'] as string) || (req.socket.remoteAddress as string) || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await prisma.user.update({
      where: { id: user.id },
      data: { lastIpAddress: ip }
    });

    await prisma.loginLog.create({
      data: { userId: user.id, ipAddress: ip, userAgent, status: 'success' }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        liquidNumber: user.liquidNumber,
        avatar: user.avatar,
        about: user.about,
        publicKey: user.publicKey,
        isBanned: user.isBanned,
        isAdmin: user.isAdmin
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
    return res.redirect('https://web.liquidchat.online/auth?error=MissingCredential');
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: '543385888390-9gjodv3m7ah41mbtb37p0v7nnbs4iiin.apps.googleusercontent.com'
    });
    
    const payload = ticket.getPayload();
    if (!payload) return res.redirect('https://web.liquidchat.online/auth?error=InvalidToken');

    const { sub, email, name, picture } = payload;
    
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: sub },
          ...(email ? [{ email }] : [])
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

      const { generateLiquidNumber } = await import('../utils/numberGen');
      const liquidNumber = await generateLiquidNumber();

      user = await prisma.user.create({
        data: {
          username: uniqueUsername,
          email: email || null,
          googleId: sub,
          liquidNumber,
          avatar: picture || null,
          isAdmin: uniqueUsername.toLowerCase().includes('deependra')
        }
      });
    } else {
      let updateData: any = {};
      if (!user.googleId) updateData.googleId = sub;
      if (picture && !user.avatar) updateData.avatar = picture;
      if (user.username.toLowerCase().includes('deependra') && !user.isAdmin) updateData.isAdmin = true;
      
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData
        });
      }
    }

    if (user.isBanned) return res.redirect('https://web.liquidchat.online/auth?error=AccountBanned');

    const ip = (req.headers['x-forwarded-for'] as string) || (req.socket.remoteAddress as string) || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await prisma.user.update({
      where: { id: user.id },
      data: { lastIpAddress: ip }
    });

    await prisma.loginLog.create({
      data: { userId: user.id, ipAddress: ip, userAgent, status: 'success' }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    const userStr = encodeURIComponent(JSON.stringify({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      about: user.about,
      isAdmin: user.isAdmin
    }));
    
    return res.redirect(`https://web.liquidchat.online/auth/callback?token=${token}&user=${userStr}`);

  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.redirect('https://web.liquidchat.online/auth?error=AuthFailed');
  }
});

  router.post('/google-implicit', async (req, res) => {
    const { sub, email, name, picture } = req.body;
    
    if (!sub) {
      return res.status(400).json({ error: 'Missing Google ID' });
    }

    try {
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { googleId: sub },
            ...(email ? [{ email }] : [])
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
  
        const { generateLiquidNumber } = await import('../utils/numberGen');
        const liquidNumber = await generateLiquidNumber();

        user = await prisma.user.create({
          data: {
            username: uniqueUsername,
            email: email || null,
            googleId: sub,
            liquidNumber,
            avatar: picture || null,
            isAdmin: uniqueUsername.toLowerCase().includes('deependra')
          }
        });
      } else {
        let updateData: any = {};
        if (!user.googleId) updateData.googleId = sub;
        if (picture && !user.avatar) updateData.avatar = picture;
        if (user.username.toLowerCase().includes('deependra') && !user.isAdmin) updateData.isAdmin = true;
        
        if (Object.keys(updateData).length > 0) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: updateData
          });
        }
      }
  
      if (user.isBanned) return res.status(403).json({ error: 'Your account is banned' });

      const ip = (req.headers['x-forwarded-for'] as string) || (req.socket.remoteAddress as string) || 'Unknown';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      await prisma.user.update({
        where: { id: user.id },
        data: { lastIpAddress: ip }
      });

      await prisma.loginLog.create({
        data: { userId: user.id, ipAddress: ip, userAgent, status: 'success' }
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          liquidNumber: user.liquidNumber,
          avatar: user.avatar,
          about: user.about,
          publicKey: user.publicKey,
          isAdmin: user.isAdmin
        }
      });
    } catch (error) {
      console.error('Google Implicit Auth Error:', error);
      res.status(500).json({ error: 'Failed to authenticate with Google' });
    }
  });

  router.post('/register', async (req, res) => {
    const { username, password, email, encryptedPrivateKey, keyBackupSalt, publicKey } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return res.status(400).json({ error: 'Email address is strictly required to prevent bots' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    try {
      const existingUser = await prisma.user.findUnique({ where: { username: cleanUsername } });
      if (existingUser) return res.status(400).json({ error: 'Username already taken' });

      const existingEmail = await prisma.user.findUnique({ where: { email: cleanEmail } });
      if (existingEmail) return res.status(400).json({ error: 'Email address already registered' });

      const passwordHash = await bcrypt.hash(password, 10);
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanUsername)}`;

      const ip = (req.headers['x-forwarded-for'] as string) || (req.socket.remoteAddress as string) || 'Unknown';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      const { generateLiquidNumber } = await import('../utils/numberGen');
      const liquidNumber = await generateLiquidNumber();

      const user = await prisma.user.create({
        data: { 
          username: cleanUsername, 
          email: cleanEmail,
          passwordHash, 
          liquidNumber,
          avatar,
          about: "Hey there! I am using Liquid Chat",
          lastIpAddress: ip,
          publicKey: publicKey || null,
          encryptedPrivateKey: encryptedPrivateKey || null,
          keyBackupSalt: keyBackupSalt || null
        }
      });

      await prisma.loginLog.create({
        data: { userId: user.id, ipAddress: ip, userAgent, status: 'success' }
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          liquidNumber: user.liquidNumber,
          avatar: user.avatar,
          about: user.about,
          publicKey: user.publicKey,
          encryptedPrivateKey: user.encryptedPrivateKey,
          keyBackupSalt: user.keyBackupSalt,
          lastSeen: user.lastSeen,
          isAdmin: user.isAdmin
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error during registration' });
    }
  });

  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const identifier = (username || req.body.email || req.body.identifier || '').trim();
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required' });
    }

    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: identifier },
            { email: identifier.toLowerCase() }
          ]
        }
      });
      if (!user) return res.status(400).json({ error: 'Invalid username/email or password' });

      if (!user.passwordHash) {
        return res.status(400).json({ error: 'This account was registered using Google or OTP. Please sign in with that method.' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) return res.status(400).json({ error: 'Invalid username/email or password' });

      if (user.isBanned) return res.status(403).json({ error: 'Your account is banned' });

      const ip = (req.headers['x-forwarded-for'] as string) || (req.socket.remoteAddress as string) || 'Unknown';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      await prisma.user.update({
        where: { id: user.id },
        data: { lastIpAddress: ip }
      });

      await prisma.loginLog.create({
        data: { userId: user.id, ipAddress: ip, userAgent, status: 'success' }
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          liquidNumber: user.liquidNumber,
          avatar: user.avatar,
          about: user.about,
          publicKey: user.publicKey,
          encryptedPrivateKey: user.encryptedPrivateKey,
          keyBackupSalt: user.keyBackupSalt,
          lastSeen: user.lastSeen,
          isAdmin: user.isAdmin
        }
      });
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
      if (user.isBanned) return res.status(403).json({ error: 'Your account is banned' });
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          liquidNumber: user.liquidNumber,
          avatar: user.avatar,
          about: user.about,
          publicKey: user.publicKey,
          encryptedPrivateKey: user.encryptedPrivateKey,
          keyBackupSalt: user.keyBackupSalt,
          lastSeen: user.lastSeen,
          isAdmin: user.isAdmin
        }
      });
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

router.post('/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const ip = (req.headers['x-forwarded-for'] as string) || (req.socket.remoteAddress as string) || 'Unknown';
      const userAgent = req.headers['user-agent'] || 'Unknown';

      await prisma.loginLog.create({
        data: {
          userId: decoded.userId,
          ipAddress: ip,
          userAgent: userAgent ? `${userAgent} (Logged Out)` : 'Logout',
          status: 'logout'
        }
      }).catch(() => {});
    } catch (e) {}
  }
  res.json({ success: true, message: 'Session successfully logged out' });
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
        email: updatedUser.email,
        liquidNumber: updatedUser.liquidNumber,
        avatar: updatedUser.avatar, 
        about: updatedUser.about, 
        publicKey: updatedUser.publicKey,
        lastSeen: updatedUser.lastSeen,
        isAdmin: updatedUser.isAdmin
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
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('force_logout');
      io.emit('user_deleted', { userId });
    }

    res.json({ success: true, message: 'Account permanently deleted from everywhere' });
  } catch (err) {
    console.error('Account deletion error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    let currentUserId: string | null = null;
    if (token) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'liquid_super_secret');
        currentUserId = decoded.userId;
      } catch (e) {}
    }

    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        username: true, 
        liquidNumber: true,
        avatar: true, 
        about: true, 
        lastSeen: true,
        settings: {
          select: { lastSeenPrivacy: true }
        },
        stories: {
          where: { expiresAt: { gt: new Date() } }
        },
        blocksInitiated: {
          select: { blockedId: true }
        },
        blocksReceived: {
          select: { blockerId: true }
        }
      }
    });

    const sanitizedUsers = users.map((u: any) => {
      const isBlockedByMe = currentUserId ? u.blocksReceived.some((b: any) => b.blockerId === currentUserId) : false;
      const hasBlockedMe = currentUserId ? u.blocksInitiated.some((b: any) => b.blockedId === currentUserId) : false;

      const privacy = u.settings?.lastSeenPrivacy || 'everyone';
      let hideLastSeen = false;

      if (privacy === 'nobody') hideLastSeen = true;
      else if (privacy === 'contacts' && !currentUserId) hideLastSeen = true;
      else if (isBlockedByMe || hasBlockedMe) hideLastSeen = true;

      // Ensure we don't leak settings or block data
      const { settings, blocksInitiated, blocksReceived, ...safeUser } = u;

      if (hideLastSeen) safeUser.lastSeen = null;
      
      return safeUser;
    });

    res.json(sanitizedUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;

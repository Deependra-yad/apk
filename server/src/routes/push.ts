import { Router } from 'express';
import webpush from 'web-push';
import prisma from '../prisma';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'liquid_super_secret';

// Use environment variables for VAPID keys, or generate fallback keys for dev
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuB3IQWwegwE3yB-kLNlU_ZPUY';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'QvT_0R6KozjHlHh_6gD_U28XkK3E5ZzK-U2NnF8pE10';

webpush.setVapidDetails(
  'mailto:support@liquidchat.com',
  publicVapidKey,
  privateVapidKey
);

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

router.get('/vapidPublicKey', (req, res) => {
  res.json({ publicKey: publicVapidKey });
});

router.post('/subscribe', authenticate, async (req: any, res) => {
  const subscription = req.body;
  const userId = req.userId;

  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      }
    });
    res.status(201).json({});
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

router.post('/fcm-subscribe', authenticate, async (req: any, res) => {
  const { token } = req.body;
  const userId = req.userId;
  if (!token) return res.status(400).json({ error: 'No token' });

  const fakeEndpoint = `fcm://${token}`;
  
  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint: fakeEndpoint },
      update: { userId, p256dh: 'fcm', auth: 'fcm' },
      create: {
        userId,
        endpoint: fakeEndpoint,
        p256dh: 'fcm',
        auth: 'fcm',
      }
    });
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save FCM token' });
  }
});

export default router;


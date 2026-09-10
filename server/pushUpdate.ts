import { PrismaClient } from '@prisma/client';
import { getMessaging } from 'firebase-admin/messaging';
import webpush from 'web-push';
import * as admin from 'firebase-admin';

const prisma = new PrismaClient();

const serviceAccount = require('./firebase-service-account.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

webpush.setVapidDetails(
  'mailto:yaddeep2@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BHGjZlC6P3v5bWzI-XJ_k9p5G82F_H9D1p5G82F_H9D1p5G82F_H9D1p5G82F_H9D',
  process.env.VAPID_PRIVATE_KEY || 'H9D1p5G82F_H9D1p5G82F'
);

async function notifyAll() {
  const subscriptions = await prisma.pushSubscription.findMany();
  let count = 0;
  
  for (const sub of subscriptions) {
    if (sub.endpoint.startsWith('fcm://')) {
      try {
        await getMessaging().send({
          token: sub.endpoint.replace('fcm://', ''),
          notification: { title: "🚀 Update Available", body: "Native file downloads are now supported. Open app to update!" }
        });
        count++;
      } catch (e) {}
    } else {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        }, JSON.stringify({ title: "🚀 Update Available", body: "Native file downloads are now supported. Open app to update!", url: "/" }));
        count++;
      } catch (e) {}
    }
  }
  console.log(`Sent ${count} notifications`);
}

notifyAll().then(() => process.exit(0));


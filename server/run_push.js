require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const webpush = require('web-push');

const prisma = new PrismaClient();

const publicVapidKey = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuB3IQWwegwE3yB-kLNlU_ZPUY';
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || 'QvT_0R6KozjHlHh_6gD_U28XkK3E5ZzK-U2NnF8pE10';
webpush.setVapidDetails('mailto:support@liquidchat.com', publicVapidKey, privateVapidKey);

async function notifyAll() {
  const subscriptions = await prisma.pushSubscription.findMany();
  let count = 0;
  
  for (const sub of subscriptions) {
    if (!sub.endpoint.startsWith('fcm://')) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        }, JSON.stringify({ title: "🚀 Update Available", body: "Native file downloads are now supported. Open app to update!", url: "/" }));
        count++;
      } catch (e) {}
    }
  }
  console.log(`Sent ${count} web push notifications`);
}

notifyAll().then(() => process.exit(0));

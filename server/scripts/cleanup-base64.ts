import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Starting Base64 Cleanup...');

  // 1. Cleanup Users with base64 avatars
  const users = await prisma.user.findMany();
  for (const user of users) {
    if (user.avatar && user.avatar.startsWith('data:image')) {
      const mime = user.avatar.split(';')[0].split(':')[1];
      const b64 = user.avatar.split(',')[1];
      const buffer = Buffer.from(b64, 'base64');

      const media = await prisma.media.create({
        data: { data: buffer, mimeType: mime, fileName: 'avatar.png' }
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { avatar: '/api/upload/' + media.id }
      });
      console.log('Updated User Avatar: ' + user.username);
    }
  }

  // 2. Cleanup Messages with base64 fileUrls
  const msgs = await prisma.message.findMany();
  for (const msg of msgs) {
    if (msg.fileUrl && msg.fileUrl.startsWith('data:')) {
      const mime = msg.fileUrl.split(';')[0].split(':')[1];
      const b64 = msg.fileUrl.split(',')[1];
      const buffer = Buffer.from(b64, 'base64');

      const media = await prisma.media.create({
        data: { data: buffer, mimeType: mime, fileName: msg.fileName || 'file' }
      });

      await prisma.message.update({
        where: { id: msg.id },
        data: { fileUrl: '/api/upload/' + media.id }
      });
      console.log('Updated Message File: ' + msg.id);
    }
  }

  // 3. Cleanup Stories with base64 mediaUrls
  const stories = await prisma.story.findMany();
  for (const story of stories) {
    if (story.mediaUrl && story.mediaUrl.startsWith('data:')) {
      const mime = story.mediaUrl.split(';')[0].split(':')[1];
      const b64 = story.mediaUrl.split(',')[1];
      const buffer = Buffer.from(b64, 'base64');

      const media = await prisma.media.create({
        data: { data: buffer, mimeType: mime, fileName: 'story' }
      });

      await prisma.story.update({
        where: { id: story.id },
        data: { mediaUrl: '/api/upload/' + media.id }
      });
      console.log('Updated Story Media: ' + story.id);
    }
  }

  console.log('Cleanup Complete!');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

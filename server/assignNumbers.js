require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateUniqueLiquidNumber() {
  while (true) {
    const num = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const exists = await prisma.user.findUnique({ where: { liquidNumber: num } });
    if (!exists) return num;
  }
}

async function run() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    if (!user.liquidNumber || user.liquidNumber.length !== 10) {
      const newNum = await generateUniqueLiquidNumber();
      await prisma.user.update({
        where: { id: user.id },
        data: { liquidNumber: newNum }
      });
      console.log(`Updated user ${user.username} with Liquid Number: ${newNum}`);
    }
  }
  console.log('Done!');
}

run().then(() => process.exit(0));

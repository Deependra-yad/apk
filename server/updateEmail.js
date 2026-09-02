const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.user.update({
    where: { id: '13b7b3e6-65a0-4ba9-b29d-f129b9214d58' },
    data: { email: 'yaddeep2@gmail.com' }
  });
  console.log('Successfully updated Deependra');
}
main().catch(console.error).finally(() => prisma.$disconnect());

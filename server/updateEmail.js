const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ where: { username: { contains: 'deependra', mode: 'insensitive' } } });
  if (users.length > 0) {
    console.log('Found user:', users[0].username);
    await prisma.user.update({
      where: { id: users[0].id },
      data: { email: 'yaddeep2@gmail.com' }
    });
    console.log('Successfully updated email to yaddeep2@gmail.com');
  } else {
    console.log('User not found');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());

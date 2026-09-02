const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log(users.map(u => ({ id: u.id, username: u.username, email: u.email })));
}
main().catch(console.error).finally(() => prisma.$disconnect());

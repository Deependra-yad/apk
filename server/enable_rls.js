const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = [
    'User',
    'Group',
    'GroupMember',
    'ChatMeta',
    'BlockList',
    'UserSettings',
    'Message',
    'Story',
    'CallLog',
    'PushSubscription',
    'Media'
  ];
  
  for (const t of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${t}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`Enabled RLS for ${t}`);
    } catch (e) {
      console.error(`Error enabling RLS for ${t}:`, e.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });


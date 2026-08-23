const fs = require('fs');
const { execSync } = require('child_process');

let url = process.env.DATABASE_URL || '';
url = url.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');

// Fix password encoding if they pasted it raw
url = url.replace('[Deependra@081]', '%5BDeependra%40081%5D');

// Ensure port 6543 and pgbouncer if it's supabase
if (url.includes('supabase.co') && !url.includes('6543')) {
  url = url.replace('5432', '6543');
}
if (url.includes('supabase.co') && !url.includes('pgbouncer=true')) {
  url += url.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true';
}

// If the URL is completely busted, fallback to the hardcoded safe string
if (!url.startsWith('postgresql://')) {
  url = 'postgresql://postgres:%5BDeependra%40081%5D@db.lokepaggzgdfxtgmpljm.supabase.co:6543/postgres?pgbouncer=true';
}

console.log('Bulletproof startup script finished checking DATABASE_URL');
process.env.DATABASE_URL = url;

try {
  console.log('Running Prisma DB Push...');
  execSync('npx prisma db push', { stdio: 'inherit', env: process.env });
  
  console.log('Starting Node Server...');
  execSync('node dist/index.js', { stdio: 'inherit', env: process.env });
} catch (error) {
  console.error('Startup failed:', error);
  process.exit(1);
}

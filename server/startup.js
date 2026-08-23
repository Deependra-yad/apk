const fs = require('fs');

let url = process.env.DATABASE_URL || '';
url = url.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');

// Fix password encoding if they pasted it raw
url = url.replace('[Deependra@081]', '%5BDeependra%40081%5D');

// Ensure port 6543 and pgbouncer if it's supabase
if (url.includes('supabase.co') && !url.includes('6543')) {
  url = url.replace('5432', '6543');
}
if (url.includes('supabase.co') && !url.includes('pgbouncer=true')) {
  url += '?pgbouncer=true';
}

// If the URL is completely busted, fallback to the hardcoded safe string
if (!url.startsWith('postgresql://')) {
  url = 'postgresql://postgres:%5BDeependra%40081%5D@db.lokepaggzgdfxtgmpljm.supabase.co:6543/postgres?pgbouncer=true';
}

fs.writeFileSync('.env', `DATABASE_URL="${url}"`);
console.log('Bulletproof startup script finished checking DATABASE_URL');

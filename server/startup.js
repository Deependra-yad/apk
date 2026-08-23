const { execSync } = require('child_process');

let url = process.env.DATABASE_URL || '';
url = url.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');

process.env.DATABASE_URL = url;

try {
  console.log('Starting Node Server...');
  execSync('node dist/index.js', { stdio: 'inherit', env: process.env });
} catch (error) {
  console.error('Startup failed:', error);
  process.exit(1);
}

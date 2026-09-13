import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

function getSanitizedDatabaseUrl(): string {
  let url = process.env.DATABASE_URL || "postgresql://postgres.lokepaggzgdfxtgmpljm:Deependra081@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1";
  
  // If using Supabase pooler, automatically enforce transaction mode (port 6543) and pgbouncer=true
  if (url.includes('pooler.supabase.com')) {
    url = url.replace(':5432/', ':6543/');
    if (!url.includes('pgbouncer=true')) {
      url += (url.includes('?') ? '&' : '?') + 'pgbouncer=true&connection_limit=1';
    } else if (!url.includes('connection_limit=')) {
      url += '&connection_limit=1';
    }
  }
  return url;
}

const dbUrl = getSanitizedDatabaseUrl();

const prismaClient = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

const prisma = prismaClient as any;

export default prisma;


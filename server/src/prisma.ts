import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();
const prisma = prismaClient as any;

export default prisma;

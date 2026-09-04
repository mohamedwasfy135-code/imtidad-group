import { createClient } from '@vercel/postgres';

// قراءة رابط الاتصال من متغيرات البيئة بشكل صريح
const connectionString = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  throw new Error('Missing POSTGRES_URL environment variable');
}

// إنشاء العميل مع تمرير الرابط صراحة
export const db = createClient({ connectionString }).sql;

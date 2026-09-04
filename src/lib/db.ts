import { createClient } from '@vercel/postgres';

// إنشاء عميل جديد لكل طلب (مهم لبيئة Serverless)
// وتمرير رابط الاتصال صراحة لتجنب مشاكل متغيرات البيئة
const getClient = () => {
  const connectionString = process.env.POSTGRES_URL;
  
  if (!connectionString) {
    throw new Error('POSTGRES_URL environment variable is missing');
  }
  
  return createClient({ connectionString });
};

export const db = getClient();

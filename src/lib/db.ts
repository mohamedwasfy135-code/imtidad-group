import { sql } from '@vercel/postgres';

// يستخدم POSTGRES_URL من متغيرات البيئة تلقائياً
// مناسب لبيئة Serverless (لا يحتاج إدارة اتصال يدوية)
export const db = sql;

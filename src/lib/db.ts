import { createClient } from '@vercel/postgres';

// إنشاء العميل واستخراج خاصية sql للاستعلامات
const client = createClient();
export const db = client.sql;

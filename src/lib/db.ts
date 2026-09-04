import { createClient } from '@vercel/postgres';

// استخدام createClient يضمن التعامل التلقائي مع Pooled Connection
// ويقرأ متغير POSTGRES_URL تلقائياً من البيئة
export const db = createClient();

// استيراد دالة sql الثابتة مباشرة من المكتبة
// هذه هي الطريقة الرسمية الموصى بها لتجنب مشاكل تهيئة العميل
import { sql } from '@vercel/postgres';

export const db = sql;

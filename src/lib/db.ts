import { Pool } from 'pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('POSTGRES_URL (or DATABASE_URL) environment variable is missing');
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

// دالة متوافقة مع صيغة Template Literal المستخدمة في باقي الكود: db`SELECT ... ${value}`
export async function db(strings: TemplateStringsArray, ...values: any[]) {
  let text = strings[0];
  for (let i = 0; i < values.length; i++) {
    text += `$${i + 1}` + strings[i + 1];
  }
  return pool.query(text, values);
}

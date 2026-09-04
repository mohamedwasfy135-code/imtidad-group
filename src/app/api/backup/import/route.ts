import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

const COLUMNS: Record<string, string[]> = {
  projects: ['id', 'name', 'client', 'budget', 'created_at'],
  partners: ['id', 'name', 'share_percentage', 'created_at'],
  workers: ['id', 'name', 'phone', 'job', 'daily_wage', 'created_at'],
  daily_logs: ['id', 'project_id', 'worker_id', 'log_date', 'ot_hours', 'notes', 'created_at'],
  expenses: ['id', 'project_id', 'description', 'amount', 'type', 'invoice_url', 'created_at'],
  payments: ['id', 'project_id', 'amount', 'payment_date', 'notes', 'check_image_url', 'created_at'],
  withdrawals: ['id', 'partner_id', 'project_id', 'amount', 'withdrawal_date', 'notes', 'created_at'],
};

// ترتيب الحذف والإدخال يراعي الاعتماديات (المراجع الخارجية أولاً)
const DELETE_ORDER = ['daily_logs', 'expenses', 'payments', 'withdrawals', 'workers', 'partners', 'projects'];
const INSERT_ORDER = ['projects', 'partners', 'workers', 'daily_logs', 'expenses', 'payments', 'withdrawals'];

export async function POST(request: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const tables = body?.tables;
    if (!tables) {
      return NextResponse.json({ error: 'صيغة الملف غير صحيحة — لا يحتوي على tables' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1) حذف كل البيانات الحالية بترتيب آمن
    for (const table of DELETE_ORDER) {
      await client.query(`DELETE FROM ${table}`);
    }

    // 2) إدخال البيانات الجديدة بترتيب آمن
    const results: Record<string, number> = {};
    for (const table of INSERT_ORDER) {
      const rows: any[] = tables[table] || [];
      const cols = COLUMNS[table];
      let count = 0;
      for (const row of rows) {
        const values = cols.map(c => row[c] ?? null);
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
        await client.query(
          `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`,
          values
        );
        count++;
      }
      results[table] = count;
    }

    await client.query('COMMIT');

    return NextResponse.json({ success: true, imported: results });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('BACKUP_IMPORT_ERROR:', error.message);
    return NextResponse.json({ error: 'فشل استيراد النسخة الاحتياطية', details: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

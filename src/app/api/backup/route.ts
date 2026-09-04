import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

const TABLES = ['projects', 'partners', 'workers', 'daily_logs', 'expenses', 'payments', 'withdrawals'];

export async function GET() {
  try {
    const data: Record<string, any[]> = {};
    for (const table of TABLES) {
      const result = await pool.query(`SELECT * FROM ${table}`);
      data[table] = result.rows;
    }

    const backup = {
      exportedAt: new Date().toISOString(),
      company: 'امتداد جروب',
      tables: data,
    };

    const filename = `imtidad-backup-${new Date().toISOString().slice(0,10)}.json`;

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('BACKUP_EXPORT_ERROR:', error.message);
    return NextResponse.json({ error: 'فشل تصدير النسخة الاحتياطية', details: error.message }, { status: 500 });
  }
}

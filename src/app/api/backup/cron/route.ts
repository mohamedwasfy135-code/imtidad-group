import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const TABLES = ['projects', 'partners', 'workers', 'daily_logs', 'expenses', 'payments', 'withdrawals'];

export async function GET(request: NextRequest) {
  // حماية الـ endpoint عشان محدش يقدر يشغّله غير Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

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

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const today = new Date().toISOString().slice(0, 10);
    const filename = `imtidad-backup-${today}.json`;

    const { error } = await supabaseAdmin.storage
      .from('backups')
      .upload(filename, JSON.stringify(backup, null, 2), {
        contentType: 'application/json',
        upsert: true, // لو النسخة بتاعة نفس اليوم موجودة، تستبدلها
      });

    if (error) throw error;

    return NextResponse.json({ success: true, filename, tablesBackedUp: TABLES.length });
  } catch (error: any) {
    console.error('CRON_BACKUP_ERROR:', error.message);
    return NextResponse.json({ error: 'فشل النسخ الاحتياطي التلقائي', details: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db, pool } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const result = await db`
    SELECT id, project_id, worker_id, log_date, hours, ot_hours, amount, notes
    FROM daily_logs WHERE user_id = ${user.id} ORDER BY log_date DESC, created_at DESC
  `;
  const logs = result.rows.map((l: any) => ({
    id: Number(l.id),
    date: l.log_date,
    projectId: l.project_id,
    workerId: Number(l.worker_id),
    hours: Number(l.hours) || 8,
    otHours: Number(l.ot_hours) || 0,
    amount: Number(l.amount) || 0,
    notes: l.notes || '',
  }));
  return NextResponse.json({ logs });
}

// الإضافة تتم دفعة واحدة لعدة عمال في نفس التاريخ والمشروع
// body: { date, projectId, notes, entries: [{ workerId, otHours }] }
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const body = await request.json();
  const { date, projectId, notes, entries } = body;
  if (!date || !projectId || !Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: 'التاريخ والمشروع والعمال مطلوبة' }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertedLogs: any[] = [];

    for (const entry of entries) {
      const workerId = entry.workerId;
      const otHours = parseFloat(entry.otHours) || 0;

      const workerResult = await client.query(
        'SELECT daily_wage FROM workers WHERE id = $1 AND user_id = $2',
        [workerId, user.id]
      );
      if (workerResult.rows.length === 0) continue; // تجاهل أي عامل غير موجود أو لا يخص المستخدم

      const dailyWage = Number(workerResult.rows[0].daily_wage) || 0;
      const hourlyRate = dailyWage / 8;
      const amount = dailyWage + hourlyRate * otHours;

      const insertResult = await client.query(
        `INSERT INTO daily_logs (project_id, worker_id, log_date, hours, ot_hours, amount, notes, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, project_id, worker_id, log_date, hours, ot_hours, amount, notes`,
        [projectId, workerId, date, 8, otHours, amount, notes || null, user.id]
      );
      const l = insertResult.rows[0];
      insertedLogs.push({
        id: Number(l.id),
        date: l.log_date,
        projectId: l.project_id,
        workerId: Number(l.worker_id),
        hours: Number(l.hours),
        otHours: Number(l.ot_hours),
        amount: Number(l.amount),
        notes: l.notes || '',
      });
    }

    if (insertedLogs.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'لم يتم العثور على أي عامل صالح للإضافة' }, { status: 400 });
    }

    await client.query('COMMIT');
    return NextResponse.json({ logs: insertedLogs });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('DAILY_LOGS_POST_ERROR:', error.message);
    return NextResponse.json({ error: 'فشل حفظ اليوميات' }, { status: 500 });
  } finally {
    client.release();
  }
}

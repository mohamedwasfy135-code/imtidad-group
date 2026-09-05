import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();
  const { date, projectId, workerId, otHours, notes } = body;
  if (!date || !projectId || !workerId) {
    return NextResponse.json({ error: 'التاريخ والمشروع والعامل مطلوبة' }, { status: 400 });
  }

  const workerResult = await db`SELECT daily_wage FROM workers WHERE id = ${workerId} AND user_id = ${user.id}`;
  if (workerResult.rows.length === 0) {
    return NextResponse.json({ error: 'العامل غير موجود' }, { status: 404 });
  }
  const dailyWage = Number(workerResult.rows[0].daily_wage) || 0;
  const ot = parseFloat(otHours) || 0;
  const amount = dailyWage + (dailyWage / 8) * ot;

  const result = await db`
    UPDATE daily_logs
    SET project_id = ${projectId}, worker_id = ${workerId}, log_date = ${date},
        hours = 8, ot_hours = ${ot}, amount = ${amount}, notes = ${notes || null}
    WHERE id = ${id} AND user_id = ${user.id}
    RETURNING id, project_id, worker_id, log_date, hours, ot_hours, amount, notes
  `;
  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'السجل غير موجود' }, { status: 404 });
  }
  const l = result.rows[0];
  return NextResponse.json({
    log: {
      id: Number(l.id), date: l.log_date, projectId: l.project_id, workerId: Number(l.worker_id),
      hours: Number(l.hours), otHours: Number(l.ot_hours), amount: Number(l.amount), notes: l.notes || '',
    },
  });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { id } = await context.params;
  await db`DELETE FROM daily_logs WHERE id = ${id} AND user_id = ${user.id}`;
  return NextResponse.json({ success: true });
}

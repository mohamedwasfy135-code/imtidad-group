import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const result = await db`SELECT id, name, phone, job, daily_wage FROM workers WHERE user_id = ${user.id} ORDER BY created_at DESC`;
  const workers = result.rows.map((w: any) => ({
    id: Number(w.id), name: w.name, phone: w.phone, job: w.job, dailyWage: Number(w.daily_wage) || 0,
  }));
  return NextResponse.json({ workers });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const body = await request.json();
  const { name, phone, job, dailyWage } = body;
  if (!name || !phone || !job) {
    return NextResponse.json({ error: 'الاسم والهاتف والتخصص مطلوبة' }, { status: 400 });
  }

  const result = await db`
    INSERT INTO workers (name, phone, job, daily_wage, user_id)
    VALUES (${name}, ${phone}, ${job}, ${dailyWage || 0}, ${user.id})
    RETURNING id, name, phone, job, daily_wage
  `;
  const w = result.rows[0];
  return NextResponse.json({
    worker: { id: Number(w.id), name: w.name, phone: w.phone, job: w.job, dailyWage: Number(w.daily_wage) || 0 },
  });
}

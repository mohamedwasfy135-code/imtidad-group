import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const result = await db`
    SELECT id, project_id, payment_date, amount, notes, check_image_url
    FROM payments WHERE user_id = ${user.id} ORDER BY created_at DESC
  `;
  const payments = result.rows.map((p: any) => ({
    id: Number(p.id),
    projectId: p.project_id,
    date: p.payment_date,
    amount: Number(p.amount) || 0,
    notes: p.notes || '',
    checkImage: p.check_image_url || undefined,
  }));
  return NextResponse.json({ payments });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const body = await request.json();
  const { projectId, date, amount, notes, checkImage } = body;
  if (!projectId || !amount) {
    return NextResponse.json({ error: 'المشروع والمبلغ مطلوبان' }, { status: 400 });
  }

  const result = await db`
    INSERT INTO payments (project_id, payment_date, amount, notes, check_image_url, user_id)
    VALUES (${projectId}, ${date}, ${amount}, ${notes || null}, ${checkImage || null}, ${user.id})
    RETURNING id, project_id, payment_date, amount, notes, check_image_url
  `;
  const p = result.rows[0];
  return NextResponse.json({
    payment: {
      id: Number(p.id), projectId: p.project_id, date: p.payment_date,
      amount: Number(p.amount) || 0, notes: p.notes || '', checkImage: p.check_image_url || undefined,
    },
  });
}

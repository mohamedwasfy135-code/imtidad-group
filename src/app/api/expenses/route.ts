import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const result = await db`
    SELECT id, project_id, expense_date, description, amount, type, invoice_url
    FROM expenses WHERE user_id = ${user.id} ORDER BY created_at DESC
  `;
  const expenses = result.rows.map((e: any) => ({
    id: Number(e.id),
    projectId: e.project_id,
    date: e.expense_date,
    description: e.description,
    amount: Number(e.amount) || 0,
    type: e.type === 'admin' ? 'admin' : 'project',
    invoiceFile: e.invoice_url || undefined,
  }));
  return NextResponse.json({ expenses });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const body = await request.json();
  const { projectId, date, description, amount, type, invoiceFile } = body;
  if (!description || !amount) {
    return NextResponse.json({ error: 'الوصف والمبلغ مطلوبان' }, { status: 400 });
  }

  const result = await db`
    INSERT INTO expenses (project_id, expense_date, description, amount, type, invoice_url, user_id)
    VALUES (${type === 'project' ? projectId : null}, ${date}, ${description}, ${amount}, ${type}, ${invoiceFile || null}, ${user.id})
    RETURNING id, project_id, expense_date, description, amount, type, invoice_url
  `;
  const e = result.rows[0];
  return NextResponse.json({
    expense: {
      id: Number(e.id), projectId: e.project_id, date: e.expense_date, description: e.description,
      amount: Number(e.amount) || 0, type: e.type, invoiceFile: e.invoice_url || undefined,
    },
  });
}

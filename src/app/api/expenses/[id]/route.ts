import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();
  const { projectId, date, description, amount, type, invoiceFile } = body;
  if (!description || !amount) {
    return NextResponse.json({ error: 'الوصف والمبلغ مطلوبان' }, { status: 400 });
  }

  const result = await db`
    UPDATE expenses
    SET project_id = ${type === 'project' ? projectId : null}, expense_date = ${date}, description = ${description},
        amount = ${amount}, type = ${type}, invoice_url = ${invoiceFile || null}
    WHERE id = ${id} AND user_id = ${user.id}
    RETURNING id, project_id, expense_date, description, amount, type, invoice_url
  `;
  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'المصروف غير موجود' }, { status: 404 });
  }
  const e = result.rows[0];
  return NextResponse.json({
    expense: {
      id: Number(e.id), projectId: e.project_id, date: e.expense_date, description: e.description,
      amount: Number(e.amount) || 0, type: e.type, invoiceFile: e.invoice_url || undefined,
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { id } = await context.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // تأكيد أن المشروع فعلاً يخص هذا المستخدم قبل الحذف
    const check = await client.query('SELECT id FROM projects WHERE id = $1 AND user_id = $2', [id, user.id]);
    if (check.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });
    }

    // حذف كل ما يتبع المشروع أولاً لتفادي بيانات يتيمة
    await client.query('DELETE FROM daily_logs WHERE project_id = $1 AND user_id = $2', [id, user.id]);
    await client.query('DELETE FROM expenses WHERE project_id = $1 AND user_id = $2', [id, user.id]);
    await client.query('DELETE FROM payments WHERE project_id = $1 AND user_id = $2', [id, user.id]);
    await client.query('DELETE FROM withdrawals WHERE project_id = $1 AND user_id = $2', [id, user.id]);

    await client.query('DELETE FROM projects WHERE id = $1 AND user_id = $2', [id, user.id]);

    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('DELETE_PROJECT_ERROR:', error.message);
    return NextResponse.json({ error: 'فشل حذف المشروع' }, { status: 500 });
  } finally {
    client.release();
  }
}

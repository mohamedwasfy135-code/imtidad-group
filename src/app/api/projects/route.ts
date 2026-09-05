import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const result = await db`SELECT id, name, client, budget FROM projects WHERE user_id = ${user.id} ORDER BY created_at DESC`;
  const projects = result.rows.map((p: any) => ({
    id: p.id, name: p.name, client: p.client || '', budget: Number(p.budget) || 0,
  }));
  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const body = await request.json();
  const { name, client, budget } = body;
  if (!name) return NextResponse.json({ error: 'اسم المشروع مطلوب' }, { status: 400 });

  const result = await db`
    INSERT INTO projects (name, client, budget, user_id)
    VALUES (${name}, ${client || null}, ${budget || 0}, ${user.id})
    RETURNING id, name, client, budget
  `;
  const p = result.rows[0];
  return NextResponse.json({ project: { id: p.id, name: p.name, client: p.client || '', budget: Number(p.budget) || 0 } });
}

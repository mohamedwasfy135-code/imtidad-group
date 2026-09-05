import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'الاسم والبريد وكلمة المرور مطلوبة' }, { status: 400 });
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب ألا تقل عن 6 أحرف' }, { status: 400 });
    }

    const existing = await db`SELECT id FROM users WHERE email = ${email}`;
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'هذا البريد الإلكتروني مسجّل بالفعل' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db`
      INSERT INTO users (email, password_hash, name)
      VALUES (${email}, ${passwordHash}, ${name})
      RETURNING id, email, name
    `;
    const user = result.rows[0];

    const token = await new SignJWT({ userId: user.id, email: user.email, name: user.name })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const response = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
    response.cookies.set('auth-token', token, {
      httpOnly: false,
      path: '/',
      maxAge: 604800,
      sameSite: 'strict',
    });
    return response;
  } catch (error: any) {
    console.error('REGISTER_API_ERROR:', error.message);
    return NextResponse.json({ error: 'حدث خطأ داخلي أثناء إنشاء الحساب' }, { status: 500 });
  }
}

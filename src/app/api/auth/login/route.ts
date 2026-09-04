import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

export async function POST(req: NextRequest) {
  try {
    // 1. قراءة البيانات من الطلب
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'البريد وكلمة المرور مطلوبان' }, { status: 400 });
    }

    // 2. البحث عن المستخدم في قاعدة البيانات
    const result = await db`SELECT * FROM users WHERE email = ${email}`;
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
    }

    // 3. التحقق من كلمة المرور
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 });
    }

    // 4. إنشاء توكن الجلسة
    const token = await new SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // 5. إرجاع النجاح
    return NextResponse.json({ token, user: { id: user.id, email: user.email, name: user.name } });

  } catch (error: any) {
    // طباعة الخطأ التفصيلي في سجلات Vercel للتشخيص
    console.error('LOGIN_API_ERROR:', error.message, error.stack);
    return NextResponse.json({ error: 'حدث خطأ داخلي أثناء المعالجة' }, { status: 500 });
  }
}

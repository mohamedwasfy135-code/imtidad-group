import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

export async function getSessionUser(request: NextRequest) {
  try {
    // 1. استخراج التوكن من الكوكيز
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return null;

    // 2. التحقق من صحة التوكن وفك تشفيره
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = (payload as any).userId;
    
    if (!userId) return null;

    // 3. جلب بيانات المستخدم من قاعدة البيانات للتأكد من وجوده
    const result = await db`SELECT id, email, name FROM users WHERE id = ${userId}`;
    const user = result.rows[0];

    return user || null;
  } catch (error) {
    // إذا فشل التحقق (توكن منتهي أو مزيف)، نعيد null
    console.error('Session verification failed:', error);
    return null;
  }
}

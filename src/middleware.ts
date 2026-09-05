import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

// المسارات المسموح الدخول عليها من غير تسجيل دخول
const PUBLIC_PATHS = ['/login', '/register'];
const PUBLIC_API_PREFIXES = ['/api/auth/login', '/api/auth/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // اسمح بالمسارات العامة (صفحات الدخول والتسجيل) وملفات Next الداخلية
  const isPublicPage = PUBLIC_PATHS.includes(pathname);
  const isPublicApi = PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));

  if (isPublicPage || isPublicApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return redirectToLogin(request);
  }

  try {
    // التحقق من توقيع التوكن وصلاحيته فقط (بدون قاعدة بيانات، غير مدعوم هنا)
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (error) {
    // توكن منتهي أو مزيف
    return redirectToLogin(request);
  }
}

function redirectToLogin(request: NextRequest) {
  // لو الطلب API، رجّع 401 بدل redirect
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'غير مصرح لك بالدخول' }, { status: 401 });
  }
  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // طبّق الـ middleware على كل المسارات ما عدا ملفات Next الداخلية والملفات الثابتة
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
